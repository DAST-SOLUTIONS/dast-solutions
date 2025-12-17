import { useParams, useNavigate } from 'react-router-dom'
import { useProjects } from '@/hooks/useProjects'
import { PageTitle } from '@/components/PageTitle'

export default function BidProposal() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { projects } = useProjects()
  const project = projects.find(p => p.id === projectId)

  return (
    <div className="animate-fade-in">
      <PageTitle 
        title="💰 Soumission complète" 
        subtitle={project?.name || 'Projet'} 
      />

      <div className="flex gap-3 mb-6">
        <button 
          onClick={() => navigate(`/project/${projectId}`)}
          className="btn btn-secondary"
        >
          ← Retour au projet
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold mb-4">🚧 Module en construction</h2>
        <p className="text-gray-600">
          Le module de soumission sera disponible prochainement.
        </p>
        <p className="text-sm text-gray-500 mt-4">
          Features à venir : Matériaux, Main-d'œuvre, Sous-traitants, Équipements, Calculs automatiques
        </p>
      </div>
    </div>
  )
}