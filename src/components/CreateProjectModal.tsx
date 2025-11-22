import React, { useState } from 'react'
import { X } from 'lucide-react'
import { useProjects } from '@/hooks/useProjects'
import { useNavigate } from 'react-router-dom'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const { createProject } = useProjects()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Section 1 - Obligatoires
  const [formData, setFormData] = useState({
    // SECTION 1 - OBLIGATOIRE
    name: '',
    type: '',
    address: '',

    // SECTION 2 - OPTIONNEL
    description: '',
    project_number: '',
    model: '',

    // SECTION 3 - OPTIONNEL
    start_date: '',
    end_date: '',

    // SECTION 4 - OPTIONNEL
    project_value: '',
    currency: 'CAD',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Le nom du projet est obligatoire')
      return false
    }
    if (!formData.type.trim()) {
      setError('Le type de projet est obligatoire')
      return false
    }
    if (!formData.address.trim()) {
      setError('L\'adresse est obligatoire')
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
      
      // Créer le projet
      const newProject = await createProject(formData.name, {
        type: formData.type,
        address: formData.address,
        description: formData.description || null,
        project_number: formData.project_number || null,
        model: formData.model || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        project_value: formData.project_value ? parseFloat(formData.project_value) : null,
        currency: formData.currency,
      })

      // Rediriger vers le projet
      onClose()
      navigate(`/project/${newProject.id}`)
    } catch (err) {
      setError('Erreur lors de la création du projet')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Créer un projet</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* SECTION 1 - OBLIGATOIRE */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <span className="text-red-500">*</span> Informations de base
            </h3>
            <div className="space-y-4">
              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du projet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ex: Rénovation Centre Commercial"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de projet <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionner un type</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Résidentiel">Résidentiel</option>
                  <option value="Industriel">Industriel</option>
                  <option value="Institutional">Institutionnel</option>
                  <option value="Infrastructure">Infrastructure</option>
                </select>
              </div>

              {/* Adresse */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Ex: 285 rue Annie, Sainte-Marthe-sur-le-Lac, QC"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* SECTION 2 - DÉTAILS (OPTIONNEL) */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Détails (optionnel)</h3>
            <div className="space-y-4">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Décrivez le projet..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Numéro de projet */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numéro de projet
                  </label>
                  <input
                    type="text"
                    name="project_number"
                    value={formData.project_number}
                    onChange={handleChange}
                    placeholder="Ex: PRJ-2025-001"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                {/* Modèle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modèle
                  </label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    placeholder="Ex: Standard"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3 - DATES (OPTIONNEL) */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Dates (optionnel)</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Date de début */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {/* Date de fin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de fin
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4 - VALEUR (OPTIONNEL) */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Valeur (optionnel)</h3>
            <div className="grid grid-cols-3 gap-4">
              {/* Valeur */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valeur du projet
                </label>
                <input
                  type="number"
                  name="project_value"
                  value={formData.project_value}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {/* Devise */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Devise
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="CAD">CAD</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              {loading ? 'Création en cours...' : 'Créer le projet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}