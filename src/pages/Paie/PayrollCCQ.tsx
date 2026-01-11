/**
 * DAST Solutions - Phase 4: Module Paie CCQ
 * Gestion complète de la paie construction selon les conventions CCQ
 * Basé sur les grilles officielles CCQ 2025
 */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft, Plus, Search, Users, DollarSign, Calendar, Clock,
  Download, Eye, Edit2, Calculator, FileText, HardHat, Building2,
  AlertTriangle, Check, Wrench, Hammer
} from 'lucide-react'

// ============================================================================
// TAUX CCQ 2025 - Conventions collectives officielles
// ============================================================================

// Secteurs CCQ
const CCQ_SECTORS = {
  residential_light: { code: 'RL', name: 'Résidentiel léger', fssRate: 0.0165 },
  residential_heavy: { code: 'RH', name: 'Résidentiel lourd', fssRate: 0.0426 },
  ici: { code: 'ICI', name: 'Institutionnel, Commercial, Industriel', fssRate: 0.0426 },
  civil_engineering: { code: 'GC', name: 'Génie civil et voirie', fssRate: 0.0426 }
}

// Métiers CCQ avec taux horaires 2025
const CCQ_TRADES_2025 = [
  // Format: { code, name, rates: { RL: { base, overtime }, RH: { base, overtime }, ICI: { base, overtime } } }
  { 
    code: 'BRQ', 
    name: 'Briqueteur-maçon', 
    rates: {
      RL: { compagnon: 44.16, apprenti1: 22.08, apprenti2: 28.70, apprenti3: 35.33 },
      RH: { compagnon: 46.87, apprenti1: 23.44, apprenti2: 30.47, apprenti3: 37.49 },
      ICI: { compagnon: 48.52, apprenti1: 24.26, apprenti2: 31.54, apprenti3: 38.82 }
    },
    socialBenefits: 7.020,
    apprenticePeriods: 3
  },
  { 
    code: 'CHP', 
    name: 'Charpentier-menuisier', 
    rates: {
      RL: { compagnon: 43.37, apprenti1: 21.69, apprenti2: 28.19, apprenti3: 34.70 },
      RH: { compagnon: 47.25, apprenti1: 23.63, apprenti2: 30.71, apprenti3: 37.80 },
      ICI: { compagnon: 48.52, apprenti1: 24.26, apprenti2: 31.54, apprenti3: 38.82 }
    },
    socialBenefits: 7.020,
    apprenticePeriods: 3
  },
  { 
    code: 'ELC', 
    name: 'Électricien', 
    rates: {
      RL: { compagnon: 45.36, apprenti1: 22.68, apprenti2: 29.48, apprenti3: 36.29, apprenti4: 40.82, apprenti5: 43.09 },
      RH: { compagnon: 47.81, apprenti1: 23.91, apprenti2: 31.08, apprenti3: 38.25, apprenti4: 43.03, apprenti5: 45.42 },
      ICI: { compagnon: 49.43, apprenti1: 24.72, apprenti2: 32.13, apprenti3: 39.54, apprenti4: 44.49, apprenti5: 46.96 }
    },
    socialBenefits: 8.320,
    apprenticePeriods: 5
  },
  { 
    code: 'PLB', 
    name: 'Plombier', 
    rates: {
      RL: { compagnon: 45.36, apprenti1: 22.68, apprenti2: 29.48, apprenti3: 36.29, apprenti4: 40.82, apprenti5: 43.09 },
      RH: { compagnon: 47.81, apprenti1: 23.91, apprenti2: 31.08, apprenti3: 38.25, apprenti4: 43.03, apprenti5: 45.42 },
      ICI: { compagnon: 49.43, apprenti1: 24.72, apprenti2: 32.13, apprenti3: 39.54, apprenti4: 44.49, apprenti5: 46.96 }
    },
    socialBenefits: 7.890,
    apprenticePeriods: 5
  },
  { 
    code: 'TYT', 
    name: 'Tuyauteur', 
    rates: {
      RL: { compagnon: 45.36, apprenti1: 22.68, apprenti2: 29.48, apprenti3: 36.29, apprenti4: 40.82, apprenti5: 43.09 },
      RH: { compagnon: 47.81, apprenti1: 23.91, apprenti2: 31.08, apprenti3: 38.25, apprenti4: 43.03, apprenti5: 45.42 },
      ICI: { compagnon: 49.43, apprenti1: 24.72, apprenti2: 32.13, apprenti3: 39.54, apprenti4: 44.49, apprenti5: 46.96 }
    },
    socialBenefits: 7.890,
    apprenticePeriods: 5
  },
  { 
    code: 'FRB', 
    name: 'Ferblantier', 
    rates: {
      RL: { compagnon: 45.36, apprenti1: 22.68, apprenti2: 29.48, apprenti3: 36.29, apprenti4: 40.82 },
      RH: { compagnon: 47.81, apprenti1: 23.91, apprenti2: 31.08, apprenti3: 38.25, apprenti4: 43.03 },
      ICI: { compagnon: 49.43, apprenti1: 24.72, apprenti2: 32.13, apprenti3: 39.54, apprenti4: 44.49 }
    },
    socialBenefits: 7.890,
    apprenticePeriods: 4
  },
  { 
    code: 'CVR', 
    name: 'Couvreur', 
    rates: {
      RL: { compagnon: 45.36, apprenti1: 22.68, apprenti2: 29.48, apprenti3: 36.29 },
      RH: { compagnon: 47.81, apprenti1: 23.91, apprenti2: 31.08, apprenti3: 38.25 },
      ICI: { compagnon: 49.43, apprenti1: 24.72, apprenti2: 32.13, apprenti3: 39.54 }
    },
    socialBenefits: 7.020,
    apprenticePeriods: 3
  },
  { 
    code: 'PLT', 
    name: 'Plâtrier', 
    rates: {
      RL: { compagnon: 42.64, apprenti1: 21.32, apprenti2: 27.72, apprenti3: 34.11 },
      RH: { compagnon: 45.76, apprenti1: 22.88, apprenti2: 29.74, apprenti3: 36.61 },
      ICI: { compagnon: 47.25, apprenti1: 23.63, apprenti2: 30.71, apprenti3: 37.80 }
    },
    socialBenefits: 7.020,
    apprenticePeriods: 3
  },
  { 
    code: 'PNT', 
    name: 'Peintre', 
    rates: {
      RL: { compagnon: 40.58, apprenti1: 20.29, apprenti2: 26.38, apprenti3: 32.46 },
      RH: { compagnon: 44.76, apprenti1: 22.38, apprenti2: 29.09, apprenti3: 35.81 },
      ICI: { compagnon: 46.25, apprenti1: 23.13, apprenti2: 30.06, apprenti3: 37.00 }
    },
    socialBenefits: 7.020,
    apprenticePeriods: 3
  },
  { 
    code: 'CIM', 
    name: 'Cimentier-applicateur', 
    rates: {
      RL: { compagnon: 43.37, apprenti1: 21.69, apprenti2: 28.19, apprenti3: 34.70 },
      RH: { compagnon: 47.25, apprenti1: 23.63, apprenti2: 30.71, apprenti3: 37.80 },
      ICI: { compagnon: 48.52, apprenti1: 24.26, apprenti2: 31.54, apprenti3: 38.82 }
    },
    socialBenefits: 7.020,
    apprenticePeriods: 3
  },
  { 
    code: 'FFA', 
    name: 'Ferrailleur', 
    rates: {
      RL: { compagnon: 43.37, apprenti1: 21.69, apprenti2: 28.19, apprenti3: 34.70 },
      RH: { compagnon: 47.25, apprenti1: 23.63, apprenti2: 30.71, apprenti3: 37.80 },
      ICI: { compagnon: 48.52, apprenti1: 24.26, apprenti2: 31.54, apprenti3: 38.82 }
    },
    socialBenefits: 7.020,
    apprenticePeriods: 3
  },
  { 
    code: 'GRT', 
    name: 'Grutier classe A', 
    rates: {
      RL: { compagnon: 43.53, apprenti1: 21.77 },
      RH: { compagnon: 47.81, apprenti1: 23.91 },
      ICI: { compagnon: 49.43, apprenti1: 24.72 }
    },
    socialBenefits: 7.020,
    apprenticePeriods: 1
  },
  { 
    code: 'MNV', 
    name: 'Manoeuvre', 
    rates: {
      RL: { compagnon: 34.50 },
      RH: { compagnon: 37.25 },
      ICI: { compagnon: 38.75 }
    },
    socialBenefits: 7.020,
    apprenticePeriods: 0
  },
  { 
    code: 'OPS', 
    name: 'Opérateur de pelles', 
    rates: {
      RL: { compagnon: 43.53, apprenti1: 21.77, apprenti2: 28.30, apprenti3: 34.82 },
      RH: { compagnon: 47.81, apprenti1: 23.91, apprenti2: 31.08, apprenti3: 38.25 },
      ICI: { compagnon: 49.43, apprenti1: 24.72, apprenti2: 32.13, apprenti3: 39.54 }
    },
    socialBenefits: 7.020,
    apprenticePeriods: 3
  }
]

// Cotisations et prélèvements CCQ 2025
const CCQ_CONTRIBUTIONS_2025 = {
  // Vacances et congés fériés
  vacationRate: 0.13, // 13% (vacances 6% + fériés 7%)
  vacationFund: 0.06, // 6%
  holidaysFund: 0.07, // 7%
  
  // Cotisations horaires
  ccqLevy: 0.0075, // 0.75% sur salaire brut
  aecq: 0.03, // 0.03$/h
  trainingFund: 0.22, // 0.22$/h
  safetyEquipment: 0.65, // 0.65$/h
  
  // RRQ spécial construction
  rrqRate: 0.064, // 6.4%
  rrqMaxPensionable: 71300,
  rrqExemption: 3500,
  
  // Assurance-emploi
  eiRate: 0.0132,
  eiMaxInsurable: 65700,
  eiEmployerMultiplier: 1.4,
  
  // RQAP
  qpipEmployeeRate: 0.00494,
  qpipEmployerRate: 0.00692,
  qpipMaxInsurable: 94000,
  
  // CNESST (varie par métier - taux moyen construction)
  cnesstRate: 0.0825, // 8.25% (moyenne construction)
  
  // Taxe sur assurance
  insuranceTax: 0.09, // 9% sur avantages sociaux
  
  // Outils et camions (si applicable)
  toolsAllowance: 1.68, // $/h
  truckAllowance: 14.46 // $/h
}

interface CCQEmployee {
  id: string
  employee_number: string
  ccq_number: string
  first_name: string
  last_name: string
  trade_code: string
  classification: 'compagnon' | 'apprenti1' | 'apprenti2' | 'apprenti3' | 'apprenti4' | 'apprenti5'
  sector_code: 'RL' | 'RH' | 'ICI' | 'GC'
  hire_date: string
  status: 'active' | 'inactive'
  ccq_card_expiry?: string
  created_at: string
}

interface CCQTimeEntry {
  id: string
  employee_id: string
  project_id?: string
  date: string
  regular_hours: number
  overtime_hours: number // Temps et demi
  double_time_hours: number // Temps double
  evening_premium: boolean
  night_premium: boolean
  notes?: string
}

// Calcul complet de la paie CCQ
function calculateCCQPayroll(
  employee: CCQEmployee,
  timeEntry: CCQTimeEntry
): {
  grossPay: number
  regularPay: number
  overtimePay: number
  doubleTimePay: number
  premiums: number
  vacationPay: number
  holidayPay: number
  socialBenefits: number
  employeeDeductions: {
    rrq: number
    ei: number
    qpip: number
    ccqLevy: number
    totalDeductions: number
  }
  employerContributions: {
    rrq: number
    ei: number
    qpip: number
    fss: number
    cnesst: number
    ccqLevy: number
    aecq: number
    trainingFund: number
    safetyEquipment: number
    insuranceTax: number
    totalContributions: number
  }
  netPay: number
  totalEmployerCost: number
} {
  // Trouver le métier et les taux
  const trade = CCQ_TRADES_2025.find(t => t.code === employee.trade_code)
  if (!trade) throw new Error(`Métier ${employee.trade_code} non trouvé`)

  const sectorRates = trade.rates[employee.sector_code as keyof typeof trade.rates]
  if (!sectorRates) throw new Error(`Secteur ${employee.sector_code} non trouvé pour ${trade.name}`)

  const hourlyRate = sectorRates[employee.classification as keyof typeof sectorRates] || sectorRates.compagnon
  const totalHours = timeEntry.regular_hours + timeEntry.overtime_hours + timeEntry.double_time_hours

  // Calcul du salaire brut
  const regularPay = timeEntry.regular_hours * hourlyRate
  const overtimePay = timeEntry.overtime_hours * hourlyRate * 1.5
  const doubleTimePay = timeEntry.double_time_hours * hourlyRate * 2

  // Primes de quart (si applicable)
  let premiums = 0
  if (timeEntry.evening_premium) premiums += totalHours * 1.50 // Prime de soir
  if (timeEntry.night_premium) premiums += totalHours * 2.00 // Prime de nuit

  const grossPay = regularPay + overtimePay + doubleTimePay + premiums

  // Vacances et congés fériés
  const vacationPay = grossPay * CCQ_CONTRIBUTIONS_2025.vacationFund
  const holidayPay = grossPay * CCQ_CONTRIBUTIONS_2025.holidaysFund

  // Avantages sociaux (par heure)
  const socialBenefits = totalHours * trade.socialBenefits

  // Déductions employé
  const rrqPensionable = Math.min(grossPay * 26, CCQ_CONTRIBUTIONS_2025.rrqMaxPensionable) - CCQ_CONTRIBUTIONS_2025.rrqExemption
  const rrqEmployee = Math.max(0, (rrqPensionable * CCQ_CONTRIBUTIONS_2025.rrqRate) / 26)
  
  const eiInsurable = Math.min(grossPay * 26, CCQ_CONTRIBUTIONS_2025.eiMaxInsurable)
  const eiEmployee = (eiInsurable * CCQ_CONTRIBUTIONS_2025.eiRate) / 26
  
  const qpipInsurable = Math.min(grossPay * 26, CCQ_CONTRIBUTIONS_2025.qpipMaxInsurable)
  const qpipEmployee = (qpipInsurable * CCQ_CONTRIBUTIONS_2025.qpipEmployeeRate) / 26
  
  const ccqLevyEmployee = grossPay * CCQ_CONTRIBUTIONS_2025.ccqLevy

  const totalDeductions = rrqEmployee + eiEmployee + qpipEmployee + ccqLevyEmployee

  // Cotisations employeur
  const rrqEmployer = rrqEmployee
  const eiEmployer = eiEmployee * CCQ_CONTRIBUTIONS_2025.eiEmployerMultiplier
  const qpipEmployer = (qpipInsurable * CCQ_CONTRIBUTIONS_2025.qpipEmployerRate) / 26
  
  const sector = CCQ_SECTORS[
    employee.sector_code === 'RL' ? 'residential_light' :
    employee.sector_code === 'RH' ? 'residential_heavy' :
    employee.sector_code === 'ICI' ? 'ici' : 'civil_engineering'
  ]
  const fss = grossPay * sector.fssRate
  const cnesst = grossPay * CCQ_CONTRIBUTIONS_2025.cnesstRate
  const ccqLevyEmployer = grossPay * CCQ_CONTRIBUTIONS_2025.ccqLevy
  const aecq = totalHours * CCQ_CONTRIBUTIONS_2025.aecq
  const trainingFund = totalHours * CCQ_CONTRIBUTIONS_2025.trainingFund
  const safetyEquipment = totalHours * CCQ_CONTRIBUTIONS_2025.safetyEquipment
  const insuranceTax = socialBenefits * CCQ_CONTRIBUTIONS_2025.insuranceTax

  const totalContributions = rrqEmployer + eiEmployer + qpipEmployer + fss + cnesst + 
    ccqLevyEmployer + aecq + trainingFund + safetyEquipment + insuranceTax + 
    socialBenefits + vacationPay + holidayPay

  return {
    grossPay: Math.round(grossPay * 100) / 100,
    regularPay: Math.round(regularPay * 100) / 100,
    overtimePay: Math.round(overtimePay * 100) / 100,
    doubleTimePay: Math.round(doubleTimePay * 100) / 100,
    premiums: Math.round(premiums * 100) / 100,
    vacationPay: Math.round(vacationPay * 100) / 100,
    holidayPay: Math.round(holidayPay * 100) / 100,
    socialBenefits: Math.round(socialBenefits * 100) / 100,
    employeeDeductions: {
      rrq: Math.round(rrqEmployee * 100) / 100,
      ei: Math.round(eiEmployee * 100) / 100,
      qpip: Math.round(qpipEmployee * 100) / 100,
      ccqLevy: Math.round(ccqLevyEmployee * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100
    },
    employerContributions: {
      rrq: Math.round(rrqEmployer * 100) / 100,
      ei: Math.round(eiEmployer * 100) / 100,
      qpip: Math.round(qpipEmployer * 100) / 100,
      fss: Math.round(fss * 100) / 100,
      cnesst: Math.round(cnesst * 100) / 100,
      ccqLevy: Math.round(ccqLevyEmployer * 100) / 100,
      aecq: Math.round(aecq * 100) / 100,
      trainingFund: Math.round(trainingFund * 100) / 100,
      safetyEquipment: Math.round(safetyEquipment * 100) / 100,
      insuranceTax: Math.round(insuranceTax * 100) / 100,
      totalContributions: Math.round(totalContributions * 100) / 100
    },
    netPay: Math.round((grossPay - totalDeductions) * 100) / 100,
    totalEmployerCost: Math.round((grossPay + totalContributions) * 100) / 100
  }
}

export default function PayrollCCQ() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'employees' | 'timesheet' | 'rates' | 'calculator'>('employees')
  const [employees, setEmployees] = useState<CCQEmployee[]>([])
  const [loading, setLoading] = useState(true)
  const [showEmployeeModal, setShowEmployeeModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTrade, setSelectedTrade] = useState('')
  const [selectedSector, setSelectedSector] = useState<'RL' | 'RH' | 'ICI'>('RL')

  // Calculatrice CCQ
  const [calcTrade, setCalcTrade] = useState('BRQ')
  const [calcSector, setCalcSector] = useState<'RL' | 'RH' | 'ICI'>('RL')
  const [calcClass, setCalcClass] = useState<'compagnon' | 'apprenti1' | 'apprenti2' | 'apprenti3'>('compagnon')
  const [calcHours, setCalcHours] = useState({ regular: 40, overtime: 0, double: 0 })
  const [calcResult, setCalcResult] = useState<any>(null)

  // Formulaire employé
  const [employeeForm, setEmployeeForm] = useState({
    first_name: '',
    last_name: '',
    ccq_number: '',
    trade_code: 'BRQ',
    classification: 'compagnon' as CCQEmployee['classification'],
    sector_code: 'RL' as CCQEmployee['sector_code'],
    hire_date: new Date().toISOString().split('T')[0],
    ccq_card_expiry: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    // Calculer automatiquement
    if (calcTrade && calcSector && calcHours.regular >= 0) {
      const mockEmployee: CCQEmployee = {
        id: 'calc',
        employee_number: 'CALC',
        ccq_number: '000000',
        first_name: 'Calc',
        last_name: 'Test',
        trade_code: calcTrade,
        classification: calcClass,
        sector_code: calcSector,
        hire_date: '',
        status: 'active',
        created_at: ''
      }
      const mockTime: CCQTimeEntry = {
        id: 'calc',
        employee_id: 'calc',
        date: new Date().toISOString(),
        regular_hours: calcHours.regular,
        overtime_hours: calcHours.overtime,
        double_time_hours: calcHours.double,
        evening_premium: false,
        night_premium: false
      }
      try {
        setCalcResult(calculateCCQPayroll(mockEmployee, mockTime))
      } catch (e) {
        console.error(e)
      }
    }
  }, [calcTrade, calcSector, calcClass, calcHours])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: empData } = await supabase
        .from('employees_ccq')
        .select('*')
        .eq('user_id', user.id)
        .order('last_name')

      setEmployees(empData || [])
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEmployee = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const employeeNumber = `CCQ-${String(employees.length + 1).padStart(4, '0')}`

    const newEmployee = {
      ...employeeForm,
      user_id: user.id,
      employee_number: employeeNumber,
      status: 'active'
    }

    const { data, error } = await supabase
      .from('employees_ccq')
      .insert(newEmployee)
      .select()
      .single()

    if (!error && data) {
      setEmployees([...employees, data])
      setShowEmployeeModal(false)
    }
  }

  const filteredEmployees = employees.filter(emp => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return emp.first_name.toLowerCase().includes(q) ||
           emp.last_name.toLowerCase().includes(q) ||
           emp.ccq_number.toLowerCase().includes(q)
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
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HardHat className="text-amber-500" />
            Paie CCQ
          </h1>
          <p className="text-gray-500">Gestion de la paie construction - Conventions CCQ 2025</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {[
          { id: 'employees', label: 'Employés CCQ', icon: Users },
          { id: 'timesheet', label: 'Feuilles de temps', icon: Clock },
          { id: 'rates', label: 'Grilles salariales', icon: DollarSign },
          { id: 'calculator', label: 'Calculatrice', icon: Calculator },
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
                placeholder="Rechercher par nom ou # CCQ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
            <button
              onClick={() => setShowEmployeeModal(true)}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-2"
            >
              <Plus size={16} />
              Nouvel employé CCQ
            </button>
          </div>

          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Employé</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600"># CCQ</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Métier</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Classification</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Secteur</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Taux horaire</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500">
                      <HardHat className="mx-auto mb-3 text-gray-300" size={48} />
                      <p>Aucun employé CCQ</p>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map(emp => {
                    const trade = CCQ_TRADES_2025.find(t => t.code === emp.trade_code)
                    const rate = trade?.rates[emp.sector_code as keyof typeof trade.rates]?.[emp.classification as keyof typeof rate]
                    return (
                      <tr key={emp.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                              <HardHat size={20} className="text-amber-600" />
                            </div>
                            <div>
                              <p className="font-medium">{emp.first_name} {emp.last_name}</p>
                              <p className="text-sm text-gray-500">{emp.employee_number}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono">{emp.ccq_number}</td>
                        <td className="py-3 px-4">
                          <span className="font-medium">{trade?.name || emp.trade_code}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            emp.classification === 'compagnon' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {emp.classification === 'compagnon' ? 'Compagnon' : `Apprenti ${emp.classification.slice(-1)}`}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm">{CCQ_SECTORS[
                            emp.sector_code === 'RL' ? 'residential_light' :
                            emp.sector_code === 'RH' ? 'residential_heavy' : 'ici'
                          ]?.name}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-teal-600">
                          {rate?.toFixed(2) || '—'} $/h
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
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'rates' && (
        <div className="space-y-6">
          {/* Sélecteur de secteur */}
          <div className="flex gap-2">
            {Object.entries(CCQ_SECTORS).map(([key, sector]) => (
              <button
                key={key}
                onClick={() => setSelectedSector(sector.code as any)}
                className={`px-4 py-2 rounded-lg border ${
                  selectedSector === sector.code
                    ? 'bg-amber-100 border-amber-300 text-amber-800'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                {sector.name}
              </button>
            ))}
          </div>

          {/* Grille des taux */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Métier</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Compagnon</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Apprenti 1</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Apprenti 2</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Apprenti 3</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Avantages</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {CCQ_TRADES_2025.map(trade => {
                  const rates = trade.rates[selectedSector as keyof typeof trade.rates]
                  return (
                    <tr key={trade.code} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-gray-400">{trade.code}</span>
                          <span className="font-medium">{trade.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-teal-600">
                        {rates?.compagnon?.toFixed(2) || '—'} $
                      </td>
                      <td className="py-3 px-4 text-right">
                        {rates?.apprenti1?.toFixed(2) || '—'} $
                      </td>
                      <td className="py-3 px-4 text-right">
                        {rates?.apprenti2?.toFixed(2) || '—'} $
                      </td>
                      <td className="py-3 px-4 text-right">
                        {rates?.apprenti3?.toFixed(2) || '—'} $
                      </td>
                      <td className="py-3 px-4 text-right text-blue-600">
                        {trade.socialBenefits.toFixed(2)} $/h
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Cotisations */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Cotisations et prélèvements CCQ 2025</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Vacances & Congés</h4>
                <p className="text-sm">Vacances: <strong>6%</strong></p>
                <p className="text-sm">Congés fériés: <strong>7%</strong></p>
                <p className="text-sm font-medium mt-1">Total: <strong>13%</strong></p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg">
                <h4 className="font-medium text-amber-800 mb-2">Cotisations horaires</h4>
                <p className="text-sm">AECQ: <strong>0.03 $/h</strong></p>
                <p className="text-sm">Formation: <strong>0.22 $/h</strong></p>
                <p className="text-sm">Équip. sécurité: <strong>0.65 $/h</strong></p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Prélèvements CCQ</h4>
                <p className="text-sm">Prélèvement CCQ: <strong>0.75%</strong></p>
                <p className="text-sm">Taxe assurance: <strong>9%</strong> sur avantages</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'calculator' && (
        <div className="grid grid-cols-2 gap-6">
          {/* Paramètres */}
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h3 className="font-semibold">Paramètres de calcul</h3>
            
            <div>
              <label className="block text-sm font-medium mb-1">Métier</label>
              <select
                value={calcTrade}
                onChange={(e) => setCalcTrade(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {CCQ_TRADES_2025.map(trade => (
                  <option key={trade.code} value={trade.code}>{trade.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Secteur</label>
              <select
                value={calcSector}
                onChange={(e) => setCalcSector(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="RL">Résidentiel léger</option>
                <option value="RH">Résidentiel lourd</option>
                <option value="ICI">ICI</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Classification</label>
              <select
                value={calcClass}
                onChange={(e) => setCalcClass(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="compagnon">Compagnon</option>
                <option value="apprenti1">Apprenti 1ère période</option>
                <option value="apprenti2">Apprenti 2e période</option>
                <option value="apprenti3">Apprenti 3e période</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Heures régulières</label>
                <input
                  type="number"
                  value={calcHours.regular}
                  onChange={(e) => setCalcHours({...calcHours, regular: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Temps et demi</label>
                <input
                  type="number"
                  value={calcHours.overtime}
                  onChange={(e) => setCalcHours({...calcHours, overtime: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Temps double</label>
                <input
                  type="number"
                  value={calcHours.double}
                  onChange={(e) => setCalcHours({...calcHours, double: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Résultats */}
          {calcResult && (
            <div className="bg-white rounded-xl border p-6 space-y-4">
              <h3 className="font-semibold">Résultats du calcul</h3>
              
              <div className="p-4 bg-teal-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-teal-800">Salaire brut</span>
                  <span className="text-2xl font-bold text-teal-600">{calcResult.grossPay.toFixed(2)} $</span>
                </div>
                <div className="text-sm text-teal-600 mt-1">
                  Régulier: {calcResult.regularPay.toFixed(2)}$ + 
                  OT: {calcResult.overtimePay.toFixed(2)}$ + 
                  DT: {calcResult.doubleTimePay.toFixed(2)}$
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Déductions employé</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>RRQ:</span>
                    <span className="text-red-600">-{calcResult.employeeDeductions.rrq.toFixed(2)} $</span>
                  </div>
                  <div className="flex justify-between">
                    <span>AE:</span>
                    <span className="text-red-600">-{calcResult.employeeDeductions.ei.toFixed(2)} $</span>
                  </div>
                  <div className="flex justify-between">
                    <span>RQAP:</span>
                    <span className="text-red-600">-{calcResult.employeeDeductions.qpip.toFixed(2)} $</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CCQ:</span>
                    <span className="text-red-600">-{calcResult.employeeDeductions.ccqLevy.toFixed(2)} $</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-1">
                    <span>Net employé:</span>
                    <span className="text-green-600">{calcResult.netPay.toFixed(2)} $</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Cotisations employeur</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>RRQ:</span>
                    <span>{calcResult.employerContributions.rrq.toFixed(2)} $</span>
                  </div>
                  <div className="flex justify-between">
                    <span>AE (1.4x):</span>
                    <span>{calcResult.employerContributions.ei.toFixed(2)} $</span>
                  </div>
                  <div className="flex justify-between">
                    <span>FSS:</span>
                    <span>{calcResult.employerContributions.fss.toFixed(2)} $</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CNESST:</span>
                    <span>{calcResult.employerContributions.cnesst.toFixed(2)} $</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avantages sociaux:</span>
                    <span>{calcResult.socialBenefits.toFixed(2)} $</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vacances (6%):</span>
                    <span>{calcResult.vacationPay.toFixed(2)} $</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Congés fériés (7%):</span>
                    <span>{calcResult.holidayPay.toFixed(2)} $</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-blue-800 font-medium">COÛT TOTAL EMPLOYEUR</span>
                  <span className="text-2xl font-bold text-blue-600">{calcResult.totalEmployerCost.toFixed(2)} $</span>
                </div>
                <div className="text-sm text-blue-600 mt-1">
                  Multiplicateur: {(calcResult.totalEmployerCost / calcResult.grossPay).toFixed(2)}x le brut
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'timesheet' && (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
          <Clock className="mx-auto mb-3 text-gray-300" size={48} />
          <p>Module feuilles de temps CCQ</p>
          <p className="text-sm mt-1">À venir - Saisie des heures par projet</p>
        </div>
      )}

      {/* Modal Nouvel employé CCQ */}
      {showEmployeeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Nouvel employé CCQ</h2>
              <button onClick={() => setShowEmployeeModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
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
              </div>

              <div>
                <label className="block text-sm font-medium mb-1"># Carte CCQ *</label>
                <input
                  type="text"
                  value={employeeForm.ccq_number}
                  onChange={(e) => setEmployeeForm({...employeeForm, ccq_number: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg font-mono"
                  placeholder="123456"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Métier</label>
                <select
                  value={employeeForm.trade_code}
                  onChange={(e) => setEmployeeForm({...employeeForm, trade_code: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {CCQ_TRADES_2025.map(trade => (
                    <option key={trade.code} value={trade.code}>{trade.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Classification</label>
                  <select
                    value={employeeForm.classification}
                    onChange={(e) => setEmployeeForm({...employeeForm, classification: e.target.value as any})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="compagnon">Compagnon</option>
                    <option value="apprenti1">Apprenti 1ère période</option>
                    <option value="apprenti2">Apprenti 2e période</option>
                    <option value="apprenti3">Apprenti 3e période</option>
                    <option value="apprenti4">Apprenti 4e période</option>
                    <option value="apprenti5">Apprenti 5e période</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Secteur</label>
                  <select
                    value={employeeForm.sector_code}
                    onChange={(e) => setEmployeeForm({...employeeForm, sector_code: e.target.value as any})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="RL">Résidentiel léger</option>
                    <option value="RH">Résidentiel lourd</option>
                    <option value="ICI">ICI</option>
                    <option value="GC">Génie civil</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium mb-1">Expiration carte CCQ</label>
                  <input
                    type="date"
                    value={employeeForm.ccq_card_expiry}
                    onChange={(e) => setEmployeeForm({...employeeForm, ccq_card_expiry: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => setShowEmployeeModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button
                onClick={handleSaveEmployee}
                disabled={!employeeForm.first_name || !employeeForm.last_name || !employeeForm.ccq_number}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                Créer l'employé CCQ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
