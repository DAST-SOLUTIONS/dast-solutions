# ⚠️ IMPORTANT - FICHIERS À SUPPRIMER

Avant de déployer, vous DEVEZ supprimer les anciens fichiers Soumissions qui causent des conflits TypeScript.

## Supprimer ce dossier complet:

```bash
rm -rf src/pages/Soumissions/
```

Ce dossier contient:
- `src/pages/Soumissions/index.tsx` (ancien module)
- `src/pages/Soumissions/Soumissions_index.tsx` (ancien module)

Ces fichiers utilisent l'ancien format (client_name, status, etc.) qui est incompatible avec le nouveau module SoumissionsV2.

## Le nouveau module utilise:

- `src/pages/SoumissionBuilder.tsx` → Route `/soumissions-v2`
- Types français: `client_nom`, `projet_nom`, `statut`
- Calculs automatiques avec marges et taxes

## Commande complète de nettoyage:

```bash
# Supprimer les anciens fichiers
rm -rf src/pages/Soumissions/

# Vérifier qu'ils sont supprimés
ls src/pages/Soumissions/ 2>/dev/null || echo "✓ Dossier supprimé"
```
