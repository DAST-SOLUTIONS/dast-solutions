import { DocumentUpload } from '@/components/DocumentUpload'
import { DocumentList } from '@/components/DocumentList'
import { useParams, useNavigate } from 'react-router-dom'
import { useProjects, Project } from '@/hooks/useProjects'
import { useState, useEffect } from 'react'
import { Save, Cloud } from 'lucide-react'
import { PageTitle } from '@/components/PageTitle'

export function ProjectDetails() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { projects, updateProject } = useProjects()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_type: 'Résidentiel',
    client_name: '',
    project_number: '',
    address: '',
    start_date: '',
    end_date: '',
    project_value: '',
    timezone: 'America/Toronto',
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const project = projects.find(p => p.id === projectId)

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        project_type: project.project_type || 'Résidentiel',
        client_name: project.client_name || '',
        project_number: project.project_number || '',
        address: project.address || '',
        start_date: project.start_date ? project.start_date.split('T')[0] : '',
        end_date: project.end_date ? project.end_date.split('T')[0] : '',
        project_value: project.project_value ? project.project_value.toString() : '',
        timezone: project.timezone || 'America/Toronto',
      })
    }
  }, [project])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSaved(false)

    try {
      const updates: Partial<Project> = {
        name: formData.name,
        description: formData.description || null,
        project_type: formData.project_type || null,
        client_name: formData.client_name || null,
        project_number: formData.project_number || null,
        address: formData.address || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        project_value: formData.project_value ? parseFloat(formData.project_value) : null,
        timezone: formData.timezone || null,
      }
      await updateProject(projectId || '', updates)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving project:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!project) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-gray-600">Projet non trouvé</p>
      </div>
    )
  }

  const projectTypes = ['Résidentiel', 'Commercial', 'Industriel', 'Institutionnel', 'Mixte']
  const timezones = ['America/Toronto', 'America/Vancouver', 'America/Denver', 'America/Chicago', 'America/New_York']

  return (
    <div className="animate-fade-in">
      <PageTitle title="Détails du projet" subtitle={project.name} />

      {saved && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          Projet sauvegardé avec succès!
        </div>
      )}

      {/* BOUTONS D'ACTION */}
      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => navigate(`/cloud-storage/${projectId}`)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Cloud size={20} />
          ☁️ Cloud Storage
        </button>
        <button 
          onClick={() => navigate(`/takeoff/${projectId}`)}
          className="btn btn-secondary flex items-center gap-2"
        >
          📐 Takeoff
        </button>
        <button 
          onClick={() => navigate(`/bid-proposal/${projectId}`)}
          className="btn btn-secondary flex items-center gap-2"
        >
          💰 Soumission
        </button>
      </div>

      <form onSubmit={handleSave} className="bg-white p-8 rounded-lg shadow space-y-6">
        {/* Nom et Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nom du projet *</label>
          <input
            type="text" name="name" value={formData.name} onChange={handleChange} required
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="input-field" />
        </div>

        {/* Infos Générales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type de projet</label>
            <select name="project_type" value={formData.project_type} onChange={handleChange} className="input-field">
              {projectTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
            <input type="text" name="client_name" value={formData.client_name} onChange={handleChange} className="input-field" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">No. de projet</label>
            <input type="text" name="project_number" value={formData.project_number} onChange={handleChange} className="input-field" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} className="input-field" />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date de début</label>
            <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date de fin</label>
            <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} className="input-field" />
          </div>
        </div>

        {/* Valeur du projet */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Valeur du projet ($)</label>
          <input type="number" name="project_value" value={formData.project_value} onChange={handleChange} step="0.01" className="input-field" />
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-2">
          <button type="submit" disabled={loading} className="btn btn-primary">
            <Save className="inline -mt-1 mr-2" size={18} /> {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
          <button type="button" onClick={() => navigate('/dashboard')} className="btn btn-secondary">
            Annuler
          </button>
        </div>
      </form>

      {/* Documents */}
      <div className="border-t pt-8 mt-8 bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Documents du projet</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ajouter des documents</h3>
            <DocumentUpload projectId={projectId || ''} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents uploadés</h3>
            <DocumentList projectId={projectId || ''} />
          </div>
        </div>
      </div>
    </div>
  )
}