/**
 * Configuration publique du module et point d'entrée de compatibilité.
 *
 * Le reste de la configuration est découpé par domaine dans les fichiers voisins ; ce barrel préserve les
 * imports historiques de ce chemin (tests, modules de scénario). Au sein du module, préférer l'import
 * direct du fichier de domaine : `import { HORROR_RANK } from "../config/horror-rank.mjs"`.
 *
 * `settings.mjs` n'est volontairement pas ré-exporté : c'est de l'enregistrement, pas de la donnée.
 */
export * from "./consciousness.mjs"
export * from "./horror-rank.mjs"
export * from "./system-patch.mjs"

/**
 * Configuration d'univers de cth-base, fusionnée dans CONFIG.CTHBASE au chargement du module.
 * Placeholder pour l'instant : à enrichir au fil de l'implémentation de l'univers cthulhien.
 *
 * @example Map de surcharge des états de santé de coc2-base (à appliquer dans le hook init)
 * export const HEALTH_STATE_OVERRIDES = {
 *   affaibli: { name: "CTHBASE.status.choque" },
 * }
 */
export const CTH_CONFIG = {
  /**
   * Compendiums d'autres modules retirés du monde quand cth-base est actif (identifiants `module.pack`).
   * « COC2 Objets » fait doublon avec « CTH Témoin » ; le guide de coc2-base reste, le guide CTH y renvoie.
   * Lu au hook i18nInit (cf. module/hooks/packs.mjs) : un module de scénario peut encore modifier la liste
   * dans son propre init.
   * @type {string[]}
   */
  hiddenPacks: ["coc2-base.coc2-objets-sans-description"],
}
