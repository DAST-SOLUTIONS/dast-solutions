# DAST Solutions - Module Estimation (Style ProEst)

## 📊 Aperçu

Module d'estimation complet inspiré de ProEst avec:
- **Base de données d'items** (cost_items) - Structure CSC MasterFormat
- **Assemblages avec formules** (assemblies) - Calculs automatiques
- **Estimations de projet** (estimates) - Lignes avec matériaux, M-O, S-T

## 🏗️ Structure des données

### Codes CSC MasterFormat
```
04.2000.1000
│   │     └── Code item (1000, 1010, 1020...)
│   └── Subdivision (2000 Unit Masonry, 0500 Common Work...)
└── Division (04 Masonry)
```

### Formules d'assemblage
```javascript
// Variables disponibles
Wall_Length, Wall_Height, Wall_Area, Floor_Area, Perimeter, Volume,
Opening_Count, Bond_Beam_Rows, Bond_Beam_Rebar, Quantity, Length, Width, Height, Depth

// Exemple de formule pour blocs de béton
(Wall_Length * Wall_Height * 1.125) - (Wall_Length / 1.333 * Bond_Beam_Rows)
```

## 📦 Installation

### 1. Migration SQL

Exécuter dans **Supabase Dashboard → SQL Editor**:

```sql
-- Copier le contenu de: supabase/005_estimation_module.sql
```

**Tables créées:**
- `cost_divisions` - 24 divisions CSC
- `cost_items` - Items avec coûts unitaires
- `assemblies` - Assemblages avec variables
- `assembly_items` - Items dans assemblages + formules
- `estimates` - Estimations par projet
- `estimate_items` - Lignes d'estimation

### 2. Copier les fichiers

```bash
# Pages
cp src/pages/CostDatabase.tsx your-project/src/pages/
cp src/pages/EstimationPage.tsx your-project/src/pages/

# Routes à ajouter dans App.tsx
```

### 3. Ajouter les routes

```tsx
import CostDatabase from '@/pages/CostDatabase'
import EstimationPage from '@/pages/EstimationPage'

// Dans <Routes>
<Route path="/database" element={<CostDatabase />} />
<Route path="/estimation/:projectId" element={<EstimationPage />} />
```

### 4. Ajouter dans la Sidebar

```tsx
// Dans la section Ressources
<NavLink to="/database">
  <Database size={16} />
  Base de données
</NavLink>
```

## 🎯 Fonctionnalités

### Base de données (CostDatabase.tsx)

| Onglet | Description |
|--------|-------------|
| **Items** | Liste hiérarchique des items CSC |
| **Assemblages** | Groupes d'items avec formules |
| **Maintenance** | Mise à jour des prix |
| **Sources** | RSMeans, imports CSV |

**Features:**
- ✅ Arbre navigable par division
- ✅ Recherche globale
- ✅ CRUD items
- ✅ CRUD assemblages
- ✅ Variables et formules
- ✅ Coûts ventilés (Mat., M-O, Équip.)

### Estimation (EstimationPage.tsx)

| Onglet | Description |
|--------|-------------|
| **Documents** | Lien vers documents projet |
| **Estimation** | Tableau des lignes |
| **Takeoff** | Lien vers takeoff |
| **Tri** | Organisation personnalisée |
| **Tâches** | Suivi des tâches |
| **Bid Leveling** | Comparaison soumissions |
| **Sommaire** | Graphiques et totaux |

**Features:**
- ✅ Ajout items depuis base de données
- ✅ Édition quantités inline
- ✅ Colonnes: Matériaux, M-O, Sous-traitants
- ✅ Totaux automatiques
- ✅ Marges: Frais généraux, Profit, Contingence
- ✅ Filtrer par division
- ✅ Grouper par division
- ✅ Export (à venir)

## 📐 Intégration Takeoff → Estimation

Le module est conçu pour s'intégrer avec le Takeoff:

```typescript
// estimate_items a un champ takeoff_measurement_id
// Permet de lier une ligne d'estimation à une mesure du takeoff

// Workflow:
// 1. Mesurer dans Takeoff (ex: 150 Pi² de mur)
// 2. Sélectionner assemblage "4" Concrete Block Wall"
// 3. Calculer automatiquement: blocs, mortier, armature, M-O
// 4. Ajouter à l'estimation avec quantité du takeoff
```

## 🔮 Prochaines étapes

1. **Import RSMeans** - Données de coûts standardisées
2. **Import CSV** - Importer vos propres données
3. **Lien Takeoff** - Auto-population depuis mesures
4. **Export Excel** - Rapports formatés
5. **Comparaison versions** - Historique des changements
6. **Bid Leveling** - Comparaison soumissions S-T

## 📋 Exemple de données

```sql
-- Ajouter quelques items de démonstration
INSERT INTO cost_items (user_id, division_code, subdivision_code, item_code, description, description_fr, unit, material_cost, labor_cost, unit_cost)
VALUES
  (auth.uid(), '04', '2000', '1000', '4" X 8" X 16" Concrete Block', 'Bloc de béton 4" X 8" X 16"', 'U', 1.00, 0.20, 1.20),
  (auth.uid(), '04', '2000', '1010', '6" X 8" X 16" Concrete Block', 'Bloc de béton 6" X 8" X 16"', 'U', 1.28, 0.20, 1.48),
  (auth.uid(), '04', '2000', '1020', '8" X 8" X 16" Concrete Block', 'Bloc de béton 8" X 8" X 16"', 'U', 2.75, 0.25, 3.00),
  (auth.uid(), '03', '3000', '1000', 'Concrete 25 MPa', 'Béton 25 MPa', 'M3', 150.00, 25.00, 175.00);
```
