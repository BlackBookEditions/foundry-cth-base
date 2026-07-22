import { CTH_CONFIG } from "./module/config/cth.mjs"

/**
 * Configuration publique du module. Exposée dès le chargement du script, et non dans le hook init,
 * pour qu'un module de scénario/univers puisse la modifier depuis son propre hook init quel que soit
 * l'ordre de chargement des modules (même pattern que CONFIG.COC2BASE dans coc2-base).
 *
 * @example Retoucher la config depuis un module de scénario
 * Hooks.once("init", () => {
 *   CONFIG.CTHBASE.someOption = "..."
 * })
 */
CONFIG.CTHBASE = {
  ...CTH_CONFIG,
}

Hooks.once("init", () => {
  console.info("CTH Base | Initialisation du module...")

  // ─────────────────────────────────────────────────────────────────────────────
  // Surcharges de CONFIG.COC2BASE.
  //
  // Sûr ici quel que soit l'ordre de chargement : CONFIG.COC2BASE est peuplée au
  // top-level de coc2-base, donc déjà disponible au moment de ce hook init.
  //
  // TODO(univers cthulhien) : définir le mapping (renommage d'états de santé, seuils…).
  // Tant que ce bloc est vide, cth-base ne modifie PAS le comportement de coc2-base.
  //
  // Exemple :
  //   CONFIG.COC2BASE.healthStates.affaibli.name = "CTHBASE.status.choque"
  // ─────────────────────────────────────────────────────────────────────────────

  console.info("CTH Base | Fin de l'initialisation du module")
})

// ─────────────────────────────────────────────────────────────────────────────
// Réservé aux surcharges devant s'exécuter APRÈS le hook init de coc2-base
// (remplacement de CONFIG.Actor.documentClass, fiche makeDefault, statusEffects…).
// Le hook setup passe après tous les init : on est certain de repasser derrière
// coc2-base sans dépendre de l'ordre de chargement des modules.
// Non utilisé au démarrage — décommenter et remplir au besoin.
// ─────────────────────────────────────────────────────────────────────────────
// Hooks.once("setup", () => {
//   console.info("CTH Base | Setup...")
// })

Hooks.once("ready", async () => {
  console.info("CTH Base | Module prêt")
})
