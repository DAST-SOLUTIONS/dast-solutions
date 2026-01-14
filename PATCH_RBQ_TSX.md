# Corrections requises pour le build

## Erreurs restantes

### 1. src/hooks/useRBQVerification.ts (ligne 62)
**Erreur**: `'checkedAt' does not exist in type 'RBQVerificationResult'`

**Solution**: Cette erreur devrait disparaître après avoir appliqué le nouveau `rbqService.ts` car `checkedAt` est maintenant dans le type.

---

### 2. src/pages/Entrepreneurs/RBQ.tsx (ligne 679)
**Erreur**: `Type 'RBQCategorie[]' is not assignable to type 'string[]'`

**Problème**: Le code utilise `RBQCategorie[]` pour `rbq_categories` mais `CreateEntrepreneurParams` attend `string[]`.

**Solution**: Ouvrez `src/pages/Entrepreneurs/RBQ.tsx` et trouvez la ligne ~679.

Cherchez un code similaire à:
```typescript
// AVANT (incorrect)
setNewEntrepreneur(p => ({
  ...p,
  rbq_categories: result.data?.categories,  // ou result.entrepreneur?.licence?.categorie
  // ...
}));
```

Remplacez par:
```typescript
// APRÈS (correct)
setNewEntrepreneur(p => ({
  ...p,
  rbq_categories: result.rbq_categories || result.data?.categories || [],
  // ...
}));
```

OU si le code utilise directement `entrepreneur.licence.categorie`:
```typescript
// AVANT
rbq_categories: result.entrepreneur?.licence?.categorie,

// APRÈS
rbq_categories: result.entrepreneur?.licence?.categorie?.map(c => c.code) || [],
```

---

## Propriétés RBQVerificationResult disponibles

| Propriété | Type | Description |
|-----------|------|-------------|
| `categories` | `string[]` | Codes de catégories (ex: ["1.1.1", "4.1"]) |
| `categoriesData` | `RBQCategorie[]` | Objets complets avec code + description |
| `rbq_categories` | `string[]` | Alias de categories |
| `checkedAt` | `string` | Date ISO de la vérification |
| `data.categories` | `string[]` | Codes dans l'objet data |

---

## Commandes pour trouver et corriger

```bash
# Trouver la ligne problématique
grep -n "rbq_categories" src/pages/Entrepreneurs/RBQ.tsx

# Après correction
git add .
git commit -m "fix: RBQ categories type compatibility"
git push origin main
```

