/**
 * DAST Solutions - Gestion Entrepreneurs & RBQ
 * Base de données sous-traitants avec CRUD Supabase
 */
import { useState, useEffect, useMemo } from 'react'
import { PageTitle } from '@/components/PageTitle'
import { 
  Search, Plus, Building, Phone, Mail, MapPin, Star, Shield, AlertTriangle, 
  CheckCircle, ExternalLink, Edit, Trash2, X, Users, Award, Clock, Eye, 
  Save, Loader2, RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  useEntrepreneursCRUD, 
  type Entrepreneur, 
  type EntrepreneurEvaluation,
  type CreateEntrepreneurParams,
  type CreateEvaluationParams
} from '@/hooks/useEntrepreneursCRUD'
import { verifyRBQLicense, type RBQVerificationResult, getRBQVerificationUrl } from '@/services/rbqService'

const SPECIALITES = [
  'Maçonnerie', 'Béton', 'Charpente', 'Électricité', 'Plomberie', 'CVAC', 
  'Toiture', 'Finition', 'Excavation', 'Peinture', 'Vitrage', 'Isolation',
  'Acier structure', 'Mécanique', 'Démolition', 'Revêtement', 'Fondation'
]

const RBQ_CATEGORIES = [
  '1.1.1 Bâtiments résidentiels neufs', 
  '1.1.2 Bâtiments commerciaux et institutionnels',
  '1.2 Ouvrages de génie civil',
  '2.1 Systèmes de mécanique du bâtiment',
  '2.2 Systèmes d\'électricité du bâtiment',
  '2.3 Systèmes de gaz',
  '3. Entrepreneur spécialisé',
  '4.1 Travaux de fondation',
  '4.2 Travaux d\'érection'
]

// Bouton de vérification RBQ
function VerifyRBQButton({ 
  licenseNumber, 
  onVerified 
}: { 
  licenseNumber: string
  onVerified?: (result: RBQVerificationResult) => void 
}) {
  const [verifying, setVerifying] = useState(false)
  const [result, setResult] = useState<RBQVerificationResult | null>(null)

  const handleVerify = async () => {
    if (!licenseNumber || licenseNumber.length < 8) {
      alert('Veuillez entrer un numéro de licence valide (minimum 8 chiffres)')
      return
    }
    
    setVerifying(true)
    try {
      const verificationResult = await verifyRBQLicense(licenseNumber)
      setResult(verificationResult)
      onVerified?.(verificationResult)
    } catch (error) {
      console.error('Erreur vérification RBQ:', error)
      alert('Erreur lors de la vérification. Réessayez plus tard.')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleVerify}
          disabled={verifying || !licenseNumber}
          className="px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
        >
          {verifying ? (
            <><Loader2 size={16} className="animate-spin" />Vérification...</>
          ) : (
            <><Shield size={16} />Vérifier RBQ</>
          )}
        </button>
        <a
          href={getRBQVerificationUrl(licenseNumber)}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 border rounded-lg hover:bg-gray-50"
          title="Vérifier manuellement sur rbq.gouv.qc.ca"
        >
          <ExternalLink size={16} className="text-gray-500" />
        </a>
      </div>
      
      {result && (
        <div className={`mt-2 p-2 rounded-lg text-sm ${
          result.data?.status === 'valide' ? 'bg-green-100 text-green-800' :
          result.data?.status === 'suspendu' ? 'bg-red-100 text-red-800' :
          result.data?.status === 'expire' ? 'bg-amber-100 text-amber-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {result.success && result.data ? (
            <div>
              <div className="flex items-center gap-2 font-medium">
                {result.data.status === 'valide' && <CheckCircle size={14} />}
                {result.data.status === 'suspendu' && <AlertTriangle size={14} />}
                {result.data.status === 'expire' && <Clock size={14} />}
                Statut: {result.data.status.charAt(0).toUpperCase() + result.data.status.slice(1)}
              </div>
              {result.data.dateExpiration && (
                <p className="text-xs mt-1">
                  Expiration: {new Date(result.data.dateExpiration).toLocaleDateString('fr-CA')}
                </p>
              )}
              {result.data.categories && result.data.categories.length > 0 && (
                <p className="text-xs mt-1">
                  Catégories: {result.data.categories.join(', ')}
                </p>
              )}
            </div>
          ) : (
            <span>❌ {result.error || 'Licence non trouvée'}</span>
          )}
        </div>
      )}
    </div>
  )
}

// Composants utilitaires
function StarRating({ rating, size = 16, interactive = false, onChange }: { 
  rating: number; size?: number; interactive?: boolean; onChange?: (r: number) => void 
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star 
          key={i} 
          size={size} 
          className={`${i <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} ${interactive ? 'cursor-pointer hover:scale-110 transition' : ''}`}
          onClick={() => interactive && onChange?.(i)}
        />
      ))}
    </div>
  )
}

function RBQBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; icon: any; label: string }> = {
    valide: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: 'RBQ Valide' },
    suspendu: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertTriangle, label: 'RBQ Suspendu' },
    expire: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock, label: 'RBQ Expiré' },
    non_verifie: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Shield, label: 'Non vérifié' }
  }
  const c = config[status] || config.non_verifie
  const Icon = c.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <Icon size={12} />{c.label}
    </span>
  )
}

// Carte entrepreneur
function EntrepreneurCard({ 
  entrepreneur, 
  onEdit, 
  onView, 
  onToggleFavori,
  onDelete
}: { 
  entrepreneur: Entrepreneur
  onEdit: (e: Entrepreneur) => void
  onView: (e: Entrepreneur) => void
  onToggleFavori: (id: string) => void
  onDelete: (id: string) => void
}) {
  const contact = entrepreneur.contacts?.find(c => c.is_principal) || entrepreneur.contacts?.[0]
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{entrepreneur.nom}</h3>
          {entrepreneur.neq && <p className="text-sm text-gray-500">NEQ: {entrepreneur.neq}</p>}
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => onToggleFavori(entrepreneur.id)} 
            className={`p-1.5 rounded transition ${entrepreneur.is_favori ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'}`}
          >
            <Star size={18} fill={entrepreneur.is_favori ? 'currentColor' : 'none'} />
          </button>
          <button onClick={() => onEdit(entrepreneur)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
            <Edit size={16} />
          </button>
          <button onClick={() => onDelete(entrepreneur.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div className="mb-3 flex items-center gap-2">
        <RBQBadge status={entrepreneur.rbq_status} />
        {entrepreneur.rbq_licence && (
          <span className="text-xs text-gray-500">#{entrepreneur.rbq_licence}</span>
        )}
      </div>
      
      <div className="flex items-center gap-2 mb-3">
        <StarRating rating={Math.round(entrepreneur.evaluation_moyenne)} />
        <span className="text-sm text-gray-600">
          {entrepreneur.evaluation_moyenne.toFixed(1)} ({entrepreneur.nb_evaluations})
        </span>
      </div>
      
      {entrepreneur.specialites.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {entrepreneur.specialites.slice(0, 3).map(s => (
            <span key={s} className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded">{s}</span>
          ))}
          {entrepreneur.specialites.length > 3 && (
            <span className="text-xs text-gray-500">+{entrepreneur.specialites.length - 3}</span>
          )}
        </div>
      )}
      
      <div className="space-y-1 text-sm text-gray-600 mb-4">
        {contact?.telephone && (
          <div className="flex items-center gap-2"><Phone size={14} />{contact.telephone}</div>
        )}
        {entrepreneur.adresse_ville && (
          <div className="flex items-center gap-2"><MapPin size={14} />{entrepreneur.adresse_ville}</div>
        )}
      </div>
      
      <div className="flex gap-2">
        <button 
          onClick={() => onView(entrepreneur)} 
          className="flex-1 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center justify-center gap-2"
        >
          <Eye size={16} />Détails
        </button>
        <a 
          href="https://www.rbq.gouv.qc.ca/services-en-ligne/recherche-de-licence-dun-entrepreneur/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="px-3 py-2 border rounded-lg hover:bg-gray-50"
        >
          <Shield size={16} />
        </a>
      </div>
    </div>
  )
}

// Modal Détails
function DetailModal({ 
  entrepreneur, 
  onClose,
  onAddEvaluation
}: { 
  entrepreneur: Entrepreneur | null
  onClose: () => void
  onAddEvaluation: (params: CreateEvaluationParams) => Promise<void>
}) {
  const [activeTab, setActiveTab] = useState<'info' | 'evaluations' | 'nouvelle'>('info')
  const [newEval, setNewEval] = useState({
    projet_nom: '',
    note_globale: 5,
    note_qualite: 5,
    note_delais: 5,
    note_communication: 5,
    note_prix: 5,
    commentaire: '',
    recommande: true
  })
  const [saving, setSaving] = useState(false)
  
  if (!entrepreneur) return null
  
  const contact = entrepreneur.contacts?.find(c => c.is_principal) || entrepreneur.contacts?.[0]
  const evaluations = entrepreneur.evaluations || []
  
  const handleSubmitEval = async () => {
    if (!newEval.projet_nom) return
    setSaving(true)
    await onAddEvaluation({
      entrepreneur_id: entrepreneur.id,
      ...newEval
    })
    setSaving(false)
    setActiveTab('evaluations')
    setNewEval({
      projet_nom: '',
      note_globale: 5,
      note_qualite: 5,
      note_delais: 5,
      note_communication: 5,
      note_prix: 5,
      commentaire: '',
      recommande: true
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">{entrepreneur.nom}</h2>
              {entrepreneur.neq && <p className="text-teal-100">NEQ: {entrepreneur.neq}</p>}
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
              <X size={24} />
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b flex">
          {[
            { id: 'info', label: 'Informations' },
            { id: 'evaluations', label: `Évaluations (${evaluations.length})` },
            { id: 'nouvelle', label: '+ Nouvelle évaluation' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 font-medium transition ${
                activeTab === tab.id 
                  ? 'text-teal-600 border-b-2 border-teal-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* RBQ Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Statut RBQ</div>
                  <RBQBadge status={entrepreneur.rbq_status} />
                  {entrepreneur.rbq_licence && (
                    <div className="text-sm mt-2">Licence: {entrepreneur.rbq_licence}</div>
                  )}
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Contact principal</div>
                  {contact ? (
                    <>
                      <div className="font-medium">{contact.nom} {contact.prenom}</div>
                      {contact.poste && <div className="text-sm text-gray-500">{contact.poste}</div>}
                      {contact.telephone && <div className="text-sm">{contact.telephone}</div>}
                      {contact.email && <div className="text-sm text-blue-600">{contact.email}</div>}
                    </>
                  ) : (
                    <div className="text-gray-400 italic">Aucun contact</div>
                  )}
                </div>
              </div>
              
              {/* Adresse */}
              {entrepreneur.adresse_ville && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Adresse</div>
                  <div>
                    {entrepreneur.adresse_rue && <div>{entrepreneur.adresse_rue}</div>}
                    <div>{entrepreneur.adresse_ville}, {entrepreneur.adresse_province} {entrepreneur.adresse_code_postal}</div>
                  </div>
                </div>
              )}
              
              {/* Spécialités */}
              {entrepreneur.specialites.length > 0 && (
                <div>
                  <div className="text-sm text-gray-500 mb-2">Spécialités</div>
                  <div className="flex flex-wrap gap-2">
                    {entrepreneur.specialites.map(s => (
                      <span key={s} className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-sm">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-teal-600">{entrepreneur.projets_completes}</div>
                  <div className="text-sm text-gray-500">Projets</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{entrepreneur.nb_evaluations}</div>
                  <div className="text-sm text-gray-500">Évaluations</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-amber-600">{entrepreneur.evaluation_moyenne.toFixed(1)}</div>
                  <div className="text-sm text-gray-500">Note moyenne</div>
                </div>
              </div>
              
              {/* Notes */}
              {entrepreneur.notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-medium text-amber-800 mb-2">Notes internes</h4>
                  <p className="text-amber-700">{entrepreneur.notes}</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'evaluations' && (
            <div className="space-y-4">
              {evaluations.length === 0 ? (
                <p className="text-center py-8 text-gray-500">Aucune évaluation pour cet entrepreneur</p>
              ) : (
                evaluations.map(ev => (
                  <div key={ev.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">{ev.projet_nom || 'Projet non spécifié'}</span>
                      <span className="text-sm text-gray-500">
                        {format(new Date(ev.date_evaluation), 'dd MMM yyyy', { locale: fr })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <StarRating rating={ev.note_globale} />
                      <span className="font-medium">{ev.note_globale}/5</span>
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-sm mb-3">
                      <div><span className="text-gray-500">Qualité:</span> {ev.note_qualite || '-'}/5</div>
                      <div><span className="text-gray-500">Délais:</span> {ev.note_delais || '-'}/5</div>
                      <div><span className="text-gray-500">Communication:</span> {ev.note_communication || '-'}/5</div>
                      <div><span className="text-gray-500">Prix:</span> {ev.note_prix || '-'}/5</div>
                      <div><span className="text-gray-500">Sécurité:</span> {ev.note_securite || '-'}/5</div>
                    </div>
                    {ev.commentaire && <p className="text-gray-600 italic">"{ev.commentaire}"</p>}
                  </div>
                ))
              )}
            </div>
          )}
          
          {activeTab === 'nouvelle' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du projet *</label>
                <input
                  type="text"
                  value={newEval.projet_nom}
                  onChange={e => setNewEval(p => ({ ...p, projet_nom: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="Ex: Construction école primaire"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Note globale</label>
                  <StarRating 
                    rating={newEval.note_globale} 
                    size={24} 
                    interactive 
                    onChange={r => setNewEval(p => ({ ...p, note_globale: r }))} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recommandez-vous?</label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setNewEval(p => ({ ...p, recommande: true }))}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 ${newEval.recommande ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                    >
                      <CheckCircle size={16} /> Oui
                    </button>
                    <button
                      onClick={() => setNewEval(p => ({ ...p, recommande: false }))}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 ${!newEval.recommande ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}
                    >
                      <X size={16} /> Non
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-5 gap-3">
                {['Qualité', 'Délais', 'Communication', 'Prix', 'Sécurité'].map((label, i) => {
                  const key = ['note_qualite', 'note_delais', 'note_communication', 'note_prix', 'note_securite'][i] as keyof typeof newEval
                  return (
                    <div key={label}>
                      <label className="block text-xs text-gray-500 mb-1">{label}</label>
                      <select
                        value={newEval[key] as number}
                        onChange={e => setNewEval(p => ({ ...p, [key]: parseInt(e.target.value) }))}
                        className="w-full px-2 py-1 border rounded text-sm"
                      >
                        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}/5</option>)}
                      </select>
                    </div>
                  )
                })}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire</label>
                <textarea
                  value={newEval.commentaire}
                  onChange={e => setNewEval(p => ({ ...p, commentaire: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  rows={3}
                  placeholder="Votre évaluation..."
                />
              </div>
              
              <button
                onClick={handleSubmitEval}
                disabled={!newEval.projet_nom || saving}
                className="w-full py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Enregistrer l'évaluation
              </button>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between border-t">
          <a 
            href="https://www.rbq.gouv.qc.ca/services-en-ligne/recherche-de-licence-dun-entrepreneur/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <ExternalLink size={16} />Vérifier sur RBQ
          </a>
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-100">
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal Ajouter/Modifier
function FormModal({
  entrepreneur,
  isOpen,
  onClose,
  onSave
}: {
  entrepreneur: Entrepreneur | null
  isOpen: boolean
  onClose: () => void
  onSave: (data: CreateEntrepreneurParams, id?: string) => Promise<void>
}) {
  const [form, setForm] = useState<CreateEntrepreneurParams>({
    nom: '',
    neq: '',
    rbq_licence: '',
    rbq_categories: [],
    adresse_rue: '',
    adresse_ville: '',
    adresse_code_postal: '',
    specialites: [],
    notes: ''
  })
  const [saving, setSaving] = useState(false)
  
  useEffect(() => {
    if (entrepreneur) {
      setForm({
        nom: entrepreneur.nom,
        neq: entrepreneur.neq || '',
        rbq_licence: entrepreneur.rbq_licence || '',
        rbq_categories: entrepreneur.rbq_categories,
        adresse_rue: entrepreneur.adresse_rue || '',
        adresse_ville: entrepreneur.adresse_ville || '',
        adresse_code_postal: entrepreneur.adresse_code_postal || '',
        specialites: entrepreneur.specialites,
        notes: entrepreneur.notes || ''
      })
    } else {
      setForm({
        nom: '',
        neq: '',
        rbq_licence: '',
        rbq_categories: [],
        adresse_rue: '',
        adresse_ville: '',
        adresse_code_postal: '',
        specialites: [],
        notes: ''
      })
    }
  }, [entrepreneur, isOpen])
  
  if (!isOpen) return null
  
  const handleSubmit = async () => {
    if (!form.nom) return
    setSaving(true)
    await onSave(form, entrepreneur?.id)
    setSaving(false)
    onClose()
  }
  
  const toggleSpecialite = (s: string) => {
    setForm(p => ({
      ...p,
      specialites: p.specialites?.includes(s) 
        ? p.specialites.filter(x => x !== s)
        : [...(p.specialites || []), s]
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">
              {entrepreneur ? 'Modifier l\'entrepreneur' : 'Nouvel entrepreneur'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
              <X size={24} />
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'entreprise *</label>
              <input
                type="text"
                value={form.nom}
                onChange={e => setForm(p => ({ ...p, nom: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder="Construction ABC Inc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NEQ</label>
              <input
                type="text"
                value={form.neq}
                onChange={e => setForm(p => ({ ...p, neq: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder="1234567890"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Licence RBQ</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.rbq_licence}
                onChange={e => setForm(p => ({ ...p, rbq_licence: e.target.value }))}
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder="1234-5678-90"
              />
              <VerifyRBQButton 
                licenseNumber={form.rbq_licence || ''} 
                onVerified={(result) => {
                  if (result.data?.categories) {
                    setForm(p => ({ ...p, rbq_categories: result.data?.categories || [] }))
                  }
                }}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
            <input
              type="text"
              value={form.adresse_rue}
              onChange={e => setForm(p => ({ ...p, adresse_rue: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg mb-2 focus:ring-2 focus:ring-teal-500"
              placeholder="123 Rue Principale"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={form.adresse_ville}
                onChange={e => setForm(p => ({ ...p, adresse_ville: e.target.value }))}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder="Montréal"
              />
              <input
                type="text"
                value={form.adresse_code_postal}
                onChange={e => setForm(p => ({ ...p, adresse_code_postal: e.target.value }))}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder="H1A 1A1"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Spécialités</label>
            <div className="flex flex-wrap gap-2">
              {SPECIALITES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSpecialite(s)}
                  className={`px-3 py-1 rounded-full text-sm transition ${
                    form.specialites?.includes(s)
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes internes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              rows={3}
              placeholder="Notes sur cet entrepreneur..."
            />
          </div>
        </div>
        
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-100">
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.nom || saving}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {entrepreneur ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Page principale
export default function EntrepreneursRBQ() {
  const { 
    entrepreneurs, 
    loading, 
    error,
    fetchEntrepreneurs,
    createEntrepreneur, 
    updateEntrepreneur, 
    deleteEntrepreneur,
    toggleFavori,
    addEvaluation,
    getStats
  } = useEntrepreneursCRUD()
  
  const [search, setSearch] = useState('')
  const [specialite, setSpecialite] = useState('')
  const [rbqFilter, setRbqFilter] = useState<'all' | 'valide' | 'suspendu' | 'non_verifie'>('all')
  const [selected, setSelected] = useState<Entrepreneur | null>(null)
  const [editing, setEditing] = useState<Entrepreneur | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  
  // Filtrer
  const filtered = useMemo(() => {
    let f = [...entrepreneurs]
    if (search) {
      const s = search.toLowerCase()
      f = f.filter(e => 
        e.nom.toLowerCase().includes(s) || 
        e.neq?.includes(s) || 
        e.rbq_licence?.includes(s)
      )
    }
    if (specialite) {
      f = f.filter(e => e.specialites.includes(specialite))
    }
    if (rbqFilter !== 'all') {
      f = f.filter(e => e.rbq_status === rbqFilter)
    }
    return f
  }, [entrepreneurs, search, specialite, rbqFilter])
  
  const stats = getStats()
  
  // Handlers
  const handleSave = async (data: CreateEntrepreneurParams, id?: string) => {
    if (id) {
      await updateEntrepreneur(id, data)
    } else {
      await createEntrepreneur(data)
    }
  }
  
  const handleDelete = async (id: string) => {
    if (confirm('Supprimer cet entrepreneur?')) {
      await deleteEntrepreneur(id)
    }
  }
  
  const handleAddEvaluation = async (params: CreateEvaluationParams) => {
    await addEvaluation(params)
    // Rafraîchir pour avoir la nouvelle moyenne
    await fetchEntrepreneurs()
    // Mettre à jour le selected
    const updated = entrepreneurs.find(e => e.id === params.entrepreneur_id)
    if (updated) setSelected(updated)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <PageTitle title="Gestion des Entrepreneurs" />
          <p className="text-gray-500 mt-1">Base de données sous-traitants et vérification RBQ</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => fetchEntrepreneurs()} 
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <a 
            href="https://www.rbq.gouv.qc.ca/services-en-ligne/recherche-de-licence-dun-entrepreneur/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <Shield size={18} />Vérifier RBQ
          </a>
          <button 
            onClick={() => setShowAdd(true)} 
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            <Plus size={18} />Ajouter
          </button>
        </div>
      </div>
      
      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Users size={20} className="text-blue-600" /></div>
            <div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-500">Entrepreneurs</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><CheckCircle size={20} className="text-green-600" /></div>
            <div>
              <div className="text-2xl font-bold">{stats.rbqValides}</div>
              <div className="text-sm text-gray-500">RBQ Valides</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg"><Star size={20} className="text-amber-600" /></div>
            <div>
              <div className="text-2xl font-bold">{stats.favoris}</div>
              <div className="text-sm text-gray-500">Favoris</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg"><Award size={20} className="text-purple-600" /></div>
            <div>
              <div className="text-2xl font-bold">{stats.evaluationMoyenne.toFixed(1)}</div>
              <div className="text-sm text-gray-500">Note moyenne</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filtres */}
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Rechercher par nom, NEQ ou licence RBQ..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500" 
            />
          </div>
          <select 
            value={specialite} 
            onChange={e => setSpecialite(e.target.value)} 
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Toutes spécialités</option>
            {SPECIALITES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select 
            value={rbqFilter} 
            onChange={e => setRbqFilter(e.target.value as any)} 
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">Tous statuts RBQ</option>
            <option value="valide">RBQ Valide</option>
            <option value="suspendu">RBQ Suspendu</option>
            <option value="non_verifie">Non vérifié</option>
          </select>
        </div>
      </div>
      
      {/* Liste */}
      {loading && entrepreneurs.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="animate-spin text-teal-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl">
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 font-medium">
            {entrepreneurs.length === 0 ? 'Aucun entrepreneur' : 'Aucun résultat'}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            {entrepreneurs.length === 0 
              ? 'Cliquez sur "Ajouter" pour créer votre premier entrepreneur'
              : 'Essayez de modifier vos filtres'
            }
          </p>
          {entrepreneurs.length === 0 && (
            <button 
              onClick={() => setShowAdd(true)}
              className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              <Plus size={18} className="inline mr-2" />Ajouter un entrepreneur
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-gray-600 mb-4">
            <span className="font-semibold">{filtered.length}</span> entrepreneur(s)
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(e => (
              <EntrepreneurCard 
                key={e.id} 
                entrepreneur={e} 
                onEdit={setEditing}
                onView={setSelected} 
                onToggleFavori={toggleFavori}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </>
      )}
      
      {/* Modals */}
      <DetailModal 
        entrepreneur={selected} 
        onClose={() => setSelected(null)}
        onAddEvaluation={handleAddEvaluation}
      />
      
      <FormModal
        entrepreneur={editing}
        isOpen={showAdd || !!editing}
        onClose={() => { setShowAdd(false); setEditing(null) }}
        onSave={handleSave}
      />
    </div>
  )
}
