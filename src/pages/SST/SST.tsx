/**
 * DAST Solutions - Phase E: Module SST/Sécurité
 * Santé et Sécurité au Travail - Conforme CNESST
 * Incidents, Inspections, Formations, Équipements
 */
import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft, Plus, Search, Shield, AlertTriangle, HardHat,
  ClipboardCheck, Calendar, Users, FileText, Clock, CheckCircle2,
  XCircle, Eye, Edit2, Trash2, Download, Upload, Filter,
  ChevronDown, AlertCircle, Activity, Heart, Flame, Zap,
  Thermometer, Wind, Volume2, Camera, MapPin, Phone, User,
  Building2, Award, BookOpen, RefreshCw, TrendingUp, TrendingDown
} from 'lucide-react'

// Types
interface Incident {
  id: string
  project_id?: string
  incident_number: string
  incident_type: 'accident' | 'near_miss' | 'first_aid' | 'property_damage' | 'environmental'
  severity: 'minor' | 'moderate' | 'serious' | 'critical'
  
  date: string
  time: string
  location: string
  
  description: string
  immediate_actions?: string
  root_cause?: string
  
  injured_person?: string
  injury_type?: string
  body_part?: string
  treatment?: string
  lost_time_days?: number
  
  witnesses?: string[]
  reported_by: string
  
  status: 'open' | 'investigating' | 'corrective_action' | 'closed'
  cnesst_reported: boolean
  cnesst_number?: string
  
  photos?: string[]
  documents?: string[]
  
  created_at: string
  updated_at: string
}

interface SafetyInspection {
  id: string
  project_id?: string
  inspection_number: string
  inspection_type: 'daily' | 'weekly' | 'monthly' | 'special'
  
  date: string
  inspector_name: string
  
  checklist_items: {
    category: string
    item: string
    status: 'pass' | 'fail' | 'na'
    notes?: string
  }[]
  
  deficiencies_found: number
  corrective_actions?: string
  
  overall_rating: 'excellent' | 'good' | 'fair' | 'poor'
  status: 'completed' | 'pending_review' | 'corrective_required'
  
  photos?: string[]
  signature?: string
  
  created_at: string
}

interface Training {
  id: string
  employee_id?: string
  employee_name: string
  
  training_type: string
  training_name: string
  provider?: string
  
  completion_date: string
  expiry_date?: string
  
  certificate_number?: string
  certificate_url?: string
  
  status: 'valid' | 'expiring_soon' | 'expired'
  
  created_at: string
}

interface SafetyEquipment {
  id: string
  equipment_type: string
  name: string
  serial_number?: string
  
  location?: string
  assigned_to?: string
  
  last_inspection: string
  next_inspection: string
  
  status: 'active' | 'needs_inspection' | 'out_of_service' | 'retired'
  
  notes?: string
  created_at: string
}

// Types d'incidents
const INCIDENT_TYPES = [
  { value: 'accident', label: 'Accident de travail', color: 'red' },
  { value: 'near_miss', label: 'Quasi-accident', color: 'amber' },
  { value: 'first_aid', label: 'Premiers soins', color: 'blue' },
  { value: 'property_damage', label: 'Dommages matériels', color: 'purple' },
  { value: 'environmental', label: 'Environnemental', color: 'green' },
]

// Types de formations
const TRAINING_TYPES = [
  { value: 'asr', label: 'ASP Construction (Carte ASP)' },
  { value: 'secourisme', label: 'Secourisme en milieu de travail' },
  { value: 'nacelle', label: 'Opération de nacelle élévatrice' },
  { value: 'chariot', label: 'Chariot élévateur' },
  { value: 'espace_clos', label: 'Travail en espace clos' },
  { value: 'hauteur', label: 'Travail en hauteur' },
  { value: 'simdut', label: 'SIMDUT 2015' },
  { value: 'cadenassage', label: 'Cadenassage' },
  { value: 'amiante', label: 'Travaux avec amiante' },
  { value: 'silice', label: 'Exposition à la silice' },
  { value: 'electrique', label: 'Sécurité électrique' },
  { value: 'excavation', label: 'Travaux d\'excavation' },
]

// Checklist inspection quotidienne
const DAILY_CHECKLIST = [
  { category: 'EPI', items: ['Casques de sécurité', 'Lunettes de protection', 'Gants', 'Bottes de sécurité', 'Vestes haute visibilité'] },
  { category: 'Échafaudages', items: ['Inspection visuelle', 'Garde-corps installés', 'Planchers complets', 'Accès sécuritaire'] },
  { category: 'Électricité', items: ['Câbles en bon état', 'Prises GFCI', 'Panneaux accessibles', 'Mise à la terre'] },
  { category: 'Excavations', items: ['Étançonnement', 'Pente adéquate', 'Accès/sortie', 'Surveillance des parois'] },
  { category: 'Incendie', items: ['Extincteurs accessibles', 'Sorties dégagées', 'Matières inflammables entreposées', 'Permis de travail à chaud'] },
  { category: 'Ordre & propreté', items: ['Aires de travail propres', 'Matériaux rangés', 'Passages dégagés', 'Déchets évacués'] },
]

// Status badges
function StatusBadge({ status, type }: { status: string, type?: string }) {
  const configs: Record<string, { className: string, label: string }> = {
    // Incidents
    open: { className: 'bg-red-100 text-red-700', label: 'Ouvert' },
    investigating: { className: 'bg-amber-100 text-amber-700', label: 'En enquête' },
    corrective_action: { className: 'bg-blue-100 text-blue-700', label: 'Actions correctives' },
    closed: { className: 'bg-green-100 text-green-700', label: 'Fermé' },
    // Severity
    minor: { className: 'bg-gray-100 text-gray-600', label: 'Mineur' },
    moderate: { className: 'bg-amber-100 text-amber-700', label: 'Modéré' },
    serious: { className: 'bg-orange-100 text-orange-700', label: 'Sérieux' },
    critical: { className: 'bg-red-100 text-red-700', label: 'Critique' },
    // Inspections
    completed: { className: 'bg-green-100 text-green-700', label: 'Complétée' },
    pending_review: { className: 'bg-amber-100 text-amber-700', label: 'En révision' },
    corrective_required: { className: 'bg-red-100 text-red-700', label: 'Corrections requises' },
    // Ratings
    excellent: { className: 'bg-green-100 text-green-700', label: 'Excellent' },
    good: { className: 'bg-blue-100 text-blue-700', label: 'Bon' },
    fair: { className: 'bg-amber-100 text-amber-700', label: 'Passable' },
    poor: { className: 'bg-red-100 text-red-700', label: 'Mauvais' },
    // Training
    valid: { className: 'bg-green-100 text-green-700', label: 'Valide' },
    expiring_soon: { className: 'bg-amber-100 text-amber-700', label: 'Expire bientôt' },
    expired: { className: 'bg-red-100 text-red-700', label: 'Expiré' },
    // Equipment
    active: { className: 'bg-green-100 text-green-700', label: 'Actif' },
    needs_inspection: { className: 'bg-amber-100 text-amber-700', label: 'Inspection requise' },
    out_of_service: { className: 'bg-red-100 text-red-700', label: 'Hors service' },
    retired: { className: 'bg-gray-100 text-gray-600', label: 'Retiré' },
  }
  const config = configs[status] || { className: 'bg-gray-100 text-gray-600', label: status }
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

export default function SST() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'incidents' | 'inspections' | 'training' | 'equipment'>('dashboard')
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [inspections, setInspections] = useState<SafetyInspection[]>([])
  const [trainings, setTrainings] = useState<Training[]>([])
  const [equipment, setEquipment] = useState<SafetyEquipment[]>([])
  const [loading, setLoading] = useState(true)
  const [showIncidentModal, setShowIncidentModal] = useState(false)
  const [showInspectionModal, setShowInspectionModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Stats
  const [stats, setStats] = useState({
    totalIncidents: 0,
    openIncidents: 0,
    daysWithoutIncident: 42,
    inspectionsThisMonth: 0,
    trainingCompliance: 95,
    equipmentDue: 0
  })

  // Formulaire incident
  const [incidentForm, setIncidentForm] = useState({
    incident_type: 'near_miss',
    severity: 'minor',
    date: new Date().toISOString().split('T')[0],
    time: '',
    location: '',
    description: '',
    injured_person: '',
    reported_by: ''
  })

  useEffect(() => {
    loadData()
  }, [projectId])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Charger les incidents
      let incidentsQuery = supabase
        .from('safety_incidents')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (projectId) {
        incidentsQuery = incidentsQuery.eq('project_id', projectId)
      }

      const { data: incidentsData } = await incidentsQuery
      setIncidents(incidentsData || [])

      // Charger les inspections
      let inspectionsQuery = supabase
        .from('safety_inspections')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (projectId) {
        inspectionsQuery = inspectionsQuery.eq('project_id', projectId)
      }

      const { data: inspectionsData } = await inspectionsQuery
      setInspections(inspectionsData || [])

      // Charger les formations
      const { data: trainingsData } = await supabase
        .from('safety_trainings')
        .select('*')
        .eq('user_id', user.id)
        .order('expiry_date', { ascending: true })

      setTrainings(trainingsData || [])

      // Charger les équipements
      const { data: equipmentData } = await supabase
        .from('safety_equipment')
        .select('*')
        .eq('user_id', user.id)
        .order('next_inspection', { ascending: true })

      setEquipment(equipmentData || [])

      // Calculer les stats
      const openIncidents = (incidentsData || []).filter(i => i.status !== 'closed').length
      const thisMonth = new Date().toISOString().slice(0, 7)
      const inspectionsThisMonth = (inspectionsData || []).filter(i => i.date.startsWith(thisMonth)).length
      const expiringSoon = (trainingsData || []).filter(t => t.status === 'expiring_soon' || t.status === 'expired').length
      const equipmentDue = (equipmentData || []).filter(e => e.status === 'needs_inspection').length

      setStats({
        totalIncidents: (incidentsData || []).length,
        openIncidents,
        daysWithoutIncident: 42, // À calculer
        inspectionsThisMonth,
        trainingCompliance: 100 - Math.round((expiringSoon / Math.max((trainingsData || []).length, 1)) * 100),
        equipmentDue
      })

    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateIncidentNumber = () => {
    const year = new Date().getFullYear()
    const count = incidents.length + 1
    return `INC-${year}-${String(count).padStart(4, '0')}`
  }

  const handleCreateIncident = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const newIncident = {
      user_id: user.id,
      project_id: projectId || null,
      incident_number: generateIncidentNumber(),
      incident_type: incidentForm.incident_type,
      severity: incidentForm.severity,
      date: incidentForm.date,
      time: incidentForm.time,
      location: incidentForm.location,
      description: incidentForm.description,
      injured_person: incidentForm.injured_person || null,
      reported_by: incidentForm.reported_by || user.email,
      status: 'open',
      cnesst_reported: false
    }

    const { data, error } = await supabase
      .from('safety_incidents')
      .insert(newIncident)
      .select()
      .single()

    if (!error && data) {
      setIncidents([data, ...incidents])
      setShowIncidentModal(false)
      resetIncidentForm()
    }
  }

  const resetIncidentForm = () => {
    setIncidentForm({
      incident_type: 'near_miss',
      severity: 'minor',
      date: new Date().toISOString().split('T')[0],
      time: '',
      location: '',
      description: '',
      injured_person: '',
      reported_by: ''
    })
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
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
            <Shield className="text-orange-600" />
            Santé et Sécurité au Travail
          </h1>
          <p className="text-gray-500">Gestion SST conforme CNESST</p>
        </div>
        <button
          onClick={() => setShowIncidentModal(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
        >
          <AlertTriangle size={16} />
          Signaler un incident
        </button>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.daysWithoutIncident}</p>
              <p className="text-xs text-gray-500">Jours sans incident</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="text-red-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.openIncidents}</p>
              <p className="text-xs text-gray-500">Incidents ouverts</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClipboardCheck className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.inspectionsThisMonth}</p>
              <p className="text-xs text-gray-500">Inspections ce mois</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Award className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.trainingCompliance}%</p>
              <p className="text-xs text-gray-500">Conformité formations</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <HardHat className="text-amber-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.equipmentDue}</p>
              <p className="text-xs text-gray-500">Équip. à inspecter</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Activity className="text-orange-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalIncidents}</p>
              <p className="text-xs text-gray-500">Total incidents</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {[
          { id: 'dashboard', label: 'Tableau de bord', icon: Activity },
          { id: 'incidents', label: 'Incidents', icon: AlertTriangle, count: stats.openIncidents },
          { id: 'inspections', label: 'Inspections', icon: ClipboardCheck },
          { id: 'training', label: 'Formations', icon: BookOpen },
          { id: 'equipment', label: 'Équipements', icon: HardHat },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 -mb-px transition ${
              activeTab === tab.id
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Contenu - Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-2 gap-6">
          {/* Incidents récents */}
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="text-red-600" size={18} />
              Incidents récents
            </h3>
            {incidents.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Aucun incident signalé</p>
            ) : (
              <div className="space-y-3">
                {incidents.slice(0, 5).map(incident => (
                  <div key={incident.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{incident.incident_number}</span>
                        <StatusBadge status={incident.severity} />
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{incident.description.substring(0, 50)}...</p>
                    </div>
                    <StatusBadge status={incident.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inspections à venir */}
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <ClipboardCheck className="text-blue-600" size={18} />
              Inspections récentes
            </h3>
            {inspections.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-2">Aucune inspection</p>
                <button
                  onClick={() => setShowInspectionModal(true)}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Créer une inspection
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {inspections.slice(0, 5).map(inspection => (
                  <div key={inspection.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{inspection.inspection_number}</span>
                        <StatusBadge status={inspection.overall_rating} />
                      </div>
                      <p className="text-sm text-gray-500">{new Date(inspection.date).toLocaleDateString('fr-CA')}</p>
                    </div>
                    <span className="text-sm">{inspection.deficiencies_found} déficiences</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Formations expirantes */}
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="text-purple-600" size={18} />
              Formations à renouveler
            </h3>
            {trainings.filter(t => t.status !== 'valid').length === 0 ? (
              <p className="text-center text-gray-500 py-4">Toutes les formations sont à jour</p>
            ) : (
              <div className="space-y-3">
                {trainings.filter(t => t.status !== 'valid').slice(0, 5).map(training => (
                  <div key={training.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{training.employee_name}</p>
                      <p className="text-sm text-gray-500">{training.training_name}</p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={training.status} />
                      <p className="text-xs text-gray-400 mt-1">
                        {training.expiry_date && new Date(training.expiry_date).toLocaleDateString('fr-CA')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Statistiques de sécurité */}
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Activity className="text-orange-600" size={18} />
              Indicateurs de performance SST
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Taux de fréquence</span>
                  <span className="font-medium text-green-600">0.5</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full w-1/4 bg-green-500 rounded-full" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Taux de gravité</span>
                  <span className="font-medium text-green-600">0.02</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full w-1/6 bg-green-500 rounded-full" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Conformité inspections</span>
                  <span className="font-medium text-blue-600">92%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '92%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Conformité formations</span>
                  <span className="font-medium text-purple-600">{stats.trainingCompliance}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${stats.trainingCompliance}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenu - Incidents */}
      {activeTab === 'incidents' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un incident..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg w-64"
              />
            </div>
            <button
              onClick={() => setShowIncidentModal(true)}
              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm"
            >
              <Plus size={16} />
              Nouveau incident
            </button>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">N° Incident</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Description</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Sévérité</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Statut</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">CNESST</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    <Shield className="mx-auto mb-3 text-gray-300" size={48} />
                    <p>Aucun incident signalé</p>
                    <p className="text-sm text-green-600 mt-1">Excellent travail!</p>
                  </td>
                </tr>
              ) : (
                incidents.map(incident => {
                  const typeConfig = INCIDENT_TYPES.find(t => t.value === incident.incident_type)
                  return (
                    <tr key={incident.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-mono font-medium">{incident.incident_number}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs bg-${typeConfig?.color || 'gray'}-100 text-${typeConfig?.color || 'gray'}-700`}>
                          {typeConfig?.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {new Date(incident.date).toLocaleDateString('fr-CA')}
                        {incident.time && <span className="text-gray-400 ml-1">{incident.time}</span>}
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm max-w-xs truncate">{incident.description}</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={incident.severity} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={incident.status} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        {incident.cnesst_reported ? (
                          <CheckCircle2 className="text-green-600 mx-auto" size={18} />
                        ) : (
                          <XCircle className="text-gray-300 mx-auto" size={18} />
                        )}
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
      )}

      {/* Contenu - Formations */}
      {activeTab === 'training' && (
        <div className="bg-white rounded-xl border p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Formations des employés</h3>
            <button className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm flex items-center gap-1">
              <Plus size={14} />
              Ajouter formation
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            {TRAINING_TYPES.slice(0, 6).map(type => (
              <div key={type.value} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{type.label}</p>
                    <p className="text-sm text-gray-500">
                      {trainings.filter(t => t.training_type === type.value).length} employés
                    </p>
                  </div>
                  <Award className="text-purple-600" size={20} />
                </div>
              </div>
            ))}
          </div>

          <table className="w-full">
            <thead className="bg-gray-50 border-y">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Employé</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Formation</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Date obtention</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Expiration</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {trainings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    Aucune formation enregistrée
                  </td>
                </tr>
              ) : (
                trainings.map(training => (
                  <tr key={training.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{training.employee_name}</td>
                    <td className="py-3 px-4">{training.training_name}</td>
                    <td className="py-3 px-4 text-center text-sm">
                      {new Date(training.completion_date).toLocaleDateString('fr-CA')}
                    </td>
                    <td className="py-3 px-4 text-center text-sm">
                      {training.expiry_date ? new Date(training.expiry_date).toLocaleDateString('fr-CA') : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={training.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Contenu - Équipements */}
      {activeTab === 'equipment' && (
        <div className="bg-white rounded-xl border p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Équipements de sécurité</h3>
            <button className="px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm flex items-center gap-1">
              <Plus size={14} />
              Ajouter équipement
            </button>
          </div>

          {equipment.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Aucun équipement enregistré</p>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {equipment.map(eq => (
                <div key={eq.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{eq.name}</p>
                      <p className="text-sm text-gray-500">{eq.equipment_type}</p>
                    </div>
                    <StatusBadge status={eq.status} />
                  </div>
                  {eq.serial_number && (
                    <p className="text-xs text-gray-400 font-mono">S/N: {eq.serial_number}</p>
                  )}
                  <div className="mt-2 pt-2 border-t text-xs text-gray-500">
                    <p>Prochaine inspection: {new Date(eq.next_inspection).toLocaleDateString('fr-CA')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contenu - Inspections */}
      {activeTab === 'inspections' && (
        <div className="bg-white rounded-xl border p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Inspections de sécurité</h3>
            <button
              onClick={() => setShowInspectionModal(true)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1"
            >
              <Plus size={14} />
              Nouvelle inspection
            </button>
          </div>

          {inspections.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Aucune inspection</p>
          ) : (
            <div className="space-y-3">
              {inspections.map(inspection => (
                <div key={inspection.id} className="p-4 border rounded-lg flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{inspection.inspection_number}</span>
                      <span className="text-sm text-gray-500">
                        {inspection.inspection_type === 'daily' ? 'Quotidienne' :
                         inspection.inspection_type === 'weekly' ? 'Hebdomadaire' :
                         inspection.inspection_type === 'monthly' ? 'Mensuelle' : 'Spéciale'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Par {inspection.inspector_name} le {new Date(inspection.date).toLocaleDateString('fr-CA')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <StatusBadge status={inspection.overall_rating} />
                      <p className="text-xs text-gray-500 mt-1">{inspection.deficiencies_found} déficiences</p>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded">
                      <Eye size={16} className="text-gray-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Nouvel Incident */}
      {showIncidentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <AlertTriangle className="text-red-600" />
                Signaler un incident
              </h2>
              <button onClick={() => setShowIncidentModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type d'incident *</label>
                  <select
                    value={incidentForm.incident_type}
                    onChange={(e) => setIncidentForm({...incidentForm, incident_type: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {INCIDENT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sévérité *</label>
                  <select
                    value={incidentForm.severity}
                    onChange={(e) => setIncidentForm({...incidentForm, severity: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="minor">Mineur</option>
                    <option value="moderate">Modéré</option>
                    <option value="serious">Sérieux</option>
                    <option value="critical">Critique</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date *</label>
                  <input
                    type="date"
                    value={incidentForm.date}
                    onChange={(e) => setIncidentForm({...incidentForm, date: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Heure</label>
                  <input
                    type="time"
                    value={incidentForm.time}
                    onChange={(e) => setIncidentForm({...incidentForm, time: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Lieu de l'incident *</label>
                <input
                  type="text"
                  value={incidentForm.location}
                  onChange={(e) => setIncidentForm({...incidentForm, location: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Ex: Niveau 3, près de l'escalier B"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description de l'incident *</label>
                <textarea
                  value={incidentForm.description}
                  onChange={(e) => setIncidentForm({...incidentForm, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={4}
                  placeholder="Décrivez ce qui s'est passé..."
                />
              </div>

              {(incidentForm.incident_type === 'accident' || incidentForm.incident_type === 'first_aid') && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">Information sur la personne blessée</h4>
                  <input
                    type="text"
                    value={incidentForm.injured_person}
                    onChange={(e) => setIncidentForm({...incidentForm, injured_person: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Nom de la personne blessée"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Signalé par</label>
                <input
                  type="text"
                  value={incidentForm.reported_by}
                  onChange={(e) => setIncidentForm({...incidentForm, reported_by: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Votre nom"
                />
              </div>

              {(incidentForm.severity === 'serious' || incidentForm.severity === 'critical') && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="text-amber-600 mt-0.5" size={20} />
                    <div>
                      <p className="font-medium text-amber-800">Déclaration CNESST requise</p>
                      <p className="text-sm text-amber-700">
                        Les incidents sérieux ou critiques doivent être déclarés à la CNESST dans les 24 heures.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowIncidentModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button
                onClick={handleCreateIncident}
                disabled={!incidentForm.description || !incidentForm.location}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Signaler l'incident
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
