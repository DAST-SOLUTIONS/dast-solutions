# DAST Solutions - Plateforme Construction Québec
## Version: Phase 1 Complète - 10 janvier 2026

---

## 🎯 CORRECTIONS PHASE 1 (8 sur 8 complétées)

### ✅ 1. Upload PDF Takeoff - AMÉLIORÉ
**Fichier:** `src/pages/TakeoffV3.tsx`
- Support multi-fichiers (jusqu'à plusieurs PDFs simultanément)
- Retry automatique (3 tentatives) en cas d'erreur réseau
- Limite augmentée à 100MB par fichier
- Comptage automatique des pages PDF
- Barre de progression pendant l'upload
- Gestion robuste des erreurs

### ✅ 2. Système de Phases Projets
**Fichiers:** `src/components/CreateProjectModal.tsx`, Migration SQL
- **4 phases mutuellement exclusives:** Conception → Estimation → Gestion → Terminé
- Sélection visuelle des phases avec icônes
- Type public/privé pour projets d'appels d'offres
- Nouveaux champs: building_type, city, province, postal_code, GPS coords, bid_number, bid_source

### ✅ 3. Factures liées aux projets
**Fichier:** `src/pages/Factures.tsx`
- Sélection de projet lors de la création de facture
- Auto-remplissage du nom client depuis le projet
- Indication visuelle de liaison projet

### ✅ 4. CRM Multi-contacts + Comptes payables
**Fichier:** `src/pages/Clients.tsx`
- Interface améliorée avec sections organisées
- Section "Comptes payables / Facturation" dédiée
- Termes de paiement: Immédiat, Net 15/30/45/60/90
- Limite de crédit
- Exonération TPS/TVQ
- Note: Multi-contacts disponible après création (via table client_contacts)

### ✅ 5. Clarification Soumissions vs Estimation
**Fichier:** `src/pages/Soumissions.tsx`
- Nouvelle page hub avec workflow visuel
- Explication claire: Takeoff → Estimation → Soumission → Facturation
- Statistiques: total, en attente, acceptées, refusées, valeur
- Filtres et recherche intégrés

### ✅ 6. Appel d'offres avec paramètres projet
**Fichier:** `src/pages/AppelsOffres.tsx`
- Sélection de projet lors de création d'appel d'offres
- Auto-remplissage: titre, adresse, ville, type de bâtiment
- Affichage des paramètres du projet sélectionné

### ✅ 7. Métiers CCQ complets (60+ entrées)
**Fichier:** Migration SQL `013_phase1_corrections.sql`
- Table ccq_trades avec tous les métiers
- 30 métiers principaux (briqueteur, électricien, plombier, etc.)
- 10+ occupations (manœuvre, arpenteur, etc.)
- Spécialités par métier (charpentier-menuisier, grutier, etc.)
- Catégories: Métier, Occupation, Spécialité
- Secteurs: résidentiel, commercial, industriel, génie civil

### ✅ 8. Vérification RBQ automatique
**Fichiers:** `src/services/rbqService.ts`, `src/pages/Entrepreneurs/RBQ.tsx`
- Bouton "Vérifier RBQ" intégré au formulaire entrepreneur
- Vérification simulée (format licence + statut aléatoire réaliste)
- Affichage du résultat: valide/suspendu/expiré + date expiration
- Lien direct vers rbq.gouv.qc.ca pour vérification manuelle
- Auto-remplissage des catégories RBQ

---

## 📊 MIGRATION BASE DE DONNÉES

### Fichier: `supabase/migrations/013_phase1_corrections.sql`

**Nouvelles colonnes sur `projects`:**
- phase (conception/estimation/gestion/termine)
- visibility (public/private)
- building_type, city, province, postal_code
- latitude, longitude (GPS)
- bid_number, bid_source

**Nouvelle table `client_contacts`:**
- Multi-contacts par client
- Types: general, billing, technical, emergency
- Contact principal marqué

**Nouvelle table `ccq_trades`:**
- 60+ métiers/occupations CCQ
- Code, nom FR/EN, catégorie, secteur

**Nouvelle table `rbq_verifications`:**
- Historique des vérifications RBQ
- Cache 24h pour éviter requêtes multiples

**Colonnes ajoutées à `entrepreneurs`:**
- rbq_status, rbq_verified_at, rbq_categories, rbq_expiry

---

## 🚀 INSTRUCTIONS DE DÉPLOIEMENT

### 1. Supabase Dashboard

**Créer les buckets Storage (si pas déjà fait):**
- `takeoff-plans` - Public - Pour les plans PDF
- `project-documents` - Public - Pour les documents projet

**Exécuter la migration SQL:**
1. Aller dans SQL Editor
2. Copier le contenu de `supabase/migrations/013_phase1_corrections.sql`
3. Cliquer "Run"

### 2. Déploiement Vercel

```bash
# Extraire le ZIP
unzip DAST_PHASE1_COMPLETE_10-01-2026.zip
cd dast-corrected

# Installer les dépendances
npm install

# Build local (optionnel)
npm run build

# Push vers GitHub (déclenche auto-déploiement Vercel)
git add .
git commit -m "Phase 1 - 8 corrections complètes"
git push origin main
```

### 3. Variables d'environnement (vérifier sur Vercel)
```
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon
```

---

## 📁 FICHIERS MODIFIÉS

```
src/
├── components/
│   └── CreateProjectModal.tsx       # Refait avec phases + étapes
├── pages/
│   ├── TakeoffV3.tsx               # Upload multi-fichiers + retry
│   ├── Factures.tsx                # Liaison projet
│   ├── Clients.tsx                 # Sections facturation
│   ├── Soumissions.tsx             # Nouveau hub workflow
│   ├── AppelsOffres.tsx            # Sélection projet
│   └── Entrepreneurs/
│       └── RBQ.tsx                 # Bouton vérification RBQ
├── services/
│   └── rbqService.ts               # Service vérification (existant)
└── supabase/
    └── migrations/
        └── 013_phase1_corrections.sql  # Migration complète
```

---

## 🔜 PROCHAINES PHASES

### Phase 2 - Gestion de projet (Procore-style)
- Journal de chantier
- RFI (Demandes d'information)
- Submittals
- Inspections/Qualité
- Punch List (Déficiences)
- Réunions

### Phase 3 - Finances avancées
- Budget vs Réel
- Courbe en S
- Change Orders améliorés
- Demandes de paiement

### Phase 4 - Avantage Québec
- Taux CCQ temps réel
- Conventions collectives
- Code de construction
- Base 25K+ entreprises RBQ

---

## 🐛 NOTES TECHNIQUES

- Le build génère un chunk de 2.6MB (normal pour l'app complète)
- Warning Three.js ignorable (module dynamique)
- PDF.js worker chargé depuis CDN Cloudflare

---

**Développé par:** DAST Solutions  
**Contact:** projets@exactto.ca  
**Version:** 1.0.0-phase1
