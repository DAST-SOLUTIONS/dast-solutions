/**
 * DAST Solutions - Page Estimation CORRIGÉE
 * Sélection de projet puis navigation vers Takeoff
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { PageTitle } from '@/components/PageTitle'
import { 
  FolderOpen, Plus, Loader2, Building2, MapPin, 
  Calendar, DollarSign, ChevronRight 
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description?: string
  client_name?: string
  city?: string
  status: string
  budget?: number
  start_date?: string
}

export default function Estimation() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('projects')
        .select('id, name, description, client_name, city, status, budget, start_date')
        .eq('user_id', user.id)
        .in('status', ['active', 'planning', 'draft'])
        .order('updated_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectProject = (projectId: string) => {
    // Naviguer vers le takeoff du projet avec l'onglet estimation
    navigate(`/takeoff/${projectId}?tab=estimation`)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-teal-600" size={40} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageTitle 
        title="Estimation" 
        subtitle="Sélectionnez un projet pour commencer"
      />

      <div className="bg-white rounded-xl border p-8 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <FolderOpen size={64} className="mx-auto mb-4 text-teal-500" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Choisir un projet</h2>
          <p className="text-gray-600 mb-6">
            Sélectionnez le projet pour lequel vous souhaitez créer une estimation
          </p>
          
          <button 
            onClick={() => navigate('/project/new')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            <Plus size={16} />
            Nouveau projet
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Aucun projet actif trouvé.</p>
            <p className="text-sm mt-1">Créez un nouveau projet pour commencer.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleSelectProject(project.id)}
                className="bg-white border rounded-xl p-4 text-left hover:shadow-lg hover:border-teal-300 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="text-teal-600" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate group-hover:text-teal-600">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {project.description || 'Pas de description'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    project.status === 'active' ? 'bg-green-100 text-green-700' :
                    project.status === 'planning' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {project.status === 'active' ? 'Actif' : 
                     project.status === 'planning' ? 'Planification' : 'Brouillon'}
                  </span>
                  <span className="text-teal-600 text-sm font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Ouvrir <ChevronRight size={16} />
                  </span>
                </div>

                {(project.city || project.budget) && (
                  <div className="mt-3 pt-3 border-t flex items-center gap-4 text-xs text-gray-500">
                    {project.city && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {project.city}
                      </span>
                    )}
                    {project.budget && (
                      <span className="flex items-center gap-1">
                        <DollarSign size={12} />
                        {new Intl.NumberFormat('fr-CA', { 
                          style: 'currency', 
                          currency: 'CAD',
                          maximumFractionDigits: 0 
                        }).format(project.budget)}
                      </span>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
