/**
 * DAST Solutions - Hub Soumissions/Estimation
 * Clarifie le workflow entre Estimation et Soumissions
 */
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { PageTitle } from '@/components/PageTitle'
import { 
  Calculator, FileText, Send, Clock, CheckCircle, XCircle, 
  ArrowRight, Plus, Filter, Search, Building2, DollarSign,
  Eye, Download, Loader2
} from 'lucide-react'

interface Soumission {
  id: string
  soumission_number: string
  project_id?: string
  project_name?: string
  client_name: string
  status: 'brouillon' | 'envoyee' | 'acceptee' | 'refusee' | 'expiree'
  total: number
  created_at: string
  sent_at?: string
}

const STATUS_CONFIG = {
  brouillon: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700', icon: Clock },
  envoyee: { label: 'Envoyée', color: 'bg-blue-100 text-blue-700', icon: Send },
  acceptee: { label: 'Acceptée', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  refusee: { label: 'Refusée', color: 'bg-red-100 text-red-700', icon: XCircle },
  expiree: { label: 'Expirée', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
}

export default function Soumissions() {
  const navigate = useNavigate()
  const [soumissions, setSoumissions] = useState<Soumission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadSoumissions()
  }, [])

  const loadSoumissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('soumissions')
        .select(`
          *,
          projects:project_id (name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setSoumissions(data?.map(s => ({
        ...s,
        project_name: s.projects?.name
      })) || [])
    } catch (err) {
      console.error('Error loading soumissions:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredSoumissions = soumissions.filter(s => {
    const matchesFilter = filter === 'all' || s.status === filter
    const matchesSearch = !search || 
      s.soumission_number?.toLowerCase().includes(search.toLowerCase()) ||
      s.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.project_name?.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const stats = {
    total: soumissions.length,
    brouillon: soumissions.filter(s => s.status === 'brouillon').length,
    envoyee: soumissions.filter(s => s.status === 'envoyee').length,
    acceptee: soumissions.filter(s => s.status === 'acceptee').length,
    refusee: soumissions.filter(s => s.status === 'refusee').length,
    valueAccepted: soumissions.filter(s => s.status === 'acceptee').reduce((a, s) => a + (s.total || 0), 0)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <PageTitle title="Soumissions" />
          <p className="text-gray-500 mt-1">
            Gérez vos soumissions et devis envoyés aux clients
          </p>
        </div>
        <Link
          to="/soumission-builder"
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
        >
          <Plus size={18} />
          Nouvelle soumission
        </Link>
      </div>

      {/* Explication du workflow */}
      <div className="bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-xl p-5 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">📋 Workflow Estimation → Soumission</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
            <Calculator size={18} className="text-purple-600" />
            <span><strong>1.</strong> Takeoff & Estimation</span>
          </div>
          <ArrowRight size={18} className="text-gray-400" />
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
            <FileText size={18} className="text-teal-600" />
            <span><strong>2.</strong> Créer soumission</span>
          </div>
          <ArrowRight size={18} className="text-gray-400" />
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
            <Send size={18} className="text-blue-600" />
            <span><strong>3.</strong> Envoyer au client</span>
          </div>
          <ArrowRight size={18} className="text-gray-400" />
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
            <CheckCircle size={18} className="text-green-600" />
            <span><strong>4.</strong> Suivi & Facturation</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          💡 Les soumissions sont générées à partir de vos estimations de projet. Utilisez le Takeoff pour mesurer, puis créez une soumission professionnelle à envoyer.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">En attente</p>
          <p className="text-2xl font-bold text-blue-600">{stats.envoyee}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Acceptées</p>
          <p className="text-2xl font-bold text-green-600">{stats.acceptee}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Refusées</p>
          <p className="text-2xl font-bold text-red-600">{stats.refusee}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Valeur acceptée</p>
          <p className="text-xl font-bold text-teal-600">
            {stats.valueAccepted.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'brouillon', 'envoyee', 'acceptee', 'refusee'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  filter === status 
                    ? 'bg-teal-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'Toutes' : STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={32} className="animate-spin text-gray-400" />
        </div>
      ) : filteredSoumissions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">Aucune soumission trouvée</p>
          <Link
            to="/soumission-builder"
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            <Plus size={16} />
            Créer une soumission
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Numéro</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Projet</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredSoumissions.map(soum => {
                const StatusIcon = STATUS_CONFIG[soum.status]?.icon || Clock
                return (
                  <tr key={soum.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono font-medium text-teal-600">{soum.soumission_number}</span>
                    </td>
                    <td className="px-4 py-3 font-medium">{soum.client_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {soum.project_name || '-'}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {soum.total?.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[soum.status]?.color}`}>
                        <StatusIcon size={12} />
                        {STATUS_CONFIG[soum.status]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(soum.created_at).toLocaleDateString('fr-CA')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded">
                          <Eye size={16} />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                          <Download size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
