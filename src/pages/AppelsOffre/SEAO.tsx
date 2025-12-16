/**
 * DAST Solutions - Intégration SEAO
 * Système électronique d'appel d'offres du Québec
 */
import { useState, useEffect, useCallback } from 'react'
import { PageTitle } from '@/components/PageTitle'
import { Search, Filter, ExternalLink, Calendar, Building, MapPin, DollarSign, Clock, FileText, Download, Star, StarOff, Bell, BellOff, RefreshCw, AlertCircle, CheckCircle, Eye, Bookmark, X, Briefcase, Truck, Wrench, Zap, Home } from 'lucide-react'
import { format, differenceInDays, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

interface AppelOffre {
  id: string; numero: string; titre: string; organisme: string; region: string; categorie: string
  datePublication: string; dateFermeture: string; estimationMin?: number; estimationMax?: number
  documents: { nom: string; url: string; taille: string }[]
  description: string; exigences: string[]; isFavori: boolean; isNotified: boolean; status: 'ouvert' | 'ferme'
}

const CATEGORIES = [
  { id: 'all', label: 'Toutes', icon: Briefcase },
  { id: 'batiment', label: 'Bâtiment', icon: Building },
  { id: 'voirie', label: 'Voirie', icon: Truck },
  { id: 'mecanique', label: 'Mécanique', icon: Wrench },
  { id: 'electrique', label: 'Électrique', icon: Zap },
  { id: 'renovation', label: 'Rénovation', icon: Home }
]

const REGIONS = ['Toutes régions', 'Montréal', 'Québec', 'Laval', 'Montérégie', 'Laurentides', 'Lanaudière', 'Outaouais', 'Estrie', 'Mauricie', 'Saguenay']

const DEMO_APPELS: AppelOffre[] = [
  { id: '1', numero: 'SEAO-2024-12345', titre: 'Construction centre sportif multifonctionnel', organisme: 'Ville de Montréal', region: 'Montréal', categorie: 'batiment', datePublication: '2024-12-01', dateFermeture: '2025-01-15', estimationMin: 5000000, estimationMax: 8000000, documents: [{ nom: 'Devis.pdf', url: '#', taille: '15MB' }], description: 'Construction nouveau centre sportif', exigences: ['Licence RBQ 1.1.1', 'Expérience 5 ans'], isFavori: true, isNotified: true, status: 'ouvert' },
  { id: '2', numero: 'SEAO-2024-12346', titre: 'Réfection toiture école Saint-Laurent', organisme: 'CSS Montréal', region: 'Montréal', categorie: 'renovation', datePublication: '2024-12-05', dateFermeture: '2025-01-10', estimationMin: 250000, estimationMax: 400000, documents: [{ nom: 'Plans.pdf', url: '#', taille: '8MB' }], description: 'Réfection complète toiture', exigences: ['Licence RBQ 1.1.2'], isFavori: false, isNotified: false, status: 'ouvert' },
  { id: '3', numero: 'SEAO-2024-12347', titre: 'Infrastructures électriques Hôpital', organisme: 'CIUSSS Est', region: 'Montréal', categorie: 'electrique', datePublication: '2024-12-03', dateFermeture: '2025-01-20', estimationMin: 1500000, estimationMax: 2200000, documents: [{ nom: 'Devis.pdf', url: '#', taille: '12MB' }], description: 'Mise à niveau systèmes électriques', exigences: ['Licence RBQ 16', 'Maître électricien'], isFavori: true, isNotified: true, status: 'ouvert' },
  { id: '4', numero: 'SEAO-2024-12348', titre: 'Asphaltage stationnement municipal', organisme: 'Ville de Laval', region: 'Laval', categorie: 'voirie', datePublication: '2024-11-28', dateFermeture: '2024-12-30', estimationMin: 180000, estimationMax: 280000, documents: [{ nom: 'Bordereau.xlsx', url: '#', taille: '1MB' }], description: 'Réfection stationnement', exigences: ['Licence RBQ 4.1'], isFavori: false, isNotified: false, status: 'ouvert' },
]

function AppelCard({ appel, onToggleFavori, onView }: { appel: AppelOffre; onToggleFavori: (id: string) => void; onView: (a: AppelOffre) => void }) {
  const joursRestants = differenceInDays(parseISO(appel.dateFermeture), new Date())
  const isUrgent = joursRestants <= 7 && joursRestants > 0
  return (
    <div className={`bg-white rounded-xl border ${isUrgent ? 'border-orange-300' : 'border-gray-200'} p-5 hover:shadow-lg transition`}>
      <div className="flex justify-between mb-3">
        <div>
          <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{appel.numero}</span>
          {isUrgent && <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full"><Clock size={10} className="inline mr-1" />{joursRestants}j</span>}
        </div>
        <button onClick={() => onToggleFavori(appel.id)} className={`p-1.5 rounded ${appel.isFavori ? 'text-amber-500' : 'text-gray-300'}`}>
          <Star size={18} fill={appel.isFavori ? 'currentColor' : 'none'} />
        </button>
      </div>
      <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2">{appel.titre}</h3>
      <div className="space-y-1.5 text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-2"><Building size={14} />{appel.organisme}</div>
        <div className="flex items-center gap-2"><MapPin size={14} />{appel.region}</div>
        <div className="flex items-center gap-2"><Calendar size={14} />Ferme: {format(parseISO(appel.dateFermeture), 'dd MMM yyyy', { locale: fr })}</div>
      </div>
      {appel.estimationMin && (
        <div className="bg-teal-50 rounded-lg p-3 mb-4">
          <div className="text-xs text-teal-600 mb-1">Budget estimé</div>
          <div className="font-bold text-teal-800">{(appel.estimationMin/1000).toFixed(0)}k$ - {(appel.estimationMax!/1000).toFixed(0)}k$</div>
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={() => onView(appel)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"><Eye size={16} />Détails</button>
        <a href="https://seao.ca" target="_blank" rel="noopener noreferrer" className="px-3 py-2 border rounded-lg hover:bg-gray-50"><ExternalLink size={16} /></a>
      </div>
    </div>
  )
}

function DetailsModal({ appel, onClose }: { appel: AppelOffre | null; onClose: () => void }) {
  if (!appel) return null
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white p-6">
          <div className="flex justify-between"><div><span className="text-sm opacity-80">{appel.numero}</span><h2 className="text-xl font-bold mt-1">{appel.titre}</h2></div><button onClick={onClose} className="p-2 hover:bg-white/20 rounded"><X size={24} /></button></div>
        </div>
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500">Organisme</div><div className="font-medium">{appel.organisme}</div></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500">Région</div><div className="font-medium">{appel.region}</div></div>
          </div>
          {appel.estimationMin && <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6"><div className="text-teal-700 font-medium mb-1">Budget estimé</div><div className="text-2xl font-bold text-teal-800">{appel.estimationMin.toLocaleString()}$ - {appel.estimationMax?.toLocaleString()}$</div></div>}
          <div className="mb-6"><h3 className="font-semibold mb-2">Description</h3><p className="text-gray-600">{appel.description}</p></div>
          <div className="mb-6"><h3 className="font-semibold mb-2">Exigences</h3><ul className="space-y-1">{appel.exigences.map((e, i) => <li key={i} className="flex items-center gap-2 text-gray-600"><CheckCircle size={14} className="text-teal-500" />{e}</li>)}</ul></div>
          <div><h3 className="font-semibold mb-2">Documents</h3>{appel.documents.map((d, i) => <a key={i} href={d.url} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 mb-2"><span className="flex items-center gap-2"><FileText size={16} />{d.nom}</span><span className="text-sm text-gray-500">{d.taille}</span></a>)}</div>
        </div>
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-100">Fermer</button>
          <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"><Bookmark size={16} />Préparer soumission</button>
        </div>
      </div>
    </div>
  )
}

export default function SEAOPage() {
  const [appels, setAppels] = useState(DEMO_APPELS)
  const [filtered, setFiltered] = useState(DEMO_APPELS)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [region, setRegion] = useState('Toutes régions')
  const [selected, setSelected] = useState<AppelOffre | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let f = [...appels]
    if (search) f = f.filter(a => a.titre.toLowerCase().includes(search.toLowerCase()) || a.numero.includes(search))
    if (category !== 'all') f = f.filter(a => a.categorie === category)
    if (region !== 'Toutes régions') f = f.filter(a => a.region === region)
    setFiltered(f)
  }, [appels, search, category, region])

  const toggleFavori = (id: string) => setAppels(p => p.map(a => a.id === id ? { ...a, isFavori: !a.isFavori } : a))
  const refresh = async () => { setLoading(true); await new Promise(r => setTimeout(r, 1000)); setLoading(false) }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div><PageTitle title="Appels d'offres - SEAO" /><p className="text-gray-500 mt-1">Système électronique d'appel d'offres du Québec</p></div>
        <div className="flex gap-3">
          <button onClick={refresh} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><RefreshCw size={18} className={loading ? 'animate-spin' : ''} />Actualiser</button>
          <a href="https://seao.ca" target="_blank" className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"><ExternalLink size={18} />SEAO</a>
        </div>
      </div>
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" /></div>
          <select value={region} onChange={e => setRegion(e.target.value)} className="px-4 py-2 border rounded-lg">{REGIONS.map(r => <option key={r}>{r}</option>)}</select>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">{CATEGORIES.map(c => <button key={c.id} onClick={() => setCategory(c.id)} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm ${category === c.id ? 'bg-teal-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}><c.icon size={14} />{c.label}</button>)}</div>
      </div>
      <p className="text-gray-600 mb-4"><span className="font-semibold">{filtered.length}</span> appel(s) trouvé(s)</p>
      {loading ? <div className="flex justify-center py-20"><RefreshCw size={32} className="animate-spin text-teal-500" /></div> : filtered.length === 0 ? <div className="text-center py-20 bg-gray-50 rounded-xl"><AlertCircle size={48} className="mx-auto text-gray-400 mb-4" /><p>Aucun résultat</p></div> : <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{filtered.map(a => <AppelCard key={a.id} appel={a} onToggleFavori={toggleFavori} onView={setSelected} />)}</div>}
      <DetailsModal appel={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
