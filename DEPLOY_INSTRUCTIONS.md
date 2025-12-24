# 🚀 DAST Solutions - Instructions de Déploiement

## Problème Identifié
L'erreur Vercel indique que `useTakeoff` n'a pas les exports requis (`CSC_DIVISIONS`, `plans`, etc.).
Cela signifie que le repo GitHub n'a pas la dernière version du fichier.

## Solution Rapide (Git Bash)

### Étape 1: Extraire le ZIP dans ton dossier projet local
```bash
# Remplacer tous les fichiers source
unzip -o DAST_COMPLET_V3_DEPLOY.zip -d /chemin/vers/dast-solutions
```

### Étape 2: Installer et tester localement
```bash
cd dast-solutions
npm install
npm run build
```

### Étape 3: Pousser vers GitHub
```bash
git add .
git commit -m "Fix: Restauration complète - routes, widgets, hooks"
git push origin main
```

### Étape 4: Vercel va automatiquement déployer

---

## Fichiers Critiques Mis à Jour

| Fichier | Description |
|---------|-------------|
| `src/hooks/useTakeoff.ts` | Hook complet avec CSC_DIVISIONS, plans, calibration |
| `src/App.tsx` | Toutes les routes (35+) |
| `src/pages/Dashboard.tsx` | Widgets personnalisables |
| `src/components/Layout.tsx` | Navigation sidebar complète |
| `src/pages/Settings.tsx` | 4 onglets (Profil, Entreprise, Préférences, Abonnement) |

## Structure des Routes

- `/dashboard` - Tableau de bord avec widgets
- `/projects` - Liste des projets
- `/projets/conception` - Conception
- `/projets/estimation` - Estimation
- `/projets/gestion` - Gestion
- `/entrepreneurs/rbq` - Bottin RBQ
- `/entrepreneurs/personnel` - Personnel
- `/appels-offre/seao` - SEAO
- `/appels-offre/merx` - MERX
- `/ressources/code-navigator` - Code Navigator
- `/ressources/ccq-navigator` - CCQ Navigator
- `/soumissions` - Soumissions
- `/settings` - Paramètres complets
- Et plus...

## Widgets Dashboard Personnalisables

1. ☁️ Météo Construction
2. 📅 Calendrier
3. 📦 Prix Matériaux
4. 📈 KPIs
5. 📁 Projets récents
6. 📄 Soumissions récentes

Les widgets peuvent être affichés/masqués et la config est sauvegardée.

## Support
Si des erreurs persistent après déploiement, partage le log Vercel complet.
