/**
 * DAST Solutions - Pages placeholder pour le module Gestion
 * Ces pages seront développées dans les prochaines phases
 */
import { useOutletContext } from 'react-router-dom'
import { 
  DollarSign, TrendingUp, Layers, FileSearch, Calendar, Camera,
  AlertCircle, MessageSquare, Send, BarChart3, Users2, Construction
} from 'lucide-react'

interface Project {
  id: string
  name: string
}

// Composant placeholder générique
function PlaceholderPage({ 
  title, 
  description, 
  icon: Icon,
  comingSoon = true 
}: { 
  title: string
  description: string
  icon: React.ElementType
  comingSoon?: boolean
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
        <Icon className="text-gray-400" size={40} />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
      <p className="text-gray-500 max-w-md mb-4">{description}</p>
      {comingSoon && (
        <span className="px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
          🚧 En développement
        </span>
      )}
    </div>
  )
}

// Page Coûts
export function GestionCouts() {
  const { project } = useOutletContext<{ project: Project }>()
  return (
    <PlaceholderPage
      title="Suivi des Coûts"
      description="Suivez les coûts réels par rapport au budget, gérez les factures fournisseurs et les paiements."
      icon={DollarSign}
    />
  )
}

// Page Prévisions
export function GestionPrevisions() {
  const { project } = useOutletContext<{ project: Project }>()
  return (
    <PlaceholderPage
      title="Prévisions"
      description="Analysez les tendances et prévoyez le coût final du projet avec des projections automatiques."
      icon={TrendingUp}
    />
  )
}

// Page Plans
export function GestionPlans() {
  const { project } = useOutletContext<{ project: Project }>()
  return (
    <PlaceholderPage
      title="Plans"
      description="Gérez les plans et dessins du projet avec versionnage et annotations."
      icon={Layers}
    />
  )
}

// Page Documents
export function GestionDocuments() {
  const { project } = useOutletContext<{ project: Project }>()
  return (
    <PlaceholderPage
      title="Documents"
      description="Centralisez tous les documents du projet: contrats, spécifications, rapports, etc."
      icon={FileSearch}
    />
  )
}

// Page Échéancier
export function GestionEcheancier() {
  const { project } = useOutletContext<{ project: Project }>()
  return (
    <PlaceholderPage
      title="Échéancier"
      description="Visualisez et gérez l'échéancier du projet avec un diagramme de Gantt interactif."
      icon={Calendar}
    />
  )
}

// Page Photos
export function GestionPhotos() {
  const { project } = useOutletContext<{ project: Project }>()
  return (
    <PlaceholderPage
      title="Photos"
      description="Galerie photo du projet avec géolocalisation et organisation par date/zone."
      icon={Camera}
    />
  )
}

// Page Problèmes
export function GestionProblemes() {
  const { project } = useOutletContext<{ project: Project }>()
  return (
    <PlaceholderPage
      title="Problèmes"
      description="Suivez et résolvez les problèmes identifiés sur le chantier."
      icon={AlertCircle}
    />
  )
}

// Page RFIs
export function GestionRFI() {
  const { project } = useOutletContext<{ project: Project }>()
  return (
    <PlaceholderPage
      title="Demandes d'information (RFI)"
      description="Gérez les demandes d'information entre les parties prenantes du projet."
      icon={MessageSquare}
    />
  )
}

// Page Soumissions fournisseurs
export function GestionSoumissionsFournisseurs() {
  const { project } = useOutletContext<{ project: Project }>()
  return (
    <PlaceholderPage
      title="Soumissions fournisseurs"
      description="Recevez et comparez les soumissions des sous-traitants et fournisseurs."
      icon={Send}
    />
  )
}

// Page Rapports
export function GestionRapports() {
  const { project } = useOutletContext<{ project: Project }>()
  return (
    <PlaceholderPage
      title="Rapports"
      description="Générez des rapports de projet: avancement, coûts, performance, etc."
      icon={BarChart3}
    />
  )
}

// Page Équipe
export function GestionEquipe() {
  const { project } = useOutletContext<{ project: Project }>()
  return (
    <PlaceholderPage
      title="Équipe du projet"
      description="Gérez les membres de l'équipe et leurs rôles sur le projet."
      icon={Users2}
    />
  )
}
