import { useState, useEffect } from 'react'
import { PageTitle } from '@/components/PageTitle'
import { useAppelOffres } from '@/hooks/useAppelOffres'
import { useEntrepreneurs } from '@/hooks/useEntrepreneurs'
import { useProjects } from '@/hooks/useProjects'
import { 
  Plus, Search, Send, FileText, Users, Calendar,
  Check, X, Eye, Trash2, Edit2, DollarSign, TrendingDown,
  Building, ChevronRight, AlertCircle, CheckCircle, Mail,
  Award, BarChart3, ArrowRight
} from 'lucide-react'
import type { 
  AppelOffre, 
  InvitationSoumission,
  CreateAppelOffreParams,
  AppelOffreStatus,
  SoumissionSTStatus,
  Entrepreneur
} from '@/types/entrepreneur-types'
import { 
  APPEL_OFFRE_STATUS_LABELS,
  SOUMISSION_ST_STATUS_LABELS,
  calculatePriceVariance,
  getSpecialiteName
} from '@/types/entrepreneur-types'

const StatusBadge = ({ status }: { status: AppelOffreStatus }) => {
  const colors: Record<AppelOffreStatus, string> = {
    brouillon: 'bg-gray-100 text-gray-700',
    envoye: 'bg-blue-100 text-blue-700',
    en_cours: 'bg-yellow-100 text-yellow-700',
    termine: 'bg-green-100 text-green-700',
    annule: 'bg-red-100 text-red-700'
  }
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
      {APPEL_OFFRE_STATUS_LABELS[status]}
    </span>
  )
}

const InvitationStatusBadge = ({ status }: { status: SoumissionSTStatus }) => {
  const colors: Record<SoumissionSTStatus, string> = {
    en_attente: 'bg-gray-100 text-gray-600',
    recu: 'bg-blue-100 text-blue-700',
    accepte: 'bg-green-100 text-green-700',
    refuse: 'bg-red-100 text-red-700',
    expire: 'bg-orange-100 text-orange-700'
  }
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
      {SOUMISSION_ST_STATUS_LABELS[status]}
    </span>
  )
}

function CreateAppelOffreModal({
  isOpen,
  onClose,
  onCreated
}: {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
}) {
  const { projects } = useProjects()
  const { entrepreneurs } = useEntrepreneurs()
  const { createAppelOffre } = useAppelOffres()
  
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    project_id: '',
    titre: '',
    description: '',
    etendue_travaux: '',
    date_limite: '',
    entrepreneur_ids: [] as string[]
  })
  
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSpecialite, setFilterSpecialite] = useState('')

  const filteredEntrepreneurs = entrepreneurs
    .filter(e => e.status === 'actif')
    .filter(e => {
      const matchSearch = !searchQuery || 
        e.company_name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchSpecialite = !filterSpecialite || 
        e.specialites?.includes(filterSpecialite as any)
      return matchSearch && matchSpecialite
    })

  const toggleEntrepreneur = (id: string) => {
    setForm(prev => ({
      ...prev,
      entrepreneur_ids: prev.entrepreneur_ids.includes(id)
        ? prev.entrepreneur_ids.filter(eid => eid !== id)
        : [...prev.entrepreneur_ids, id]
    }))
  }

  const selectAll = () => {
    setForm(prev => ({
      ...prev,
      entrepreneur_ids: filteredEntrepreneurs.map(e => e.id)
    }))
  }

  const deselectAll = () => {
    setForm(prev => ({ ...prev, entrepreneur_ids: [] }))
  }

  const handleSubmit = async () => {
    if (!form.project_id || !form.titre || !form.date_limite) {
      alert('Veuillez remplir les champs obligatoires')
      return
    }

    if (form.entrepreneur_ids.length === 0) {
      alert('Sélectionnez au moins un entrepreneur')
      return
    }

    setLoading(true)
    try {
      const result = await createAppelOffre(form as CreateAppelOffreParams)
      if (result) {
        onCreated()
        onClose()
        resetForm()
      }
    } catch (err) {
      alert('Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setForm({
      project_id: '',
      titre: '',
      description: '',
      etendue_travaux: '',
      date_limite: '',
      entrepreneur_ids: []
    })
    setSearchQuery('')
    setFilterSpecialite('')
  }

  useEffect(() => {
    if (!form.date_limite) {
      const defaultDate = new Date()
      defaultDate.setDate(defaultDate.getDate() + 14)
      setForm(prev => ({ ...prev, date_limite: defaultDate.toISOString().split('T')[0] }))
    }
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Nouvel appel d'offres</h2>
            <p className="text-orange-100 text-sm">Étape {step} de 2</p>
          </div>
          <button onClick={onClose} className="text-white hover:text-orange-200">
            <X size={24} />
          </button>
        </div>

        <div className="flex bg-gray-100">
          <div className={`flex-1 h-1 ${step >= 1 ? 'bg-orange-500' : 'bg-gray-300'}`} />
          <div className={`flex-1 h-1 ${step >= 2 ? 'bg-orange-500' : 'bg-gray-300'}`} />
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Projet *</label>
                <select
                  value={form.project_id}
                  onChange={(e) => setForm({...form, project_id: e.target.value})}
                  className="input-field"
                  required
                >
                  <option value="">-- Sélectionner un projet --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre de l'appel d'offres *</label>
                <input
                  type="text"
                  value={form.titre}
                  onChange={(e) => setForm({...form, titre: e.target.value})}
                  placeholder="Ex: Travaux de plomberie - Phase 1"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  placeholder="Description générale des travaux..."
                  rows={3}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Étendue des travaux *</label>
                <textarea
                  value={form.etendue_travaux}
                  onChange={(e) => setForm({...form, etendue_travaux: e.target.value})}
                  placeholder="Détaillez précisément ce qui est inclus et exclu des travaux demandés..."
                  rows={6}
                  className="input-field"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Soyez précis pour pouvoir comparer les soumissions sur la même base
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date limite de réponse *</label>
                <input
                  type="date"
                  value={form.date_limite}
                  onChange={(e) => setForm({...form, date_limite: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  className="input-field w-auto"
                  required
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un entrepreneur..."
                    className="input-field pl-10"
                  />
                </div>
                <select
                  value={filterSpecialite}
                  onChange={(e) => setFilterSpecialite(e.target.value)}
                  className="input-field w-auto"
                >
                  <option value="">Toutes spécialités</option>
                  <option value="PLOMB">Plomberie</option>
                  <option value="ELEC">Électricité</option>
                  <option value="CVAC">CVAC</option>
                  <option value="MACONN">Maçonnerie</option>
                  <option value="TOIT">Toiture</option>
                </select>
              </div>

              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  {form.entrepreneur_ids.length} entrepreneur(s) sélectionné(s)
                </p>
                <div className="space-x-2">
                  <button onClick={selectAll} className="text-sm text-teal-600 hover:underline">
                    Tout sélectionner
                  </button>
                  <button onClick={deselectAll} className="text-sm text-gray-500 hover:underline">
                    Tout désélectionner
                  </button>
                </div>
              </div>

              <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                {filteredEntrepreneurs.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Users size={48} className="mx-auto mb-2 opacity-30" />
                    <p>Aucun entrepreneur trouvé</p>
                  </div>
                ) : (
                  filteredEntrepreneurs.map(entrepreneur => (
                    <label
                      key={entrepreneur.id}
                      className={`flex items-center p-4 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${
                        form.entrepreneur_ids.includes(entrepreneur.id) ? 'bg-orange-50' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.entrepreneur_ids.includes(entrepreneur.id)}
                        onChange={() => toggleEntrepreneur(entrepreneur.id)}
                        className="mr-4 w-5 h-5"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{entrepreneur.company_name}</p>
                        <p className="text-sm text-gray-500">
                          {entrepreneur.contact_name && `${entrepreneur.contact_name} • `}
                          {entrepreneur.city || 'Ville non spécifiée'}
                        </p>
                        {entrepreneur.specialites && entrepreneur.specialites.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {entrepreneur.specialites.slice(0, 3).map(code => (
                              <span key={code} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                {getSpecialiteName(code)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {entrepreneur.email && (
                        <Mail size={16} className="text-gray-400 ml-2" />
                      )}
                    </label>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-between">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="btn btn-secondary"
          >
            {step > 1 ? 'Précédent' : 'Annuler'}
          </button>
          
          {step < 2 ? (
            <button
              onClick={() => setStep(2)}
              disabled={!form.project_id || !form.titre}
              className="btn btn-primary bg-orange-500 hover:bg-orange-600"
            >
              Suivant <ChevronRight size={16} className="ml-1" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || form.entrepreneur_ids.length === 0}
              className="btn btn-primary bg-orange-500 hover:bg-orange-600"
            >
              {loading ? 'Création...' : `Créer (${form.entrepreneur_ids.length} invitations)`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function AppelOffreDetailModal({
  appelOffre,
  onClose,
  onUpdate
}: {
  appelOffre: AppelOffre | null
  onClose: () => void
  onUpdate: () => void
}) {
  const { 
    updateStatus, 
    receiveSoumission, 
    selectSoumission,
    integrateToEstimation,
    markInvitationsSent
  } = useAppelOffres()
  
  const [activeTab, setActiveTab] = useState<'invitations' | 'comparaison'>('invitations')
  const [receivingId, setReceivingId] = useState<string | null>(null)
  const [receiveForm, setReceiveForm] = useState({
    montant: '',
    inclusions: '',
    exclusions: '',
    conditions: ''
  })

  if (!appelOffre) return null

  const invitations = appelOffre.invitations || []
  const soumissionsRecues = invitations.filter(i => i.status === 'recu' && i.montant)
  const lowestPrice = soumissionsRecues.length > 0 
    ? Math.min(...soumissionsRecues.map(s => s.montant!))
    : 0

  const handleReceive = async () => {
    if (!receivingId || !receiveForm.montant) return
    
    await receiveSoumission(receivingId, parseFloat(receiveForm.montant), {
      inclusions: receiveForm.inclusions,
      exclusions: receiveForm.exclusions,
      conditions: receiveForm.conditions
    })
    
    setReceivingId(null)
    setReceiveForm({ montant: '', inclusions: '', exclusions: '', conditions: '' })
    onUpdate()
  }

  const handleSelect = async (invitationId: string) => {
    if (confirm('Sélectionner cette soumission comme gagnante?')) {
      await selectSoumission(appelOffre.id, invitationId)
      onUpdate()
    }
  }

  const handleIntegrate = async (invitationId: string) => {
    if (confirm('Intégrer ce sous-traitant dans l\'estimation du projet?')) {
      const success = await integrateToEstimation(invitationId)
      if (success) {
        alert('Sous-traitant ajouté à l\'estimation!')
      }
    }
  }

  const handleSendInvitations = async () => {
    if (confirm('Marquer les invitations comme envoyées?')) {
      await markInvitationsSent(appelOffre.id)
      await updateStatus(appelOffre.id, 'envoye')
      onUpdate()
    }
  }

  const formatCurrency = (value: number) => 
    value.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-white border-b px-6 py-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">{appelOffre.titre}</h2>
                <StatusBadge status={appelOffre.status} />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {appelOffre.numero} • Date limite: {new Date(appelOffre.date_limite).toLocaleDateString('fr-CA')}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>

          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setActiveTab('invitations')}
              className={`pb-2 px-1 font-medium transition ${
                activeTab === 'invitations'
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users size={16} className="inline mr-2" />
              Invitations ({invitations.length})
            </button>
            <button
              onClick={() => setActiveTab('comparaison')}
              className={`pb-2 px-1 font-medium transition ${
                activeTab === 'comparaison'
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3 size={16} className="inline mr-2" />
              Comparaison ({soumissionsRecues.length})
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-bold text-gray-700 mb-2">Étendue des travaux</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{appelOffre.etendue_travaux || 'Non spécifié'}</p>
          </div>

          {activeTab === 'invitations' && (
            <div className="space-y-3">
              {invitations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users size={48} className="mx-auto mb-2 opacity-30" />
                  <p>Aucune invitation</p>
                </div>
              ) : (
                invitations.map(invitation => (
                  <div 
                    key={invitation.id} 
                    className={`border rounded-lg p-4 ${
                      invitation.is_selected ? 'border-green-500 bg-green-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <Building size={18} className="text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {invitation.entrepreneur?.company_name || 'Entrepreneur inconnu'}
                            {invitation.is_selected && (
                              <Award size={16} className="inline ml-2 text-green-600" />
                            )}
                          </p>
                          <p className="text-sm text-gray-500">
                            {invitation.entrepreneur?.contact_name}
                            {invitation.entrepreneur?.email && ` • ${invitation.entrepreneur.email}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <InvitationStatusBadge status={invitation.status} />
                        {invitation.montant && (
                          <span className={`font-bold text-lg ${
                            invitation.montant === lowestPrice ? 'text-green-600' : 'text-gray-900'
                          }`}>
                            {formatCurrency(invitation.montant)}
                            {invitation.montant === lowestPrice && soumissionsRecues.length > 1 && (
                              <TrendingDown size={14} className="inline ml-1" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {invitation.status === 'recu' && (
                      <div className="mt-3 pt-3 border-t grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        {invitation.inclusions && (
                          <div>
                            <p className="font-medium text-gray-700">Inclusions</p>
                            <p className="text-gray-600 whitespace-pre-wrap">{invitation.inclusions}</p>
                          </div>
                        )}
                        {invitation.exclusions && (
                          <div>
                            <p className="font-medium text-gray-700">Exclusions</p>
                            <p className="text-gray-600 whitespace-pre-wrap">{invitation.exclusions}</p>
                          </div>
                        )}
                        {invitation.conditions && (
                          <div>
                            <p className="font-medium text-gray-700">Conditions</p>
                            <p className="text-gray-600 whitespace-pre-wrap">{invitation.conditions}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t flex gap-2">
                      {invitation.status === 'en_attente' && (
                        <button
                          onClick={() => setReceivingId(invitation.id)}
                          className="btn btn-sm bg-blue-100 text-blue-700 hover:bg-blue-200"
                        >
                          <DollarSign size={14} className="mr-1" /> Entrer le prix
                        </button>
                      )}
                      {invitation.status === 'recu' && !invitation.is_selected && (
                        <>
                          <button
                            onClick={() => handleSelect(invitation.id)}
                            className="btn btn-sm bg-green-100 text-green-700 hover:bg-green-200"
                          >
                            <Check size={14} className="mr-1" /> Sélectionner
                          </button>
                          <button
                            onClick={() => setReceivingId(invitation.id)}
                            className="btn btn-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
                          >
                            <Edit2 size={14} className="mr-1" /> Modifier
                          </button>
                        </>
                      )}
                      {invitation.is_selected && (
                        <button
                          onClick={() => handleIntegrate(invitation.id)}
                          className="btn btn-sm bg-teal-100 text-teal-700 hover:bg-teal-200"
                        >
                          <ArrowRight size={14} className="mr-1" /> Intégrer à l'estimation
                        </button>
                      )}
                    </div>

                    {receivingId === invitation.id && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg space-y-3">
                        <h4 className="font-medium text-blue-900">Enregistrer la soumission</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-sm text-blue-800">Montant *</label>
                            <input
                              type="number"
                              step="0.01"
                              value={receiveForm.montant}
                              onChange={(e) => setReceiveForm({...receiveForm, montant: e.target.value})}
                              placeholder="0.00"
                              className="input-field"
                              autoFocus
                            />
                          </div>
                          <div>
                            <label className="text-sm text-blue-800">Inclusions</label>
                            <textarea
                              value={receiveForm.inclusions}
                              onChange={(e) => setReceiveForm({...receiveForm, inclusions: e.target.value})}
                              placeholder="Ce qui est inclus..."
                              rows={2}
                              className="input-field"
                            />
                          </div>
                          <div>
                            <label className="text-sm text-blue-800">Exclusions</label>
                            <textarea
                              value={receiveForm.exclusions}
                              onChange={(e) => setReceiveForm({...receiveForm, exclusions: e.target.value})}
                              placeholder="Ce qui est exclu..."
                              rows={2}
                              className="input-field"
                            />
                          </div>
                          <div>
                            <label className="text-sm text-blue-800">Conditions</label>
                            <textarea
                              value={receiveForm.conditions}
                              onChange={(e) => setReceiveForm({...receiveForm, conditions: e.target.value})}
                              placeholder="Conditions particulières..."
                              rows={2}
                              className="input-field"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleReceive}
                            disabled={!receiveForm.montant}
                            className="btn btn-primary"
                          >
                            <Check size={14} className="mr-1" /> Enregistrer
                          </button>
                          <button
                            onClick={() => {
                              setReceivingId(null)
                              setReceiveForm({ montant: '', inclusions: '', exclusions: '', conditions: '' })
                            }}
                            className="btn btn-secondary"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'comparaison' && (
            <div>
              {soumissionsRecues.length < 2 ? (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 size={48} className="mx-auto mb-2 opacity-30" />
                  <p>Il faut au moins 2 soumissions pour comparer</p>
                  <p className="text-sm mt-1">
                    {soumissionsRecues.length === 0 
                      ? 'Aucune soumission reçue pour le moment'
                      : '1 soumission reçue, en attente d\'autres réponses'
                    }
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border p-3 text-left font-medium text-gray-700">Critère</th>
                        {soumissionsRecues.map(s => (
                          <th key={s.id} className="border p-3 text-center font-medium text-gray-700">
                            <div className="flex flex-col items-center">
                              <span>{s.entrepreneur?.company_name}</span>
                              {s.is_selected && (
                                <span className="text-xs text-green-600 flex items-center gap-1 mt-1">
                                  <Award size={12} /> Sélectionné
                                </span>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border p-3 font-medium">Prix</td>
                        {soumissionsRecues.map(s => (
                          <td 
                            key={s.id} 
                            className={`border p-3 text-center font-bold text-lg ${
                              s.montant === lowestPrice ? 'bg-green-50 text-green-700' : ''
                            }`}
                          >
                            {formatCurrency(s.montant!)}
                            {s.montant !== lowestPrice && (
                              <span className="block text-xs text-red-500 font-normal">
                                +{calculatePriceVariance(s.montant!, lowestPrice)}%
                              </span>
                            )}
                            {s.montant === lowestPrice && (
                              <span className="block text-xs text-green-600 font-normal">
                                Meilleur prix
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="border p-3 font-medium">Inclusions</td>
                        {soumissionsRecues.map(s => (
                          <td key={s.id} className="border p-3 text-sm">
                            {s.inclusions || '-'}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="border p-3 font-medium">Exclusions</td>
                        {soumissionsRecues.map(s => (
                          <td key={s.id} className="border p-3 text-sm text-red-600">
                            {s.exclusions || '-'}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="border p-3 font-medium">Conditions</td>
                        {soumissionsRecues.map(s => (
                          <td key={s.id} className="border p-3 text-sm">
                            {s.conditions || '-'}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="border p-3 font-medium">Action</td>
                        {soumissionsRecues.map(s => (
                          <td key={s.id} className="border p-3 text-center">
                            {!s.is_selected ? (
                              <button
                                onClick={() => handleSelect(s.id)}
                                className="btn btn-sm bg-green-600 text-white hover:bg-green-700"
                              >
                                <Check size={14} className="mr-1" /> Sélectionner
                              </button>
                            ) : (
                              <button
                                onClick={() => handleIntegrate(s.id)}
                                className="btn btn-sm bg-teal-600 text-white hover:bg-teal-700"
                              >
                                <ArrowRight size={14} className="mr-1" /> Intégrer
                              </button>
                            )}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
          <div className="flex gap-2">
            {appelOffre.status === 'brouillon' && (
              <button
                onClick={handleSendInvitations}
                className="btn bg-blue-600 text-white hover:bg-blue-700"
              >
                <Send size={16} className="mr-2" /> Marquer comme envoyé
              </button>
            )}
            {appelOffre.status === 'envoye' && soumissionsRecues.length > 0 && (
              <button
                onClick={() => updateStatus(appelOffre.id, 'termine').then(onUpdate)}
                className="btn bg-green-600 text-white hover:bg-green-700"
              >
                <CheckCircle size={16} className="mr-2" /> Terminer
              </button>
            )}
          </div>
          <button onClick={onClose} className="btn btn-secondary">
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

export function AppelOffresPage() {
  const { appelOffres, loading, getAppelOffre, refetch } = useAppelOffres()
  const [showCreate, setShowCreate] = useState(false)
  const [selectedAppelOffre, setSelectedAppelOffre] = useState<AppelOffre | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const handleView = async (id: string) => {
    setLoadingDetail(true)
    const ao = await getAppelOffre(id)
    setSelectedAppelOffre(ao)
    setLoadingDetail(false)
  }

  const stats = {
    total: appelOffres.length,
    brouillons: appelOffres.filter(ao => ao.status === 'brouillon').length,
    enCours: appelOffres.filter(ao => ao.status === 'envoye' || ao.status === 'en_cours').length,
    termines: appelOffres.filter(ao => ao.status === 'termine').length
  }

  return (
    <div className="animate-fade-in">
      <PageTitle 
        title="Appels d'offres" 
        subtitle="Invitations à soumissionner et comparaison des prix" 
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Total</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-gray-500">{stats.brouillons}</p>
          <p className="text-sm text-gray-500">Brouillons</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.enCours}</p>
          <p className="text-sm text-gray-500">En cours</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.termines}</p>
          <p className="text-sm text-gray-500">Terminés</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div />
        <button
          onClick={() => setShowCreate(true)}
          className="btn bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Plus size={16} className="mr-2" /> Nouvel appel d'offres
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="spinner" />
        </div>
      ) : appelOffres.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText size={64} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun appel d'offres</h3>
          <p className="text-gray-600 mb-6">
            Créez votre premier appel d'offres pour inviter des sous-traitants
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="btn bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Plus size={16} className="mr-2" /> Créer un appel d'offres
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Numéro</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invitations</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date limite</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {appelOffres.map(ao => {
                const invitations = ao.invitations || []
                const recues = invitations.filter(i => i.status === 'recu').length
                
                return (
                  <tr key={ao.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-orange-600">{ao.numero}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{ao.titre}</p>
                      {ao.project && (
                        <p className="text-sm text-gray-500">{ao.project.name}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-gray-400" />
                        <span className="text-gray-900">{invitations.length}</span>
                        {recues > 0 && (
                          <span className="text-green-600 text-sm">({recues} reçues)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        <span className={`text-sm ${
                          new Date(ao.date_limite) < new Date() ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {new Date(ao.date_limite).toLocaleDateString('fr-CA')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={ao.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleView(ao.id)}
                        className="text-orange-600 hover:text-orange-800"
                        disabled={loadingDetail}
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <CreateAppelOffreModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={refetch}
      />

      <AppelOffreDetailModal
        appelOffre={selectedAppelOffre}
        onClose={() => setSelectedAppelOffre(null)}
        onUpdate={async () => {
          if (selectedAppelOffre) {
            const updated = await getAppelOffre(selectedAppelOffre.id)
            setSelectedAppelOffre(updated)
          }
          refetch()
        }}
      />
    </div>
  )
}

export default AppelOffresPage
