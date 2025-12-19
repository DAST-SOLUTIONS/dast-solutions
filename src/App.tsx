import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Layout from '@/components/Layout'
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
// Options A-D: Nouvelles fonctionnalités
import MaterialDatabase from '@/pages/MaterialDatabase'
import SoumissionBuilder from '@/pages/SoumissionBuilder'
import MobileRapportTerrain from '@/pages/MobileRapportTerrain'

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
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/" element={session ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="project/new" element={<ProjectDetails />} />
          <Route path="project/:projectId" element={<ProjectDetails />} />
          <Route path="takeoff/:projectId" element={<TakeoffV2 />} />
          <Route path="bid-proposal/:projectId" element={<BidProposalV2 />} />
          <Route path="clients" element={<Clients />} />
          <Route path="factures" element={<Factures />} />
          <Route path="material-prices" element={<MaterialPrices />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="rapports-terrain" element={<RapportsTerrain />} />
          {/* Option A: Base de données matériaux */}
          <Route path="materials" element={<MaterialDatabase />} />
          {/* Option C: Constructeur de soumissions */}
          <Route path="soumission/new" element={<SoumissionBuilder />} />
          <Route path="soumission/:id" element={<SoumissionBuilder />} />
        </Route>
        {/* Option D: PWA Mobile Rapports (layout séparé pour mobile) */}
        <Route path="/mobile/rapport/:projectId" element={session ? <MobileRapportTerrain /> : <Navigate to="/login" />} />
        <Route path="/mobile/rapport/:projectId/:rapportId" element={session ? <MobileRapportTerrain /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  )
}

export default App