# CTH Base

Surcouche d'**univers cthulhien** pour Foundry VTT, posée sur le module
[`coc2-base`](../coc2-base) (Chroniques Oubliées Contemporain 2), lui-même overlay
du système [`co2`](../../systems/co2) (Chroniques Oubliées 2).

Chaîne de dépendances : `co2` (système) → `coc2-base` (module) → **`cth-base`** (module).

## Architecture (pattern overlay)

`cth-base` ne modifie ni `co2` ni `coc2-base` : il se superpose via les hooks.

- **`CONFIG.CTHBASE`** est exposée dès le chargement du script (top-level, hors `init`),
  pour rester surchargeable par un futur module de scénario **quel que soit l'ordre de
  chargement des modules**.
- Les surcharges de **`CONFIG.COC2BASE`** (renommage d'états de santé, seuils…) se font
  dans le hook **`init`** : sûr quel que soit l'ordre, car `CONFIG.COC2BASE` est peuplée
  au top-level de coc2-base, donc déjà disponible.
- Les surcharges devant passer **après** le `init` de coc2-base (classe Actor, fiche
  `makeDefault`, `statusEffects`…) se font dans le hook **`setup`** (garanti après tous
  les `init`), pour ne pas dépendre de l'ordre de chargement.

## Dépendances

`module.json` déclare `coc2-base` en `relationships.requires` : Foundry exige sa présence
et son activation.

## Développement

```bash
npm install
npm run compile   # style/cth-base.less -> cth-base.css
```

L'entrée JS est `cth-base.mjs` ; les sources de style sont sous `style/`, compilées vers
`cth-base.css` (référencé par `module.json`).
