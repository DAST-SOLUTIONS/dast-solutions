# 🔧 DAST Solutions - Corrections Bugs Janvier 2026

## 📋 BUGS CORRIGÉS

| # | Bug | Fichier | Solution |
|---|-----|---------|----------|
| 1 | Création projet échoue | `ProjectDetails.tsx` + SQL | Colonnes manquantes ajoutées |
| 2 | Liste projets non cliquable | `Projects.tsx` | Navigation onClick ajoutée |
| 3 | Estimation → Dashboard | `Estimation.tsx` | Route corrigée vers `/takeoff/:id` |
| 4 | Upload plans ne fonctionne pas | `useTakeoff.ts` + SQL | Hook corrigé + Storage bucket |
| 5 | RLS désactivé (alertes Supabase) | SQL | Policies ajoutées sur toutes les tables |

## 🆕 NOUVELLES FONCTIONNALITÉS

### Formulaire Projet amélioré:
- **Client CRM**: Sélection depuis la liste des clients ou saisie manuelle
- **Contacts**: Association de contacts au projet
- **Type projet**: Privé / Public
- **Portée**: Neuf, Rénovation, Agrandissement, etc.
- **Type bâtiment**: 25+ options (commerce, école, caserne, etc.)
- **Localisation**: Adresse, Ville, Province, Code postal

---

## 📦 CONTENU DU PACKAGE

```
dast-bugfix-jan2/
├── README.md
├── supabase/migrations/
│   └── 002_fix_projects_schema.sql    ← EXÉCUTER EN PREMIER
├── src/pages/
│   ├── ProjectDetails.tsx             ← Formulaire projet complet
│   ├── Projects.tsx                   ← Liste cliquable
│   └── Projets/
│       └── Estimation.tsx             ← Navigation corrigée
└── src/hooks/
    └── useTakeoff.ts                  ← Upload fonctionnel
```

---

## 🚀 INSTRUCTIONS D'INSTALLATION

### ÉTAPE 1: Exécuter la migration SQL (OBLIGATOIRE)

1. Aller dans **Supabase Dashboard** → **SQL Editor**
2. Copier le contenu de `supabase/migrations/002_fix_projects_schema.sql`
3. Cliquer sur **Run**

Cette migration:
- Ajoute les colonnes manquantes à `projects` (city, province, postal_code, budget, etc.)
- Crée les tables `clients` et `contacts` pour le CRM
- Active RLS sur toutes les tables signalées
- Configure le bucket storage `takeoff-plans`

### ÉTAPE 2: Configurer le Storage (si pas déjà fait)

Dans **Supabase Dashboard** → **Storage**:

1. Cliquer sur **New bucket**
2. Nom: `takeoff-plans`
3. Cocher **Public bucket**
4. Cliquer **Create bucket**

### ÉTAPE 3: Remplacer les fichiers

Copier ces fichiers dans votre repo GitHub:

```
src/pages/ProjectDetails.tsx        ← REMPLACER
src/pages/Projects.tsx              ← REMPLACER
src/pages/Projets/Estimation.tsx    ← REMPLACER
src/hooks/useTakeoff.ts             ← REMPLACER
```

### ÉTAPE 4: Commit & Push

```bash
git add .
git commit -m "fix: bugs création projet, navigation, upload takeoff"
git push origin main
```

Vercel redéploiera automatiquement.

---

## ✅ VÉRIFICATION

Après déploiement, tester:

1. **Création projet**: Formulaire complet avec tous les champs
2. **Liste projets**: Cliquer sur un projet → ouvre la page détails
3. **Estimation**: Cliquer sur "Ouvrir" → va vers Takeoff
4. **Takeoff**: Upload un PDF → doit s'afficher dans la liste

---

## 📊 NOUVELLES TABLES CRÉÉES

### `clients` (CRM)
| Colonne | Type | Description |
|---------|------|-------------|
| type | varchar | 'individu' ou 'societe' |
| prenom, nom | varchar | Pour individus |
| nom_societe | varchar | Pour sociétés |
| email, telephone | varchar | Contact |
| adresse, ville, province | varchar | Localisation |

### `contacts` (liés aux clients)
| Colonne | Type | Description |
|---------|------|-------------|
| client_id | uuid | FK vers clients |
| prenom, nom | varchar | Nom du contact |
| titre | varchar | Fonction |
| est_principal | boolean | Contact principal |

### `project_contacts` (liaison projet-contacts)
| Colonne | Type | Description |
|---------|------|-------------|
| project_id | uuid | FK vers projects |
| contact_id | uuid | FK vers contacts |
| role | varchar | Rôle sur le projet |

---

## 🔒 RLS POLICIES AJOUTÉES

Tables avec RLS maintenant activé:
- ccq_sectors, ccq_trades, ccq_hourly_rates, ccq_regions, ccq_social_benefits (lecture publique)
- appels_offres_favoris, appels_offres_notifications, appels_offres_invitations, etc. (user-specific)
- bottin_equipe_membres, bottin_equipe_equipements (via equipe_id)
- materiaux_categories (lecture publique)
- materiaux_prix_historique (user-specific)
- soumissions_sections, soumissions_items (via soumission_id)

---

## 🐛 PROBLÈMES CONNUS

### Three.js / BIM Viewer (Conception)
La page Conception nécessite une implémentation Three.js complète qui sera développée dans une phase ultérieure. Pour l'instant, cette fonctionnalité est désactivée.

### Import depuis cloud externe
L'import depuis Box, SharePoint, Google Drive sera implémenté dans une phase ultérieure. Pour l'instant, seul l'upload local fonctionne.
