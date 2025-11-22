# DAST Solutions 🏗️

Application moderne de gestion de projets de construction avec module Takeoff intégré pour l'estimation des coûts et relevés de quantités.

## 🌟 Fonctionnalités

- **📊 Tableau de bord** - Vue d'ensemble des projets et statistiques
- **🏗️ Gestion de projets** - Suivi complet des projets de construction
- **📝 Module Estimation** - Création d'estimations détaillées
- **📐 Module Takeoff** - Relevé de quantités interactif et fonctionnel
- **📈 Rapports** - Analyse des performances et budgets
- **💡 Interface moderne** - Design responsive avec Tailwind CSS

## 🛠️ Technologies utilisées

- **React 18** avec TypeScript
- **Vite** pour le build rapide
- **Tailwind CSS** pour le styling
- **Lucide React** pour les icônes
- **ESLint** pour la qualité du code

## 📋 Prérequis

- Node.js 16.0.0 ou plus récent
- npm 8.0.0 ou plus récent

## 🚀 Installation

1. **Clonez ou extrayez le projet**
   ```bash
   # Si vous avez un repository git
   git clone <repository-url>
   cd dast-solutions
   
   # Ou extrayez simplement l'archive ZIP
   ```

2. **Installez les dépendances**
   ```bash
   npm install
   ```

3. **Lancez le serveur de développement**
   ```bash
   npm run dev
   ```

4. **Ouvrez votre navigateur**
   ```
   http://localhost:5173
   ```

## 🎯 Scripts disponibles

```bash
# Développement avec hot reload
npm run dev

# Build de production
npm run build

# Aperçu du build de production
npm run preview

# Vérification TypeScript
npm run type-check

# Linting du code
npm run lint
```

## 📁 Structure du projet

```
dast-solutions/
├── src/
│   ├── components/        # Composants React réutilisables
│   ├── types/            # Types TypeScript
│   ├── utils/            # Fonctions utilitaires
│   ├── App.tsx           # Composant principal
│   └── main.tsx          # Point d'entrée
├── public/               # Fichiers statiques
├── index.html           # Template HTML
├── package.json         # Dépendances et scripts
├── tsconfig.json        # Configuration TypeScript
├── tailwind.config.js   # Configuration Tailwind
├── vite.config.ts       # Configuration Vite
└── README.md           # Ce fichier
```

## 🎮 Guide d'utilisation

### Module Takeoff (Relevé de quantités)

1. **Accès au module**
   - Cliquez sur "Takeoff" dans la sidebar ou le header

2. **Ajouter un élément**
   - Sélectionnez une catégorie (Fondations, Charpente, etc.)
   - Entrez le nom de l'élément
   - Choisissez l'unité de mesure
   - Saisissez la quantité et le prix unitaire
   - Ajoutez des notes si nécessaire
   - Cliquez sur le bouton "+"

3. **Modifier les quantités**
   - Cliquez directement dans les champs du tableau
   - Les totaux se recalculent automatiquement

4. **Supprimer un élément**
   - Cliquez sur l'icône de corbeille dans la colonne Actions

### Navigation

- **Tableau de bord** : Vue d'ensemble et statistiques
- **Projets** : Gestion complète des projets
- **Estimation** : Module d'estimation (en développement)
- **Takeoff** : Relevé de quantités fonctionnel
- **Rapports** : Analyses et métriques

## 🏗️ Données d'exemple

L'application inclut des données réalistes pour le marché québécois :

- **Béton de fondation** : 185 $/m³
- **Brique d'argile** : 25 $/m²
- **Bois d'œuvre 2x8** : 4,25 $/pmp
- **Bardeaux d'asphalte** : 18 $/m²

## 🎨 Personnalisation

### Couleurs et thème
Les couleurs principales sont définies dans `tailwind.config.js` et utilisent un dégradé teal-orange-rouge.

### Ajout de nouvelles catégories
Modifiez le composant Takeoff dans `src/App.tsx` pour ajouter de nouvelles catégories d'éléments.

### Unités de mesure
Les unités disponibles sont : m², m³, m, pmp, unité, kg, L

## 🐛 Résolution de problèmes

### Port déjà utilisé
```bash
# Utilisez un port différent
npm run dev -- --port 3000
```

### Erreurs TypeScript
```bash
# Vérifiez les types
npm run type-check
```

### Problèmes de dépendances
```bash
# Nettoyez et réinstallez
rm -rf node_modules package-lock.json
npm install
```

## 🚀 Déploiement

### Build de production
```bash
npm run build
```

Les fichiers optimisés seront dans le dossier `dist/`.

### Serveur statique
```bash
npm run preview
```

## 📝 Développement

### Ajout de nouvelles fonctionnalités
1. Créez des composants dans `src/components/`
2. Définissez les types dans `src/types/`
3. Utilisez TypeScript pour la sécurité des types
4. Suivez les conventions de nommage existantes

### Standards de code
- Utilisez TypeScript pour tous les nouveaux fichiers
- Suivez les règles ESLint configurées
- Utilisez Tailwind CSS pour le styling
- Commentez le code complexe

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commitez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push sur la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

Pour toute question ou problème :
- Ouvrez une issue sur GitHub
- Contactez l'équipe DAST Solutions

---

**Développé avec ❤️ par l'équipe DAST Solutions**