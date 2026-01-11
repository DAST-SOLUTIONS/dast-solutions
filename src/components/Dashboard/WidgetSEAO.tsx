/**
 * DAST Solutions - Widget SEAO
 * Nouveaux appels d'offres selon le profil de l'entreprise
 */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  Globe, Search, Star, StarOff, ExternalLink, Calendar,
  MapPin, DollarSign, Building2, Filter, Bell, RefreshCw,
  ChevronRight, Clock, AlertCircle, Bookmark, Eye
} from 'lucide-react'

interface AppelOffre {
  id: string
  numero: string
  titre: string
  organisme: string
  region: string
  categorie: string
  budgetEstime?: string
  datePublication: Date
  dateFermeture: Date
  status: 'new' | 'viewed' | 'favorite' | 'applied'
  matchScore?: number // Pertinence selon profil
  url?: string
}

const REGIONS_QC = [
  'Montréal', 'Québec', 'Laval', 'Longueuil', 'Gatineau',
  'Sherbrooke', 'Trois-Rivières', 'Saguenay', 'Lévis', 'Terrebonne'
]

const CATEGORIES = [
  { id: 'construction', name: 'Construction', color: 'bg-blue-100 text-blue-700' },
  { id: 'renovation', name: 'Rénovation', color: 'bg-green-100 text-green-700' },
  { id: 'infrastructure', name: 'Infrastructure', color: 'bg-purple-100 text-purple-700' },
  { id: 'entretien', name: 'Entretien', color: 'bg-amber-100 text-amber-700' },
]

export default function WidgetSEAO() {
  const navigate = useNavigate()
  const [appels, setAppels] = useState<AppelOffre[]>([])
  const [loading, setLoading] = useState(true)
  const [filterRegion, setFilterRegion] = useState<string>('')
  const [showOnlyNew, setShowOnlyNew] = useState(true)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadAppelsOffre()
    loadFavorites()
  }, [])

  const loadFavorites = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('seao_favorites')
      .select('appel_id')
      .eq('user_id', user.id)

    if (data) {
      setFavorites(new Set(data.map(d => d.appel_id)))
    }
  }

  const loadAppelsOffre = async () => {
    try {
      setLoading(true)
      // En production, connecter à l'API SEAO
      // Pour l'instant, données simulées
      const mockAppels = generateMockAppels()
      setAppels(mockAppels)
    } catch (err) {
      console.error('Erreur SEAO:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateMockAppels = (): AppelOffre[] => {
    const now = new Date()
    const appels: AppelOffre[] = []
    
    const titres = [
      'Réfection de la toiture - Édifice municipal',
      'Construction d\'un centre communautaire',
      'Rénovation des vestiaires - Aréna',
      'Travaux de maçonnerie - École primaire',
      'Agrandissement bibliothèque municipale',
      'Remplacement système CVAC - Hôtel de ville',
      'Construction stationnement étagé',
      'Réhabilitation pont piétonnier',
      'Travaux de béton - Parc industriel',
      'Mise aux normes incendie - Centre sportif'
    ]

    const organismes = [
      'Ville de Montréal', 'Ville de Laval', 'Ville de Longueuil',
      'Commission scolaire de Montréal', 'Société de transport de Montréal',
      'Ville de Québec', 'MRC des Laurentides', 'Ville de Gatineau'
    ]

    const budgets = ['50 000$ - 100 000$', '100 000$ - 500 000$', '500 000$ - 1M$', '1M$ - 5M$', '5M$ +']

    for (let i = 0; i < 10; i++) {
      const pubDate = new Date(now)
      pubDate.setDate(pubDate.getDate() - Math.floor(Math.random() * 7))
      
      const closeDate = new Date(pubDate)
      closeDate.setDate(closeDate.getDate() + 14 + Math.floor(Math.random() * 21))

      const daysOld = Math.floor((now.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24))

      appels.push({
        id: `seao-${i + 1}`,
        numero: `AO-${2024}-${1000 + i}`,
        titre: titres[i],
        organisme: organismes[Math.floor(Math.random() * organismes.length)],
        region: REGIONS_QC[Math.floor(Math.random() * REGIONS_QC.length)],
        categorie: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)].id,
        budgetEstime: budgets[Math.floor(Math.random() * budgets.length)],
        datePublication: pubDate,
        dateFermeture: closeDate,
        status: daysOld <= 2 ? 'new' : 'viewed',
        matchScore: Math.floor(70 + Math.random() * 30),
        url: 'https://seao.ca'
      })
    }

    return appels.sort((a, b) => b.datePublication.getTime() - a.datePublication.getTime())
  }

  const toggleFavorite = async (appelId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const newFavorites = new Set(favorites)
    
    if (favorites.has(appelId)) {
      newFavorites.delete(appelId)
      await supabase
        .from('seao_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('appel_id', appelId)
    } else {
      newFavorites.add(appelId)
      await supabase
        .from('seao_favorites')
        .insert({ user_id: user.id, appel_id: appelId })
    }

    setFavorites(newFavorites)
  }

  const getDaysRemaining = (closeDate: Date) => {
    const now = new Date()
    const diff = Math.ceil((closeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diff < 0) return { text: 'Fermé', color: 'text-gray-500' }
    if (diff === 0) return { text: "Aujourd'hui", color: 'text-red-600' }
    if (diff === 1) return { text: 'Demain', color: 'text-red-600' }
    if (diff <= 3) return { text: `${diff} jours`, color: 'text-amber-600' }
    if (diff <= 7) return { text: `${diff} jours`, color: 'text-blue-600' }
    return { text: `${diff} jours`, color: 'text-gray-600' }
  }

  const getCategoryConfig = (catId: string) => {
    return CATEGORIES.find(c => c.id === catId) || CATEGORIES[0]
  }

  const filteredAppels = appels.filter(a => {
    if (filterRegion && a.region !== filterRegion) return false
    if (showOnlyNew && a.status !== 'new') return false
    return true
  })

  const newCount = appels.filter(a => a.status === 'new').length
  const favCount = favorites.size

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-4 h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe className="text-indigo-600" size={18} />
          <h3 className="font-semibold text-gray-900">SEAO Québec</h3>
          {newCount > 0 && (
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
              {newCount} nouveau{newCount > 1 ? 'x' : ''}
            </span>
          )}
        </div>
        <button 
          onClick={loadAppelsOffre}
          className="p-1 hover:bg-gray-100 rounded"
          title="Rafraîchir"
        >
          <RefreshCw size={14} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <select
          value={filterRegion}
          onChange={(e) => setFilterRegion(e.target.value)}
          className="flex-1 px-2 py-1.5 border rounded-lg text-sm"
        >
          <option value="">Toutes les régions</option>
          {REGIONS_QC.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <button
          onClick={() => setShowOnlyNew(!showOnlyNew)}
          className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition ${
            showOnlyNew 
              ? 'bg-indigo-100 text-indigo-700' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Bell size={14} />
          Nouveaux
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-indigo-50 rounded-lg">
          <p className="text-lg font-bold text-indigo-600">{appels.length}</p>
          <p className="text-xs text-indigo-600">Actifs</p>
        </div>
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <p className="text-lg font-bold text-green-600">{newCount}</p>
          <p className="text-xs text-green-600">Nouveaux</p>
        </div>
        <div className="text-center p-2 bg-amber-50 rounded-lg">
          <p className="text-lg font-bold text-amber-600">{favCount}</p>
          <p className="text-xs text-amber-600">Favoris</p>
        </div>
      </div>

      {/* Liste des appels */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredAppels.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Search className="mx-auto mb-2 text-gray-300" size={32} />
            <p className="text-sm">Aucun appel d'offres</p>
            <p className="text-xs">Modifiez vos filtres</p>
          </div>
        ) : (
          filteredAppels.slice(0, 5).map(appel => {
            const remaining = getDaysRemaining(appel.dateFermeture)
            const catConfig = getCategoryConfig(appel.categorie)
            const isFavorite = favorites.has(appel.id)

            return (
              <div 
                key={appel.id}
                className={`p-3 rounded-lg border transition hover:shadow-sm ${
                  appel.status === 'new' ? 'border-indigo-200 bg-indigo-50/50' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {appel.status === 'new' && (
                        <span className="px-1.5 py-0.5 bg-indigo-500 text-white text-xs rounded">
                          Nouveau
                        </span>
                      )}
                      <span className={`px-1.5 py-0.5 text-xs rounded ${catConfig.color}`}>
                        {catConfig.name}
                      </span>
                      {appel.matchScore && appel.matchScore >= 85 && (
                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded flex items-center gap-0.5">
                          <Star size={10} fill="currentColor" />
                          {appel.matchScore}%
                        </span>
                      )}
                    </div>
                    
                    <h4 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
                      {appel.titre}
                    </h4>
                    
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Building2 size={12} />
                        {appel.organisme}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {appel.region}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {appel.budgetEstime}
                      </span>
                      <span className={`text-xs font-medium flex items-center gap-1 ${remaining.color}`}>
                        <Clock size={12} />
                        {remaining.text}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => toggleFavorite(appel.id)}
                      className={`p-1.5 rounded hover:bg-gray-100 ${
                        isFavorite ? 'text-amber-500' : 'text-gray-400'
                      }`}
                    >
                      {isFavorite ? <Star size={16} fill="currentColor" /> : <StarOff size={16} />}
                    </button>
                    <a
                      href={appel.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-400"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Mis à jour: {new Date().toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <button 
          onClick={() => navigate('/seao')}
          className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
        >
          Voir tous
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
