import React, { useState } from 'react'
import { X, MapPin, Building, Calendar, Loader2, Globe, Lock, Layers } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  redirectToEstimation?: boolean
}

// Phases du projet (mutuellement exclusives)
const PROJECT_PHASES = [
  { id: 'conception', name: 'Conception', description: 'Plans et design', icon: '📐', color: 'bg-blue-100 text-blue-700' },
  { id: 'estimation', name: 'Estimation', description: 'Quantités et soumission', icon: '📊', color: 'bg-purple-100 text-purple-700' },
  { id: 'gestion', name: 'Gestion', description: 'Exécution des travaux', icon: '🏗️', color: 'bg-green-100 text-green-700' },
  { id: 'termine', name: 'Terminé', description: 'Projet complété', icon: '✅', color: 'bg-gray-100 text-gray-700' },
]

// Types de projets
const PROJECT_TYPES = [
  'Résidentiel unifamilial',
  'Résidentiel multifamilial',
  'Commercial',
  'Institutionnel',
  'Industriel',
  'Rénovation',
  'Agrandissement',
  'Génie civil',
  'Infrastructure',
  'Autre'
]

// Types de bâtiments
const BUILDING_TYPES = [
  'Maison unifamiliale',
  'Maison jumelée',
  'Triplex/Multiplex',
  'Condo',
  'Tour d\'habitation',
  'Bureau',
  'Commerce de détail',
  'Centre commercial',
  'Entrepôt',
  'Usine',
  'École',
  'Hôpital/CLSC',
  'Église/Lieu de culte',
  'Centre sportif',
  'Restaurant/Hôtel',
  'Stationnement',
  'Route/Pont',
  'Autre'
]

// Provinces
const PROVINCES = [
  { code: 'QC', name: 'Québec' },
  { code: 'ON', name: 'Ontario' },
  { code: 'BC', name: 'Colombie-Britannique' },
  { code: 'AB', name: 'Alberta' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'NS', name: 'Nouvelle-Écosse' },
  { code: 'NB', name: 'Nouveau-Brunswick' },
  { code: 'NL', name: 'Terre-Neuve-et-Labrador' },
  { code: 'PE', name: 'Île-du-Prince-Édouard' },
]

// Sources d'appels d'offres
const BID_SOURCES = [
  { id: 'seao', name: 'SEAO' },
  { id: 'merx', name: 'MERX' },
  { id: 'bonfire', name: 'Bonfire' },
  { id: 'buygc', name: 'Buy GC' },
  { id: 'direct', name: 'Demande directe' },
  { id: 'invitation', name: 'Sur invitation' },
  { id: 'other', name: 'Autre' },
]

export function CreateProjectModal({ isOpen, onClose, redirectToEstimation = false }: CreateProjectModalProps) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)

  const [formData, setFormData] = useState({
    // Infos générales
    name: '',
    projectNumber: '',
    description: '',
    // Classification
    phase: 'conception',
    projectType: 'Résidentiel unifamilial',
    buildingType: '',
    visibility: 'private',
    // Client
    client: '',
    // Localisation
    street: '',
    city: '',
    province: 'QC',
    postalCode: '',
    latitude: '',
    longitude: '',
    // Dates
    startDate: '',
    endDate: '',
    // Budget
    projectValue: '',
    // Appel d'offres
    bidNumber: '',
    bidSource: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const geocodeAddress = async () => {
    const { street, city, province, postalCode } = formData
    if (!street && !city) {
      alert('Entrez au moins une rue ou une ville')
      return
    }

    const addressParts = [street, city, province, postalCode, 'Canada'].filter(Boolean)
    const fullAddress = addressParts.join(', ')

    setGeocoding(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`,
        { headers: { 'User-Agent': 'DAST-Solutions/1.0' } }
      )
      const data = await response.json()
      
      if (data?.length > 0) {
        setFormData(prev => ({
          ...prev,
          latitude: parseFloat(data[0].lat).toFixed(6),
          longitude: parseFloat(data[0].lon).toFixed(6)
        }))
      } else {
        alert('Adresse non trouvée')
      }
    } catch (err) {
      console.error('Geocoding error:', err)
    } finally {
      setGeocoding(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError('Le nom du projet est obligatoire')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const fullAddress = [formData.street, formData.city, formData.province, formData.postalCode]
        .filter(Boolean).join(', ')

      const { data, error: createError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: formData.name,
          project_number: formData.projectNumber || null,
          description: formData.description || null,
          phase: formData.phase,
          status: 'active',
          project_type: formData.projectType,
          building_type: formData.buildingType || null,
          visibility: formData.visibility,
          client_name: formData.client || null,
          address: fullAddress || null,
          city: formData.city || null,
          province: formData.province,
          postal_code: formData.postalCode || null,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
          start_date: formData.startDate || null,
          end_date: formData.endDate || null,
          budget: formData.projectValue ? parseFloat(formData.projectValue) : null,
          bid_number: formData.bidNumber || null,
          bid_source: formData.bidSource || null,
        })
        .select()
        .single()

      if (createError) throw createError

      resetForm()
      onClose()
      
      if (redirectToEstimation && data?.id) {
        navigate(`/projets/${data.id}/estimation`)
      } else if (data?.id) {
        navigate(`/project/${data.id}`)
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création')
      console.error('Create project error:', err)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      projectNumber: '',
      description: '',
      phase: 'conception',
      projectType: 'Résidentiel unifamilial',
      buildingType: '',
      visibility: 'private',
      client: '',
      street: '',
      city: '',
      province: 'QC',
      postalCode: '',
      latitude: '',
      longitude: '',
      startDate: '',
      endDate: '',
      projectValue: '',
      bidNumber: '',
      bidSource: '',
    })
    setError('')
    setStep(1)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Nouveau projet</h2>
            <p className="text-teal-100 text-sm">Étape {step} sur 3</p>
          </div>
          <button onClick={() => { resetForm(); onClose() }} className="text-white/80 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex bg-gray-100">
          {[1, 2, 3].map(s => (
            <div 
              key={s} 
              className={`flex-1 h-1 ${s <= step ? 'bg-teal-500' : 'bg-gray-300'}`}
            />
          ))}
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {/* STEP 1: Informations générales */}
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Building size={20} className="text-teal-600" />
                  Informations générales
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom du projet <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Ex: Résidence Tremblay"
                      className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de projet</label>
                    <input
                      type="text"
                      name="projectNumber"
                      value={formData.projectNumber}
                      onChange={handleChange}
                      placeholder="Ex: 2026-001"
                      className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                    <input
                      type="text"
                      name="client"
                      value={formData.client}
                      onChange={handleChange}
                      placeholder="Nom du client"
                      className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Phase du projet */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Layers size={16} className="inline mr-1" />
                    Phase actuelle du projet
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {PROJECT_PHASES.map(phase => (
                      <button
                        key={phase.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, phase: phase.id }))}
                        className={`p-3 rounded-lg border-2 text-center transition ${
                          formData.phase === phase.id 
                            ? 'border-teal-500 bg-teal-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-2xl">{phase.icon}</span>
                        <p className="font-medium text-sm mt-1">{phase.name}</p>
                        <p className="text-xs text-gray-500">{phase.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visibilité */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type de projet</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, visibility: 'private' }))}
                      className={`flex-1 p-3 rounded-lg border-2 flex items-center justify-center gap-2 ${
                        formData.visibility === 'private' 
                          ? 'border-teal-500 bg-teal-50' 
                          : 'border-gray-200'
                      }`}
                    >
                      <Lock size={18} />
                      <span className="font-medium">Privé</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, visibility: 'public' }))}
                      className={`flex-1 p-3 rounded-lg border-2 flex items-center justify-center gap-2 ${
                        formData.visibility === 'public' 
                          ? 'border-teal-500 bg-teal-50' 
                          : 'border-gray-200'
                      }`}
                    >
                      <Globe size={18} />
                      <span className="font-medium">Public (Appel d'offres)</span>
                    </button>
                  </div>
                </div>

                {/* Type de projet et bâtiment */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type de projet</label>
                    <select
                      name="projectType"
                      value={formData.projectType}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    >
                      {PROJECT_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type de bâtiment</label>
                    <select
                      name="buildingType"
                      value={formData.buildingType}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">Sélectionner...</option>
                      {BUILDING_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Localisation */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin size={20} className="text-teal-600" />
                  Localisation du projet
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                    <input
                      type="text"
                      name="street"
                      value={formData.street}
                      onChange={handleChange}
                      placeholder="123 rue Principale"
                      className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Montréal"
                      className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                    <select
                      name="province"
                      value={formData.province}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    >
                      {PROVINCES.map(p => (
                        <option key={p.code} value={p.code}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      placeholder="H2X 1Y4"
                      className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={geocodeAddress}
                      disabled={geocoding}
                      className="px-4 py-2.5 bg-gray-100 border rounded-lg hover:bg-gray-200 flex items-center gap-2 disabled:opacity-50"
                    >
                      {geocoding ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
                      Géolocaliser
                    </button>
                  </div>
                </div>

                {formData.latitude && formData.longitude && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">
                      📍 Coordonnées: {formData.latitude}, {formData.longitude}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Dates et Budget */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar size={20} className="text-teal-600" />
                  Dates et Budget
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin prévue</label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Budget estimé ($)</label>
                    <input
                      type="number"
                      name="projectValue"
                      value={formData.projectValue}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Si projet public, afficher options d'appel d'offres */}
                {formData.visibility === 'public' && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
                    <h4 className="font-medium text-blue-900">Informations appel d'offres</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Numéro d'appel d'offres</label>
                        <input
                          type="text"
                          name="bidNumber"
                          value={formData.bidNumber}
                          onChange={handleChange}
                          placeholder="Ex: AO-2026-001"
                          className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                        <select
                          name="bidSource"
                          value={formData.bidSource}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="">Sélectionner...</option>
                          {BID_SOURCES.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description / Notes</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Notes additionnelles..."
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t bg-gray-50 px-6 py-4 flex justify-between">
            <button
              type="button"
              onClick={() => step > 1 ? setStep(step - 1) : onClose()}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              {step > 1 ? '← Précédent' : 'Annuler'}
            </button>
            
            <div className="flex gap-2">
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (step === 1 && !formData.name.trim()) {
                      setError('Le nom du projet est obligatoire')
                      return
                    }
                    setError('')
                    setStep(step + 1)
                  }}
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  Suivant →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  Créer le projet
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
