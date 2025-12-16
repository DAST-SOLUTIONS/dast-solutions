import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { ToastProvider } from '@/components/ToastProvider'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import ProjectDetails from '@/pages/ProjectDetails'
import Takeoff from '@/pages/Takeoff'
import Settings from '@/pages/Settings'
import Pricing from '@/pages/Pricing'
import CloudStorage from '@/pages/CloudStorage'
import BidProposal from '@/pages/BidProposal'
import ProjectCosts from '@/pages/ProjectCosts'

// Pages Projets
import ProjetsConcept from '@/pages/Projets/Conception'
import ProjetsEstimation from '@/pages/Projets/Estimation'
import ProjetsGestion from '@/pages/Projets/Gestion'
import AppelOffresPage from '@/pages/Projets/AppelOffres'

// Pages Entrepreneurs
import EntrepreneursRBQ from '@/pages/Entrepreneurs/RBQ'
import EntrepreneursPersonnel from '@/pages/Entrepreneurs/Personnel'

// Pages Appels d'offre
import AppelsOffreSEAO from '@/pages/AppelsOffre/SEAO'
import AppelsOffreMERX from '@/pages/AppelsOffre/MERX'
import AppelsOffreBuyGC from '@/pages/AppelsOffre/BuyGC'
import AppelsOffreBonfire from '@/pages/AppelsOffre/Bonfire'

// Pages Ressources
import CodeNavigator from '@/pages/Ressources/CodeNavigator'
import CCQNavigator from '@/pages/Ressources/CCQNavigator'
import DocumentsACCCDC from '@/pages/Ressources/DocumentsACCCCDC'
import Associations from '@/pages/Ressources/Associations'

// Pages Outils Avancés
import ApplicationMobileTerrain from '@/pages/OutilsAvances/ApplicationMobile'
import MessagerieEquipe from '@/pages/OutilsAvances/Messagerie'
import Geolocalisation from '@/pages/OutilsAvances/Geolocalisation'

import AppHeader from '@/components/AppHeader'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="spinner" />
      </div>
    )
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />
}

function PrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <ToastProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/pricing" element={<Pricing />} />

          {/* Private Routes - Dashboard */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <PrivateLayout>
                <Dashboard />
              </PrivateLayout>
            </PrivateRoute>
          } />

          {/* Private Routes - Projects */}
          <Route path="/project/:projectId" element={
            <PrivateRoute>
              <PrivateLayout>
                <ProjectDetails />
              </PrivateLayout>
            </PrivateRoute>
          } />

          <Route path="/takeoff/:projectId" element={
            <PrivateRoute>
              <PrivateLayout>
                <Takeoff />
              </PrivateLayout>
            </PrivateRoute>
          } />

          <Route path="/cloud-storage/:projectId" element={
            <PrivateRoute>
              <PrivateLayout>
                <CloudStorage />
              </PrivateLayout>
            </PrivateRoute>
          } />

          <Route path="/bid-proposal/:projectId" element={
            <PrivateRoute>
              <PrivateLayout>
                <BidProposal />
              </PrivateLayout>
            </PrivateRoute>
          } />

          <Route path="/project-costs/:projectId" element={
            <PrivateRoute>
              <PrivateLayout>
                <ProjectCosts />
              </PrivateLayout>
            </PrivateRoute>
          } />

          {/* Private Routes - Projets Menu */}
          <Route path="/projets/conception" element={
            <PrivateRoute>
              <PrivateLayout>
                <ProjetsConcept />
              </PrivateLayout>
            </PrivateRoute>
          } />

          {/* Route Estimation sans projectId - affiche sélecteur */}
          <Route path="/projets/estimation" element={
            <PrivateRoute>
              <PrivateLayout>
                <ProjetsEstimation />
              </PrivateLayout>
            </PrivateRoute>
          } />
          {/* FIX: Route Estimation avec projectId */}
          <Route path="/projets/:projectId/estimation" element={
            <PrivateRoute>
              <PrivateLayout>
                <ProjetsEstimation />
              </PrivateLayout>
            </PrivateRoute>
          } />

          <Route path="/projets/gestion" element={
            <PrivateRoute>
              <PrivateLayout>
                <ProjetsGestion />
              </PrivateLayout>
            </PrivateRoute>
          } />

          {/* Private Routes - Appels d'offres internes */}
          <Route path="/projets/appels-offres" element={
            <PrivateRoute>
              <PrivateLayout>
                <AppelOffresPage />
              </PrivateLayout>
            </PrivateRoute>
          } />

          {/* Private Routes - Entrepreneurs */}
          <Route path="/entrepreneurs/rbq" element={
            <PrivateRoute>
              <PrivateLayout>
                <EntrepreneursRBQ />
              </PrivateLayout>
            </PrivateRoute>
          } />

          <Route path="/entrepreneurs/personnel" element={
            <PrivateRoute>
              <PrivateLayout>
                <EntrepreneursPersonnel />
              </PrivateLayout>
            </PrivateRoute>
          } />

          {/* Private Routes - Appels d'offre publics */}
          <Route path="/appels-offre/seao" element={
            <PrivateRoute>
              <PrivateLayout>
                <AppelsOffreSEAO />
              </PrivateLayout>
            </PrivateRoute>
          } />

          <Route path="/appels-offre/merx" element={
            <PrivateRoute>
              <PrivateLayout>
                <AppelsOffreMERX />
              </PrivateLayout>
            </PrivateRoute>
          } />

          <Route path="/appels-offre/buy-gc" element={
            <PrivateRoute>
              <PrivateLayout>
                <AppelsOffreBuyGC />
              </PrivateLayout>
            </PrivateRoute>
          } />

          <Route path="/appels-offre/bonfire" element={
            <PrivateRoute>
              <PrivateLayout>
                <AppelsOffreBonfire />
              </PrivateLayout>
            </PrivateRoute>
          } />

          {/* Private Routes - Ressources */}
          <Route path="/ressources/code-navigator" element={
            <PrivateRoute>
              <PrivateLayout>
                <CodeNavigator />
              </PrivateLayout>
            </PrivateRoute>
          } />

          <Route path="/ressources/ccq-navigator" element={
            <PrivateRoute>
              <PrivateLayout>
                <CCQNavigator />
              </PrivateLayout>
            </PrivateRoute>
          } />

          <Route path="/ressources/documents-acc-ccdc" element={
            <PrivateRoute>
              <PrivateLayout>
                <DocumentsACCCDC />
              </PrivateLayout>
            </PrivateRoute>
          } />

          <Route path="/ressources/associations" element={
            <PrivateRoute>
              <PrivateLayout>
                <Associations />
              </PrivateLayout>
            </PrivateRoute>
          } />

          {/* Private Routes - Outils Avancés */}
          <Route path="/outils-avances/application-mobile" element={
            <PrivateRoute>
              <PrivateLayout>
                <ApplicationMobileTerrain />
              </PrivateLayout>
            </PrivateRoute>
          } />

          <Route path="/outils-avances/messagerie" element={
            <PrivateRoute>
              <PrivateLayout>
                <MessagerieEquipe />
              </PrivateLayout>
            </PrivateRoute>
          } />

          <Route path="/outils-avances/geolocalisation" element={
            <PrivateRoute>
              <PrivateLayout>
                <Geolocalisation />
              </PrivateLayout>
            </PrivateRoute>
          } />

          {/* Settings */}
          <Route path="/settings" element={
            <PrivateRoute>
              <PrivateLayout>
                <Settings />
              </PrivateLayout>
            </PrivateRoute>
          } />

          {/* Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </ToastProvider>
    </Router>
  )
}