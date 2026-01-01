/**
 * DAST Solutions - Project Details CORRIGÉ
 * Avec champs CRM, type projet, catégorie bâtiment
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, Save, Loader2, MapPin, Calendar, DollarSign, User, FileText, 
  Ruler, Receipt, ChevronRight, Trash2, Calculator, Building2, Users,
  Globe, Home, Briefcase, ChevronDown
} from 'lucide-react'

// Options de statut
const STATUS_OPTIONS = [
  { value: 'draft', label: 'Brouillon', color: 'bg-gray-100 text-gray-700' },
  { value: 'planning', label: 'Planification', color: 'bg-blue-100 text-blue-700' },
  { value: 'active', label: 'En cours', color: 'bg-green-100 text-green-700' },
  { value: 'on_hold', label: 'En pause', color: 'bg-amber-100 text-amber-700' },
  { value: 'completed', label: 'Terminé', color: 'bg-teal-100 text-teal-700' },
  { value: 'cancelled', label: 'Annulé', color: 'bg-red-100 text-red-700' }
]

// Types de projet (public/privé)
const PROJECT_TYPES = [
  { value: 'prive', label: 'Privé' },
  { value: 'public', label: 'Public' }
]

// Portée du projet
const PROJECT_SCOPES = [
  { value: 'neuf', label: 'Construction neuve' },
  { value: 'renovation', label: 'Rénovation' },
  { value: 'agrandissement', label: 'Agrandissement' },
  { value: 'transformation', label: 'Transformation' },
  { value: 'demolition', label: 'Démolition' },
  { value: 'entretien', label: 'Entretien / Réparation' }
]

// Types de bâtiment
const BUILDING_TYPES = [
  { value: 'residence_unifamiliale', label: 'Résidence unifamiliale' },
  { value: 'residence_multifamiliale', label: 'Résidence multifamiliale' },
  { value: 'condo', label: 'Condominium' },
  { value: 'commerce', label: 'Commerce' },
  { value: 'bureau', label: 'Bureau' },
  { value: 'industriel', label: 'Industriel' },
  { value: 'entrepot', label: 'Entrepôt' },
  { value: 'garage', label: 'Garage' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'hotel', label: 'Hôtel' },
  { value: 'ecole_primaire', label: 'École primaire' },
  { value: 'ecole_secondaire', label: 'École secondaire' },
  { value: 'cegep', label: 'Cégep' },
  { value: 'universite', label: 'Université' },
  { value: 'hopital', label: 'Hôpital' },
  { value: 'clinique', label: 'Clinique médicale' },
  { value: 'chsld', label: 'CHSLD' },
  { value: 'caserne_pompier', label: 'Caserne de pompiers' },
  { value: 'poste_police', label: 'Poste de police' },
  { value: 'edifice_municipal', label: 'Édifice municipal' },
  { value: 'bibliotheque', label: 'Bibliothèque' },
  { value: 'centre_sportif', label: 'Centre sportif' },
  { value: 'arena', label: 'Aréna' },
  { value: 'piscine', label: 'Piscine' },
  { value: 'eglise', label: 'Église / Lieu de culte' },
  { value: 'autre', label: 'Autre' }
]

// Provinces canadiennes
const PROVINCES = [
  { value: 'QC', label: 'Québec' },
  { value: 'ON', label: 'Ontario' },
  { value: 'NB', label: 'Nouveau-Brunswick' },
  { value: 'NS', label: 'Nouvelle-Écosse' },
  { value: 'PE', label: 'Île-du-Prince-Édouard' },
  { value: 'NL', label: 'Terre-Neuve-et-Labrador' },
  { value: 'MB', label: 'Manitoba' },
  { value: 'SK', label: 'Saskatchewan' },
  { value: 'AB', label: 'Alberta' },
  { value: 'BC', label: 'Colombie-Britannique' },
  { value: 'YT', label: 'Yukon' },
  { value: 'NT', label: 'Territoires du Nord-Ouest' },
  { value: 'NU', label: 'Nunavut' }
]

interface Client {
  id: string
  type: 'individu' | 'societe'
  prenom?: string
  nom?: string
  nom_societe?: string
  email?: string
  telephone?: string
}

interface Contact {
  id: string
  client_id: string
  prenom: string
  nom: string
  titre?: string
  email?: string
  telephone?: string
  est_principal: boolean
}

export default function ProjectDetails() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const isNew = !projectId || projectId === 'new'

  const [project, setProject] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'edit'>('overview')
  
  // Clients et contacts
  const [clients, setClients] = useState<Client[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])

  // Formulaire
  const [form, setForm] = useState({
    name: '',
    client_id: '',
    client_name: '', // Legacy fallback
    address: '',
    city: '',
    province: 'QC',
    postal_code: '',
    description: '',
    status: 'draft',
    start_date: '',
    end_date: '',
    budget: '',
    project_type: 'prive',
    project_scope: 'neuf',
    building_type: 'residence_unifamiliale',
    is_public: false
  })

  // Charger les clients
  useEffect(() => {
    const loadClients = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .eq('actif', true)
        .order('nom_societe, nom')

      setClients(data || [])
    }
    loadClients()
  }, [])

  // Charger les contacts du client sélectionné
  useEffect(() => {
    const loadContacts = async () => {
      if (!form.client_id) {
        setContacts([])
        return
      }

      const { data } = await supabase
        .from('contacts')
        .select('*')
        .eq('client_id', form.client_id)
        .eq('actif', true)
        .order('est_principal', { ascending: false })

      setContacts(data || [])
    }
    loadContacts()
  }, [form.client_id])

  // Charger le projet existant
  useEffect(() => {
    if (isNew) {
      setActiveTab('edit')
      return
    }

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: p, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Erreur chargement projet:', error)
        navigate('/projects')
        return
      }

      if (p) {
        setProject(p)
        setForm({
          name: p.name || '',
          client_id: p.client_id || '',
          client_name: p.client_name || '',
          address: p.address || '',
          city: p.city || '',
          province: p.province || 'QC',
          postal_code: p.postal_code || '',
          description: p.description || '',
          status: p.status || 'draft',
          start_date: p.start_date || '',
          end_date: p.end_date || '',
          budget: p.budget?.toString() || '',
          project_type: p.project_type || 'prive',
          project_scope: p.project_scope || 'neuf',
          building_type: p.building_type || 'residence_unifamiliale',
          is_public: p.is_public || false
        })

        // Charger les contacts liés
        const { data: pc } = await supabase
          .from('project_contacts')
          .select('contact_id')
          .eq('project_id', projectId)

        setSelectedContacts((pc || []).map(c => c.contact_id))
      }

      // Charger les stats
      const [soumRes, factRes, measRes] = await Promise.all([
        supabase.from('soumissions').select('id, status, total').eq('project_id', projectId),
        supabase.from('factures').select('id, status, total, balance_due').eq('project_id', projectId),
        supabase.from('takeoff_measures').select('id').eq('project_id', projectId)
      ])

      const soum = soumRes.data || []
      const fact = factRes.data || []
      const meas = measRes.data || []

      setStats({
        soumissions: soum.length,
        soumissionsAccepted: soum.filter(s => s.status === 'accepted').length,
        factures: fact.length,
        facturesUnpaid: fact.filter(f => f.status !== 'paid').length,
        measures: meas.length,
        totalRevenue: fact.reduce((sum, f) => sum + (f.total - (f.balance_due || 0)), 0)
      })

      setLoading(false)
    }

    load()
  }, [projectId, isNew, navigate])

  // Sauvegarder
  const handleSave = async () => {
    if (!form.name.trim()) {
      alert('Le nom du projet est requis')
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const projectData = {
        name: form.name.trim(),
        client_id: form.client_id || null,
        client_name: form.client_name || null,
        address: form.address || null,
        city: form.city || null,
        province: form.province || 'QC',
        postal_code: form.postal_code || null,
        description: form.description || null,
        status: form.status,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        budget: form.budget ? parseFloat(form.budget) : null,
        project_type: form.project_type,
        project_scope: form.project_scope,
        building_type: form.building_type,
        is_public: form.is_public,
        updated_at: new Date().toISOString()
      }

      if (isNew) {
        const { data, error } = await supabase
          .from('projects')
          .insert({ ...projectData, user_id: user.id })
          .select()
          .single()

        if (error) throw error

        // Sauvegarder les contacts
        if (selectedContacts.length > 0 && data) {
          await supabase.from('project_contacts').insert(
            selectedContacts.map(contactId => ({
              project_id: data.id,
              contact_id: contactId
            }))
          )
        }

        navigate(`/project/${data.id}`)
      } else {
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', projectId)

        if (error) throw error

        // Mettre à jour les contacts
        await supabase.from('project_contacts').delete().eq('project_id', projectId)
        if (selectedContacts.length > 0) {
          await supabase.from('project_contacts').insert(
            selectedContacts.map(contactId => ({
              project_id: projectId,
              contact_id: contactId
            }))
          )
        }

        setProject({ ...project, ...projectData })
        setActiveTab('overview')
      }
    } catch (err: any) {
      console.error('Erreur sauvegarde:', err)
      alert(`Erreur: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet? Cette action est irréversible.')) return

    try {
      await supabase.from('projects').delete().eq('id', projectId)
      navigate('/projects')
    } catch (err) {
      console.error('Erreur suppression:', err)
    }
  }

  const toggleContact = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    )
  }

  const getClientDisplayName = (client: Client) => {
    if (client.type === 'societe') return client.nom_societe || 'Sans nom'
    return `${client.prenom || ''} ${client.nom || ''}`.trim() || 'Sans nom'
  }

  const statusConfig = STATUS_OPTIONS.find(s => s.value === project?.status) || STATUS_OPTIONS[0]

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-teal-600" size={40} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/projects')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{isNew ? 'Nouveau projet' : project?.name}</h1>
            {!isNew && project && (
              <div className="flex items-center gap-3 mt-1">
                <span className={`px-2 py-0.5 text-xs rounded-full ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
                {project.client_name && (
                  <span className="text-sm text-gray-500">
                    <User size={14} className="inline mr-1" />{project.client_name}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {!isNew && activeTab === 'overview' && (
            <button onClick={() => setActiveTab('edit')} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
              Modifier
            </button>
          )}
          {(isNew || activeTab === 'edit') && (
            <button
              onClick={handleSave}
              disabled={saving || !form.name}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              <span>{isNew ? 'Créer' : 'Enregistrer'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Formulaire d'édition */}
      {(isNew || activeTab === 'edit') && (
        <div className="bg-white rounded-xl border p-6 space-y-6">
          {/* Informations de base */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du projet <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder="Ex: Rénovation cuisine 285 rue Annie"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Type et catégorie */}
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Globe size={14} className="inline mr-1" />
                Type de projet
              </label>
              <select
                value={form.project_type}
                onChange={(e) => setForm({ ...form, project_type: e.target.value, is_public: e.target.value === 'public' })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                {PROJECT_TYPES.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Home size={14} className="inline mr-1" />
                Portée
              </label>
              <select
                value={form.project_scope}
                onChange={(e) => setForm({ ...form, project_scope: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                {PROJECT_SCOPES.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Building2 size={14} className="inline mr-1" />
                Type de bâtiment
              </label>
              <select
                value={form.building_type}
                onChange={(e) => setForm({ ...form, building_type: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                {BUILDING_TYPES.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Client CRM */}
          <div className="border-t pt-6">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase size={18} />
              Client
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sélectionner un client (CRM)
                </label>
                <select
                  value={form.client_id}
                  onChange={(e) => {
                    const client = clients.find(c => c.id === e.target.value)
                    setForm({ 
                      ...form, 
                      client_id: e.target.value,
                      client_name: client ? getClientDisplayName(client) : ''
                    })
                  }}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">-- Sélectionner --</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.type === 'societe' ? '🏢 ' : '👤 '}
                      {getClientDisplayName(client)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ou saisir manuellement
                </label>
                <input
                  type="text"
                  value={form.client_name}
                  onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="Nom du client"
                  disabled={!!form.client_id}
                />
              </div>
            </div>

            {/* Contacts du client */}
            {contacts.length > 0 && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users size={14} className="inline mr-1" />
                  Contacts associés au projet
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {contacts.map(contact => (
                    <label
                      key={contact.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                        selectedContacts.includes(contact.id) 
                          ? 'border-teal-500 bg-teal-50' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedContacts.includes(contact.id)}
                        onChange={() => toggleContact(contact.id)}
                        className="rounded text-teal-600"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {contact.prenom} {contact.nom}
                          {contact.est_principal && (
                            <span className="ml-2 text-xs text-teal-600">(Principal)</span>
                          )}
                        </p>
                        {contact.titre && (
                          <p className="text-xs text-gray-500 truncate">{contact.titre}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Adresse */}
          <div className="border-t pt-6">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <MapPin size={18} />
              Localisation
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="285 rue Annie"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    placeholder="Ste-Marthe-sur-le-Lac"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                  <select
                    value={form.province}
                    onChange={(e) => setForm({ ...form, province: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  >
                    {PROVINCES.map(prov => (
                      <option key={prov.value} value={prov.value}>{prov.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
                  <input
                    type="text"
                    value={form.postal_code}
                    onChange={(e) => setForm({ ...form, postal_code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    placeholder="J0N 1P0"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dates et budget */}
          <div className="border-t pt-6">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Calendar size={18} />
              Planification
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <DollarSign size={14} className="inline mr-1" />
                  Budget estimé
                </label>
                <input
                  type="number"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="150000"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="border-t pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="Description détaillée du projet..."
            />
          </div>

          {/* Actions */}
          {!isNew && (
            <div className="border-t pt-6 flex justify-end">
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
              >
                <Trash2 size={16} />
                Supprimer le projet
              </button>
            </div>
          )}
        </div>
      )}

      {/* Vue Overview (projet existant) */}
      {!isNew && activeTab === 'overview' && project && stats && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <FileText className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.soumissions}</p>
                  <p className="text-sm text-gray-500">Soumissions</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                  <Receipt className="text-teal-600" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.factures}</p>
                  <p className="text-sm text-gray-500">Factures</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Ruler className="text-purple-600" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.measures}</p>
                  <p className="text-sm text-gray-500">Mesures</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <DollarSign className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {stats.totalRevenue.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-sm text-gray-500">Revenus</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="grid grid-cols-4 gap-4">
            <button
              onClick={() => navigate(`/takeoff/${projectId}`)}
              className="bg-white rounded-xl p-6 border hover:shadow-lg transition group text-left"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Ruler className="text-white" size={28} />
              </div>
              <h3 className="font-semibold">Takeoff</h3>
              <p className="text-sm text-gray-500 mt-1">Relevé de quantités</p>
              <ChevronRight className="text-gray-400 mt-3" size={18} />
            </button>

            <button
              onClick={() => navigate(`/bid-proposal/${projectId}`)}
              className="bg-white rounded-xl p-6 border hover:shadow-lg transition group text-left"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <FileText className="text-white" size={28} />
              </div>
              <h3 className="font-semibold">Soumission</h3>
              <p className="text-sm text-gray-500 mt-1">Créer une soumission</p>
              <ChevronRight className="text-gray-400 mt-3" size={18} />
            </button>

            <button
              onClick={() => navigate(`/takeoff/${projectId}?tab=estimation`)}
              className="bg-white rounded-xl p-6 border hover:shadow-lg transition group text-left"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Calculator className="text-white" size={28} />
              </div>
              <h3 className="font-semibold">Estimation</h3>
              <p className="text-sm text-gray-500 mt-1">Coûts et main-d'œuvre</p>
              <ChevronRight className="text-gray-400 mt-3" size={18} />
            </button>

            <button
              onClick={() => navigate(`/factures?project=${projectId}`)}
              className="bg-white rounded-xl p-6 border hover:shadow-lg transition group text-left"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Receipt className="text-white" size={28} />
              </div>
              <h3 className="font-semibold">Facturation</h3>
              <p className="text-sm text-gray-500 mt-1">Gérer les factures</p>
              <ChevronRight className="text-gray-400 mt-3" size={18} />
            </button>
          </div>

          {/* Informations du projet */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Informations du projet</h3>
            <div className="grid grid-cols-3 gap-6 text-sm">
              <div>
                <p className="text-gray-500">Type</p>
                <p className="font-medium">{PROJECT_TYPES.find(t => t.value === project.project_type)?.label || 'Privé'}</p>
              </div>
              <div>
                <p className="text-gray-500">Portée</p>
                <p className="font-medium">{PROJECT_SCOPES.find(s => s.value === project.project_scope)?.label || 'Construction neuve'}</p>
              </div>
              <div>
                <p className="text-gray-500">Bâtiment</p>
                <p className="font-medium">{BUILDING_TYPES.find(b => b.value === project.building_type)?.label || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">Adresse</p>
                <p className="font-medium">
                  {[project.address, project.city, project.province, project.postal_code].filter(Boolean).join(', ') || '-'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Budget</p>
                <p className="font-medium">
                  {project.budget ? new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(project.budget) : '-'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Dates</p>
                <p className="font-medium">
                  {project.start_date ? new Date(project.start_date).toLocaleDateString('fr-CA') : '-'}
                  {project.end_date ? ` → ${new Date(project.end_date).toLocaleDateString('fr-CA')}` : ''}
                </p>
              </div>
            </div>
            {project.description && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-gray-500 text-sm">Description</p>
                <p className="mt-1">{project.description}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
