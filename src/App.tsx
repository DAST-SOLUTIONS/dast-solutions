/**
 * DAST Solutions - Application Principale
 * Routes et configuration complètes
 */
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { DashboardConfigProvider } from '@/contexts/DashboardConfigContext';

// Layouts
import Layout from '@/components/Layout';
import PrivateLayout from '@/components/PrivateLayout';

// Pages Auth
import Login from '@/pages/Login';

// Pages Dashboard
import DashboardV2 from '@/pages/DashboardV2';

// Pages Projets
import Projects from '@/pages/Projects';
import ProjectDetails from '@/pages/ProjectDetails';
import ProjectCosts from '@/pages/ProjectCosts';

// ============================================================================
// NOUVELLES PAGES - PHASES 1-4
// ============================================================================
import TakeoffViewerAdvanced from '@/components/Takeoff/TakeoffViewerAdvanced';
import EstimationAdvanced from '@/pages/EstimationAdvanced';
import AITakeoff from '@/components/AITakeoff';

// Pages Soumissions
import SoumissionsIndex from '@/pages/Soumissions/index';

// Pages Clients & Factures
import Clients from '@/pages/Clients';
import Factures from '@/pages/Factures';

// Pages Appels d'offres
import SEAO from '@/pages/AppelsOffre/SEAO';
import MERX from '@/pages/AppelsOffre/MERX';
import Bonfire from '@/pages/AppelsOffre/Bonfire';
import BuyGC from '@/pages/AppelsOffre/BuyGC';

// Pages Ressources
import CCQNavigator from '@/pages/Ressources/CCQNavigator';
import CodeNavigator from '@/pages/Ressources/CodeNavigator';
import Associations from '@/pages/Ressources/Associations';
import DocumentsACCCCDC from '@/pages/Ressources/DocumentsACCCCDC';

// Pages Entrepreneurs
import RBQ from '@/pages/Entrepreneurs/RBQ';
import Personnel from '@/pages/Entrepreneurs/Personnel';

// Pages Outils Avancés
import Geolocalisation from '@/pages/OutilsAvances/Geolocalisation';
import Messagerie from '@/pages/OutilsAvances/Messagerie';
import ApplicationMobile from '@/pages/OutilsAvances/ApplicationMobile';

// Pages Autres
import Settings from '@/pages/Settings';
import Analytics from '@/pages/Analytics';
import CloudStorage from '@/pages/CloudStorage';
import RapportsTerrain from '@/pages/RapportsTerrain';
import MaterialPrices from '@/pages/MaterialPrices';
import ImportData from '@/pages/ImportData';
import Pricing from '@/pages/Pricing';

// Pages Projets sous-menu
import Conception from '@/pages/Projets/Conception';
import AppelOffres from '@/pages/Projets/AppelOffres';
import Estimation from '@/pages/Projets/Estimation';
import Gestion from '@/pages/Projets/Gestion';

function App() {
  return (
    <ThemeProvider>
      <DashboardConfigProvider>
        <BrowserRouter>
          <Routes>
            {/* ============================================================ */}
            {/* PUBLIC ROUTES */}
            {/* ============================================================ */}
            <Route path="/login" element={<Login />} />
            
            {/* ============================================================ */}
            {/* PROTECTED ROUTES */}
            {/* ============================================================ */}
            <Route element={<PrivateLayout><Outlet /></PrivateLayout>}>
              <Route element={<Layout><Outlet /></Layout>}>
                {/* ======================================================== */}
                {/* DASHBOARD */}
                {/* ======================================================== */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardV2 />} />
                
                {/* ======================================================== */}
                {/* PROJETS */}
                {/* ======================================================== */}
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:id" element={<ProjectDetails />} />
                <Route path="/projects/:id/costs" element={<ProjectCosts />} />
                <Route path="/projets/conception" element={<Conception />} />
                <Route path="/projets/appel-offres" element={<AppelOffres />} />
                <Route path="/projets/estimation" element={<Estimation />} />
                <Route path="/projets/gestion" element={<Gestion />} />
                
                {/* ======================================================== */}
                {/* TAKEOFF & ESTIMATION AVANCÉS (PHASES 1-4) */}
                {/* ======================================================== */}
                <Route path="/takeoff" element={<TakeoffViewerAdvanced />} />
                <Route path="/takeoff/:projectId" element={<TakeoffViewerAdvanced />} />
                <Route path="/ai-takeoff" element={<AITakeoff />} />
                <Route path="/ai-takeoff/:projectId" element={<AITakeoff />} />
                <Route path="/estimation" element={<EstimationAdvanced />} />
                <Route path="/estimation/:projectId" element={<EstimationAdvanced />} />
                
                {/* ======================================================== */}
                {/* SOUMISSIONS */}
                {/* ======================================================== */}
                <Route path="/soumissions" element={<SoumissionsIndex />} />
                <Route path="/soumissions/nouvelle" element={<SoumissionsIndex />} />
                <Route path="/soumissions/:id" element={<SoumissionsIndex />} />
                
                {/* ======================================================== */}
                {/* CLIENTS & FACTURES */}
                {/* ======================================================== */}
                <Route path="/clients" element={<Clients />} />
                <Route path="/factures" element={<Factures />} />
                
                {/* ======================================================== */}
                {/* APPELS D'OFFRES */}
                {/* ======================================================== */}
                <Route path="/appels-offres/seao" element={<SEAO />} />
                <Route path="/appels-offres/merx" element={<MERX />} />
                <Route path="/appels-offres/bonfire" element={<Bonfire />} />
                <Route path="/appels-offres/buygc" element={<BuyGC />} />
                
                {/* ======================================================== */}
                {/* RESSOURCES */}
                {/* ======================================================== */}
                <Route path="/ressources/ccq" element={<CCQNavigator />} />
                <Route path="/ressources/codes" element={<CodeNavigator />} />
                <Route path="/ressources/associations" element={<Associations />} />
                <Route path="/ressources/documents-ccdc" element={<DocumentsACCCCDC />} />
                
                {/* ======================================================== */}
                {/* ENTREPRENEURS */}
                {/* ======================================================== */}
                <Route path="/entrepreneurs/rbq" element={<RBQ />} />
                <Route path="/entrepreneurs/personnel" element={<Personnel />} />
                
                {/* ======================================================== */}
                {/* OUTILS AVANCÉS */}
                {/* ======================================================== */}
                <Route path="/outils/geolocalisation" element={<Geolocalisation />} />
                <Route path="/outils/messagerie" element={<Messagerie />} />
                <Route path="/outils/mobile" element={<ApplicationMobile />} />
                
                {/* ======================================================== */}
                {/* AUTRES */}
                {/* ======================================================== */}
                <Route path="/settings" element={<Settings />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/cloud-storage" element={<CloudStorage />} />
                <Route path="/rapports-terrain" element={<RapportsTerrain />} />
                <Route path="/material-prices" element={<MaterialPrices />} />
                <Route path="/import-data" element={<ImportData />} />
                <Route path="/pricing" element={<Pricing />} />
              </Route>
            </Route>
            
            {/* ============================================================ */}
            {/* FALLBACK - REDIRECT TO DASHBOARD */}
            {/* ============================================================ */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </DashboardConfigProvider>
    </ThemeProvider>
  );
}

export default App;
