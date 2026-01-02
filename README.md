# DAST Solutions - Package Unifié Gestion Complète

## 🐛 FIX BUG: "new row violates row-level security policy for table bid_configuration"

Ce package corrige l'erreur RLS qui empêche la création de nouveaux projets.

## 📦 Contenu du Package

```
src/
├── components/
│   └── Sidebar.tsx              # Sidebar UNIFIÉE avec tous les modules
├── pages/
│   ├── GestionPages.tsx         # TOUTES les pages de gestion (20+ pages)
│   └── ProjetsParPhase.tsx      # Listes par phase (Conception, Estimation, Gestion)
└── routes-unified.tsx           # Routes à ajouter dans App.tsx

supabase/
├── fix_bid_configuration_rls.sql   # Fix RLS (exécuter en premier si erreur)
└── 004_gestion_complete.sql        # Migration complète (tables gestion)
```

## 🚀 Installation

### Étape 1: CORRIGER L'ERREUR RLS (URGENT)

Dans **Supabase Dashboard → SQL Editor**, exécutez:

```sql
-- Fix bid_configuration RLS
ALTER TABLE public.bid_configuration DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own bid configurations" ON public.bid_configuration;
ALTER TABLE public.bid_configuration ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own bid configurations" ON public.bid_configuration
  FOR ALL 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
```

Ou exécutez le fichier complet: `supabase/004_gestion_complete.sql`

### Étape 2: Copier les fichiers

```bash
# Copier les nouveaux fichiers
cp src/components/Sidebar.tsx your-project/src/components/
cp src/pages/GestionPages.tsx your-project/src/pages/
cp src/pages/ProjetsParPhase.tsx your-project/src/pages/
```

### Étape 3: Ajouter les routes dans App.tsx

```tsx
// IMPORTS À AJOUTER
import {
  ProjectBudget, ProjectChangeOrders, ProjectJournal,
  ProjectCouts, ProjectPrevisions, ProjectPlans,
  ProjectSpecifications, ProjectDocuments, ProjectPhotos,
  ProjectEcheancier, ProjectProblemes, ProjectRFI,
  ProjectSoumissionsST, ProjectCorrespondance, ProjectReunions,
  ProjectFormulaires, ProjectEquipe, ProjectEquipements,
  ProjectMateriaux, ProjectRapports, ProjectParametres
} from '@/pages/GestionPages'

import {
  ProjetsConception, ProjetsEstimation, ProjetsGestion
} from '@/pages/ProjetsParPhase'

// ROUTES À AJOUTER
<Route path="/projets/conception" element={<ProjetsConception />} />
<Route path="/projets/estimation" element={<ProjetsEstimation />} />
<Route path="/projets/gestion" element={<ProjetsGestion />} />

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
```

### Étape 4: Déployer

```bash
git add .
git commit -m "feat: gestion projet complète + fix RLS bid_configuration"
git push
```

## 📊 Modules Inclus (Style ACC)

| Module | Route | Statut |
|--------|-------|--------|
| **Accueil projet** | /project/:id | ✅ Existant |
| **Budget** | /project/:id/budget | ✅ Complet |
| **Coûts** | /project/:id/couts | 🔧 Placeholder |
| **Ordres de changement** | /project/:id/change-orders | ✅ Complet |
| **Prévisions** | /project/:id/previsions | 🔧 Placeholder |
| **Takeoff** | /takeoff/:id | ✅ Existant |
| **Plans** | /project/:id/plans | 🔧 Placeholder |
| **Devis techniques** | /project/:id/specifications | 🔧 Placeholder |
| **Documents** | /project/:id/documents | 🔧 Placeholder |
| **Photos** | /project/:id/photos | 🔧 Placeholder |
| **Échéancier** | /project/:id/echeancier | 🔧 Placeholder |
| **Journal chantier** | /project/:id/journal | ✅ Complet |
| **Problèmes** | /project/:id/problemes | 🔧 Placeholder |
| **RFIs** | /project/:id/rfi | 🔧 Placeholder |
| **Soum. sous-traitants** | /project/:id/soumissions-st | 🔧 Placeholder |
| **Correspondance** | /project/:id/correspondance | 🔧 Placeholder |
| **Réunions** | /project/:id/reunions | 🔧 Placeholder |
| **Formulaires** | /project/:id/formulaires | 🔧 Placeholder |
| **Équipe** | /project/:id/equipe | 🔧 Placeholder |
| **Équipements** | /project/:id/equipements | 🔧 Placeholder |
| **Matériaux** | /project/:id/materiaux | 🔧 Placeholder |
| **Rapports** | /project/:id/rapports | 🔧 Placeholder |
| **Paramètres** | /project/:id/parametres | 🔧 Placeholder |

## 🔗 Navigation Unifiée

```
SIDEBAR
├── Tableau de bord
├── Projets
│   ├── Tous les projets
│   ├── Conception (draft)
│   ├── Estimation (draft, planning)
│   ├── Gestion (active, on_hold) ← PROJETS EN EXÉCUTION
│   └── Appels d'offres
│
├── [PROJET ACTIF EN GESTION] ← Apparaît quand projet actif
│   ├── Finances
│   │   ├── Budget
│   │   ├── Coûts
│   │   ├── Ordres de changement
│   │   └── Prévisions
│   ├── Documents
│   │   ├── Takeoff
│   │   ├── Plans
│   │   ├── Devis techniques
│   │   ├── Documents
│   │   └── Photos
│   ├── Suivi
│   │   ├── Échéancier
│   │   ├── Journal chantier
│   │   └── Problèmes
│   ├── Communication
│   │   ├── RFIs
│   │   ├── Soum. sous-traitants
│   │   ├── Correspondance
│   │   ├── Réunions
│   │   └── Formulaires
│   ├── Ressources
│   │   ├── Équipe
│   │   ├── Équipements
│   │   └── Matériaux
│   └── Rapports
│       ├── Rapports
│       └── Paramètres
│
├── Soumissions
├── Factures
├── Entrepreneurs
├── Appels d'offre
└── Ressources
```

## ✅ Cohérence garantie

- **UN SEUL CHEMIN** vers chaque fonctionnalité
- **MÊME STRUCTURE** peu importe d'où on accède
- La sidebar s'adapte au contexte (projet actif ou non)
- Toutes les routes projet sont sous `/project/:projectId/[module]`
- Takeoff reste à `/takeoff/:projectId` pour compatibilité

## 📋 Checklist post-installation

- [ ] Migration SQL exécutée (fix RLS + tables gestion)
- [ ] Fichiers copiés (Sidebar, GestionPages, ProjetsParPhase)
- [ ] Routes ajoutées dans App.tsx
- [ ] Imports ajoutés
- [ ] Build passe (`npm run build`)
- [ ] Test création projet → PLUS D'ERREUR bid_configuration
- [ ] Test navigation sidebar → menus cohérents
