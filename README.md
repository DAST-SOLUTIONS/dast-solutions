# DAST Solutions - Modules Phases 1-4

## 📁 Structure des dossiers (prêt à copier-coller)

```
dast-ready/
├── src/
│   ├── types/
│   │   └── modules.ts          → Copier vers src/types/
│   ├── hooks/
│   │   ├── useBottin.ts        → Copier vers src/hooks/
│   │   ├── useMateriauxPrix.ts → Copier vers src/hooks/
│   │   ├── useSoumissions.ts   → Copier vers src/hooks/
│   │   └── useAppelsOffres.ts  → Copier vers src/hooks/
│   └── pages/
│       ├── BottinRessources.tsx    → Copier vers src/pages/
│       ├── MateriauxPrix.tsx       → Copier vers src/pages/
│       ├── SoumissionBuilder.tsx   → Copier vers src/pages/
│       └── AppelsOffres.tsx        → Copier vers src/pages/
└── supabase/
    └── migrations/
        └── 001_modules_complets.sql → Exécuter dans Supabase SQL Editor
```

## 🚀 Installation

### Étape 1: Base de données (Supabase)

1. Ouvrir Supabase Dashboard → SQL Editor
2. Copier le contenu de `supabase/migrations/001_modules_complets.sql`
3. Cliquer "Run" pour exécuter

### Étape 2: Fichiers TypeScript

Copier les fichiers dans votre projet DAST existant:

```bash
# Types
cp src/types/modules.ts [VOTRE_PROJET]/src/types/

# Hooks
cp src/hooks/*.ts [VOTRE_PROJET]/src/hooks/

# Pages
cp src/pages/*.tsx [VOTRE_PROJET]/src/pages/
```

### Étape 3: Routes (App.tsx)

Ajouter ces imports et routes dans votre App.tsx:

```tsx
// Imports
import BottinRessources from '@/pages/BottinRessources'
import MateriauxPrixPage from '@/pages/MateriauxPrix'
import SoumissionsPage, { SoumissionEditor } from '@/pages/SoumissionBuilder'
import AppelsOffresPage, { AppelOffreDetail } from '@/pages/AppelsOffres'

// Routes (dans le Router)
<Route path="/bottin" element={<BottinRessources />} />
<Route path="/materiaux-prix" element={<MateriauxPrixPage />} />
<Route path="/soumissions-v2" element={<SoumissionsPage />} />
<Route path="/soumissions-v2/:id" element={<SoumissionEditor />} />
<Route path="/appels-offres" element={<AppelsOffresPage />} />
<Route path="/appels-offres/:id" element={<AppelOffreDetail />} />
```

## 📋 Modules inclus

| Module | Description | Route |
|--------|-------------|-------|
| **Bottin Ressources** | Individus, équipes, équipements | `/bottin` |
| **Matériaux & Prix** | Catalogue + productivités M.O. | `/materiaux-prix` |
| **Soumissions V2** | Builder avec calculs auto | `/soumissions-v2` |
| **Appels d'Offres** | Invitations + comparatif | `/appels-offres` |

## 🗄️ Tables créées

- `bottin_individus` - Employés, sous-traitants, contacts, fournisseurs
- `bottin_equipements` - Inventaire équipements
- `bottin_equipes` - Équipes avec coûts calculés
- `bottin_equipe_membres` - Liaison équipe-individu
- `bottin_equipe_equipements` - Liaison équipe-équipement
- `materiaux_categories` - Catégories CSC MasterFormat (23 pré-chargées)
- `materiaux_catalogue` - Catalogue matériaux utilisateur
- `materiaux_prix_historique` - Historique des prix
- `materiaux_productivites` - Taux de productivité
- `soumissions_v2` - En-têtes soumissions
- `soumissions_sections` - Sections (DÉMOLITION, MAÇONNERIE, etc.)
- `soumissions_items` - Lignes de soumission
- `appels_offres` - En-têtes appels d'offres
- `appels_offres_invitations` - Invitations envoyées
- `appels_offres_soumissions` - Soumissions reçues
- `appels_offres_comparatifs` - Tableaux comparatifs

## ⚠️ Note importante

Les colonnes `statut` ont été renommées pour éviter les conflits PostgreSQL:
- `equipement_statut` (bottin_equipements)
- `soumission_statut` (soumissions_v2)
- `ao_statut` (appels_offres)
- `invitation_statut` (appels_offres_invitations)
- `soumission_recue_statut` (appels_offres_soumissions)

Les hooks font automatiquement le mapping vers `statut` dans l'interface.
