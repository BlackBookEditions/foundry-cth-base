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
- Le profil des états CTH est injecté au **chargement du script**, après l'exposition de
  `CONFIG.COC2BASE` par la dépendance mais avant les hooks `init`, afin que coc2-base
  construise directement la bonne liste.
- Les autres surcharges de **`CONFIG.COC2BASE`** et les modèles se font dans **`init`**.
  Celles qui doivent passer après tous les `init` restent dans **`setup`**.
- L'**Échelle de conscience** force le profil CTH : bonus de VOL pour les traumatismes et
  malus de CHA pour l'empathie aux paliers ±1/±3/±5/±10. Le bonus est présélectionné lors
  des tests d'horreur ; le malus d'empathie reste un choix contextuel dans la fenêtre de jet.
  La configuration générique de COC2 est masquée dans cet univers.

## Dépendances

`module.json` déclare `coc2-base` en `relationships.requires` : Foundry exige sa présence
et son activation.

## Développement

```bash
npm install
npm run compile   # style/cth-base.less -> cth-base.css
npm test
```

L'entrée JS est `cth-base.mjs` ; les sources de style sont sous `style/`, compilées vers
`cth-base.css` (référencé par `module.json`).
