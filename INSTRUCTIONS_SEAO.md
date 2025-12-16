# 🚀 INTÉGRATION SEAO - Instructions de Déploiement

## 📋 Contenu du Package

```
DAST_SEAO_COMPLET/
├── database/
│   └── MIGRATION_005_APPELS_OFFRES.sql    # Table Supabase
├── supabase/
│   └── functions/
│       └── seao-scraper/
│           └── index.ts                    # Edge Function de scraping
├── src/
│   ├── services/
│   │   └── seaoService.ts                  # Service de récupération
│   └── pages/
│       └── AppelsOffre/
│           └── SEAO.tsx                    # Interface utilisateur
└── INSTRUCTIONS.md                         # Ce fichier
```

---

## 📊 ÉTAPE 1: Créer la table dans Supabase

1. Ouvrir **Supabase Dashboard** → **SQL Editor**
2. Copier le contenu de `MIGRATION_005_APPELS_OFFRES.sql`
3. Cliquer **Run**

La table `appels_offres` sera créée avec:
- Numéro SEAO, titre, description
- Organisme, région, ville
- Dates publication/fermeture
- Budget estimé
- Exigences RBQ
- Catégorie (batiment, genie_civil, architecture, services)

---

## ⚡ ÉTAPE 2: Déployer l'Edge Function

### Prérequis
```bash
# Installer Supabase CLI si pas déjà fait
npm install -g supabase
```

### Déploiement
```bash
# Se connecter à Supabase
supabase login

# Lier au projet
supabase link --project-ref VOTRE_PROJECT_REF

# Déployer la fonction
supabase functions deploy seao-scraper
```

### Tester la fonction
```bash
# Tester localement
curl "https://YOUR_PROJECT.supabase.co/functions/v1/seao-scraper"
```

---

## 📁 ÉTAPE 3: Mettre à jour l'application

1. Copier `src/services/seaoService.ts` → dans ton projet
2. Copier `src/pages/AppelsOffre/SEAO.tsx` → dans ton projet
3. Push vers GitHub
4. Vercel redéploie automatiquement

---

## 🔧 Configuration

### Variables d'environnement (déjà configurées)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🎯 Catégories filtrées automatiquement

| Catégorie | Mots-clés |
|-----------|-----------|
| **Bâtiments** | construction, rénovation, école, hôpital, maçonnerie, toiture |
| **Génie civil** | infrastructure, route, pont, aqueduc, égout, asphaltage |
| **Architecture/Ingénierie** | conception, plans, études, structural, mécanique |
| **Services de soutien** | estimation, gestion de projet, surveillance, contrôle des coûts |

---

## 📅 Synchronisation automatique (Optionnel)

Pour synchroniser automatiquement les appels d'offres:

### Option A: Supabase Cron (pg_cron)
```sql
-- Dans SQL Editor
SELECT cron.schedule(
  'sync-seao',
  '0 */4 * * *',  -- Toutes les 4 heures
  $$
  SELECT net.http_get('https://YOUR_PROJECT.supabase.co/functions/v1/seao-scraper');
  $$
);
```

### Option B: GitHub Actions
Créer `.github/workflows/sync-seao.yml`:
```yaml
name: Sync SEAO
on:
  schedule:
    - cron: '0 */4 * * *'
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - run: curl "${{ secrets.SEAO_FUNCTION_URL }}"
```

---

## ✅ Test Final

1. Ouvrir l'application
2. Naviguer vers **Appels d'offres** → **SEAO**
3. Vérifier:
   - [ ] Liste des appels d'offres affichée
   - [ ] Filtres par catégorie fonctionnent
   - [ ] Filtres par région fonctionnent
   - [ ] Détails affichés correctement
   - [ ] Liens vers SEAO fonctionnels

---

## 🐛 Dépannage

### Erreur CORS
L'Edge Function gère les CORS. Si problème:
```typescript
// Vérifier les headers dans index.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  ...
}
```

### Pas de données
1. Vérifier que l'Edge Function est déployée: `supabase functions list`
2. Vérifier les logs: `supabase functions logs seao-scraper`
3. Le fallback affiche des données de démo si SEAO inaccessible

---

## 📞 Support

- Documentation SEAO: https://seao.ca/aide
- Documentation Supabase: https://supabase.com/docs

Bonne intégration! 🎉
