import { CONSCIOUSNESS_MODIFIER_PROFILE, CONSCIOUSNESS_STATES } from "./consciousness.mjs"

/*
 * Ce que cth-base impose aux couches en dessous : le système co2 (`game.system.CONST`) et le module
 * coc2-base (`CONFIG.COC2BASE`).
 *
 * Trois moments distincts, d'où trois fonctions :
 *  - applyStatusProfile() au chargement du script, avant tout hook — coc2-base a déjà exposé
 *    CONFIG.COC2BASE grâce à la dépendance obligatoire, mais son hook init n'a pas encore construit
 *    CONFIG.statusEffects, donc cth peut encore en modifier la composition sans recopier le catalogue ;
 *  - patchSystemConstants() et applyCoc2BaseOverrides() au hook init.
 */

/**
 * Profil des états CTH : composition de la liste des statuts et malus associés.
 * À appeler au chargement du script, PAS dans un hook (cf. en-tête).
 */
export function applyStatusProfile() {
  CONFIG.COC2BASE.removedStatusIds = [...CONFIG.COC2BASE.removedStatusIds.filter((id) => id !== "stun"), "unconscious"]
  Object.assign(CONFIG.COC2BASE.statusChanges, {
    blind: { init: -5, def: -5 },
    stun: { def: -5 },
  })
  Object.assign(CONFIG.COC2BASE.statusOverrides, {
    blind: { name: "CTHBASE.status.blind", description: "CTHBASE.status.blindDescription" },
    stun: { name: "CTHBASE.status.stun", description: "CTHBASE.status.stunDescription" },
    immobilized: { name: "CTHBASE.status.immobilized", description: "CTHBASE.status.immobilizedDescription" },
  })
}

/**
 * Surcharges du système co2. À appeler depuis le hook init.
 */
export function patchSystemConstants() {
  // Dans CTH, toute attaque contre une cible immobilisée est critique. Inconscient n'est pas un
  // état autonome : toute tentative de l'appliquer passe par Immobilisé, y compris depuis une
  // ancienne capacité COC2 ou un appel direct à toggleStatusEffect.
  game.system.CONST.statusRules.incomingAttack.immobilized = { automaticCritical: "all" }
  game.system.CONST.statusRules.replacements.unconscious = "immobilized"
}

/**
 * Surcharges de CONFIG.COC2BASE : vocabulaire de l'échelle de santé et Échelle de conscience.
 *
 * Sûr au hook init quel que soit l'ordre de chargement : CONFIG.COC2BASE est peuplée au top-level de
 * coc2-base, donc déjà disponible.
 */
export function applyCoc2BaseOverrides() {
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
  CONFIG.COC2BASE.secondScale.modifierProfile = CONSCIOUSNESS_MODIFIER_PROFILE

  // Paliers de conscience atteints aux échelons 5/10/15/20 : Profane, Initié, Éveillé, Illuminé.
  // Le profil de modificateurs est fixé ci-dessus ; on adapte ici leurs libellés.
  for (const [id, key] of Object.entries(CONSCIOUSNESS_STATES)) {
    CONFIG.COC2BASE.secondScale.states[id].name = `CTHBASE.consciousness.status.${key}`
    CONFIG.COC2BASE.secondScale.states[id].description = `CTHBASE.consciousness.status.${key}Description`
  }
}
