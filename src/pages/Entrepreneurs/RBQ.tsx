/**
 * DAST Solutions - Gestion Entrepreneurs & RBQ
 * Base de données sous-traitants, évaluations, vérification RBQ
 */
import { useState, useEffect, useCallback } from 'react'
import { PageTitle } from '@/components/PageTitle'
import { Search, Plus, Building, Phone, Mail, MapPin, Star, Shield, AlertTriangle, CheckCircle, ExternalLink, Edit, Trash2, X, Filter, Download, Upload, Users, Award, Clock, DollarSign, FileText, ChevronDown, Eye, ThumbsUp, ThumbsDown } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Entrepreneur {
  id: string; nom: string; neq: string; rbqLicence: string; rbqCategories: string[]; rbqStatus: 'valide' | 'suspendu' | 'expire'
  contact: { nom: string; poste: string; telephone: string; email: string }
  adresse: { rue: string; ville: string; province: string; codePostal: string }
  specialites: string[]; evaluationMoyenne: number; nbEvaluations: number; projetsCompletes: number
  dateCreation: string; derniereActivite: string; notes: string; isFavori: boolean
}

interface Evaluation { id: string; entrepreneurId: string; projetNom: string; date: string; note: number; qualite: number; delais: number; communication: number; prix: number; commentaire: string }

const SPECIALITES = ['Maçonnerie', 'Béton', 'Charpente', 'Électricité', 'Plomberie', 'CVAC', 'Toiture', 'Finition', 'Excavation', 'Peinture', 'Vitrage', 'Isolation']
const RBQ_CATEGORIES = ['1.1.1 Bâtiments résidentiels', '1.1.2 Bâtiments commerciaux', '1.2 Ouvrages de génie civil', '2.1 Mécanique du bâtiment', '2.2 Électricité', '2.3 Gaz', '3. Entrepreneur spécialisé']

const DEMO_ENTREPRENEURS: Entrepreneur[] = [
  { id: '1', nom: 'Construction ABC Inc.', neq: '1234567890', rbqLicence: '5678-9012-34', rbqCategories: ['1.1.1', '1.1.2'], rbqStatus: 'valide', contact: { nom: 'Jean Tremblay', poste: 'Président', telephone: '514-555-0101', email: 'jean@abc.com' }, adresse: { rue: '123 Rue Principale', ville: 'Montréal', province: 'QC', codePostal: 'H1A 1A1' }, specialites: ['Béton', 'Maçonnerie', 'Charpente'], evaluationMoyenne: 4.5, nbEvaluations: 28, projetsCompletes: 45, dateCreation: '2020-03-15', derniereActivite: '2024-12-10', notes: 'Excellent partenaire', isFavori: true },
  { id: '2', nom: 'Électro-Plus Ltée', neq: '9876543210', rbqLicence: '1234-5678-90', rbqCategories: ['2.2'], rbqStatus: 'valide', contact: { nom: 'Marie Dubois', poste: 'Directrice', telephone: '514-555-0202', email: 'marie@electroplus.com' }, adresse: { rue: '456 Boul. Industriel', ville: 'Laval', province: 'QC', codePostal: 'H7A 2B2' }, specialites: ['Électricité'], evaluationMoyenne: 4.8, nbEvaluations: 15, projetsCompletes: 22, dateCreation: '2019-06-01', derniereActivite: '2024-12-08', notes: '', isFavori: true },
  { id: '3', nom: 'Plomberie Rapide Inc.', neq: '5555555555', rbqLicence: '9999-8888-77', rbqCategories: ['2.1'], rbqStatus: 'suspendu', contact: { nom: 'Pierre Martin', poste: 'Propriétaire', telephone: '514-555-0303', email: 'pierre@plomberierapide.com' }, adresse: { rue: '789 Ave du Parc', ville: 'Longueuil', province: 'QC', codePostal: 'J4A 3C3' }, specialites: ['Plomberie', 'CVAC'], evaluationMoyenne: 3.2, nbEvaluations: 8, projetsCompletes: 12, dateCreation: '2021-01-10', derniereActivite: '2024-09-15', notes: 'Licence suspendue - vérifier avant collaboration', isFavori: false },
  { id: '4', nom: 'Toitures Excellence', neq: '1111222233', rbqLicence: '4444-5555-66', rbqCategories: ['1.1.1', '1.1.2'], rbqStatus: 'valide', contact: { nom: 'Sophie Gagnon', poste: 'Gérante', telephone: '450-555-0404', email: 'sophie@toituresexcellence.com' }, adresse: { rue: '321 Rue du Commerce', ville: 'Terrebonne', province: 'QC', codePostal: 'J6W 4D4' }, specialites: ['Toiture', 'Isolation'], evaluationMoyenne: 4.2, nbEvaluations: 19, projetsCompletes: 31, dateCreation: '2018-09-20', derniereActivite: '2024-11-28', notes: '', isFavori: false },
]

const DEMO_EVALUATIONS: Evaluation[] = [
  { id: '1', entrepreneurId: '1', projetNom: 'Centre sportif Montréal', date: '2024-11-15', note: 5, qualite: 5, delais: 4, communication: 5, prix: 4, commentaire: 'Travail impeccable, équipe professionnelle' },
  { id: '2', entrepreneurId: '1', projetNom: 'École primaire Laval', date: '2024-09-20', note: 4, qualite: 4, delais: 4, communication: 5, prix: 4, commentaire: 'Bon travail général' },
  { id: '3', entrepreneurId: '2', projetNom: 'Hôpital Maisonneuve', date: '2024-10-05', note: 5, qualite: 5, delais: 5, communication: 5, prix: 4, commentaire: 'Expert en installations hospitalières' },
]

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => <Star key={i} size={size} className={i <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />)}
    </div>
  )
}

function RBQBadge({ status }: { status: 'valide' | 'suspendu' | 'expire' }) {
  const config = { valide: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: 'RBQ Valide' }, suspendu: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertTriangle, label: 'RBQ Suspendu' }, expire: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock, label: 'RBQ Expiré' } }[status]
  return <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}><config.icon size={12} />{config.label}</span>
}

function EntrepreneurCard({ entrepreneur, onEdit, onView, onToggleFavori }: { entrepreneur: Entrepreneur; onEdit: (e: Entrepreneur) => void; onView: (e: Entrepreneur) => void; onToggleFavori: (id: string) => void }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{entrepreneur.nom}</h3>
          <p className="text-sm text-gray-500">NEQ: {entrepreneur.neq}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onToggleFavori(entrepreneur.id)} className={`p-1.5 rounded ${entrepreneur.isFavori ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'}`}><Star size={18} fill={entrepreneur.isFavori ? 'currentColor' : 'none'} /></button>
          <button onClick={() => onEdit(entrepreneur)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded"><Edit size={16} /></button>
        </div>
      </div>
      <div className="mb-3"><RBQBadge status={entrepreneur.rbqStatus} /><span className="ml-2 text-xs text-gray-500">#{entrepreneur.rbqLicence}</span></div>
      <div className="flex items-center gap-2 mb-3"><StarRating rating={Math.round(entrepreneur.evaluationMoyenne)} /><span className="text-sm text-gray-600">{entrepreneur.evaluationMoyenne.toFixed(1)} ({entrepreneur.nbEvaluations})</span></div>
      <div className="flex flex-wrap gap-1 mb-4">{entrepreneur.specialites.slice(0, 3).map(s => <span key={s} className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded">{s}</span>)}{entrepreneur.specialites.length > 3 && <span className="text-xs text-gray-500">+{entrepreneur.specialites.length - 3}</span>}</div>
      <div className="space-y-1 text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-2"><Phone size={14} />{entrepreneur.contact.telephone}</div>
        <div className="flex items-center gap-2"><MapPin size={14} />{entrepreneur.adresse.ville}</div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onView(entrepreneur)} className="flex-1 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center justify-center gap-2"><Eye size={16} />Détails</button>
        <a href={`https://www.rbq.gouv.qc.ca/services-en-ligne/recherche-de-licence-dun-entrepreneur/`} target="_blank" className="px-3 py-2 border rounded-lg hover:bg-gray-50"><Shield size={16} /></a>
      </div>
    </div>
  )
}

function EntrepreneurModal({ entrepreneur, evaluations, isOpen, onClose }: { entrepreneur: Entrepreneur | null; evaluations: Evaluation[]; isOpen: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'info' | 'evaluations'>('info')
  if (!isOpen || !entrepreneur) return null
  const entEvals = evaluations.filter(e => e.entrepreneurId === entrepreneur.id)
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div><h2 className="text-xl font-bold">{entrepreneur.nom}</h2><p className="text-blue-100 mt-1">NEQ: {entrepreneur.neq} • RBQ: {entrepreneur.rbqLicence}</p></div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded"><X size={24} /></button>
          </div>
          <div className="flex gap-4 mt-4">
            <button onClick={() => setActiveTab('info')} className={`px-4 py-2 rounded-lg ${activeTab === 'info' ? 'bg-white/20' : 'hover:bg-white/10'}`}>Informations</button>
            <button onClick={() => setActiveTab('evaluations')} className={`px-4 py-2 rounded-lg ${activeTab === 'evaluations' ? 'bg-white/20' : 'hover:bg-white/10'}`}>Évaluations ({entEvals.length})</button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'info' ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4"><RBQBadge status={entrepreneur.rbqStatus} /><div className="flex items-center gap-2"><StarRating rating={Math.round(entrepreneur.evaluationMoyenne)} /><span>{entrepreneur.evaluationMoyenne.toFixed(1)}</span></div></div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4"><h4 className="font-medium mb-3">Contact</h4><div className="space-y-2 text-sm"><p><strong>{entrepreneur.contact.nom}</strong> - {entrepreneur.contact.poste}</p><p className="flex items-center gap-2"><Phone size={14} />{entrepreneur.contact.telephone}</p><p className="flex items-center gap-2"><Mail size={14} />{entrepreneur.contact.email}</p></div></div>
                <div className="bg-gray-50 rounded-lg p-4"><h4 className="font-medium mb-3">Adresse</h4><div className="text-sm"><p>{entrepreneur.adresse.rue}</p><p>{entrepreneur.adresse.ville}, {entrepreneur.adresse.province}</p><p>{entrepreneur.adresse.codePostal}</p></div></div>
              </div>
              <div><h4 className="font-medium mb-3">Catégories RBQ</h4><div className="flex flex-wrap gap-2">{entrepreneur.rbqCategories.map(c => <span key={c} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">{c}</span>)}</div></div>
              <div><h4 className="font-medium mb-3">Spécialités</h4><div className="flex flex-wrap gap-2">{entrepreneur.specialites.map(s => <span key={s} className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-sm">{s}</span>)}</div></div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-gray-50 rounded-lg p-4"><div className="text-2xl font-bold text-teal-600">{entrepreneur.projetsCompletes}</div><div className="text-sm text-gray-500">Projets</div></div>
                <div className="bg-gray-50 rounded-lg p-4"><div className="text-2xl font-bold text-blue-600">{entrepreneur.nbEvaluations}</div><div className="text-sm text-gray-500">Évaluations</div></div>
                <div className="bg-gray-50 rounded-lg p-4"><div className="text-2xl font-bold text-amber-600">{entrepreneur.evaluationMoyenne.toFixed(1)}</div><div className="text-sm text-gray-500">Note moyenne</div></div>
              </div>
              {entrepreneur.notes && <div className="bg-amber-50 border border-amber-200 rounded-lg p-4"><h4 className="font-medium text-amber-800 mb-2">Notes</h4><p className="text-amber-700">{entrepreneur.notes}</p></div>}
            </div>
          ) : (
            <div className="space-y-4">
              {entEvals.length === 0 ? <p className="text-center py-8 text-gray-500">Aucune évaluation</p> : entEvals.map(ev => (
                <div key={ev.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between mb-2"><span className="font-medium">{ev.projetNom}</span><span className="text-sm text-gray-500">{format(new Date(ev.date), 'dd MMM yyyy', { locale: fr })}</span></div>
                  <div className="flex items-center gap-2 mb-3"><StarRating rating={ev.note} /><span className="font-medium">{ev.note}/5</span></div>
                  <div className="grid grid-cols-4 gap-2 text-sm mb-3">
                    <div><span className="text-gray-500">Qualité:</span> {ev.qualite}/5</div>
                    <div><span className="text-gray-500">Délais:</span> {ev.delais}/5</div>
                    <div><span className="text-gray-500">Communication:</span> {ev.communication}/5</div>
                    <div><span className="text-gray-500">Prix:</span> {ev.prix}/5</div>
                  </div>
                  {ev.commentaire && <p className="text-gray-600 italic">"{ev.commentaire}"</p>}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-gray-50 px-6 py-4 flex justify-between border-t">
          <a href={`https://www.rbq.gouv.qc.ca/services-en-ligne/recherche-de-licence-dun-entrepreneur/`} target="_blank" className="flex items-center gap-2 text-blue-600 hover:text-blue-700"><ExternalLink size={16} />Vérifier RBQ</a>
          <div className="flex gap-3"><button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-100">Fermer</button><button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">Nouvelle évaluation</button></div>
        </div>
      </div>
    </div>
  )
}

export default function EntrepreneursRBQ() {
  const [entrepreneurs, setEntrepreneurs] = useState(DEMO_ENTREPRENEURS)
  const [evaluations] = useState(DEMO_EVALUATIONS)
  const [filtered, setFiltered] = useState(DEMO_ENTREPRENEURS)
  const [search, setSearch] = useState('')
  const [specialite, setSpecialite] = useState('')
  const [rbqFilter, setRbqFilter] = useState<'all' | 'valide' | 'suspendu'>('all')
  const [selected, setSelected] = useState<Entrepreneur | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    let f = [...entrepreneurs]
    if (search) f = f.filter(e => e.nom.toLowerCase().includes(search.toLowerCase()) || e.neq.includes(search) || e.rbqLicence.includes(search))
    if (specialite) f = f.filter(e => e.specialites.includes(specialite))
    if (rbqFilter !== 'all') f = f.filter(e => e.rbqStatus === rbqFilter)
    setFiltered(f)
  }, [entrepreneurs, search, specialite, rbqFilter])

  const toggleFavori = (id: string) => setEntrepreneurs(p => p.map(e => e.id === id ? { ...e, isFavori: !e.isFavori } : e))

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div><PageTitle title="Gestion des Entrepreneurs" /><p className="text-gray-500 mt-1">Base de données sous-traitants et vérification RBQ</p></div>
        <div className="flex gap-3">
          <a href="https://www.rbq.gouv.qc.ca/services-en-ligne/recherche-de-licence-dun-entrepreneur/" target="_blank" className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Shield size={18} />Vérifier RBQ</a>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"><Plus size={18} />Ajouter</button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4"><div className="flex items-center gap-3"><div className="p-2 bg-blue-100 rounded-lg"><Users size={20} className="text-blue-600" /></div><div><div className="text-2xl font-bold">{entrepreneurs.length}</div><div className="text-sm text-gray-500">Entrepreneurs</div></div></div></div>
        <div className="bg-white rounded-xl border p-4"><div className="flex items-center gap-3"><div className="p-2 bg-green-100 rounded-lg"><CheckCircle size={20} className="text-green-600" /></div><div><div className="text-2xl font-bold">{entrepreneurs.filter(e => e.rbqStatus === 'valide').length}</div><div className="text-sm text-gray-500">RBQ Valides</div></div></div></div>
        <div className="bg-white rounded-xl border p-4"><div className="flex items-center gap-3"><div className="p-2 bg-amber-100 rounded-lg"><Star size={20} className="text-amber-600" /></div><div><div className="text-2xl font-bold">{entrepreneurs.filter(e => e.isFavori).length}</div><div className="text-sm text-gray-500">Favoris</div></div></div></div>
        <div className="bg-white rounded-xl border p-4"><div className="flex items-center gap-3"><div className="p-2 bg-purple-100 rounded-lg"><Award size={20} className="text-purple-600" /></div><div><div className="text-2xl font-bold">{(entrepreneurs.reduce((s, e) => s + e.evaluationMoyenne, 0) / entrepreneurs.length).toFixed(1)}</div><div className="text-sm text-gray-500">Note moyenne</div></div></div></div>
      </div>
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Rechercher par nom, NEQ ou licence RBQ..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" /></div>
          <select value={specialite} onChange={e => setSpecialite(e.target.value)} className="px-4 py-2 border rounded-lg"><option value="">Toutes spécialités</option>{SPECIALITES.map(s => <option key={s}>{s}</option>)}</select>
          <select value={rbqFilter} onChange={e => setRbqFilter(e.target.value as any)} className="px-4 py-2 border rounded-lg"><option value="all">Tous statuts RBQ</option><option value="valide">RBQ Valide</option><option value="suspendu">RBQ Suspendu</option></select>
        </div>
      </div>
      <p className="text-gray-600 mb-4"><span className="font-semibold">{filtered.length}</span> entrepreneur(s)</p>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(e => <EntrepreneurCard key={e.id} entrepreneur={e} onEdit={() => {}} onView={setSelected} onToggleFavori={toggleFavori} />)}
      </div>
      <EntrepreneurModal entrepreneur={selected} evaluations={evaluations} isOpen={!!selected} onClose={() => setSelected(null)} />
    </div>
  )
}
