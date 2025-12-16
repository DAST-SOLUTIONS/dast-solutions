/**
 * DAST Solutions - Gestion Personnel CCQ
 * Gestion employés, taux horaires CCQ, certifications - Connecté à Supabase
 */
import { useState, useMemo } from 'react'
import { PageTitle } from '@/components/PageTitle'
import { 
  Search, Plus, Users, Phone, Mail, Calendar, DollarSign, Award, Clock, 
  Edit, Trash2, X, CheckCircle, AlertTriangle, Briefcase, Eye, 
  HardHat, Save, Loader2, RefreshCw, Shield, FileText
} from 'lucide-react'
import { format, differenceInYears, differenceInDays, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  usePersonnelCCQ, 
  type Personnel, 
  type MetierCCQ,
  type PersonnelCertification,
  type CreatePersonnelParams,
  type CreateCertificationParams
} from '@/hooks/usePersonnelCCQ'

const CERTIFICATIONS_TYPES = [
  'Santé et sécurité générale (ASP)',
  'Travail en hauteur',
  'SIMDUT 2015',
  'Espace clos',
  'Premiers soins',
  'Chariot élévateur',
  'Nacelle élévatrice',
  'Signaleur',
  'Cadenassage',
  'Gréage et levage',
  'Opérateur de grue',
  'Soudure'
]

const COMPETENCES_LIST = [
  'Lecture de plans', 'Coffrage', 'Finition', 'Câblage', 'Domotique',
  'Panneaux électriques', 'Maçonnerie traditionnelle', 'Restauration patrimoine',
  'Pierre naturelle', 'Peinture intérieure', 'Faux-finis', 'Application époxy',
  'Excavation', 'Nivellement', 'Compactage', 'Soudure MIG', 'Soudure TIG',
  'Plomberie', 'Chauffage', 'Ventilation', 'Climatisation'
]

// Composants utilitaires
function CertBadge({ cert }: { cert: PersonnelCertification }) {
  const config: Record<string, { bg: string; text: string; icon: any }> = {
    valide: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
    expire: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertTriangle },
    bientot_expire: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock }
  }
  const c = config[cert.status] || config.valide
  const Icon = c.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${c.bg} ${c.text}`}>
      <Icon size={12} />{cert.nom}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    actif: { bg: 'bg-green-100', text: 'text-green-700', label: 'Actif' },
    inactif: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Inactif' },
    conge: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'En congé' },
    termine: { bg: 'bg-red-100', text: 'text-red-700', label: 'Terminé' }
  }
  const c = config[status] || config.actif
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{c.label}</span>
}

// Carte employé
function EmployeCard({ 
  employe, 
  onView, 
  onEdit, 
  onDelete,
  getTauxComplet
}: { 
  employe: Personnel
  onView: (e: Personnel) => void
  onEdit: (e: Personnel) => void
  onDelete: (id: string) => void
  getTauxComplet: (taux: number, metier?: MetierCCQ) => { total: number }
}) {
  const age = employe.date_naissance 
    ? differenceInYears(new Date(), parseISO(employe.date_naissance)) 
    : null
  const anciennete = employe.date_embauche
    ? differenceInYears(new Date(), parseISO(employe.date_embauche))
    : 0
  const certExpirees = (employe.certifications || []).filter(
    c => c.status === 'expire' || c.status === 'bientot_expire'
  ).length
  
  const coutHoraire = employe.taux_horaire_actuel 
    ? getTauxComplet(employe.taux_horaire_actuel, employe.metier).total
    : 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
            {employe.prenom?.[0] || ''}{employe.nom?.[0] || ''}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{employe.prenom} {employe.nom}</h3>
            <p className="text-sm text-gray-500">{employe.metier_nom || 'Non assigné'}</p>
          </div>
        </div>
        <StatusBadge status={employe.status} />
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div className="flex items-center gap-1 text-gray-600">
          <DollarSign size={14} />
          <span>{coutHoraire.toFixed(2)}$/h</span>
        </div>
        <div className="flex items-center gap-1 text-gray-600">
          <Clock size={14} />
          <span>{employe.heures_travaillees_total || 0}h</span>
        </div>
      </div>
      
      {certExpirees > 0 && (
        <div className="flex items-center gap-1 text-amber-600 text-sm mb-3">
          <AlertTriangle size={14} />
          {certExpirees} certification(s) à renouveler
        </div>
      )}
      
      {(employe.certifications || []).length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {(employe.certifications || []).slice(0, 2).map(c => (
            <CertBadge key={c.id} cert={c} />
          ))}
          {(employe.certifications || []).length > 2 && (
            <span className="text-xs text-gray-500">+{(employe.certifications || []).length - 2}</span>
          )}
        </div>
      )}
      
      <div className="flex gap-2">
        <button 
          onClick={() => onView(employe)} 
          className="flex-1 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center justify-center gap-2"
        >
          <Eye size={16} />Détails
        </button>
        <button onClick={() => onEdit(employe)} className="px-3 py-2 border rounded-lg hover:bg-gray-50">
          <Edit size={16} />
        </button>
        <button onClick={() => onDelete(employe.id)} className="px-3 py-2 border rounded-lg hover:bg-red-50 text-red-600">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

// Modal Détails
function DetailModal({ 
  employe, 
  onClose,
  onAddCertification,
  getTauxComplet
}: { 
  employe: Personnel | null
  onClose: () => void
  onAddCertification: (params: CreateCertificationParams) => Promise<void>
  getTauxComplet: (taux: number, metier?: MetierCCQ) => { tauxBase: number; vacances: number; avantages: number; total: number }
}) {
  const [activeTab, setActiveTab] = useState<'info' | 'certifications' | 'nouvelle'>('info')
  const [newCert, setNewCert] = useState({
    nom: '',
    organisme: '',
    date_obtention: '',
    date_expiration: ''
  })
  const [saving, setSaving] = useState(false)
  
  if (!employe) return null
  
  const taux = employe.taux_horaire_actuel 
    ? getTauxComplet(employe.taux_horaire_actuel, employe.metier)
    : { tauxBase: 0, vacances: 0, avantages: 0, total: 0 }
  
  const anciennete = employe.date_embauche
    ? differenceInYears(new Date(), parseISO(employe.date_embauche))
    : 0
  
  const handleSubmitCert = async () => {
    if (!newCert.nom) return
    setSaving(true)
    await onAddCertification({
      personnel_id: employe.id,
      ...newCert
    })
    setSaving(false)
    setActiveTab('certifications')
    setNewCert({ nom: '', organisme: '', date_obtention: '', date_expiration: '' })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                {employe.prenom?.[0]}{employe.nom?.[0]}
              </div>
              <div>
                <h2 className="text-xl font-bold">{employe.prenom} {employe.nom}</h2>
                <p className="text-teal-100">{employe.metier_nom || 'Métier non assigné'}</p>
              </div>
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
            { id: 'certifications', label: `Certifications (${(employe.certifications || []).length})` },
            { id: 'nouvelle', label: '+ Nouvelle certification' }
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
              {/* Coût horaire détaillé */}
              <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl p-4">
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <DollarSign size={18} />Coût horaire complet
                </h4>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-gray-800">{taux.tauxBase.toFixed(2)}$</div>
                    <div className="text-xs text-gray-500">Taux de base</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-blue-600">+{taux.vacances.toFixed(2)}$</div>
                    <div className="text-xs text-gray-500">Vacances (13%)</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-purple-600">+{taux.avantages.toFixed(2)}$</div>
                    <div className="text-xs text-gray-500">Avantages (15.5%)</div>
                  </div>
                  <div className="bg-teal-100 rounded-lg p-2">
                    <div className="text-2xl font-bold text-teal-700">{taux.total.toFixed(2)}$</div>
                    <div className="text-xs text-teal-600">Total/heure</div>
                  </div>
                </div>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Clock className="mx-auto text-purple-600 mb-1" size={24} />
                  <div className="text-xl font-bold text-purple-800">{employe.heures_travaillees_total || 0}</div>
                  <div className="text-xs text-gray-500">Heures travaillées</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Award className="mx-auto text-amber-600 mb-1" size={24} />
                  <div className="text-xl font-bold text-amber-800">{anciennete} ans</div>
                  <div className="text-xs text-gray-500">Ancienneté</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Briefcase className="mx-auto text-blue-600 mb-1" size={24} />
                  <div className="text-xl font-bold text-blue-800">{(employe.projets_assignes || []).length}</div>
                  <div className="text-xs text-gray-500">Projets</div>
                </div>
              </div>
              
              {/* Contact & Adresse */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2"><Phone size={16} />Contact</h4>
                  <div className="space-y-2 text-sm">
                    {employe.telephone && <p>{employe.telephone}</p>}
                    {employe.email && <p className="text-blue-600">{employe.email}</p>}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2"><HardHat size={16} />Adresse</h4>
                  <div className="text-sm">
                    {employe.adresse_rue && <p>{employe.adresse_rue}</p>}
                    <p>{employe.adresse_ville}, {employe.adresse_province} {employe.adresse_code_postal}</p>
                  </div>
                </div>
              </div>
              
              {/* CCQ Info */}
              {employe.numero_ccq && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                    <Shield size={16} />Carte CCQ
                  </h4>
                  <div className="text-sm text-blue-700">
                    <p>Numéro: {employe.numero_ccq}</p>
                    {employe.date_expiration_carte && (
                      <p>Expiration: {format(parseISO(employe.date_expiration_carte), 'dd MMMM yyyy', { locale: fr })}</p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Compétences */}
              {(employe.competences || []).length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Compétences</h4>
                  <div className="flex flex-wrap gap-2">
                    {(employe.competences || []).map(c => (
                      <span key={c} className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-sm">{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'certifications' && (
            <div className="space-y-4">
              {(employe.certifications || []).length === 0 ? (
                <p className="text-center py-8 text-gray-500">Aucune certification enregistrée</p>
              ) : (
                (employe.certifications || []).map(cert => (
                  <div key={cert.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <CertBadge cert={cert} />
                      {cert.organisme && <span className="text-sm text-gray-500">({cert.organisme})</span>}
                    </div>
                    <div className="text-right">
                      {cert.date_expiration && (
                        <div className="text-sm text-gray-600">
                          Exp: {format(parseISO(cert.date_expiration), 'dd MMM yyyy', { locale: fr })}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          
          {activeTab === 'nouvelle' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de certification *</label>
                <select
                  value={newCert.nom}
                  onChange={e => setNewCert(p => ({ ...p, nom: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Sélectionner...</option>
                  {CERTIFICATIONS_TYPES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organisme</label>
                <input
                  type="text"
                  value={newCert.organisme}
                  onChange={e => setNewCert(p => ({ ...p, organisme: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="Ex: ASP Construction"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date d'obtention</label>
                  <input
                    type="date"
                    value={newCert.date_obtention}
                    onChange={e => setNewCert(p => ({ ...p, date_obtention: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date d'expiration</label>
                  <input
                    type="date"
                    value={newCert.date_expiration}
                    onChange={e => setNewCert(p => ({ ...p, date_expiration: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
              
              <button
                onClick={handleSubmitCert}
                disabled={!newCert.nom || saving}
                className="w-full py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Enregistrer la certification
              </button>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
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
  employe,
  metiers,
  isOpen,
  onClose,
  onSave
}: {
  employe: Personnel | null
  metiers: MetierCCQ[]
  isOpen: boolean
  onClose: () => void
  onSave: (data: CreatePersonnelParams, id?: string) => Promise<void>
}) {
  const [form, setForm] = useState<CreatePersonnelParams>({
    nom: '',
    prenom: '',
    date_naissance: '',
    telephone: '',
    email: '',
    adresse_ville: '',
    metier_ccq_id: '',
    metier_code: '',
    metier_nom: '',
    taux_horaire_actuel: 0,
    numero_ccq: '',
    competences: [],
    date_embauche: '',
    type_emploi: 'temps_plein'
  })
  const [saving, setSaving] = useState(false)
  
  // Reset form when modal opens
  useState(() => {
    if (employe) {
      setForm({
        nom: employe.nom,
        prenom: employe.prenom,
        date_naissance: employe.date_naissance || '',
        telephone: employe.telephone || '',
        email: employe.email || '',
        adresse_ville: employe.adresse_ville || '',
        metier_ccq_id: employe.metier_ccq_id || '',
        metier_code: employe.metier_code || '',
        metier_nom: employe.metier_nom || '',
        taux_horaire_actuel: employe.taux_horaire_actuel || 0,
        numero_ccq: employe.numero_ccq || '',
        competences: employe.competences || [],
        date_embauche: employe.date_embauche || '',
        type_emploi: employe.type_emploi || 'temps_plein'
      })
    } else {
      setForm({
        nom: '',
        prenom: '',
        date_naissance: '',
        telephone: '',
        email: '',
        adresse_ville: '',
        metier_ccq_id: '',
        metier_code: '',
        metier_nom: '',
        taux_horaire_actuel: 0,
        numero_ccq: '',
        competences: [],
        date_embauche: '',
        type_emploi: 'temps_plein'
      })
    }
  })
  
  if (!isOpen) return null
  
  const handleMetierChange = (metierId: string) => {
    const metier = metiers.find(m => m.id === metierId)
    if (metier) {
      setForm(p => ({
        ...p,
        metier_ccq_id: metier.id,
        metier_code: metier.code,
        metier_nom: metier.nom,
        taux_horaire_actuel: metier.taux_horaire
      }))
    }
  }
  
  const toggleCompetence = (c: string) => {
    setForm(p => ({
      ...p,
      competences: p.competences?.includes(c)
        ? p.competences.filter(x => x !== c)
        : [...(p.competences || []), c]
    }))
  }
  
  const handleSubmit = async () => {
    if (!form.nom || !form.prenom) return
    setSaving(true)
    await onSave(form, employe?.id)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">
              {employe ? 'Modifier l\'employé' : 'Nouvel employé'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
              <X size={24} />
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
              <input
                type="text"
                value={form.prenom}
                onChange={e => setForm(p => ({ ...p, prenom: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input
                type="text"
                value={form.nom}
                onChange={e => setForm(p => ({ ...p, nom: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input
                type="tel"
                value={form.telephone}
                onChange={e => setForm(p => ({ ...p, telephone: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder="514-555-0000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
              <input
                type="date"
                value={form.date_naissance}
                onChange={e => setForm(p => ({ ...p, date_naissance: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d'embauche</label>
              <input
                type="date"
                value={form.date_embauche}
                onChange={e => setForm(p => ({ ...p, date_embauche: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Métier CCQ</label>
            <select
              value={form.metier_ccq_id}
              onChange={e => handleMetierChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Sélectionner un métier...</option>
              {metiers.map(m => (
                <option key={m.id} value={m.id}>
                  {m.code} - {m.nom} ({m.taux_horaire.toFixed(2)}$/h)
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numéro CCQ</label>
              <input
                type="text"
                value={form.numero_ccq}
                onChange={e => setForm(p => ({ ...p, numero_ccq: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
              <input
                type="text"
                value={form.adresse_ville}
                onChange={e => setForm(p => ({ ...p, adresse_ville: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder="Montréal"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Compétences</label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {COMPETENCES_LIST.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCompetence(c)}
                  className={`px-3 py-1 rounded-full text-sm transition ${
                    form.competences?.includes(c)
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-100">
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.nom || !form.prenom || saving}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {employe ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Page principale
export default function PersonnelCCQ() {
  const {
    personnel,
    metiers,
    loading,
    error,
    fetchPersonnel,
    createPersonnel,
    updatePersonnel,
    deletePersonnel,
    addCertification,
    getTauxComplet,
    getStats
  } = usePersonnelCCQ()
  
  const [search, setSearch] = useState('')
  const [metierFilter, setMetierFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'actif' | 'inactif' | 'conge'>('all')
  const [selected, setSelected] = useState<Personnel | null>(null)
  const [editing, setEditing] = useState<Personnel | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  
  // Filtrer
  const filtered = useMemo(() => {
    let f = [...personnel]
    if (search) {
      const s = search.toLowerCase()
      f = f.filter(e => 
        `${e.prenom} ${e.nom}`.toLowerCase().includes(s) ||
        e.numero_ccq?.includes(s)
      )
    }
    if (metierFilter) {
      f = f.filter(e => e.metier_code === metierFilter)
    }
    if (statusFilter !== 'all') {
      f = f.filter(e => e.status === statusFilter)
    }
    return f
  }, [personnel, search, metierFilter, statusFilter])
  
  const stats = getStats()
  
  // Handlers
  const handleSave = async (data: CreatePersonnelParams, id?: string) => {
    if (id) {
      await updatePersonnel(id, data)
    } else {
      await createPersonnel(data)
    }
  }
  
  const handleDelete = async (id: string) => {
    if (confirm('Supprimer cet employé?')) {
      await deletePersonnel(id)
    }
  }
  
  const handleAddCertification = async (params: CreateCertificationParams) => {
    await addCertification(params)
    await fetchPersonnel()
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <PageTitle title="Personnel CCQ" />
          <p className="text-gray-500 mt-1">Gestion des employés et taux horaires CCQ</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => fetchPersonnel()} 
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => setShowAdd(true)} 
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            <Plus size={18} />Nouvel employé
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Users size={20} className="text-blue-600" /></div>
            <div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-500">Employés</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><CheckCircle size={20} className="text-green-600" /></div>
            <div>
              <div className="text-2xl font-bold">{stats.actifs}</div>
              <div className="text-sm text-gray-500">Actifs</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg"><AlertTriangle size={20} className="text-amber-600" /></div>
            <div>
              <div className="text-2xl font-bold">{stats.certExpirees}</div>
              <div className="text-sm text-gray-500">Cert. expirées</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg"><Clock size={20} className="text-purple-600" /></div>
            <div>
              <div className="text-2xl font-bold">{(stats.heuresTotal/1000).toFixed(1)}k</div>
              <div className="text-sm text-gray-500">Heures totales</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg"><DollarSign size={20} className="text-teal-600" /></div>
            <div>
              <div className="text-2xl font-bold">{stats.tauxMoyen.toFixed(2)}$</div>
              <div className="text-sm text-gray-500">Taux moyen</div>
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
              placeholder="Rechercher un employé..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500" 
            />
          </div>
          <select 
            value={metierFilter} 
            onChange={e => setMetierFilter(e.target.value)} 
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Tous les métiers</option>
            {metiers.map(m => (
              <option key={m.id} value={m.code}>{m.nom}</option>
            ))}
          </select>
          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value as any)} 
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">Tous statuts</option>
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
            <option value="conge">En congé</option>
          </select>
        </div>
      </div>
      
      {/* Liste */}
      {loading && personnel.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="animate-spin text-teal-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl">
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 font-medium">
            {personnel.length === 0 ? 'Aucun employé' : 'Aucun résultat'}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            {personnel.length === 0 
              ? 'Cliquez sur "Nouvel employé" pour ajouter votre premier employé'
              : 'Essayez de modifier vos filtres'
            }
          </p>
          {personnel.length === 0 && (
            <button 
              onClick={() => setShowAdd(true)}
              className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              <Plus size={18} className="inline mr-2" />Nouvel employé
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-gray-600 mb-4">
            <span className="font-semibold">{filtered.length}</span> employé(s)
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(e => (
              <EmployeCard 
                key={e.id} 
                employe={e} 
                onView={setSelected}
                onEdit={setEditing}
                onDelete={handleDelete}
                getTauxComplet={getTauxComplet}
              />
            ))}
          </div>
        </>
      )}
      
      {/* Modals */}
      <DetailModal 
        employe={selected} 
        onClose={() => setSelected(null)}
        onAddCertification={handleAddCertification}
        getTauxComplet={getTauxComplet}
      />
      
      <FormModal
        employe={editing}
        metiers={metiers}
        isOpen={showAdd || !!editing}
        onClose={() => { setShowAdd(false); setEditing(null) }}
        onSave={handleSave}
      />
    </div>
  )
}
