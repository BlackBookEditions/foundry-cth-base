/**
 * Enregistre les réglages du module. À appeler depuis le hook init.
 */
export function registerSettings() {
  // Dernière version des notes affichée (voir applications.CTHReleaseNotes) : scope "user" pour que
  // chaque MJ ait son propre suivi de lecture, config: false car piloté par la case à cocher de la fenêtre.
  game.settings.register("cth-base", "lastReleaseNotesSeen", {
    scope: "user",
    config: false,
    type: String,
    default: "",
  })
}

/**
 * Retire des réglages de monde ceux de coc2-base qui sont sans objet en CTH.
 *
 * À appeler depuis le hook setup, et non init : le hook setup passe après TOUS les init, donc le
 * réglage est garanti enregistré par coc2-base quel que soit l'ordre de chargement des modules.
 */
export function hideCoc2ScaleSettings() {
  // Le réglage coc2 « Afficher la seconde échelle » est sans effet en cth : l'échelle de Conscience
  // est déjà forcée visible (CONFIG.COC2BASE.secondScale.forced = true, cf. applyCoc2BaseOverrides).
  // On le retire du menu des réglages de monde pour éviter la confusion.
  const setting = game.settings.settings.get("coc2-base.showSecondScale")
  if (setting) setting.config = false
  game.settings.menus.delete("coc2-base.secondScaleConfiguration")
}
