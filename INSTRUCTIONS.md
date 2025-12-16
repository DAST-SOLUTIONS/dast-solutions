# DAST Solutions - CORRECTION ENTREPRENEURS & PERSONNEL CCQ

## ⚠️ PROBLÈME IDENTIFIÉ

Tu avais **deux migrations différentes** qui créaient la table `entrepreneurs` avec des structures **incompatibles**:
- Une ancienne avec `company_name`, `contact_name`...
- La nouvelle avec `nom`, `neq`, `rbq_licence`...

La première exécutée a gagné car `IF NOT EXISTS` empêche la recréation.

---

## 📋 ÉTAPES DE CORRECTION

### ÉTAPE 1: Exécuter la migration SQL (Supabase)

1. Ouvrir **Supabase Dashboard** → **SQL Editor**
2. Copier-coller le contenu de `FIX_ENTREPRENEURS_PERSONNEL.sql`
3. Cliquer **Run**
4. Vérifier que tu vois:
   - `✅ MIGRATION TERMINÉE!`
   - 7 tables listées
   - 36 métiers CCQ

### ÉTAPE 2: Remplacer les fichiers React

Copier les fichiers du dossier `src/` vers ton projet:

| Fichier source | Destination |
|----------------|-------------|
| `src/hooks/useEntrepreneursCRUD.ts` | `C:\dast-solutions\DAST Solutions\src\hooks\useEntrepreneursCRUD.ts` |
| `src/hooks/usePersonnelCCQ.ts` | `C:\dast-solutions\DAST Solutions\src\hooks\usePersonnelCCQ.ts` |
| `src/pages/Entrepreneurs/RBQ.tsx` | `C:\dast-solutions\DAST Solutions\src\pages\Entrepreneurs\RBQ.tsx` |
| `src/pages/Entrepreneurs/Personnel.tsx` | `C:\dast-solutions\DAST Solutions\src\pages\Entrepreneurs\Personnel.tsx` |

### ÉTAPE 3: Déployer sur Vercel

Dans **Git Bash**:

```bash
cd /c/dast-solutions/"DAST Solutions"
git add .
git commit -m "Fix: Entrepreneurs RBQ et Personnel CCQ connectés à Supabase"
git push
```

---

## ✅ VÉRIFICATION

Après déploiement, tu devrais pouvoir:

### Page Entrepreneurs RBQ (`/entrepreneurs/rbq`)
- Voir 0 entrepreneurs (normal, base vide)
- Cliquer "Ajouter" pour créer un entrepreneur
- Remplir nom, NEQ, licence RBQ, spécialités
- Voir l'entrepreneur apparaître dans la liste
- Ajouter des évaluations
- Filtrer par spécialité et statut RBQ

### Page Personnel CCQ (`/entrepreneurs/personnel`)
- Voir 0 employés (normal, base vide)
- Cliquer "Nouvel employé" pour créer
- Sélectionner un métier CCQ (36 disponibles avec taux 2024-2025)
- Voir le calcul automatique: Base + 13% vacances + 15.5% avantages
- Ajouter des certifications (ASP, SIMDUT, etc.)
- Voir les alertes de certifications expirantes

---

## 🗂️ STRUCTURE DES TABLES CRÉÉES

```
metiers_ccq (36 métiers avec taux horaires)
├── entrepreneurs
│   ├── entrepreneur_contacts
│   └── entrepreneur_evaluations
└── personnel_ccq
    ├── personnel_certifications
    └── personnel_assignations
```

---

## 🔧 EN CAS DE PROBLÈME

Si l'erreur persiste après la migration:

1. Vérifier dans Supabase → Table Editor que les tables existent
2. Vérifier que `entrepreneurs` a bien une colonne `user_id`
3. Vérifier que `personnel_ccq` a bien une colonne `user_id`

Pour voir la structure d'une table:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'entrepreneurs';
```

---

## 📊 PROCHAINES ÉTAPES APRÈS CORRECTION

| Étape | Description | Status |
|-------|-------------|--------|
| 1.3 | CRUD Entrepreneurs RBQ | ✅ Corrigé |
| 1.3 | CRUD Personnel CCQ | ✅ Corrigé |
| 2.RBQ | Vérification licence RBQ (API) | ⏳ À venir |
| 3 | Connecter Dashboard aux vraies données | ⏳ À venir |
| 4 | Import données 3000+ projets | ⏳ À venir |
