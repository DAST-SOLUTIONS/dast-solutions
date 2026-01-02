/**
 * DAST Solutions - Routes UNIFIÉES
 * 
 * INSTRUCTIONS: Copier ces routes dans votre App.tsx
 * 
 * Structure: /project/:projectId/[module]
 * Toutes les pages de gestion sont des sous-routes de /project/:projectId
 */

// ============================================================================
// IMPORTS À AJOUTER DANS App.tsx
// ============================================================================

/*
// Pages de gestion de projet (TOUTES)
import {
  ProjectBudget,
  ProjectChangeOrders,
  ProjectJournal,
  ProjectCouts,
  ProjectPrevisions,
  ProjectPlans,
  ProjectSpecifications,
  ProjectDocuments,
  ProjectPhotos,
  ProjectEcheancier,
  ProjectProblemes,
  ProjectRFI,
  ProjectSoumissionsST,
  ProjectCorrespondance,
  ProjectReunions,
  ProjectFormulaires,
  ProjectEquipe,
  ProjectEquipements,
  ProjectMateriaux,
  ProjectRapports,
  ProjectParametres
} from '@/pages/GestionPages'
*/

// ============================================================================
// ROUTES À AJOUTER DANS <Routes>
// ============================================================================

/*
{/* === ROUTES PROJET UNIFIÉES === *}
{/* Toutes les pages de gestion accessibles via /project/:projectId/[module] *}

<Route path="/project/:projectId" element={<ProjectDetails />} />
<Route path="/project/:projectId/budget" element={<ProjectBudget />} />
<Route path="/project/:projectId/couts" element={<ProjectCouts />} />
<Route path="/project/:projectId/change-orders" element={<ProjectChangeOrders />} />
<Route path="/project/:projectId/previsions" element={<ProjectPrevisions />} />
<Route path="/project/:projectId/plans" element={<ProjectPlans />} />
<Route path="/project/:projectId/specifications" element={<ProjectSpecifications />} />
<Route path="/project/:projectId/documents" element={<ProjectDocuments />} />
<Route path="/project/:projectId/photos" element={<ProjectPhotos />} />
<Route path="/project/:projectId/echeancier" element={<ProjectEcheancier />} />
<Route path="/project/:projectId/journal" element={<ProjectJournal />} />
<Route path="/project/:projectId/problemes" element={<ProjectProblemes />} />
<Route path="/project/:projectId/rfi" element={<ProjectRFI />} />
<Route path="/project/:projectId/soumissions-st" element={<ProjectSoumissionsST />} />
<Route path="/project/:projectId/correspondance" element={<ProjectCorrespondance />} />
<Route path="/project/:projectId/reunions" element={<ProjectReunions />} />
<Route path="/project/:projectId/formulaires" element={<ProjectFormulaires />} />
<Route path="/project/:projectId/equipe" element={<ProjectEquipe />} />
<Route path="/project/:projectId/equipements" element={<ProjectEquipements />} />
<Route path="/project/:projectId/materiaux" element={<ProjectMateriaux />} />
<Route path="/project/:projectId/rapports" element={<ProjectRapports />} />
<Route path="/project/:projectId/parametres" element={<ProjectParametres />} />

{/* Takeoff reste à /takeoff/:projectId pour compatibilité *}
<Route path="/takeoff/:projectId" element={<TakeoffV2 />} />
*/

// ============================================================================
// EXEMPLE COMPLET App.tsx
// ============================================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Layout
import Sidebar from '@/components/Sidebar'

// Pages principales
import Dashboard from '@/pages/Dashboard'
import Projects from '@/pages/Projects'
import ProjectDetails from '@/pages/ProjectDetails'
import TakeoffV2 from '@/pages/TakeoffV2'
// ... autres imports existants ...

// Pages de gestion projet (NOUVELLES)
import {
  ProjectBudget,
  ProjectChangeOrders,
  ProjectJournal,
  ProjectCouts,
  ProjectPrevisions,
  ProjectPlans,
  ProjectSpecifications,
  ProjectDocuments,
  ProjectPhotos,
  ProjectEcheancier,
  ProjectProblemes,
  ProjectRFI,
  ProjectSoumissionsST,
  ProjectCorrespondance,
  ProjectReunions,
  ProjectFormulaires,
  ProjectEquipe,
  ProjectEquipements,
  ProjectMateriaux,
  ProjectRapports,
  ProjectParametres
} from '@/pages/GestionPages'

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Chargement...</div>
  }

  // Si non connecté, rediriger vers login
  if (!user) {
    return <LoginPage />
  }

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar UNIFIÉE */}
        <Sidebar user={user} onLogout={handleLogout} />

        {/* Contenu principal */}
        <main className="flex-1 ml-60">
          <Routes>
            {/* Dashboard */}
            <Route path="/" element={<Dashboard />} />

            {/* Projets */}
            <Route path="/projects" element={<Projects />} />
            <Route path="/project/new" element={<ProjectDetails />} />
            <Route path="/project/:projectId" element={<ProjectDetails />} />

            {/* === MODULES GESTION PROJET === */}
            <Route path="/project/:projectId/budget" element={<ProjectBudget />} />
            <Route path="/project/:projectId/couts" element={<ProjectCouts />} />
            <Route path="/project/:projectId/change-orders" element={<ProjectChangeOrders />} />
            <Route path="/project/:projectId/previsions" element={<ProjectPrevisions />} />
            <Route path="/project/:projectId/plans" element={<ProjectPlans />} />
            <Route path="/project/:projectId/specifications" element={<ProjectSpecifications />} />
            <Route path="/project/:projectId/documents" element={<ProjectDocuments />} />
            <Route path="/project/:projectId/photos" element={<ProjectPhotos />} />
            <Route path="/project/:projectId/echeancier" element={<ProjectEcheancier />} />
            <Route path="/project/:projectId/journal" element={<ProjectJournal />} />
            <Route path="/project/:projectId/problemes" element={<ProjectProblemes />} />
            <Route path="/project/:projectId/rfi" element={<ProjectRFI />} />
            <Route path="/project/:projectId/soumissions-st" element={<ProjectSoumissionsST />} />
            <Route path="/project/:projectId/correspondance" element={<ProjectCorrespondance />} />
            <Route path="/project/:projectId/reunions" element={<ProjectReunions />} />
            <Route path="/project/:projectId/formulaires" element={<ProjectFormulaires />} />
            <Route path="/project/:projectId/equipe" element={<ProjectEquipe />} />
            <Route path="/project/:projectId/equipements" element={<ProjectEquipements />} />
            <Route path="/project/:projectId/materiaux" element={<ProjectMateriaux />} />
            <Route path="/project/:projectId/rapports" element={<ProjectRapports />} />
            <Route path="/project/:projectId/parametres" element={<ProjectParametres />} />

            {/* Takeoff */}
            <Route path="/takeoff/:projectId" element={<TakeoffV2 />} />

            {/* Autres routes existantes */}
            {/* ... */}

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
