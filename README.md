# 🚀 DAST Solutions - Correction Build Vercel

## 📋 RÉSUMÉ DES CORRECTIONS

Ce package contient les fichiers corrigés pour résoudre les erreurs de build Vercel.

### Fichiers inclus:
- `src/App.tsx` - Routes mises à jour avec les nouveaux modules
- `src/vite-env.d.ts` - Types d'environnement corrigés
- `src/components/SidebarWithNewLinks.tsx` - Menu avec les nouveaux liens
- `src/pages/*.tsx` - Pages des modules Phases 1-4
- `src/hooks/*.ts` - Hooks avec mapping des colonnes DB
- `src/types/modules.ts` - Types TypeScript
- `supabase/migrations/001_modules_complets.sql` - Migration SQL

---

## 📝 INSTRUCTIONS D'INSTALLATION

### ÉTAPE 1: Exécuter la migration SQL (une seule fois)

1. Aller dans Supabase Dashboard → SQL Editor
2. Coller le contenu de `supabase/migrations/001_modules_complets.sql`
3. Exécuter

### ÉTAPE 2: Remplacer les fichiers dans GitHub

Remplacer/ajouter ces fichiers dans votre repo:

```
src/App.tsx                              ← REMPLACER
src/vite-env.d.ts                        ← REMPLACER
src/components/SidebarWithNewLinks.tsx   ← REMPLACER
src/pages/BottinRessources.tsx           ← AJOUTER/REMPLACER
src/pages/MateriauxPrix.tsx              ← AJOUTER/REMPLACER
src/pages/SoumissionBuilder.tsx          ← AJOUTER/REMPLACER
src/pages/AppelsOffres.tsx               ← AJOUTER/REMPLACER
src/pages/Soumissions.tsx                ← REMPLACER (redirection)
src/hooks/useBottin.ts                   ← AJOUTER/REMPLACER
src/hooks/useMateriauxPrix.ts            ← AJOUTER/REMPLACER
src/hooks/useSoumissions.ts              ← AJOUTER/REMPLACER
src/hooks/useAppelsOffres.ts             ← AJOUTER/REMPLACER
src/types/modules.ts                     ← AJOUTER/REMPLACER
```

### ÉTAPE 3: Supprimer les anciens fichiers (si présents)

Si vous avez encore un dossier `src/pages/Soumissions/`, SUPPRIMEZ-LE:
```bash
rm -rf src/pages/Soumissions/
```

### ÉTAPE 4: Commit & Push

```bash
git add .
git commit -m "feat: ajout modules Phases 1-4 corrigés"
git push origin main
```

Vercel redéploiera automatiquement.

---

## 🆕 NOUVELLES ROUTES

| Route | Module |
|-------|--------|
| `/bottin` | Bottin Ressources (individus, équipements, équipes) |
| `/materiaux` | Matériaux & Prix (avec catégories CSC) |
| `/soumissions` | Soumissions V2 (constructeur de soumissions) |
| `/appels-offres` | Appels d'Offres V2 (avec invitations) |

---

## ⚠️ VARIABLES D'ENVIRONNEMENT

Assurez-vous d'avoir ces variables dans Vercel (Settings → Environment Variables):

**Obligatoires:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**Optionnelles (pour fonctionnalités avancées):**
- `VITE_OPENWEATHER_API_KEY`
- `VITE_OPENAI_API_KEY`
- `VITE_ANTHROPIC_API_KEY`
- `VITE_RESEND_API_KEY`

---

## 📊 ARCHITECTURE DES MODULES

```
Bottin Ressources
├── Individus (employés, sous-traitants, contacts, fournisseurs)
├── Équipements (nacelles, échafauds, véhicules...)
└── Équipes (compositions avec coûts calculés)

Matériaux & Prix
├── Catégories CSC MasterFormat
├── Matériaux avec prix fournisseurs multiples
└── Historique des prix

Soumissions V2
├── Sections personnalisables
├── Items avec calcul automatique
└── Export PDF professionnel

Appels d'Offres V2
├── Gestion des AO
├── Invitations aux sous-traitants
└── Réception des soumissions
```
