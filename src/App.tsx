/**
 * DAST Solutions - App Principal COMPLET
 * Toutes les routes pour tous les menus
 */
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ThemeProvider } from '@/contexts/ThemeContext'
import Layout from '@/components/Layout'

// Pages principales
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Projects from '@/pages/Projects'
import ProjectDetails from '@/pages/ProjectDetails'
import TakeoffV2 from '@/pages/TakeoffV2'
import BidProposalV2 from '@/pages/BidProposalV2'
import Clients from '@/pages/Clients'
import Factures from '@/pages/Factures'
import MaterialPrices from '@/pages/MaterialPrices'
import Analytics from '@/pages/Analytics'
import RapportsTerrain from '@/pages/RapportsTerrain'
import Settings from '@/pages/Settings'
import CloudStorage from '@/pages/CloudStorage'
import ProjectCosts from '@/pages/ProjectCosts'
import ImportData from '@/pages/ImportData'
import Pricing from '@/pages/Pricing'

// Pages Projets
import Conception from '@/pages/Projets/Conception'
import Estimation from '@/pages/Projets/Estimation'
import Gestion from '@/pages/Projets/Gestion'
import AppelOffres from '@/pages/Projets/AppelOffres'

// Pages Entrepreneurs
import RBQ from '@/pages/Entrepreneurs/RBQ'
import Personnel from '@/pages/Entrepreneurs/Personnel'

// Pages Appels d'offre
import SEAO from '@/pages/AppelsOffre/SEAO'
import MERX from '@/pages/AppelsOffre/MERX'
import BuyGC from '@/pages/AppelsOffre/BuyGC'
import Bonfire from '@/pages/AppelsOffre/Bonfire'

// Pages Ressources
import CodeNavigator from '@/pages/Ressources/CodeNavigator'
import CCQNavigator from '@/pages/Ressources/CCQNavigator'
import DocumentsACCCCDC from '@/pages/Ressources/DocumentsACCCCDC'
import Associations from '@/pages/Ressources/Associations'

// Pages Outils Avancés
import ApplicationMobile from '@/pages/OutilsAvances/ApplicationMobile'
import Messagerie from '@/pages/OutilsAvances/Messagerie'
import Geolocalisation from '@/pages/OutilsAvances/Geolocalisation'

function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de DAST Solutions...</p>
        </div>
      </div>
    )
  }

  return (
    <ThemeProvider>
      <Router>
        <Routes>
        {/* Routes publiques */}
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/pricing" element={<Pricing />} />

        {/* Routes protégées avec Layout */}
        <Route path="/" element={session ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Navigate to="/dashboard" />} />
          
          {/* Dashboard & Projets principaux */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="project/new" element={<ProjectDetails />} />
          <Route path="project/:projectId" element={<ProjectDetails />} />
          <Route path="takeoff/:projectId" element={<TakeoffV2 />} />
          <Route path="bid-proposal/:projectId" element={<BidProposalV2 />} />
          <Route path="cloud-storage/:projectId" element={<CloudStorage />} />
          <Route path="project-costs/:projectId" element={<ProjectCosts />} />

          {/* === PROJETS Menu === */}
          <Route path="projets/conception" element={<Conception />} />
          <Route path="projets/estimation" element={<Estimation />} />
          <Route path="projets/:projectId/estimation" element={<Estimation />} />
          <Route path="projets/gestion" element={<Gestion />} />
          <Route path="projets/appels-offres" element={<AppelOffres />} />
          <Route path="factures" element={<Factures />} />

          {/* === ENTREPRENEURS Menu === */}
          <Route path="entrepreneurs/rbq" element={<RBQ />} />
          <Route path="entrepreneurs/personnel" element={<Personnel />} />
          <Route path="clients" element={<Clients />} />

          {/* === APPELS D'OFFRE Menu === */}
          <Route path="appels-offre/seao" element={<SEAO />} />
          <Route path="appels-offre/merx" element={<MERX />} />
          <Route path="appels-offre/buy-gc" element={<BuyGC />} />
          <Route path="appels-offre/bonfire" element={<Bonfire />} />

          {/* === RESSOURCES Menu === */}
          <Route path="ressources/code-navigator" element={<CodeNavigator />} />
          <Route path="ressources/ccq-navigator" element={<CCQNavigator />} />
          <Route path="ressources/documents-acc-ccdc" element={<DocumentsACCCCDC />} />
          <Route path="ressources/associations" element={<Associations />} />
          <Route path="materiaux" element={<MaterialPrices />} />
          <Route path="material-prices" element={<MaterialPrices />} />

          {/* === OUTILS AVANCÉS Menu === */}
          <Route path="outils-avances/application-mobile" element={<ApplicationMobile />} />
          <Route path="outils-avances/messagerie" element={<Messagerie />} />
          <Route path="outils-avances/geolocalisation" element={<Geolocalisation />} />
          <Route path="terrain" element={<RapportsTerrain />} />
          <Route path="rapports-terrain" element={<RapportsTerrain />} />
          <Route path="analytics" element={<Analytics />} />

          {/* === Autres === */}
          <Route path="settings" element={<Settings />} />
          <Route path="import-data" element={<ImportData />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
    </ThemeProvider>
  )
}

export default App
