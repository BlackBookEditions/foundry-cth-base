import { CTH_CONFIG } from "./module/config/cth.mjs"
import CTHEncounterData from "./module/models/encounter.mjs"
import CTHEncounterSheet from "./module/applications/encounter-sheet.mjs"

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
  // ─────────────────────────────────────────────────────────────────────────────

  // Échelle de santé : le vocabulaire s'adapte à l'univers cthulhien.
  // L'échelon 20 (« mourant ») s'affiche « Meurtri » — le même objet est référencé par le
  // statut posé sur le token, donc la mutation se répercute partout ; le libellé est
  // localisé ensuite par le hook i18nInit du système (postérieur à ce init).
  CONFIG.COC2BASE.healthStates.mourant.name = "CTHBASE.status.meurtri"

  // Seconde échelle : forcée visible et renommée « Échelle de conscience » dans l'univers cthulhien.
  // Compteur avec libellé de palier affiché sur la fiche, SANS statut de token. Le libellé est lu au
  // rendu de la fiche ; le flag `forced` la rend visible sans dépendre du réglage de monde.
  CONFIG.COC2BASE.secondScale.forced = true
  CONFIG.COC2BASE.secondScale.label = "CTHBASE.consciousnessScale.label"
  CONFIG.COC2BASE.secondScale.labelShort = "CTHBASE.consciousnessScale.short"

  // Paliers de conscience atteints aux échelons 5/10/15/20 (seuils 25/50/75/100 %) : Profane, Initié,
  // Éveillé, Illuminé. Affichage seul (aucun statut, aucun modificateur) : on ne renomme que le libellé
  // et la description du niveau affiché sur la fiche.
  const consciousnessStates = { secondState1: "profane", secondState2: "initie", secondState3: "eveille", secondState4: "illumine" }
  for (const [id, key] of Object.entries(consciousnessStates)) {
    CONFIG.COC2BASE.secondScale.states[id].name = `CTHBASE.consciousness.status.${key}`
    CONFIG.COC2BASE.secondScale.states[id].description = `CTHBASE.consciousness.status.${key}Description`
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Adversaires : modèle et fiche cth surchargeant ceux de coc2-base.
  //
  // Sûr ici : cth-base requiert coc2-base, donc son script est chargé après et son hook init est
  // enregistré après celui de coc2-base. Les callbacks init s'exécutant dans l'ordre d'enregistrement,
  // coc2-base a déjà posé CONFIG.Actor.dataModels.encounter et enregistré sa fiche ; on repasse derrière.
  // Le data model est enregistré au init (et non au setup), pour être disponible avant la préparation
  // des acteurs. Ajoute le Rang d'horreur des créatures et l'Échelle de conscience des antagonistes.
  // ─────────────────────────────────────────────────────────────────────────────
  CONFIG.Actor.dataModels.encounter = CTHEncounterData
  foundry.documents.collections.Actors.registerSheet("cth-base", CTHEncounterSheet, {
    types: ["encounter"],
    makeDefault: true,
    label: "CTHBASE.sheet.encounter",
  })

  console.info("CTH Base | Fin de l'initialisation du module")
})

// ─────────────────────────────────────────────────────────────────────────────
// Surcharges devant s'exécuter APRÈS le hook init de coc2-base. Le hook setup passe
// après tous les init : on est certain de repasser derrière coc2-base sans dépendre
// de l'ordre de chargement des modules.
// ─────────────────────────────────────────────────────────────────────────────
Hooks.once("setup", () => {
  // Le réglage coc2 « Afficher la seconde échelle » est sans effet en cth : l'échelle de Conscience
  // est déjà forcée visible (CONFIG.COC2BASE.secondScale.forced = true, cf. init ci-dessus). On le
  // retire du menu des réglages de monde pour éviter la confusion. Au setup (après tous les init),
  // le réglage est garanti enregistré par coc2-base quel que soit l'ordre de chargement.
  const setting = game.settings.settings.get("coc2-base.showSecondScale")
  if (setting) setting.config = false
})

Hooks.once("ready", async () => {
  console.info("CTH Base | Module prêt")
})
