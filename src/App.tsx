/**
 * DAST Solutions - App.tsx COMPLET
 * TOUTES les routes pour TOUS les modules
 * Mis à jour: 2 janvier 2026
 */
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Layout from '@/components/Layout'

// Pages principales
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Projects from '@/pages/Projects'
import ProjectDetails from '@/pages/ProjectDetails'
import TakeoffV3 from '@/pages/TakeoffV3'
import BidProposalV2 from '@/pages/BidProposalV2'
import Clients from '@/pages/Clients'
import Factures from '@/pages/Factures'
import Analytics from '@/pages/Analytics'
import Settings from '@/pages/Settings'

// Projets sous-menus
import Conception from '@/pages/Projets/Conception'
import Estimation from '@/pages/Projets/Estimation'
import Gestion from '@/pages/Projets/Gestion'
import AppelOffres from '@/pages/Projets/AppelOffres'

// Entrepreneurs sous-menus
import RBQ from '@/pages/Entrepreneurs/RBQ'
import Personnel from '@/pages/Entrepreneurs/Personnel'

// Appels d'offre sous-menus (SEAO, MERX, etc.)
import SEAO from '@/pages/AppelsOffre/SEAO'
import MERX from '@/pages/AppelsOffre/MERX'
import BuyGC from '@/pages/AppelsOffre/BuyGC'
import Bonfire from '@/pages/AppelsOffre/Bonfire'

// Ressources sous-menus
import CodeNavigator from '@/pages/Ressources/CodeNavigator'
import CCQNavigator from '@/pages/Ressources/CCQNavigator'
import DocumentsACCCCDC from '@/pages/Ressources/DocumentsACCCCDC'
import Associations from '@/pages/Ressources/Associations'

// Outils avancés sous-menus
import ApplicationMobile from '@/pages/OutilsAvances/ApplicationMobile'
import Messagerie from '@/pages/OutilsAvances/Messagerie'
import Geolocalisation from '@/pages/OutilsAvances/Geolocalisation'
import RapportsTerrain from '@/pages/RapportsTerrain'
import CloudStorage from '@/pages/CloudStorage'
import ImportData from '@/pages/ImportData'

// Options A-D: Nouvelles fonctionnalités
import MaterialDatabase from '@/pages/MaterialDatabase'
import MobileRapportTerrain from '@/pages/MobileRapportTerrain'

// ============================================================================
// NOUVEAUX MODULES PHASES 1-4
// ============================================================================
import BottinRessources from '@/pages/BottinRessources'
import MateriauxPrix from '@/pages/MateriauxPrix'
import SoumissionBuilder from '@/pages/SoumissionBuilder'
import AppelsOffres from '@/pages/AppelsOffres'

// ============================================================================
// MODULE GESTION DE PROJET (23 pages)
// ============================================================================
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

// ============================================================================
// MODULE ESTIMATION (Base de données ProEst)
// ============================================================================
import CostDatabase from '@/pages/CostDatabase'
import EstimationPage from '@/pages/EstimationPage'

// ============================================================================
// PROJETS PAR PHASE (listes filtrées)
// ============================================================================
import { ProjetsConception, ProjetsEstimation, ProjetsGestion } from '@/pages/ProjetsParPhase'

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
    <Router>
      <Routes>
        {/* Login public */}
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/dashboard" />} />

        {/* Routes protégées avec Layout */}
        <Route path="/" element={session ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Navigate to="/dashboard" />} />
          
          {/* ============ DASHBOARD ============ */}
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* ============ PROJETS - LISTE ============ */}
          <Route path="projects" element={<Projects />} />
          <Route path="project/new" element={<ProjectDetails />} />
          <Route path="project/:projectId" element={<ProjectDetails />} />
          <Route path="takeoff/:projectId" element={<TakeoffV3 />} />
          <Route path="bid-proposal/:projectId" element={<BidProposalV2 />} />

          {/* ============ PROJETS PAR PHASE (Sidebar) ============ */}
          <Route path="projets/conception" element={<ProjetsConception />} />
          <Route path="projets/estimation" element={<ProjetsEstimation />} />
          <Route path="projets/gestion" element={<ProjetsGestion />} />
          <Route path="projets/appels-offres" element={<AppelOffres />} />
          
          {/* Legacy routes pour compatibilité */}
          <Route path="conception" element={<Conception />} />
          <Route path="estimation" element={<Estimation />} />
          <Route path="gestion" element={<Gestion />} />

          {/* ============ MODULE GESTION PROJET (23 routes) ============ */}
          {/* Finances */}
          <Route path="project/:projectId/budget" element={<ProjectBudget />} />
          <Route path="project/:projectId/couts" element={<ProjectCouts />} />
          <Route path="project/:projectId/change-orders" element={<ProjectChangeOrders />} />
          <Route path="project/:projectId/previsions" element={<ProjectPrevisions />} />
          
          {/* Documents */}
          <Route path="project/:projectId/plans" element={<ProjectPlans />} />
          <Route path="project/:projectId/specifications" element={<ProjectSpecifications />} />
          <Route path="project/:projectId/documents" element={<ProjectDocuments />} />
          <Route path="project/:projectId/photos" element={<ProjectPhotos />} />
          
          {/* Suivi */}
          <Route path="project/:projectId/echeancier" element={<ProjectEcheancier />} />
          <Route path="project/:projectId/journal" element={<ProjectJournal />} />
          <Route path="project/:projectId/problemes" element={<ProjectProblemes />} />
          
          {/* Communication */}
          <Route path="project/:projectId/rfi" element={<ProjectRFI />} />
          <Route path="project/:projectId/soumissions-st" element={<ProjectSoumissionsST />} />
          <Route path="project/:projectId/correspondance" element={<ProjectCorrespondance />} />
          <Route path="project/:projectId/reunions" element={<ProjectReunions />} />
          <Route path="project/:projectId/formulaires" element={<ProjectFormulaires />} />
          
          {/* Ressources */}
          <Route path="project/:projectId/equipe" element={<ProjectEquipe />} />
          <Route path="project/:projectId/equipements" element={<ProjectEquipements />} />
          <Route path="project/:projectId/materiaux" element={<ProjectMateriaux />} />
          
          {/* Rapports & Config */}
          <Route path="project/:projectId/rapports" element={<ProjectRapports />} />
          <Route path="project/:projectId/parametres" element={<ProjectParametres />} />

          {/* ============ MODULE ESTIMATION (ProEst) ============ */}
          <Route path="database" element={<CostDatabase />} />
          <Route path="estimation/:projectId" element={<EstimationPage />} />
          
          {/* ============ FACTURES ============ */}
          <Route path="factures" element={<Factures />} />
          
          {/* ============ ENTREPRENEURS ============ */}
          <Route path="entrepreneurs/rbq" element={<RBQ />} />
          <Route path="entrepreneurs/personnel" element={<Personnel />} />
          <Route path="clients" element={<Clients />} />

          {/* ============ APPELS D'OFFRE (plateformes) ============ */}
          <Route path="appels-offre/seao" element={<SEAO />} />
          <Route path="appels-offre/merx" element={<MERX />} />
          <Route path="appels-offre/buy-gc" element={<BuyGC />} />
          <Route path="appels-offre/bonfire" element={<Bonfire />} />

          {/* ============ SOUMISSIONS V2 ============ */}
          <Route path="soumissions" element={<SoumissionBuilder />} />
          <Route path="soumissions-v2" element={<SoumissionBuilder />} />
          <Route path="soumission/new" element={<SoumissionBuilder />} />
          <Route path="soumission/:id" element={<SoumissionBuilder />} />

          {/* ============ RESSOURCES ============ */}
          <Route path="ressources/code-navigator" element={<CodeNavigator />} />
          <Route path="ressources/ccq-navigator" element={<CCQNavigator />} />
          <Route path="ressources/documents-acc-ccdc" element={<DocumentsACCCCDC />} />
          <Route path="ressources/associations" element={<Associations />} />

          {/* ============ NOUVEAUX MODULES PHASES 1-4 ============ */}
          <Route path="bottin" element={<BottinRessources />} />
          <Route path="bottin-ressources" element={<BottinRessources />} />
          <Route path="materiaux" element={<MateriauxPrix />} />
          <Route path="materiaux-prix" element={<MateriauxPrix />} />
          <Route path="materials" element={<MaterialDatabase />} />
          <Route path="appels-offres" element={<AppelsOffres />} />

          {/* ============ OUTILS AVANCÉS ============ */}
          <Route path="outils-avances/application-mobile" element={<ApplicationMobile />} />
          <Route path="outils-avances/messagerie" element={<Messagerie />} />
          <Route path="outils-avances/geolocalisation" element={<Geolocalisation />} />
          <Route path="rapports-terrain" element={<RapportsTerrain />} />
          <Route path="cloud-storage" element={<CloudStorage />} />
          <Route path="import-data" element={<ImportData />} />

          {/* ============ ANALYTICS & SETTINGS ============ */}
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />

          {/* Legacy redirects */}
          <Route path="material-prices" element={<Navigate to="/materiaux" />} />
          <Route path="pricing" element={<Settings />} />
        </Route>

        {/* Routes mobiles hors layout */}
        <Route path="/mobile/rapport/:projectId" element={session ? <MobileRapportTerrain /> : <Navigate to="/login" />} />
        <Route path="/mobile/rapport/:projectId/:rapportId" element={session ? <MobileRapportTerrain /> : <Navigate to="/login" />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  )
}

export default App
