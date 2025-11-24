import React, { useState } from 'react'
import { X, MapPin, Building, Calendar, Loader2 } from 'lucide-react'
import { useProjects } from '@/hooks/useProjects'
import { useNavigate } from 'react-router-dom'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  redirectToEstimation?: boolean
}

// Types de projets
const PROJECT_TYPES = [
  'Résidentiel',
  'Commercial',
  'Institutionnel',
  'Industriel',
  'Multi-résidentiel',
  'Rénovation',
  'Agrandissement',
  'Génie civil',
  'Infrastructure',
  'Autre'
]

// Provinces canadiennes
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
  { code: 'NT', name: 'Territoires du Nord-Ouest' },
  { code: 'YT', name: 'Yukon' },
  { code: 'NU', name: 'Nunavut' }
]

export function CreateProjectModal({ isOpen, onClose, redirectToEstimation = false }: CreateProjectModalProps) {
  const { createProject } = useProjects()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    projectNumber: '',
    projectType: 'Résidentiel',
    client: '',
    description: '',
    street: '',
    city: '',
    province: 'QC',
    postalCode: '',
    country: 'Canada',
    latitude: '',
    longitude: '',
    startDate: '',
    endDate: '',
    projectValue: '',
    currency: 'CAD'
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Géocodage: Convertir l'adresse en coordonnées GPS
  const geocodeAddress = async () => {
    const { street, city, province, postalCode, country } = formData
    
    if (!street && !city) {
      alert('Veuillez entrer au moins une rue ou une ville pour géolocaliser')
      return
    }

    const addressParts = [street, city, province, postalCode, country].filter(Boolean)
    const fullAddress = addressParts.join(', ')

    setGeocoding(true)
    try {
      // Utilisation de l'API Nominatim (OpenStreetMap) - Gratuite
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`,
        {
          headers: {
            'User-Agent': 'DAST-Solutions-App/1.0'
          }
        }
      )
      
      const data = await response.json()
      
      if (data && data.length > 0) {
        setFormData(prev => ({
          ...prev,
          latitude: parseFloat(data[0].lat).toFixed(6),
          longitude: parseFloat(data[0].lon).toFixed(6)
        }))
      } else {
        alert('Adresse non trouvée. Vérifiez les informations saisies.')
      }
    } catch (err) {
      console.error('Erreur de géocodage:', err)
      alert('Erreur lors de la géolocalisation. Réessayez plus tard.')
    } finally {
      setGeocoding(false)
    }
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Le nom du projet est obligatoire')
      return false
    }
    setError('')
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setLoading(true)

      // Combiner l'adresse complète
      const addressParts = [
        formData.street,
        formData.city,
        formData.province,
        formData.postalCode,
        formData.country
      ].filter(Boolean)
      
      let fullAddress = addressParts.join(', ')

      // Ajouter les coordonnées si disponibles
      if (formData.latitude && formData.longitude) {
        fullAddress += ` [${formData.latitude}, ${formData.longitude}]`
      }

      const newProject = await createProject(
        formData.name,
        formData.description || undefined,
        formData.projectType || undefined,
        formData.client || undefined,
        formData.projectNumber || undefined,
        fullAddress || undefined,
        formData.startDate || undefined,
        formData.endDate || undefined,
        formData.projectValue ? parseFloat(formData.projectValue) : undefined,
        formData.currency || undefined
      )

      resetForm()
      onClose()
      
      // Rediriger vers estimation ou projet selon le contexte
      if (redirectToEstimation && newProject?.id) {
        navigate(`/projets/${newProject.id}/estimation`)
      } else if (newProject?.id) {
        navigate(`/project/${newProject.id}`)
      }
    } catch (err) {
      setError('Erreur lors de la création du projet')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      projectNumber: '',
      projectType: 'Résidentiel',
      client: '',
      description: '',
      street: '',
      city: '',
      province: 'QC',
      postalCode: '',
      country: 'Canada',
      latitude: '',
      longitude: '',
      startDate: '',
      endDate: '',
      projectValue: '',
      currency: 'CAD'
    })
    setError('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header fixe */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">Créer un projet</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Contenu scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {/* Section: Informations générales */}
            <div className="border-b pb-6">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Building size={16} />
                Informations générales
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du projet <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ex: Résidence Tremblay"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                    placeholder="Ex: PRJ-2025-001"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type de projet</label>
                  <select
                    name="projectType"
                    value={formData.projectType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    {PROJECT_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                  <input
                    type="text"
                    name="client"
                    value={formData.client}
                    onChange={handleChange}
                    placeholder="Ex: Jean Tremblay"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Ex: Construction maison unifamiliale 2 étages, 3 chambres, garage double"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Section: Adresse */}
            <div className="border-b pb-6">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <MapPin size={16} />
                Adresse du projet
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse (rue et numéro)</label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    placeholder="Ex: 123 Rue Principale"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Ex: Montréal"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                  <select
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    {PROVINCES.map(prov => (
                      <option key={prov.code} value={prov.code}>{prov.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value.toUpperCase() }))}
                    placeholder="Ex: H2X 1Y4"
                    maxLength={7}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="Canada"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Géolocalisation */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Géolocalisation</span>
                  <button
                    type="button"
                    onClick={geocodeAddress}
                    disabled={geocoding}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                  >
                    {geocoding ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Recherche...
                      </>
                    ) : (
                      <>
                        <MapPin size={14} />
                        Localiser l'adresse
                      </>
                    )}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Latitude</label>
                    <input
                      type="text"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleChange}
                      placeholder="Ex: 45.508888"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Longitude</label>
                    <input
                      type="text"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleChange}
                      placeholder="Ex: -73.561668"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>
                {formData.latitude && formData.longitude && (
                  <p className="mt-2 text-xs text-green-600">
                    ✓ Coordonnées trouvées: {formData.latitude}, {formData.longitude}
                  </p>
                )}
              </div>
            </div>

            {/* Section: Dates et Budget */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Calendar size={16} />
                Dates et Budget
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin prévue</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valeur estimée ($)</label>
                  <input
                    type="number"
                    name="projectValue"
                    value={formData.projectValue}
                    onChange={handleChange}
                    placeholder="Ex: 500000"
                    min="0"
                    step="1000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer fixe avec boutons */}
          <div className="bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-4 flex-shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Création...
                </>
              ) : (
                'Créer le projet'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
