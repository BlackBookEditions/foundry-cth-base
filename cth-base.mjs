// Configuration
import * as config from "./module/config/cth.mjs"
import { registerSettings, hideCoc2ScaleSettings } from "./module/config/settings.mjs"
import { applyStatusProfile, patchSystemConstants, applyCoc2BaseOverrides } from "./module/config/system-patch.mjs"

// Import modules
import * as models from "./module/models/_module.mjs"
import * as applications from "./module/applications/_module.mjs"
import * as hooks from "./module/hooks/_module.mjs"

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
  ...config.CTH_CONFIG,
}

// Profil des états CTH, posé au chargement du script et non dans un hook : coc2-base a déjà exposé
// CONFIG.COC2BASE, mais son hook init n'a pas encore construit CONFIG.statusEffects (cf. applyStatusProfile).
applyStatusProfile()

Hooks.once("i18nInit", hooks.onI18nInit)

Hooks.once("init", () => {
  console.info("CTH Base | Initialisation du module...")

  // Expose the module API
  game.modules.get("cth-base").api = {
    models,
    applications,
    hooks,
    config,
  }

  // Règles d'états propres à CTH, imposées au système co2
  patchSystemConstants()

  registerSettings()

  // Vocabulaire de l'échelle de santé et Échelle de conscience, imposés à coc2-base
  applyCoc2BaseOverrides()

  // ─────────────────────────────────────────────────────────────────────────────
  // Adversaires : modèle et fiche cth surchargeant ceux de coc2-base.
  //
  // Sûr ici : cth-base requiert coc2-base, donc son script est chargé après et son hook init est
  // enregistré après celui de coc2-base. Les callbacks init s'exécutant dans l'ordre d'enregistrement,
  // coc2-base a déjà posé CONFIG.Actor.dataModels.encounter et enregistré sa fiche ; on repasse derrière.
  // Le data model est enregistré au init (et non au setup), pour être disponible avant la préparation
  // des acteurs. Ajoute le Rang d'horreur des créatures et l'Échelle de conscience des antagonistes.
  // ─────────────────────────────────────────────────────────────────────────────
  CONFIG.Actor.dataModels.encounter = models.CTHEncounterData
  foundry.documents.collections.Actors.registerSheet("cth-base", applications.CTHEncounterSheet, {
    types: ["encounter"],
    makeDefault: true,
    label: "CTHBASE.sheet.encounter",
  })

  console.info("CTH Base | Fin de l'initialisation du module")
})

// Surcharge devant s'exécuter APRÈS le hook init de coc2-base : le hook setup passe après tous les init,
// on repasse donc derrière coc2-base sans dépendre de l'ordre de chargement des modules.
Hooks.once("setup", hideCoc2ScaleSettings)

Hooks.once("ready", () => {
  console.info("CTH Base | Module prêt")

  // Notes de version du module (garde MJ interne à displayIfNeeded)
  applications.CTHReleaseNotes.displayIfNeeded()
})

// Retouches de l'interface du système, implémentées dans module/hooks/
Hooks.on("renderCOSidebarMenu", hooks.onRenderSidebarMenu)
