import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useProjects } from '@/hooks/useProjects'
import { useKpis } from '@/hooks/useKpis'
import { StatCard } from '@/components/StatCard'
import { PageTitle } from '@/components/PageTitle'
import { Users, ShieldCheck, DollarSign, Briefcase, FolderKanban, PlusCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { CreateProjectModal } from '@/components/CreateProjectModal'

export function Dashboard() {
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const { projects, loading } = useProjects()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const kpis = useKpis()

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="spinner" />
      </div>
    )
  }

  const displayName = userProfile?.fullName || userProfile?.email?.split('@')[0] || 'Utilisateur'

  return (
    <div className="animate-fade-in">
      <PageTitle 
        title={`Bienvenue, ${displayName}!`} 
        subtitle="Hub central de construction du Québec" 
      />

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
        <StatCard 
          title="ENTREPRENEURS RBQ" 
          value={kpis.entrepreneursRbq} 
          icon={<Users />} 
          trend={{ text: '↗️ +2,3% ce mois', positive: true }} 
        />
        <StatCard 
          title="APPELS D'OFFRES" 
          value={kpis.appelsOffres} 
          icon={<Briefcase />} 
          subtitle="Actifs aujourd'hui" 
          trend={{ text: '•', positive: true }} 
        />
        <StatCard 
          title="LICENCES ACTIVES" 
          value={kpis.licencesActives} 
          icon={<ShieldCheck />} 
          trend={{ text: `⚠️ ${kpis.licencesSuspendues} suspendues`, danger: true }} 
        />
        <StatCard
          title="VALEUR PROJETS"
          value={
            kpis.totalProjectValue > 0
              ? kpis.totalProjectValue.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })
              : '–'
          }
          icon={<DollarSign />}
          trend={{ text: '↗️ +8,7% ce trimestre', positive: true }}
        />
      </div>

      {/* Mes projets */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Mes projets</h2>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <PlusCircle size={18} />
          Créer un projet
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <FolderKanban className="mx-auto mb-4 text-gray-400" size={48} />
          <p>Aucun projet pour le moment.</p>
          <p className="text-sm text-gray-400 mt-1">Créez votre premier projet pour commencer.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => navigate(`/project/${project.id}`)}
              className="card p-6 cursor-pointer hover:shadow-xl transition-all"
            >
              <h3 className="text-xl font-semibold mb-2 text-gray-800">{project.name}</h3>
              <p className="text-sm text-gray-500 mb-3">
                Créé le {new Date(project.created_at).toLocaleDateString('fr-CA')}
              </p>

              {project.project_value ? (
                <p className="text-teal-700 font-bold">
                  {Number(project.project_value).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                </p>
              ) : (
                <p className="text-gray-400 italic">Valeur non estimée</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de création */}
      <CreateProjectModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  )
}