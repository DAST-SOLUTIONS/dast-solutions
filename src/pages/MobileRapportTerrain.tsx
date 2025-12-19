/**
 * DAST Solutions - PWA Mobile Rapports Terrain
 * Option D - Application mobile pour inspections chantier
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  Camera, MapPin, Cloud, CloudOff, Plus, Check, X,
  ChevronLeft, ChevronRight, Trash2, Save, Send,
  Sun, CloudRain, Thermometer, Clock, Calendar,
  AlertTriangle, CheckCircle, HelpCircle, XCircle,
  Image, Mic, FileText, User, Building2, Loader2,
  Wifi, WifiOff, Upload, Download, RefreshCw
} from 'lucide-react'
import type { RapportTerrainMobile, RapportTerrainItem, RapportPhoto } from '@/types/pricing-types'

const VISIT_TYPES = [
  { value: 'inspection', label: 'Inspection', icon: '🔍' },
  { value: 'progress', label: 'Avancement', icon: '📊' },
  { value: 'safety', label: 'Sécurité', icon: '⚠️' },
  { value: 'quality', label: 'Qualité', icon: '✅' },
  { value: 'punch_list', label: 'Liste de déficiences', icon: '📋' },
  { value: 'other', label: 'Autre', icon: '📝' },
]

const ITEM_CATEGORIES = [
  'Structure', 'Fondations', 'Toiture', 'Électricité', 'Plomberie',
  'CVCA', 'Finitions', 'Extérieur', 'Sécurité', 'Autre'
]

const STATUS_OPTIONS = [
  { value: 'ok', label: 'Conforme', icon: CheckCircle, color: 'text-green-500 bg-green-50' },
  { value: 'issue', label: 'Problème', icon: AlertTriangle, color: 'text-red-500 bg-red-50' },
  { value: 'pending', label: 'En attente', icon: Clock, color: 'text-yellow-500 bg-yellow-50' },
  { value: 'na', label: 'N/A', icon: HelpCircle, color: 'text-gray-500 bg-gray-50' },
]

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Basse', color: 'bg-gray-100 text-gray-700' },
  { value: 'medium', label: 'Moyenne', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'high', label: 'Haute', color: 'bg-orange-100 text-orange-700' },
  { value: 'critical', label: 'Critique', color: 'bg-red-100 text-red-700' },
]

export default function MobileRapportTerrain() {
  const { projectId, rapportId } = useParams<{ projectId: string; rapportId?: string }>()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [rapport, setRapport] = useState<RapportTerrainMobile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [currentStep, setCurrentStep] = useState(0)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [weather, setWeather] = useState<{ condition: string; temp: number } | null>(null)
  const [pendingUploads, setPendingUploads] = useState<File[]>([])

  // Steps du wizard mobile
  const steps = ['Info', 'Items', 'Photos', 'Signature']

  // Détecter connexion
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Charger ou créer rapport
  useEffect(() => {
    if (rapportId) {
      loadRapport()
    } else {
      createNewRapport()
    }
    getLocation()
  }, [rapportId, projectId])

  const loadRapport = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('rapports_terrain')
        .select('*')
        .eq('id', rapportId)
        .single()

      if (error) throw error
      setRapport(data)
    } catch (err) {
      console.error('Erreur:', err)
      // Try loading from localStorage (offline)
      const cached = localStorage.getItem(`rapport_${rapportId}`)
      if (cached) {
        setRapport(JSON.parse(cached))
      }
    } finally {
      setLoading(false)
    }
  }

  const createNewRapport = () => {
    const now = new Date()
    setRapport({
      id: crypto.randomUUID(),
      project_id: projectId || '',
      date_visite: now.toISOString().split('T')[0],
      heure_debut: now.toTimeString().slice(0, 5),
      type_visite: 'inspection',
      description: '',
      items: [],
      photos: [],
      status: 'draft',
      is_synced: false,
      offline_id: crypto.randomUUID(),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    setLoading(false)
  }

  // Géolocalisation
  const getLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
          // TODO: Reverse geocoding for address
        },
        (error) => console.log('Geolocation error:', error),
        { enableHighAccuracy: true }
      )
    }
  }

  // Sauvegarder localement
  const saveLocal = useCallback(() => {
    if (rapport) {
      localStorage.setItem(`rapport_${rapport.id}`, JSON.stringify({
        ...rapport,
        updated_at: new Date().toISOString()
      }))
    }
  }, [rapport])

  // Auto-save
  useEffect(() => {
    const interval = setInterval(saveLocal, 30000) // Every 30s
    return () => clearInterval(interval)
  }, [saveLocal])

  // Sauvegarder sur serveur
  const saveToServer = async () => {
    if (!rapport || !isOnline) {
      saveLocal()
      return
    }

    setSaving(true)
    try {
      // Upload pending photos first
      for (const file of pendingUploads) {
        await uploadPhoto(file)
      }
      setPendingUploads([])

      const { error } = await supabase
        .from('rapports_terrain')
        .upsert({
          ...rapport,
          latitude: location?.lat,
          longitude: location?.lng,
          weather_condition: weather?.condition,
          temperature: weather?.temp,
          is_synced: true,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
      setRapport(prev => prev ? { ...prev, is_synced: true } : null)
      localStorage.removeItem(`rapport_${rapport.id}`)
    } catch (err) {
      console.error('Erreur sync:', err)
      saveLocal()
    } finally {
      setSaving(false)
    }
  }

  // Upload photo
  const uploadPhoto = async (file: File): Promise<string | null> => {
    try {
      const fileName = `rapports/${rapport?.id}/${Date.now()}_${file.name}`
      const { error } = await supabase.storage
        .from('documents')
        .upload(fileName, file)

      if (error) throw error

      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName)

      return urlData.publicUrl
    } catch (err) {
      console.error('Upload error:', err)
      return null
    }
  }

  // Ajouter photo
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !rapport) return

    for (const file of Array.from(files)) {
      const photo: RapportPhoto = {
        id: crypto.randomUUID(),
        rapport_id: rapport.id,
        url: URL.createObjectURL(file),
        filename: file.name,
        latitude: location?.lat,
        longitude: location?.lng,
        created_at: new Date().toISOString()
      }

      setRapport(prev => prev ? {
        ...prev,
        photos: [...prev.photos, photo]
      } : null)

      if (isOnline) {
        const url = await uploadPhoto(file)
        if (url) {
          setRapport(prev => prev ? {
            ...prev,
            photos: prev.photos.map(p => p.id === photo.id ? { ...p, url } : p)
          } : null)
        }
      } else {
        setPendingUploads(prev => [...prev, file])
      }
    }
  }

  // Ajouter item
  const addItem = () => {
    if (!rapport) return

    const newItem: RapportTerrainItem = {
      id: crypto.randomUUID(),
      rapport_id: rapport.id,
      category: 'Autre',
      description: '',
      status: 'pending',
    }

    setRapport({
      ...rapport,
      items: [...rapport.items, newItem]
    })
  }

  // Mettre à jour item
  const updateItem = (itemId: string, updates: Partial<RapportTerrainItem>) => {
    if (!rapport) return

    setRapport({
      ...rapport,
      items: rapport.items.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    })
  }

  // Supprimer item
  const removeItem = (itemId: string) => {
    if (!rapport) return

    setRapport({
      ...rapport,
      items: rapport.items.filter(item => item.id !== itemId)
    })
  }

  // Supprimer photo
  const removePhoto = (photoId: string) => {
    if (!rapport) return

    setRapport({
      ...rapport,
      photos: rapport.photos.filter(p => p.id !== photoId)
    })
  }

  // Soumettre rapport
  const submitRapport = async () => {
    if (!rapport) return

    setRapport({
      ...rapport,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      heure_fin: new Date().toTimeString().slice(0, 5)
    })

    await saveToServer()
    navigate(`/project/${projectId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="animate-spin text-teal-600" size={32} />
      </div>
    )
  }

  if (!rapport) return null

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header Mobile */}
      <header className="bg-teal-600 text-white px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ChevronLeft size={24} />
          </button>
          <h1 className="font-semibold">Rapport Terrain</h1>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi size={18} className="text-teal-200" />
            ) : (
              <WifiOff size={18} className="text-yellow-300" />
            )}
            {!rapport.is_synced && (
              <Cloud size={18} className="text-yellow-300" />
            )}
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mt-3">
          {steps.map((step, index) => (
            <button
              key={step}
              onClick={() => setCurrentStep(index)}
              className={`flex-1 text-center py-1 text-xs font-medium border-b-2 transition-colors
                ${currentStep === index 
                  ? 'border-white text-white' 
                  : 'border-transparent text-teal-200'}`}
            >
              {step}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {/* Step 0: Info */}
        {currentStep === 0 && (
          <div className="p-4 space-y-4">
            {/* Location & Weather */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Localisation</h3>
                <button
                  onClick={getLocation}
                  className="text-teal-600 text-sm flex items-center gap-1"
                >
                  <MapPin size={14} />
                  Actualiser
                </button>
              </div>
              {location ? (
                <p className="text-sm text-gray-600">
                  {rapport.address || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
                </p>
              ) : (
                <p className="text-sm text-gray-400">Localisation non disponible</p>
              )}
            </div>

            {/* Date & Time */}
            <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de visite
                </label>
                <input
                  type="date"
                  value={rapport.date_visite}
                  onChange={(e) => setRapport({ ...rapport, date_visite: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Heure début
                  </label>
                  <input
                    type="time"
                    value={rapport.heure_debut || ''}
                    onChange={(e) => setRapport({ ...rapport, heure_debut: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Heure fin
                  </label>
                  <input
                    type="time"
                    value={rapport.heure_fin || ''}
                    onChange={(e) => setRapport({ ...rapport, heure_fin: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Visit Type */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de visite
              </label>
              <div className="grid grid-cols-3 gap-2">
                {VISIT_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setRapport({ ...rapport, type_visite: type.value as any })}
                    className={`p-3 rounded-lg border text-center transition-colors
                      ${rapport.type_visite === type.value 
                        ? 'border-teal-500 bg-teal-50 text-teal-700' 
                        : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <span className="text-2xl">{type.icon}</span>
                    <p className="text-xs mt-1">{type.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description générale
              </label>
              <textarea
                value={rapport.description}
                onChange={(e) => setRapport({ ...rapport, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={4}
                placeholder="Décrivez la visite..."
              />
            </div>
          </div>
        )}

        {/* Step 1: Items */}
        {currentStep === 1 && (
          <div className="p-4 space-y-3">
            {rapport.items.map((item, index) => (
              <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs text-gray-500">Item #{index + 1}</span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Category */}
                <select
                  value={item.category}
                  onChange={(e) => updateItem(item.id, { category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg mb-3 text-sm"
                >
                  {ITEM_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                {/* Description */}
                <textarea
                  value={item.description}
                  onChange={(e) => updateItem(item.id, { description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg mb-3 text-sm"
                  rows={2}
                  placeholder="Description de l'observation..."
                />

                {/* Status */}
                <div className="flex gap-2 mb-3">
                  {STATUS_OPTIONS.map(status => {
                    const Icon = status.icon
                    return (
                      <button
                        key={status.value}
                        onClick={() => updateItem(item.id, { status: status.value as any })}
                        className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-colors
                          ${item.status === status.value ? status.color : 'bg-gray-100 text-gray-500'}`}
                      >
                        <Icon size={14} />
                        {status.label}
                      </button>
                    )
                  })}
                </div>

                {/* Priority (if issue) */}
                {item.status === 'issue' && (
                  <div className="flex gap-2">
                    {PRIORITY_OPTIONS.map(priority => (
                      <button
                        key={priority.value}
                        onClick={() => updateItem(item.id, { priority: priority.value as any })}
                        className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors
                          ${item.priority === priority.value ? priority.color : 'bg-gray-50 text-gray-400'}`}
                      >
                        {priority.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Add Item Button */}
            <button
              onClick={addItem}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Ajouter un item
            </button>

            {/* Summary */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h4 className="font-medium text-gray-900 mb-2">Résumé</h4>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-green-50 p-2 rounded">
                  <p className="text-green-700 font-bold">
                    {rapport.items.filter(i => i.status === 'ok').length}
                  </p>
                  <p className="text-green-600">Conforme</p>
                </div>
                <div className="bg-red-50 p-2 rounded">
                  <p className="text-red-700 font-bold">
                    {rapport.items.filter(i => i.status === 'issue').length}
                  </p>
                  <p className="text-red-600">Problème</p>
                </div>
                <div className="bg-yellow-50 p-2 rounded">
                  <p className="text-yellow-700 font-bold">
                    {rapport.items.filter(i => i.status === 'pending').length}
                  </p>
                  <p className="text-yellow-600">En attente</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-gray-700 font-bold">
                    {rapport.items.filter(i => i.status === 'na').length}
                  </p>
                  <p className="text-gray-600">N/A</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Photos */}
        {currentStep === 2 && (
          <div className="p-4 space-y-4">
            {/* Camera Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-8 bg-teal-600 text-white rounded-xl flex flex-col items-center gap-2"
            >
              <Camera size={32} />
              <span className="font-medium">Prendre une photo</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handlePhotoCapture}
              className="hidden"
            />

            {/* Pending Uploads */}
            {pendingUploads.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
                <CloudOff className="text-yellow-600" size={18} />
                <span className="text-sm text-yellow-700">
                  {pendingUploads.length} photo(s) en attente de synchronisation
                </span>
              </div>
            )}

            {/* Photo Grid */}
            <div className="grid grid-cols-2 gap-3">
              {rapport.photos.map(photo => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.url}
                    alt={photo.filename}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removePhoto(photo.id)}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                  {photo.caption && (
                    <p className="text-xs text-gray-500 mt-1 truncate">{photo.caption}</p>
                  )}
                </div>
              ))}
            </div>

            {rapport.photos.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Image className="mx-auto mb-2" size={32} />
                <p>Aucune photo ajoutée</p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Signature */}
        {currentStep === 3 && (
          <div className="p-4 space-y-4">
            {/* Inspector */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-medium text-gray-900 mb-3">Inspecteur</h3>
              <input
                type="text"
                value={rapport.inspector_name || ''}
                onChange={(e) => setRapport({ ...rapport, inspector_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Votre nom"
              />
              {/* TODO: Add signature canvas */}
              <div className="mt-3 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400">
                Signature inspecteur
              </div>
            </div>

            {/* Client (optional) */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-medium text-gray-900 mb-3">Client (optionnel)</h3>
              <input
                type="text"
                value={rapport.client_name || ''}
                onChange={(e) => setRapport({ ...rapport, client_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Nom du client"
              />
              <div className="mt-3 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400">
                Signature client
              </div>
            </div>

            {/* Observations */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-medium text-gray-900 mb-3">Observations finales</h3>
              <textarea
                value={rapport.observations || ''}
                onChange={(e) => setRapport({ ...rapport, observations: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={4}
                placeholder="Notes supplémentaires..."
              />
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3 flex gap-3">
        {currentStep > 0 && (
          <button
            onClick={() => setCurrentStep(prev => prev - 1)}
            className="flex-1 py-3 border rounded-xl font-medium text-gray-700"
          >
            Précédent
          </button>
        )}
        
        {currentStep < steps.length - 1 ? (
          <button
            onClick={() => setCurrentStep(prev => prev + 1)}
            className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-medium"
          >
            Suivant
          </button>
        ) : (
          <button
            onClick={submitRapport}
            disabled={saving}
            className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Send size={18} />
            )}
            {saving ? 'Envoi...' : 'Soumettre'}
          </button>
        )}
      </footer>
    </div>
  )
}
