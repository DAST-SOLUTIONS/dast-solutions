import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy load all pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const Takeoff = lazy(() => import('./pages/Takeoff'));
const TakeoffViewer = lazy(() => import('./pages/TakeoffViewer'));
const Estimating = lazy(() => import('./pages/Estimating'));
const Soumissions = lazy(() => import('./pages/Soumissions'));
const Documents = lazy(() => import('./pages/Documents'));
const Settings = lazy(() => import('./pages/Settings'));

// Phase 2 Modules (1-9)
const ReportCenter = lazy(() => import('./pages/Reports/ReportCenter'));
const IntegrationCenter = lazy(() => import('./pages/Integrations/IntegrationCenter'));
const PlanningModule = lazy(() => import('./pages/Planning/PlanningModule'));
const FournisseursModule = lazy(() => import('./pages/Fournisseurs/FournisseursModule'));

// Phase 2 Modules (10-19)
const TeamsModule = lazy(() => import('./pages/Teams/TeamsModule'));
const CRMModule = lazy(() => import('./pages/CRM/CRMModule'));
const InvoicingModule = lazy(() => import('./pages/Invoicing/InvoicingModule'));
const FieldReportsModule = lazy(() => import('./pages/FieldReports/FieldReportsModule'));
const MessagingModule = lazy(() => import('./pages/Messaging/MessagingModule'));
const GeolocationModule = lazy(() => import('./pages/Geolocation/GeolocationModule'));

// Additional Modules from combined file
const AdditionalModules = lazy(() => import('./pages/Modules/AdditionalModules'));

// Phase 3 Modules (20-29) - NOUVEAUX
const CCQModule = lazy(() => import('./pages/CCQ/CCQModule'));
const CalendrierModule = lazy(() => import('./pages/Calendrier/CalendrierModule'));
const PortailClientModule = lazy(() => import('./pages/PortailClient/PortailClientModule'));
const BonsCommandeModule = lazy(() => import('./pages/BonsCommandeAvances/BonsCommandeModule'));
const DashboardBIModule = lazy(() => import('./pages/DashboardBI/DashboardBIModule'));
const RFIModule = lazy(() => import('./pages/RFI/RFIModule'));
const SEAOModule = lazy(() => import('./pages/SEAO/SEAOModule'));
const ContratsModule = lazy(() => import('./pages/Contrats/ContratsModule'));
const InspectionsModule = lazy(() => import('./pages/Inspections/InspectionsModule'));
const MultiProjetsModule = lazy(() => import('./pages/MultiProjets/MultiProjetsModule'));

// Phase 4 Modules IA (30-35) - NOUVEAUX
const AITakeoffModule = lazy(() => import('./pages/AITakeoff/AITakeoffModule'));
const AIEstimationModule = lazy(() => import('./pages/AIEstimation/AIEstimationModule'));
const OCRDocumentsModule = lazy(() => import('./pages/OCRDocuments/OCRDocumentsModule'));
const AssistantIAModule = lazy(() => import('./pages/AssistantIA/AssistantIAModule'));
const PredictionCoutsModule = lazy(() => import('./pages/PredictionCouts/PredictionCoutsModule'));
const ComparaisonSoumissionsModule = lazy(() => import('./pages/ComparaisonSoumissions/ComparaisonSoumissionsModule'));

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Wrapper components for AdditionalModules exports
const PWAModuleWrapper: React.FC = () => {
  const [Component, setComponent] = React.useState<React.ComponentType | null>(null);
  
  React.useEffect(() => {
    import('./pages/Modules/AdditionalModules').then(mod => {
      setComponent(() => mod.PWAModule);
    });
  }, []);
  
  if (!Component) return <LoadingSpinner />;
  return <Component />;
};

const NotificationsModuleWrapper: React.FC = () => {
  const [Component, setComponent] = React.useState<React.ComponentType | null>(null);
  
  React.useEffect(() => {
    import('./pages/Modules/AdditionalModules').then(mod => {
      setComponent(() => mod.NotificationsModule);
    });
  }, []);
  
  if (!Component) return <LoadingSpinner />;
  return <Component />;
};

const TakeoffSyncModuleWrapper: React.FC = () => {
  const [Component, setComponent] = React.useState<React.ComponentType | null>(null);
  
  React.useEffect(() => {
    import('./pages/Modules/AdditionalModules').then(mod => {
      setComponent(() => mod.TakeoffSyncModule);
    });
  }, []);
  
  if (!Component) return <LoadingSpinner />;
  return <Component />;
};

const AIRecognitionModuleWrapper: React.FC = () => {
  const [Component, setComponent] = React.useState<React.ComponentType | null>(null);
  
  React.useEffect(() => {
    import('./pages/Modules/AdditionalModules').then(mod => {
      setComponent(() => mod.AIRecognitionModule);
    });
  }, []);
  
  if (!Component) return <LoadingSpinner />;
  return <Component />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                      {/* Core Routes */}
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/projects" element={<Projects />} />
                      <Route path="/projects/:id" element={<ProjectDetail />} />
                      <Route path="/takeoff" element={<Takeoff />} />
                      <Route path="/takeoff/:id" element={<TakeoffViewer />} />
                      <Route path="/estimating" element={<Estimating />} />
                      <Route path="/soumissions" element={<Soumissions />} />
                      <Route path="/documents" element={<Documents />} />
                      <Route path="/settings" element={<Settings />} />
                      
                      {/* Phase 2 - Améliorations 1-9 */}
                      <Route path="/reports" element={<ReportCenter />} />
                      <Route path="/integrations" element={<IntegrationCenter />} />
                      <Route path="/planning" element={<PlanningModule />} />
                      <Route path="/fournisseurs" element={<FournisseursModule />} />
                      
                      {/* Phase 2 - Améliorations 10-19 */}
                      <Route path="/teams" element={<TeamsModule />} />
                      <Route path="/crm" element={<CRMModule />} />
                      <Route path="/invoicing" element={<InvoicingModule />} />
                      <Route path="/field-reports" element={<FieldReportsModule />} />
                      <Route path="/messaging" element={<MessagingModule />} />
                      <Route path="/geolocation" element={<GeolocationModule />} />
                      <Route path="/pwa" element={<PWAModuleWrapper />} />
                      <Route path="/notifications" element={<NotificationsModuleWrapper />} />
                      <Route path="/takeoff-sync" element={<TakeoffSyncModuleWrapper />} />
                      <Route path="/ai-recognition" element={<AIRecognitionModuleWrapper />} />
                      
                      {/* Phase 3 - Améliorations 20-29 NOUVEAUX */}
                      <Route path="/ccq" element={<CCQModule />} />
                      <Route path="/calendrier" element={<CalendrierModule />} />
                      <Route path="/portail-client" element={<PortailClientModule />} />
                      <Route path="/bons-commande" element={<BonsCommandeModule />} />
                      <Route path="/dashboard-bi" element={<DashboardBIModule />} />
                      <Route path="/rfi" element={<RFIModule />} />
                      <Route path="/seao" element={<SEAOModule />} />
                      <Route path="/contrats" element={<ContratsModule />} />
                      <Route path="/inspections" element={<InspectionsModule />} />
                      <Route path="/multi-projets" element={<MultiProjetsModule />} />
                      
                      {/* Phase 4 - Modules IA 30-35 NOUVEAUX */}
                      <Route path="/ai-takeoff" element={<AITakeoffModule />} />
                      <Route path="/ai-estimation" element={<AIEstimationModule />} />
                      <Route path="/ocr-documents" element={<OCRDocumentsModule />} />
                      <Route path="/assistant-ia" element={<AssistantIAModule />} />
                      <Route path="/prediction-couts" element={<PredictionCoutsModule />} />
                      <Route path="/comparaison-soumissions" element={<ComparaisonSoumissionsModule />} />
                      
                      {/* Catch all */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
