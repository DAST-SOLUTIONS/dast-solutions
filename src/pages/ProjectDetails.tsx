import { useParams, useNavigate } from 'react-router-dom'
import { useProjects } from '@/hooks/useProjects'
import { PageTitle } from '@/components/PageTitle'
import { Calculator, FileText, DollarSign } from 'lucide-react'

export function ProjectDetails() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { projects, loading } = useProjects()

  const project = projects.find(p => p.id === projectId)

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Projet introuvable</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <PageTitle title={project.name} subtitle={project.description || 'Détails du projet'} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        
        <div 
          onClick={() => navigate(`/projets/${projectId}/estimation`)}
          className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <Calculator className="text-teal-600" size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Estimation</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Relevé de quantités (Takeoff) et estimation des coûts
          </p>
          <button className="btn btn-primary w-full">
            Ouvrir le module →
          </button>
        </div>

        <div 
          onClick={() => navigate(`/cloud-storage/${projectId}`)}
          className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="text-blue-600" size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Documents</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Plans, contrats et documents du projet
          </p>
          <button className="btn btn-secondary w-full">
            Voir les documents →
          </button>
        </div>

        <div 
          onClick={() => navigate(`/bid-proposal/${projectId}`)}
          className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <DollarSign className="text-orange-600" size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Soumissions</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Gestion des appels d'offre et soumissions
          </p>
          <button className="btn btn-secondary w-full">
            Gérer les soumissions →
          </button>
        </div>

      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Informations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Nom du projet</p>
            <p className="font-semibold">{project.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Statut</p>
            <p className="font-semibold capitalize">{project.status || 'En cours'}</p>
          </div>
          {project.description && (
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600">Description</p>
              <p className="text-gray-900">{project.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProjectDetails
