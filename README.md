# DAST Solutions - Module Gestion Complet

## 📦 Contenu du Package

Ce package ajoute un module de gestion de projet complet inspiré d'Autodesk Construction Cloud (ACC).

### Fichiers inclus:

```
src/
├── components/
│   └── Sidebar.tsx                    # Sidebar avec projets par phase
├── pages/
│   └── Gestion/
│       ├── index.ts                   # Exports
│       ├── GestionProjetLayout.tsx    # Layout principal (style ACC)
│       ├── Budget.tsx                 # Gestion budget par division CSC
│       ├── ChangeOrders.tsx           # Ordres de changement
│       ├── Journal.tsx                # Journal de chantier
│       └── PlaceholderPages.tsx       # Pages à développer
├── routes-gestion.tsx                 # Routes à ajouter dans App.tsx
supabase/
└── migrations/
    └── 003_gestion_tables.sql         # Tables pour gestion
```

## 🚀 Installation

### Étape 1: Exécuter la migration SQL

Dans **Supabase Dashboard → SQL Editor**, exécutez le contenu de:
```
supabase/migrations/003_gestion_tables.sql
```

Cela crée les tables:
- `budget_lines` - Lignes de budget par division CSC
- `change_orders` - Ordres de changement
- `daily_reports` - Rapports journaliers de chantier
- `rfis` - Demandes d'information
- `project_issues` - Problèmes/issues
- `project_photos` - Photos de projet

### Étape 2: Copier les fichiers

```bash
# Copier les nouveaux fichiers
cp -r src/components/Sidebar.tsx your-project/src/components/
cp -r src/pages/Gestion your-project/src/pages/
```

### Étape 3: Ajouter les routes dans App.tsx

Ajoutez les imports:
```tsx
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
```

Ajoutez les routes:
```tsx
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
```

### Étape 4: Déployer

```bash
git add .
git commit -m "feat: module gestion projet complet (style ACC)"
git push
```

## 📊 Fonctionnalités

### Module Gestion (inspiré ACC Build)

| Page | Statut | Description |
|------|--------|-------------|
| Accueil | ✅ Complète | Dashboard projet avec météo, progression, liens rapides |
| Budget | ✅ Complète | Budget par division CSC MasterFormat |
| Ordres de changement | ✅ Complète | CO avec workflow d'approbation |
| Journal chantier | ✅ Complète | Rapports quotidiens avec météo |
| Coûts | 🔧 Placeholder | Suivi des coûts réels |
| Prévisions | 🔧 Placeholder | Projections fin de projet |
| Plans | 🔧 Placeholder | Gestion des plans |
| Documents | 🔧 Placeholder | GED projet |
| Échéancier | 🔧 Placeholder | Gantt |
| Photos | 🔧 Placeholder | Galerie photos |
| Problèmes | 🔧 Placeholder | Suivi des issues |
| RFIs | 🔧 Placeholder | Demandes d'information |
| Soum. fournisseurs | 🔧 Placeholder | Soumissions sous-traitants |
| Rapports | 🔧 Placeholder | Génération de rapports |
| Équipe | 🔧 Placeholder | Gestion équipe |

### Sidebar améliorée

- **Projets filtrés par phase**:
  - Estimation: projets en `draft`, `planning`
  - Gestion: projets en `active`, `on_hold`
  
- **Menu contextuel**: Quand un projet actif est ouvert, le menu de gestion apparaît dans la sidebar

## 🔗 Flux Estimation ↔ Gestion

```
ESTIMATION                      GESTION
┌──────────────────┐           ┌──────────────────┐
│ • Takeoff        │           │ • Budget         │
│ • Soumission     │ ────────► │ • Suivi coûts    │
│ • Budget initial │  contrat  │ • Change Orders  │
└──────────────────┘  signé    └──────────────────┘
                                       │
                                       ▼
                               ┌──────────────────┐
                               │ ORDRE DE         │
                               │ CHANGEMENT       │
                               │ • Nouveau takeoff│
                               │ • Ajust. budget  │
                               └──────────────────┘
```

## 📝 Notes

- Les pages "Placeholder" sont des coquilles prêtes à être développées
- Le module respecte le style Autodesk Construction Cloud pour la familiarité
- Toutes les tables ont RLS activé pour la sécurité
- Les triggers `updated_at` sont automatiques

## ✅ Checklist post-installation

- [ ] Migration SQL exécutée
- [ ] Fichiers copiés
- [ ] Routes ajoutées dans App.tsx
- [ ] Build passe (npm run build)
- [ ] Test création d'un projet "actif"
- [ ] Accès au module Gestion via /gestion/{projectId}
