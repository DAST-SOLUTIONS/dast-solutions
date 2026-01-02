/**
 * DAST Solutions - Routes à AJOUTER dans App.tsx
 * 
 * INSTRUCTIONS:
 * 1. Ajouter les imports en haut du fichier App.tsx
 * 2. Ajouter les routes dans le <Routes> existant
 */

// ============================================================================
// IMPORTS À AJOUTER (en haut de App.tsx)
// ============================================================================

/*
// Module Gestion de Projet
import {
  GestionProjetLayout,
  GestionBudget,
  GestionChangeOrders,
  GestionJournal,
  GestionCouts,
  GestionPrevisions,
  GestionPlans,
  GestionDocuments,
  GestionEcheancier,
  GestionPhotos,
  GestionProblemes,
  GestionRFI,
  GestionSoumissionsFournisseurs,
  GestionRapports,
  GestionEquipe
} from '@/pages/Gestion'
*/

// ============================================================================
// ROUTES À AJOUTER (dans <Routes>)
// ============================================================================

/*
{/* Module Gestion de Projet (style ACC) *}
<Route path="/gestion/:projectId" element={<GestionProjetLayout />}>
  <Route index element={null} /> {/* La page d'accueil est gérée dans le layout *}
  <Route path="budget" element={<GestionBudget />} />
  <Route path="couts" element={<GestionCouts />} />
  <Route path="change-orders" element={<GestionChangeOrders />} />
  <Route path="previsions" element={<GestionPrevisions />} />
  <Route path="plans" element={<GestionPlans />} />
  <Route path="documents" element={<GestionDocuments />} />
  <Route path="echeancier" element={<GestionEcheancier />} />
  <Route path="photos" element={<GestionPhotos />} />
  <Route path="problemes" element={<GestionProblemes />} />
  <Route path="rfi" element={<GestionRFI />} />
  <Route path="soumissions-fournisseurs" element={<GestionSoumissionsFournisseurs />} />
  <Route path="journal" element={<GestionJournal />} />
  <Route path="rapports" element={<GestionRapports />} />
  <Route path="equipe" element={<GestionEquipe />} />
</Route>
*/

// ============================================================================
// EXEMPLE COMPLET DE App.tsx
// ============================================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Pages existantes (garder vos imports actuels)
// import Dashboard from '@/pages/Dashboard'
// import Projects from '@/pages/Projects'
// import ProjectDetails from '@/pages/ProjectDetails'
// ... etc

// Module Gestion (NOUVEAU)
import {
  GestionProjetLayout,
  GestionBudget,
  GestionChangeOrders,
  GestionJournal,
  GestionCouts,
  GestionPrevisions,
  GestionPlans,
  GestionDocuments,
  GestionEcheancier,
  GestionPhotos,
  GestionProblemes,
  GestionRFI,
  GestionSoumissionsFournisseurs,
  GestionRapports,
  GestionEquipe
} from '@/pages/Gestion'

export default function App() {
  // ... votre code existant ...

  return (
    <BrowserRouter>
      <Routes>
        {/* Vos routes existantes */}
        {/* ... */}

        {/* NOUVELLES ROUTES - Module Gestion de Projet */}
        <Route path="/gestion/:projectId" element={<GestionProjetLayout />}>
          <Route path="budget" element={<GestionBudget />} />
          <Route path="couts" element={<GestionCouts />} />
          <Route path="change-orders" element={<GestionChangeOrders />} />
          <Route path="previsions" element={<GestionPrevisions />} />
          <Route path="plans" element={<GestionPlans />} />
          <Route path="documents" element={<GestionDocuments />} />
          <Route path="echeancier" element={<GestionEcheancier />} />
          <Route path="photos" element={<GestionPhotos />} />
          <Route path="problemes" element={<GestionProblemes />} />
          <Route path="rfi" element={<GestionRFI />} />
          <Route path="soumissions-fournisseurs" element={<GestionSoumissionsFournisseurs />} />
          <Route path="journal" element={<GestionJournal />} />
          <Route path="rapports" element={<GestionRapports />} />
          <Route path="equipe" element={<GestionEquipe />} />
        </Route>

      </Routes>
    </BrowserRouter>
  )
}
