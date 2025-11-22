import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

// Pages principales - IMPORTS NOMMÉS
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { Pricing } from '@/pages/Pricing'
import { ProjectDetails } from '@/pages/ProjectDetails'
import ProjectCosts from '@/pages/ProjectCosts'
import { Takeoff } from '@/pages/Takeoff'
import { Settings } from '@/pages/Settings'
import CloudStorage from '@/pages/CloudStorage'
import BidProposal from '@/pages/BidProposal'

import PrivateLayout from '@/components/PrivateLayout'
import { ToastProvider } from '@/components/ToastProvider'
import './index.css'

// Loading component
const LoadingPage = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Chargement...</p>
    </div>
  </div>
)

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingPage />
  }

  return user ? <>{children}</> : <Navigate to="/login" />
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/login" element={<Login />} />
          <Route path="/pricing" element={<Pricing />} />

          {/* PRIVATE ROUTES */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <PrivateLayout>
                  <Dashboard />
                </PrivateLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/project/:projectId"
            element={
              <PrivateRoute>
                <PrivateLayout>
                  <ProjectDetails />
                </PrivateLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/project/:projectId/costs"
            element={
              <PrivateRoute>
                <PrivateLayout>
                  <ProjectCosts />
                </PrivateLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/takeoff/:projectId"
            element={
              <PrivateRoute>
                <PrivateLayout>
                  <Takeoff />
                </PrivateLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/cloud-storage/:projectId"
            element={
              <PrivateRoute>
                <PrivateLayout>
                  <CloudStorage />
                </PrivateLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/bid-proposal/:projectId"
            element={
              <PrivateRoute>
                <PrivateLayout>
                  <BidProposal />
                </PrivateLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <PrivateLayout>
                  <Settings />
                </PrivateLayout>
              </PrivateRoute>
            }
          />

          {/* CATCH ALL */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}