/**
 * DAST Solutions - Rapports Terrain COMPLET
 * Avec Photos, Géolocalisation, Signatures
 */
import { useState, useEffect, useRef } from 'react'
import { PageTitle } from '@/components/PageTitle'
import { supabase } from '@/lib/supabase'
import { SignatureCanvas, SignatureDisplay } from '@/components/SignatureCanvas'
import {
  Plus, Camera, MapPin, Cloud, Sun, CloudRain, Snowflake,
  Clock, Users, FileText, Check, X, Loader2, Calendar,
  ChevronRight, Upload, Trash2, Edit, Eye, Send, Image, Pen
} from 'lucide-react'

// Types
interface RapportPhoto {
  id: string
  url: string
  description?: string
}

interface RapportTerrain {
  id: string
  project_id: string
  date_rapport: string
  titre?: string
  meteo_condition?: string
  meteo_temperature?: number
  latitude?: number
  longitude?: number
  adresse?: string
  description?: string
  travaux_effectues?: string
  problemes_rencontres?: string
  decisions_prises?: string
  personnel_present: string[]
  sous_traitants_present: string[]
  heure_debut?: string
  heure_fin?: string
  heures_total?: number
  status: 'brouillon' | 'soumis' | 'approuve'
  signature_id?: string
  photos?: RapportPhoto[]
  created_at: string
}

// Icônes météo
const METEO_OPTIONS = [
  { value: 'ensoleille', label: 'Ensoleillé', icon: Sun },
  { value: 'nuageux', label: 'Nuageux', icon: Cloud },
  { value: 'pluie', label: 'Pluie', icon: CloudRain },
  { value: 'neige', label: 'Neige', icon: Snowflake }
]

// Hook pour les projets
function useProjects() {
  const [projects, setProjects] = useState<any[]>([])
  
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('projects').select('id, name').order('name')
      setProjects(data || [])
    }
    load()
  }, [])
  
  return { projects }
}

// Hook pour rapports terrain
function useRapportsTerrain(projectId?: string) {
  const [rapports, setRapports] = useState<RapportTerrain[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRapports = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let query = supabase
        .from('rapports_terrain')
        .select('*')
        .eq('user_id', user.id)
        .order('date_rapport', { ascending: false })

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data, error } = await query
      if (error) throw error

      // Charger les photos pour chaque rapport
      const rapportsWithPhotos = await Promise.all((data || []).map(async (r) => {
        const { data: photos } = await supabase
          .from('rapport_photos')
          .select('id, url, description')
          .eq('rapport_id', r.id)
        
        return { ...r, photos: photos || [] }
      }))

      setRapports(rapportsWithPhotos)
    } catch (err) {
      console.error('Erreur chargement rapports:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRapports()
  }, [projectId])

  const createRapport = async (rapport: Partial<RapportTerrain>): Promise<RapportTerrain | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('rapports_terrain')
        .insert({
          user_id: user.id,
          ...rapport,
          date_rapport: rapport.date_rapport || new Date().toISOString().split('T')[0],
          status: 'brouillon'
        })
        .select()
        .single()

      if (error) throw error
      await fetchRapports()
      return data
    } catch (err) {
      console.error('Erreur création rapport:', err)
      return null
    }
  }

  const updateRapport = async (id: string, updates: Partial<RapportTerrain>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('rapports_terrain')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      await fetchRapports()
      return true
    } catch (err) {
      console.error('Erreur mise à jour:', err)
      return false
    }
  }

  const deleteRapport = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('rapports_terrain').delete().eq('id', id)
      if (error) throw error
      await fetchRapports()
      return true
    } catch (err) {
      console.error('Erreur suppression:', err)
      return false
    }
  }

  // Upload photo
  const uploadPhoto = async (rapportId: string, file: File): Promise<RapportPhoto | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const fileName = `${user.id}/${rapportId}/${Date.now()}_${file.name}`
      
      const { error: uploadError } = await supabase.storage
        .from('rapport-photos')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('rapport-photos')
        .getPublicUrl(fileName)

      const { data, error } = await supabase
        .from('rapport_photos')
        .insert({
          rapport_id: rapportId,
          storage_path: fileName,
          url: publicUrl,
          filename: file.name
        })
        .select()
        .single()

      if (error) throw error
      
      await fetchRapports()
      return { id: data.id, url: publicUrl }
    } catch (err) {
      console.error('Erreur upload photo:', err)
      return null
    }
  }

  // Supprimer photo
  const deletePhoto = async (photoId: string): Promise<boolean> => {
    try {
      const { data: photo } = await supabase
        .from('rapport_photos')
        .select('storage_path')
        .eq('id', photoId)
        .single()

      if (photo?.storage_path) {
        await supabase.storage.from('rapport-photos').remove([photo.storage_path])
      }

      await supabase.from('rapport_photos').delete().eq('id', photoId)
      await fetchRapports()
      return true
    } catch (err) {
      console.error('Erreur suppression photo:', err)
      return false
    }
  }

  return {
    rapports,
    loading,
    createRapport,
    updateRapport,
    deleteRapport,
    uploadPhoto,
    deletePhoto,
    refetch: fetchRapports
  }
}

// Formulaire de rapport
function RapportForm({
  rapport,
  onSave,
  onCancel,
  onUploadPhoto,
  onDeletePhoto
}: {
  rapport?: RapportTerrain
  onSave: (data: Partial<RapportTerrain>) => void
  onCancel: () => void
  onUploadPhoto?: (file: File) => Promise<void>
  onDeletePhoto?: (photoId: string) => Promise<void>
}) {
  const { projects } = useProjects()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  
  const [formData, setFormData] = useState<Partial<RapportTerrain>>({
    project_id: rapport?.project_id || '',
    date_rapport: rapport?.date_rapport || new Date().toISOString().split('T')[0],
    titre: rapport?.titre || '',
    meteo_condition: rapport?.meteo_condition || 'ensoleille',
    meteo_temperature: rapport?.meteo_temperature || 0,
    description: rapport?.description || '',
    travaux_effectues: rapport?.travaux_effectues || '',
    problemes_rencontres: rapport?.problemes_rencontres || '',
    decisions_prises: rapport?.decisions_prises || '',
    heure_debut: rapport?.heure_debut || '08:00',
    heure_fin: rapport?.heure_fin || '16:00',
    personnel_present: rapport?.personnel_present || [],
    sous_traitants_present: rapport?.sous_traitants_present || []
  })
  
  const [personnelInput, setPersonnelInput] = useState('')
  const [gettingLocation, setGettingLocation] = useState(false)

  // Géolocalisation
  const getLocation = () => {
    if (!navigator.geolocation) {
      alert('Géolocalisation non supportée')
      return
    }

    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setFormData(prev => ({ ...prev, latitude, longitude }))
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          )
          const data = await response.json()
          if (data.display_name) {
            setFormData(prev => ({ ...prev, adresse: data.display_name }))
          }
        } catch {}
        
        setGettingLocation(false)
      },
      () => setGettingLocation(false)
    )
  }

  // Personnel
  const addPersonnel = () => {
    if (personnelInput.trim()) {
      setFormData(prev => ({
        ...prev,
        personnel_present: [...(prev.personnel_present || []), personnelInput.trim()]
      }))
      setPersonnelInput('')
    }
  }

  const removePersonnel = (index: number) => {
    setFormData(prev => ({
      ...prev,
      personnel_present: (prev.personnel_present || []).filter((_, i) => i !== index)
    }))
  }

  // Heures
  useEffect(() => {
    if (formData.heure_debut && formData.heure_fin) {
      const [h1, m1] = formData.heure_debut.split(':').map(Number)
      const [h2, m2] = formData.heure_fin.split(':').map(Number)
      const total = (h2 * 60 + m2 - h1 * 60 - m1) / 60
      setFormData(prev => ({ ...prev, heures_total: Math.max(0, total) }))
    }
  }, [formData.heure_debut, formData.heure_fin])

  // Upload photo
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onUploadPhoto) {
      setUploading(true)
      await onUploadPhoto(file)
      setUploading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="px-4 py-3 border-b bg-gray-50 flex justify-between items-center">
        <h3 className="font-semibold">{rapport ? 'Modifier' : 'Nouveau rapport'}</h3>
        <button onClick={onCancel} className="p-1 text-gray-500"><X size={20} /></button>
      </div>

      <div className="p-4 space-y-4">
        {/* Projet */}
        <div>
          <label className="block text-sm font-medium mb-1">Projet *</label>
          <select
            value={formData.project_id}
            onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">Sélectionner</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* Date et titre */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              value={formData.date_rapport}
              onChange={(e) => setFormData({ ...formData, date_rapport: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Titre</label>
            <input
              type="text"
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        {/* Météo */}
        <div>
          <label className="block text-sm font-medium mb-2">Météo</label>
          <div className="flex gap-2 mb-2">
            {METEO_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormData({ ...formData, meteo_condition: option.value })}
                className={`flex-1 p-3 rounded-lg border-2 ${
                  formData.meteo_condition === option.value ? 'border-teal-500 bg-teal-50' : 'border-gray-200'
                }`}
              >
                <option.icon className="mx-auto mb-1" size={24} />
                <span className="text-xs">{option.label}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={formData.meteo_temperature}
              onChange={(e) => setFormData({ ...formData, meteo_temperature: parseInt(e.target.value) })}
              className="w-20 px-3 py-2 border rounded-lg"
            />
            <span>°C</span>
          </div>
        </div>

        {/* Localisation */}
        <div>
          <label className="block text-sm font-medium mb-1">Localisation</label>
          <button
            type="button"
            onClick={getLocation}
            disabled={gettingLocation}
            className="w-full p-3 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 text-gray-600 hover:border-teal-400"
          >
            {gettingLocation ? <Loader2 className="animate-spin" size={20} /> : <MapPin size={20} />}
            {formData.latitude ? 'Position enregistrée ✓' : 'Obtenir ma position'}
          </button>
          {formData.adresse && <p className="text-xs text-gray-500 mt-1">{formData.adresse}</p>}
        </div>

        {/* Heures */}
        <div>
          <label className="block text-sm font-medium mb-1">Heures de travail</label>
          <div className="grid grid-cols-3 gap-2">
            <input type="time" value={formData.heure_debut} onChange={(e) => setFormData({ ...formData, heure_debut: e.target.value })} className="px-3 py-2 border rounded-lg" />
            <input type="time" value={formData.heure_fin} onChange={(e) => setFormData({ ...formData, heure_fin: e.target.value })} className="px-3 py-2 border rounded-lg" />
            <input type="text" value={`${formData.heures_total?.toFixed(1) || 0}h`} className="px-3 py-2 border rounded-lg bg-gray-50" readOnly />
          </div>
        </div>

        {/* Personnel */}
        <div>
          <label className="block text-sm font-medium mb-1">Personnel présent</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={personnelInput}
              onChange={(e) => setPersonnelInput(e.target.value)}
              placeholder="Nom"
              className="flex-1 px-3 py-2 border rounded-lg"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPersonnel())}
            />
            <button type="button" onClick={addPersonnel} className="px-4 py-2 border rounded-lg"><Plus size={18} /></button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(formData.personnel_present || []).map((name, index) => (
              <span key={index} className="px-2 py-1 bg-teal-100 text-teal-700 rounded-full text-sm flex items-center gap-1">
                {name}
                <button onClick={() => removePersonnel(index)}><X size={14} /></button>
              </span>
            ))}
          </div>
        </div>

        {/* Travaux */}
        <div>
          <label className="block text-sm font-medium mb-1">Travaux effectués</label>
          <textarea
            value={formData.travaux_effectues}
            onChange={(e) => setFormData({ ...formData, travaux_effectues: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        {/* Problèmes */}
        <div>
          <label className="block text-sm font-medium mb-1">Problèmes rencontrés</label>
          <textarea
            value={formData.problemes_rencontres}
            onChange={(e) => setFormData({ ...formData, problemes_rencontres: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        {/* Photos (si édition) */}
        {rapport && (
          <div>
            <label className="block text-sm font-medium mb-2">Photos</label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {(rapport.photos || []).map(photo => (
                <div key={photo.id} className="relative group">
                  <img src={photo.url} alt="" className="w-full h-24 object-cover rounded-lg" />
                  <button
                    onClick={() => onDeletePhoto?.(photo.id)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full p-3 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 text-gray-600 hover:border-teal-400"
            >
              {uploading ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
              Ajouter une photo
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t bg-gray-50 flex gap-3">
        <button onClick={onCancel} className="flex-1 px-4 py-2 border rounded-lg">Annuler</button>
        <button
          onClick={() => onSave(formData)}
          disabled={!formData.project_id}
          className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg disabled:opacity-50"
        >
          <Check size={18} className="inline mr-2" /> Sauvegarder
        </button>
      </div>
    </div>
  )
}

// Page principale
export default function RapportsTerrainPage() {
  const { rapports, loading, createRapport, updateRapport, deleteRapport, uploadPhoto, deletePhoto, refetch } = useRapportsTerrain()
  const { projects } = useProjects()
  const [showForm, setShowForm] = useState(false)
  const [editingRapport, setEditingRapport] = useState<RapportTerrain | undefined>()
  const [signatureModal, setSignatureModal] = useState<RapportTerrain | null>(null)

  const handleSave = async (data: Partial<RapportTerrain>) => {
    if (editingRapport) {
      await updateRapport(editingRapport.id, data)
    } else {
      await createRapport(data)
    }
    setShowForm(false)
    setEditingRapport(undefined)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Supprimer ce rapport?')) {
      await deleteRapport(id)
    }
  }

  const handleUploadPhoto = async (file: File) => {
    if (editingRapport) {
      await uploadPhoto(editingRapport.id, file)
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    await deletePhoto(photoId)
  }

  const handleSignatureSaved = async (signatureData: string, signatureId: string) => {
    if (signatureModal) {
      await updateRapport(signatureModal.id, { signature_id: signatureId, status: 'soumis' })
      setSignatureModal(null)
    }
  }

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || 'Projet'
  }

  const getMeteoIcon = (condition?: string) => {
    const option = METEO_OPTIONS.find(o => o.value === condition)
    return option ? option.icon : Cloud
  }

  return (
    <div className="animate-fade-in">
      <PageTitle title="Rapports Terrain" subtitle="Suivi journalier des chantiers" />

      {/* Bouton mobile */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-teal-600 text-white rounded-full shadow-lg flex items-center justify-center z-40 md:hidden"
        >
          <Plus size={28} />
        </button>
      )}

      {/* Desktop button */}
      <div className="hidden md:flex justify-end mb-6">
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-teal-600 text-white rounded-lg flex items-center gap-2">
          <Plus size={18} /> Nouveau rapport
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="mb-6">
          <RapportForm
            rapport={editingRapport}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingRapport(undefined) }}
            onUploadPhoto={editingRapport ? handleUploadPhoto : undefined}
            onDeletePhoto={editingRapport ? handleDeletePhoto : undefined}
          />
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-teal-600" size={40} /></div>
      ) : rapports.length === 0 && !showForm ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <FileText size={64} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-bold mb-2">Aucun rapport</h3>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-teal-600 text-white rounded-lg">
            <Plus size={18} className="inline mr-2" /> Créer un rapport
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {rapports.map(rapport => {
            const MeteoIcon = getMeteoIcon(rapport.meteo_condition)
            
            return (
              <div key={rapport.id} className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar size={16} className="text-gray-400" />
                      <span className="font-medium">
                        {new Date(rapport.date_rapport).toLocaleDateString('fr-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{getProjectName(rapport.project_id)}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><MeteoIcon size={16} /> {rapport.meteo_temperature}°C</span>
                      {rapport.heures_total && <span className="flex items-center gap-1"><Clock size={16} /> {rapport.heures_total}h</span>}
                      {rapport.personnel_present?.length > 0 && <span className="flex items-center gap-1"><Users size={16} /> {rapport.personnel_present.length}</span>}
                      {(rapport.photos?.length || 0) > 0 && <span className="flex items-center gap-1"><Image size={16} /> {rapport.photos?.length}</span>}
                    </div>

                    {/* Photos miniatures */}
                    {rapport.photos && rapport.photos.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {rapport.photos.slice(0, 4).map(photo => (
                          <img key={photo.id} src={photo.url} alt="" className="w-12 h-12 object-cover rounded" />
                        ))}
                        {rapport.photos.length > 4 && (
                          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-sm text-gray-600">
                            +{rapport.photos.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => { setEditingRapport(rapport); setShowForm(true) }}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => setSignatureModal(rapport)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded"
                      title="Signer"
                    >
                      <Pen size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(rapport.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Status */}
                <div className="mt-3 pt-3 border-t flex justify-between items-center">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    rapport.status === 'approuve' ? 'bg-green-100 text-green-700' :
                    rapport.status === 'soumis' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {rapport.status === 'approuve' ? '✓ Approuvé' : rapport.status === 'soumis' ? '📤 Soumis' : 'Brouillon'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Signature Modal */}
      {signatureModal && (
        <SignatureCanvas
          onSave={handleSignatureSaved}
          onCancel={() => setSignatureModal(null)}
          documentType="rapport_terrain"
          documentId={signatureModal.id}
          signerRole="superviseur"
        />
      )}
    </div>
  )
}
