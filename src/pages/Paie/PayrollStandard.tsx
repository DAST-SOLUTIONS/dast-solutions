/**
 * DAST Solutions - Phase 4: Module Paie Standard
 * Gestion de la paie pour employés non-CCQ (bureau, admin, etc.)
 */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft, Plus, Search, Users, DollarSign, Calendar, Clock,
  Download, Eye, Edit2, Trash2, Calculator, FileText, Check,
  AlertTriangle, Building2, User, Mail, Phone, CreditCard
} from 'lucide-react'

interface Employee {
  id: string
  employee_number: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  hire_date: string
  job_title: string
  department: string
  pay_type: 'hourly' | 'salary'
  hourly_rate?: number
  annual_salary?: number
  pay_frequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly'
  status: 'active' | 'inactive' | 'terminated'
  sin_last4?: string
  bank_transit?: string
  bank_institution?: string
  bank_account?: string
  td1_federal_claim: number
  tp1_provincial_claim: number
  created_at: string
}

interface PayrollRun {
  id: string
  pay_period_start: string
  pay_period_end: string
  pay_date: string
  status: 'draft' | 'processing' | 'approved' | 'paid'
  total_gross: number
  total_deductions: number
  total_net: number
  total_employer_cost: number
  entries_count: number
  created_at: string
}

// Taux gouvernementaux 2025 Québec
const TAX_RATES_2025 = {
  // Fédéral
  federal: {
    brackets: [
      { min: 0, max: 55867, rate: 0.15 },
      { min: 55867, max: 111733, rate: 0.205 },
      { min: 111733, max: 173205, rate: 0.26 },
      { min: 173205, max: 246752, rate: 0.29 },
      { min: 246752, max: Infinity, rate: 0.33 }
    ],
    basicPersonalAmount: 15705
  },
  // Provincial Québec
  provincial: {
    brackets: [
      { min: 0, max: 51780, rate: 0.14 },
      { min: 51780, max: 103545, rate: 0.19 },
      { min: 103545, max: 126000, rate: 0.24 },
      { min: 126000, max: Infinity, rate: 0.2575 }
    ],
    basicPersonalAmount: 18056
  },
  // RRQ (Régime de rentes du Québec)
  qpp: {
    maxPensionableEarnings: 71300,
    exemption: 3500,
    rate: 0.064, // 6.4% employé + 6.4% employeur = 12.8% total
    additionalRate: 0.01 // RRQ2
  },
  // Assurance-emploi
  ei: {
    maxInsurableEarnings: 65700,
    rateEmployee: 0.0132, // 1.32%
    rateEmployer: 1.4 // Multiplicateur (employeur paie 1.4x)
  },
  // RQAP (Régime québécois d'assurance parentale)
  qpip: {
    maxInsurableEarnings: 94000,
    rateEmployee: 0.00494, // 0.494%
    rateEmployer: 0.00692 // 0.692%
  },
  // FSS (Fonds des services de santé) - Employeur seulement
  fss: {
    rate: 0.0165 // 1.65% (peut varier selon masse salariale)
  },
  // CNT (Commission des normes du travail)
  cnt: {
    rate: 0.0007 // 0.07%
  }
}

// Calcul des déductions
function calculateDeductions(grossPay: number, annualGross: number, td1Claim: number, tp1Claim: number) {
  // Impôt fédéral
  let federalTax = 0
  let taxableIncome = annualGross - TAX_RATES_2025.federal.basicPersonalAmount - td1Claim
  if (taxableIncome > 0) {
    for (const bracket of TAX_RATES_2025.federal.brackets) {
      if (taxableIncome > bracket.min) {
        const taxableInBracket = Math.min(taxableIncome, bracket.max) - bracket.min
        federalTax += taxableInBracket * bracket.rate
      }
    }
  }
  const federalTaxPeriod = (federalTax / 26) * (grossPay / (annualGross / 26))

  // Impôt provincial Québec
  let provincialTax = 0
  let taxableIncomeQC = annualGross - TAX_RATES_2025.provincial.basicPersonalAmount - tp1Claim
  if (taxableIncomeQC > 0) {
    for (const bracket of TAX_RATES_2025.provincial.brackets) {
      if (taxableIncomeQC > bracket.min) {
        const taxableInBracket = Math.min(taxableIncomeQC, bracket.max) - bracket.min
        provincialTax += taxableInBracket * bracket.rate
      }
    }
  }
  const provincialTaxPeriod = (provincialTax / 26) * (grossPay / (annualGross / 26))

  // RRQ
  const qppPensionable = Math.min(grossPay * 26, TAX_RATES_2025.qpp.maxPensionableEarnings) - TAX_RATES_2025.qpp.exemption
  const qppEmployee = Math.max(0, (qppPensionable * TAX_RATES_2025.qpp.rate) / 26)
  const qppEmployer = qppEmployee

  // AE
  const eiInsurable = Math.min(grossPay * 26, TAX_RATES_2025.ei.maxInsurableEarnings)
  const eiEmployee = (eiInsurable * TAX_RATES_2025.ei.rateEmployee) / 26
  const eiEmployer = eiEmployee * TAX_RATES_2025.ei.rateEmployer

  // RQAP
  const qpipInsurable = Math.min(grossPay * 26, TAX_RATES_2025.qpip.maxInsurableEarnings)
  const qpipEmployee = (qpipInsurable * TAX_RATES_2025.qpip.rateEmployee) / 26
  const qpipEmployer = (qpipInsurable * TAX_RATES_2025.qpip.rateEmployer) / 26

  // FSS (employeur seulement)
  const fss = grossPay * TAX_RATES_2025.fss.rate

  // CNT (employeur seulement)
  const cnt = grossPay * TAX_RATES_2025.cnt.rate

  const totalEmployeeDeductions = federalTaxPeriod + provincialTaxPeriod + qppEmployee + eiEmployee + qpipEmployee
  const totalEmployerContributions = qppEmployer + eiEmployer + qpipEmployer + fss + cnt

  return {
    federalTax: Math.round(federalTaxPeriod * 100) / 100,
    provincialTax: Math.round(provincialTaxPeriod * 100) / 100,
    qppEmployee: Math.round(qppEmployee * 100) / 100,
    qppEmployer: Math.round(qppEmployer * 100) / 100,
    eiEmployee: Math.round(eiEmployee * 100) / 100,
    eiEmployer: Math.round(eiEmployer * 100) / 100,
    qpipEmployee: Math.round(qpipEmployee * 100) / 100,
    qpipEmployer: Math.round(qpipEmployer * 100) / 100,
    fss: Math.round(fss * 100) / 100,
    cnt: Math.round(cnt * 100) / 100,
    totalEmployeeDeductions: Math.round(totalEmployeeDeductions * 100) / 100,
    totalEmployerContributions: Math.round(totalEmployerContributions * 100) / 100,
    netPay: Math.round((grossPay - totalEmployeeDeductions) * 100) / 100,
    totalCost: Math.round((grossPay + totalEmployerContributions) * 100) / 100
  }
}

export default function PayrollStandard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'employees' | 'payroll' | 'calculator'>('employees')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([])
  const [loading, setLoading] = useState(true)
  const [showEmployeeModal, setShowEmployeeModal] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Calculatrice
  const [calcGross, setCalcGross] = useState(1000)
  const [calcAnnual, setCalcAnnual] = useState(52000)
  const [calcResult, setCalcResult] = useState<any>(null)

  // Formulaire employé
  const [employeeForm, setEmployeeForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    job_title: '',
    department: '',
    pay_type: 'hourly' as 'hourly' | 'salary',
    hourly_rate: 25,
    annual_salary: 52000,
    pay_frequency: 'biweekly' as Employee['pay_frequency'],
    hire_date: new Date().toISOString().split('T')[0],
    td1_federal_claim: 0,
    tp1_provincial_claim: 0
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (calcGross && calcAnnual) {
      setCalcResult(calculateDeductions(calcGross, calcAnnual, 0, 0))
    }
  }, [calcGross, calcAnnual])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: empData } = await supabase
        .from('employees_standard')
        .select('*')
        .eq('user_id', user.id)
        .order('last_name')

      setEmployees(empData || [])

      const { data: payrollData } = await supabase
        .from('payroll_runs_standard')
        .select('*')
        .eq('user_id', user.id)
        .order('pay_date', { ascending: false })

      setPayrollRuns(payrollData || [])
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEmployee = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const employeeNumber = `EMP-${String(employees.length + 1).padStart(4, '0')}`

    const newEmployee = {
      ...employeeForm,
      user_id: user.id,
      employee_number: employeeNumber,
      status: 'active'
    }

    const { data, error } = await supabase
      .from('employees_standard')
      .insert(newEmployee)
      .select()
      .single()

    if (!error && data) {
      setEmployees([...employees, data])
      setShowEmployeeModal(false)
      resetEmployeeForm()
    }
  }

  const resetEmployeeForm = () => {
    setEmployeeForm({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      job_title: '',
      department: '',
      pay_type: 'hourly',
      hourly_rate: 25,
      annual_salary: 52000,
      pay_frequency: 'biweekly',
      hire_date: new Date().toISOString().split('T')[0],
      td1_federal_claim: 0,
      tp1_provincial_claim: 0
    })
  }

  const filteredEmployees = employees.filter(emp => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return emp.first_name.toLowerCase().includes(q) ||
           emp.last_name.toLowerCase().includes(q) ||
           emp.employee_number.toLowerCase().includes(q) ||
           emp.job_title?.toLowerCase().includes(q)
  })

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">💰 Paie Standard</h1>
          <p className="text-gray-500">Gestion de la paie - Employés non-CCQ</p>
        </div>
        <button
          onClick={() => setShowCalculator(true)}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <Calculator size={16} />
          Calculatrice
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {[
          { id: 'employees', label: 'Employés', icon: Users },
          { id: 'payroll', label: 'Cycles de paie', icon: Calendar },
          { id: 'calculator', label: 'Taux 2025', icon: DollarSign },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 -mb-px transition ${
              activeTab === tab.id
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un employé..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
            <button
              onClick={() => setShowEmployeeModal(true)}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
            >
              <Plus size={16} />
              Nouvel employé
            </button>
          </div>

          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Employé</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Poste</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Taux/Salaire</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Statut</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500">
                      <Users className="mx-auto mb-3 text-gray-300" size={48} />
                      <p>Aucun employé</p>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map(emp => (
                    <tr key={emp.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                            <span className="font-medium text-teal-700">
                              {emp.first_name[0]}{emp.last_name[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{emp.first_name} {emp.last_name}</p>
                            <p className="text-sm text-gray-500">{emp.employee_number}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p>{emp.job_title}</p>
                        <p className="text-sm text-gray-500">{emp.department}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          emp.pay_type === 'hourly' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {emp.pay_type === 'hourly' ? 'Horaire' : 'Salarié'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {emp.pay_type === 'hourly' 
                          ? `${emp.hourly_rate?.toFixed(2)} $/h`
                          : `${emp.annual_salary?.toLocaleString('fr-CA')} $/an`
                        }
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {emp.status === 'active' ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-1">
                          <button className="p-1.5 hover:bg-gray-100 rounded" title="Voir">
                            <Eye size={16} className="text-gray-500" />
                          </button>
                          <button className="p-1.5 hover:bg-gray-100 rounded" title="Modifier">
                            <Edit2 size={16} className="text-gray-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'payroll' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Historique des paies</h3>
            <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2">
              <Plus size={16} />
              Nouveau cycle de paie
            </button>
          </div>

          <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
            <Calendar className="mx-auto mb-3 text-gray-300" size={48} />
            <p>Aucun cycle de paie</p>
            <p className="text-sm mt-1">Créez votre premier cycle de paie</p>
          </div>
        </div>
      )}

      {activeTab === 'calculator' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Taux gouvernementaux 2025 - Québec</h3>
            
            <div className="grid grid-cols-2 gap-6">
              {/* RRQ */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">RRQ (Régime de rentes)</h4>
                <div className="space-y-1 text-sm">
                  <p>Maximum cotisable: <strong>{TAX_RATES_2025.qpp.maxPensionableEarnings.toLocaleString()} $</strong></p>
                  <p>Exemption: <strong>{TAX_RATES_2025.qpp.exemption.toLocaleString()} $</strong></p>
                  <p>Taux employé: <strong>{(TAX_RATES_2025.qpp.rate * 100).toFixed(2)}%</strong></p>
                  <p>Taux employeur: <strong>{(TAX_RATES_2025.qpp.rate * 100).toFixed(2)}%</strong></p>
                </div>
              </div>

              {/* AE */}
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Assurance-emploi</h4>
                <div className="space-y-1 text-sm">
                  <p>Maximum assurable: <strong>{TAX_RATES_2025.ei.maxInsurableEarnings.toLocaleString()} $</strong></p>
                  <p>Taux employé: <strong>{(TAX_RATES_2025.ei.rateEmployee * 100).toFixed(2)}%</strong></p>
                  <p>Taux employeur: <strong>{(TAX_RATES_2025.ei.rateEmployee * TAX_RATES_2025.ei.rateEmployer * 100).toFixed(2)}%</strong> (1.4x)</p>
                </div>
              </div>

              {/* RQAP */}
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-800 mb-2">RQAP</h4>
                <div className="space-y-1 text-sm">
                  <p>Maximum assurable: <strong>{TAX_RATES_2025.qpip.maxInsurableEarnings.toLocaleString()} $</strong></p>
                  <p>Taux employé: <strong>{(TAX_RATES_2025.qpip.rateEmployee * 100).toFixed(3)}%</strong></p>
                  <p>Taux employeur: <strong>{(TAX_RATES_2025.qpip.rateEmployer * 100).toFixed(3)}%</strong></p>
                </div>
              </div>

              {/* FSS/CNT */}
              <div className="p-4 bg-amber-50 rounded-lg">
                <h4 className="font-medium text-amber-800 mb-2">Employeur seulement</h4>
                <div className="space-y-1 text-sm">
                  <p>FSS: <strong>{(TAX_RATES_2025.fss.rate * 100).toFixed(2)}%</strong></p>
                  <p>CNT: <strong>{(TAX_RATES_2025.cnt.rate * 100).toFixed(2)}%</strong></p>
                </div>
              </div>
            </div>
          </div>

          {/* Calculatrice rapide */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Calculatrice rapide</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Salaire brut (période)</label>
                <input
                  type="number"
                  value={calcGross}
                  onChange={(e) => setCalcGross(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Salaire annuel</label>
                <input
                  type="number"
                  value={calcAnnual}
                  onChange={(e) => setCalcAnnual(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            {calcResult && (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">Déductions employé</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Impôt fédéral:</span>
                      <span className="font-medium text-red-600">-{calcResult.federalTax.toFixed(2)} $</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Impôt Québec:</span>
                      <span className="font-medium text-red-600">-{calcResult.provincialTax.toFixed(2)} $</span>
                    </div>
                    <div className="flex justify-between">
                      <span>RRQ:</span>
                      <span className="font-medium text-red-600">-{calcResult.qppEmployee.toFixed(2)} $</span>
                    </div>
                    <div className="flex justify-between">
                      <span>AE:</span>
                      <span className="font-medium text-red-600">-{calcResult.eiEmployee.toFixed(2)} $</span>
                    </div>
                    <div className="flex justify-between">
                      <span>RQAP:</span>
                      <span className="font-medium text-red-600">-{calcResult.qpipEmployee.toFixed(2)} $</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-bold">
                      <span>Salaire net:</span>
                      <span className="text-green-600">{calcResult.netPay.toFixed(2)} $</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">Cotisations employeur</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>RRQ:</span>
                      <span className="font-medium">{calcResult.qppEmployer.toFixed(2)} $</span>
                    </div>
                    <div className="flex justify-between">
                      <span>AE:</span>
                      <span className="font-medium">{calcResult.eiEmployer.toFixed(2)} $</span>
                    </div>
                    <div className="flex justify-between">
                      <span>RQAP:</span>
                      <span className="font-medium">{calcResult.qpipEmployer.toFixed(2)} $</span>
                    </div>
                    <div className="flex justify-between">
                      <span>FSS:</span>
                      <span className="font-medium">{calcResult.fss.toFixed(2)} $</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CNT:</span>
                      <span className="font-medium">{calcResult.cnt.toFixed(2)} $</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-bold">
                      <span>Coût total employeur:</span>
                      <span className="text-blue-600">{calcResult.totalCost.toFixed(2)} $</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Nouvel employé */}
      {showEmployeeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Nouvel employé</h2>
              <button onClick={() => setShowEmployeeModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Prénom *</label>
                  <input
                    type="text"
                    value={employeeForm.first_name}
                    onChange={(e) => setEmployeeForm({...employeeForm, first_name: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nom *</label>
                  <input
                    type="text"
                    value={employeeForm.last_name}
                    onChange={(e) => setEmployeeForm({...employeeForm, last_name: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Courriel</label>
                  <input
                    type="email"
                    value={employeeForm.email}
                    onChange={(e) => setEmployeeForm({...employeeForm, email: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={employeeForm.phone}
                    onChange={(e) => setEmployeeForm({...employeeForm, phone: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Titre du poste</label>
                  <input
                    type="text"
                    value={employeeForm.job_title}
                    onChange={(e) => setEmployeeForm({...employeeForm, job_title: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Département</label>
                  <input
                    type="text"
                    value={employeeForm.department}
                    onChange={(e) => setEmployeeForm({...employeeForm, department: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type de paie</label>
                  <select
                    value={employeeForm.pay_type}
                    onChange={(e) => setEmployeeForm({...employeeForm, pay_type: e.target.value as any})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="hourly">Horaire</option>
                    <option value="salary">Salarié</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {employeeForm.pay_type === 'hourly' ? 'Taux horaire' : 'Salaire annuel'}
                  </label>
                  <input
                    type="number"
                    value={employeeForm.pay_type === 'hourly' ? employeeForm.hourly_rate : employeeForm.annual_salary}
                    onChange={(e) => {
                      if (employeeForm.pay_type === 'hourly') {
                        setEmployeeForm({...employeeForm, hourly_rate: parseFloat(e.target.value) || 0})
                      } else {
                        setEmployeeForm({...employeeForm, annual_salary: parseFloat(e.target.value) || 0})
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date d'embauche</label>
                  <input
                    type="date"
                    value={employeeForm.hire_date}
                    onChange={(e) => setEmployeeForm({...employeeForm, hire_date: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fréquence de paie</label>
                  <select
                    value={employeeForm.pay_frequency}
                    onChange={(e) => setEmployeeForm({...employeeForm, pay_frequency: e.target.value as any})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="weekly">Hebdomadaire</option>
                    <option value="biweekly">Aux 2 semaines</option>
                    <option value="semimonthly">Bimensuel</option>
                    <option value="monthly">Mensuel</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowEmployeeModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveEmployee}
                disabled={!employeeForm.first_name || !employeeForm.last_name}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                Créer l'employé
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
