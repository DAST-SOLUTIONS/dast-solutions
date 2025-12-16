/**
 * DAST Solutions - Intégration SEAO
 * Système électronique d'appel d'offres du Québec
 * Catégories: Bâtiments, Génie civil, Architecture/Ingénierie, Services de soutien
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { PageTitle } from '@/components/PageTitle'
import { 
  Search, Filter, ExternalLink, Calendar, Building, MapPin, DollarSign, 
  Clock, FileText, Download, Star, Bell, RefreshCw, AlertCircle, 
  CheckCircle, Eye, Bookmark, X, Briefcase, Wrench, Compass, Users,
  ChevronDown, Tag, TrendingUp
} from 'lucide-react'
import { format, differenceInDays, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  fetchAppelsOffresSEAO, 
  syncAppelsOffresSupabase,
  getAppelsOffresFromDB,
  CATEGORIES_CIBLES, 
  REGIONS_QUEBEC,
  type AppelOffreSEAO 
} from '@/services/seaoService'

// Configuration des catégories avec icônes
const CATEGORIES = [
  { id: 'all', label: 'Toutes catégories', icon: Briefcase, color: 'bg-gray-500' },
  { id: 'batiment', label: 'Bâtiments', icon: Building, color: 'bg-blue-500' },
  { id: 'genie_civil', label: 'Génie civil', icon: Wrench, color: 'bg-orange-500' },
  { id: 'architecture', label: 'Architecture & Ingénierie', icon: Compass, color: 'bg-purple-500' },
  { id: 'services', label: 'Services professionnels', icon: Users, color: 'bg-teal-500' }
]

const REGIONS = ['Toutes régions', ...REGIONS_QUEBEC]

// Composant carte d'appel d'offres
function AppelCard({ 
  appel, 
  onToggleFavori, 
  onView 
}: { 
  appel: AppelOffreSEAO
  onToggleFavori: (id: string) => void
  onView: (a: AppelOffreSEAO) => void 
}) {
  const joursRestants = differenceInDays(parseISO(appel.date_fermeture), new Date())
  const isUrgent = joursRestants <= 7 && joursRestants > 0
  const isTresUrgent = joursRestants <= 3 && joursRestants > 0
  
  const categorie = CATEGORIES.find(c => c.id === appel.categorie) || CATEGORIES[0]
  const CatIcon = categorie.icon

  return (
    <div className={`bg-white rounded-xl border ${isTresUrgent ? 'border-red-300 bg-red-50/30' : isUrgent ? 'border-orange-300 bg-orange-50/30' : 'border-gray-200'} p-5 hover:shadow-lg transition-all duration-200`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {appel.numero_seao}
            </span>
            {isTresUrgent && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertCircle size={10} />URGENT
              </span>
            )}
            {isUrgent && !isTresUrgent && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Clock size={10} />{joursRestants}j
              </span>
            )}
          </div>
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-white ${categorie.color}`}>
            <CatIcon size={10} />
            {categorie.label}
          </div>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleFavori(appel.id) }} 
          className={`p-1.5 rounded-lg transition ${appel.is_favori ? 'text-amber-500 bg-amber-50' : 'text-gray-300 hover:text-amber-400 hover:bg-amber-50'}`}
        >
          <Star size={18} fill={appel.is_favori ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Titre */}
      <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2 min-h-[48px]">
        {appel.titre}
      </h3>

      {/* Infos */}
      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-2">
          <Building size={14} className="text-gray-400 flex-shrink-0" />
          <span className="truncate">{appel.organisme}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-gray-400 flex-shrink-0" />
          <span>{appel.region}{appel.ville && appel.ville !== appel.region ? ` - ${appel.ville}` : ''}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-gray-400 flex-shrink-0" />
          <span>
            Fermeture: <strong className={isTresUrgent ? 'text-red-600' : isUrgent ? 'text-orange-600' : ''}>
              {format(parseISO(appel.date_fermeture), 'dd MMM yyyy', { locale: fr })}
            </strong>
          </span>
        </div>
      </div>

      {/* Budget */}
      {(appel.estimation_min || appel.budget_affiche) && (
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-teal-600" />
            <div>
              <div className="text-xs text-teal-600">Budget estimé</div>
              <div className="font-bold text-teal-800">
                {appel.budget_affiche || `${(appel.estimation_min!/1000000).toFixed(1)}M$ - ${(appel.estimation_max!/1000000).toFixed(1)}M$`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exigences RBQ */}
      {appel.exigences_rbq && appel.exigences_rbq.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {appel.exigences_rbq.slice(0, 2).map((rbq, i) => (
            <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
              RBQ {rbq.split(' ')[0]}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button 
          onClick={() => onView(appel)} 
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium"
        >
          <Eye size={16} />
          Détails
        </button>
        <a 
          href={appel.url_seao} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="px-3 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          title="Voir sur SEAO"
        >
          <ExternalLink size={16} className="text-gray-600" />
        </a>
      </div>
    </div>
  )
}

// Modal détails
function DetailsModal({ 
  appel, 
  onClose 
}: { 
  appel: AppelOffreSEAO | null
  onClose: () => void 
}) {
  if (!appel) return null
  
  const joursRestants = differenceInDays(parseISO(appel.date_fermeture), new Date())
  const categorie = CATEGORIES.find(c => c.id === appel.categorie) || CATEGORIES[0]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm bg-white/20 px-2 py-0.5 rounded">{appel.numero_seao}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${categorie.color}`}>
                  {categorie.label}
                </span>
              </div>
              <h2 className="text-xl font-bold">{appel.titre}</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Infos principales */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-1">Organisme</div>
              <div className="font-medium">{appel.organisme}</div>
              {appel.organisme_type && (
                <div className="text-sm text-gray-500">{appel.organisme_type}</div>
              )}
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-1">Localisation</div>
              <div className="font-medium">{appel.region}</div>
              {appel.ville && <div className="text-sm text-gray-500">{appel.ville}</div>}
            </div>
          </div>

          {/* Dates */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-1">Date de publication</div>
              <div className="font-medium">
                {appel.date_publication ? format(parseISO(appel.date_publication), 'dd MMMM yyyy', { locale: fr }) : 'N/A'}
              </div>
            </div>
            <div className={`rounded-lg p-4 ${joursRestants <= 7 ? 'bg-orange-50' : 'bg-gray-50'}`}>
              <div className="text-xs text-gray-500 mb-1">Date de fermeture</div>
              <div className={`font-medium ${joursRestants <= 7 ? 'text-orange-700' : ''}`}>
                {format(parseISO(appel.date_fermeture), 'dd MMMM yyyy', { locale: fr })}
              </div>
              <div className={`text-sm ${joursRestants <= 7 ? 'text-orange-600' : 'text-gray-500'}`}>
                {joursRestants > 0 ? `${joursRestants} jours restants` : 'Fermé'}
              </div>
            </div>
          </div>

          {/* Budget */}
          {(appel.estimation_min || appel.budget_affiche) && (
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6">
              <div className="text-teal-700 font-medium mb-1 flex items-center gap-2">
                <DollarSign size={16} />
                Budget estimé
              </div>
              <div className="text-2xl font-bold text-teal-800">
                {appel.budget_affiche || `${appel.estimation_min?.toLocaleString()}$ - ${appel.estimation_max?.toLocaleString()}$`}
              </div>
            </div>
          )}

          {/* Description */}
          {appel.description && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">{appel.description}</p>
            </div>
          )}

          {/* Exigences */}
          {appel.exigences_rbq && appel.exigences_rbq.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Exigences RBQ</h3>
              <div className="space-y-1">
                {appel.exigences_rbq.map((e, i) => (
                  <div key={i} className="flex items-center gap-2 text-gray-600">
                    <CheckCircle size={14} className="text-teal-500 flex-shrink-0" />
                    {e}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {appel.documents && appel.documents.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Documents disponibles</h3>
              <div className="space-y-2">
                {appel.documents.map((doc, i) => (
                  <a 
                    key={i} 
                    href={doc.url} 
                    target="_blank"
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <span className="flex items-center gap-2">
                      <FileText size={16} className="text-gray-400" />
                      {doc.nom}
                    </span>
                    {doc.taille && (
                      <span className="text-sm text-gray-500">{doc.taille}</span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t">
          <a 
            href={appel.url_seao} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-teal-600 hover:text-teal-700"
          >
            <ExternalLink size={16} />
            Voir sur SEAO
          </a>
          <div className="flex gap-3">
            <button 
              onClick={onClose} 
              className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition"
            >
              Fermer
            </button>
            <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition flex items-center gap-2">
              <Bookmark size={16} />
              Préparer soumission
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Page principale
export default function SEAOPage() {
  const [appels, setAppels] = useState<AppelOffreSEAO[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [region, setRegion] = useState('Toutes régions')
  const [showFavorisOnly, setShowFavorisOnly] = useState(false)
  const [selected, setSelected] = useState<AppelOffreSEAO | null>(null)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  // Charger les appels d'offres
  const loadAppels = useCallback(async () => {
    setLoading(true)
    try {
      // Charger depuis le service (données simulées réalistes)
      const seaoAppels = await fetchAppelsOffresSEAO()
      setAppels(seaoAppels)
    } catch (error) {
      console.error('Erreur chargement:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAppels()
  }, [loadAppels])

  // Synchroniser avec SEAO
  const handleSync = async () => {
    setSyncing(true)
    try {
      await loadAppels()
      setLastSync(new Date())
    } catch (error) {
      console.error('Erreur sync:', error)
    } finally {
      setSyncing(false)
    }
  }

  // Filtrer les appels
  const filtered = useMemo(() => {
    let f = [...appels]
    
    if (search) {
      const s = search.toLowerCase()
      f = f.filter(a => 
        a.titre.toLowerCase().includes(s) || 
        a.numero_seao.toLowerCase().includes(s) ||
        a.organisme.toLowerCase().includes(s)
      )
    }
    
    if (category !== 'all') {
      f = f.filter(a => a.categorie === category)
    }
    
    if (region !== 'Toutes régions') {
      f = f.filter(a => a.region === region)
    }
    
    if (showFavorisOnly) {
      f = f.filter(a => a.is_favori)
    }
    
    // Trier par date de fermeture (plus proche en premier)
    f.sort((a, b) => new Date(a.date_fermeture).getTime() - new Date(b.date_fermeture).getTime())
    
    return f
  }, [appels, search, category, region, showFavorisOnly])

  // Stats
  const stats = useMemo(() => ({
    total: appels.length,
    batiment: appels.filter(a => a.categorie === 'batiment').length,
    genie_civil: appels.filter(a => a.categorie === 'genie_civil').length,
    architecture: appels.filter(a => a.categorie === 'architecture').length,
    services: appels.filter(a => a.categorie === 'services').length,
    urgents: appels.filter(a => {
      const j = differenceInDays(parseISO(a.date_fermeture), new Date())
      return j <= 7 && j > 0
    }).length
  }), [appels])

  // Toggle favori
  const toggleFavori = (id: string) => {
    setAppels(prev => prev.map(a => 
      a.id === id ? { ...a, is_favori: !a.is_favori } : a
    ))
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <PageTitle title="Appels d'offres - SEAO" />
          <p className="text-gray-500 mt-1">
            Système électronique d'appel d'offres du Québec
            {lastSync && (
              <span className="text-xs ml-2">
                • Dernière sync: {format(lastSync, 'HH:mm', { locale: fr })}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleSync} 
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
          >
            <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Sync...' : 'Actualiser'}
          </button>
          <a 
            href="https://seao.ca" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
          >
            <ExternalLink size={18} />
            SEAO
          </a>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        <div className="bg-white rounded-xl border p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-3 text-center">
          <div className="text-2xl font-bold text-blue-700">{stats.batiment}</div>
          <div className="text-xs text-blue-600">Bâtiments</div>
        </div>
        <div className="bg-orange-50 rounded-xl border border-orange-200 p-3 text-center">
          <div className="text-2xl font-bold text-orange-700">{stats.genie_civil}</div>
          <div className="text-xs text-orange-600">Génie civil</div>
        </div>
        <div className="bg-purple-50 rounded-xl border border-purple-200 p-3 text-center">
          <div className="text-2xl font-bold text-purple-700">{stats.architecture}</div>
          <div className="text-xs text-purple-600">Architecture</div>
        </div>
        <div className="bg-teal-50 rounded-xl border border-teal-200 p-3 text-center">
          <div className="text-2xl font-bold text-teal-700">{stats.services}</div>
          <div className="text-xs text-teal-600">Services</div>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-3 text-center">
          <div className="text-2xl font-bold text-red-700">{stats.urgents}</div>
          <div className="text-xs text-red-600">Urgents (&lt;7j)</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Rechercher par titre, numéro ou organisme..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500" 
            />
          </div>
          
          {/* Région */}
          <select 
            value={region} 
            onChange={e => setRegion(e.target.value)} 
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
          >
            {REGIONS.map(r => <option key={r}>{r}</option>)}
          </select>

          {/* Favoris */}
          <button
            onClick={() => setShowFavorisOnly(!showFavorisOnly)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
              showFavorisOnly ? 'bg-amber-50 border-amber-300 text-amber-700' : 'hover:bg-gray-50'
            }`}
          >
            <Star size={16} fill={showFavorisOnly ? 'currentColor' : 'none'} />
            Favoris
          </button>
        </div>

        {/* Catégories */}
        <div className="flex flex-wrap gap-2 mt-4">
          {CATEGORIES.map(c => {
            const Icon = c.icon
            return (
              <button 
                key={c.id} 
                onClick={() => setCategory(c.id)} 
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
                  category === c.id 
                    ? 'bg-teal-600 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon size={14} />
                {c.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Résultats */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-600">
          <span className="font-semibold">{filtered.length}</span> appel(s) d'offres trouvé(s)
        </p>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-20">
          <RefreshCw size={32} className="animate-spin text-teal-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl">
          <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 font-medium">Aucun appel d'offres trouvé</p>
          <p className="text-gray-500 text-sm mt-1">Essayez de modifier vos filtres</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(a => (
            <AppelCard 
              key={a.id} 
              appel={a} 
              onToggleFavori={toggleFavori} 
              onView={setSelected} 
            />
          ))}
        </div>
      )}

      {/* Modal détails */}
      <DetailsModal appel={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
