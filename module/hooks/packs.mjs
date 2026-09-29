/**
 * Compendiums masqués (CONFIG.CTHBASE.hiddenPacks) : retirés de game.data.packs avant que Foundry ne crée
 * les compendiums du monde (Game#initializePacks, appelé par setupGame).
 *
 * Branché sur i18nInit, qui passe après TOUS les init et avant setupGame : un module de scénario peut donc
 * ajuster la liste dans son propre init. Le compendium n'existe alors pas côté client (onglet Compendiums,
 * game.packs, UUID) ; rien n'est modifié sur le serveur ni dans coc2-base, et désactiver cth-base le fait
 * réapparaître.
 */
export function onI18nInit() {
  for (const id of new Set(CONFIG.CTHBASE.hiddenPacks ?? [])) game.data.packs.findSplice((pack) => pack.id === id)
}
