/**
 * Configuration d'univers de cth-base.
 *
 * Objet fusionné dans CONFIG.CTHBASE au chargement du module (cf. cth-base.mjs).
 * Placeholder pour l'instant : à enrichir au fil de l'implémentation de l'univers cthulhien.
 *
 * @example Map de surcharge des états de santé de coc2-base (à appliquer dans le hook init)
 * export const HEALTH_STATE_OVERRIDES = {
 *   affaibli: { name: "CTHBASE.status.choque" },
 * }
 */
export const CTH_CONFIG = {}

/**
 * Rang d'horreur des créatures (Livre de l'Archiviste, tableau « Rang de la source », p. 9).
 * Le Rang (1 à 5) d'une créature ou d'une entité détermine :
 * - la difficulté du test de VOL de prise de conscience (= rang × 5) ;
 * - la plage d'échec critique de ce test (résultats 1 à rang) ;
 * - la difficulté des rituels d'appel/protection la concernant (= 5 × rang).
 */
export const HORROR_RANK = {
  1: { vol: 5, fumbleMax: 1 },
  2: { vol: 10, fumbleMax: 2 },
  3: { vol: 15, fumbleMax: 3 },
  4: { vol: 20, fumbleMax: 4 },
  5: { vol: 25, fumbleMax: 5 },
}

/**
 * Difficulté du test de VOL provoqué par une créature de Rang donné (5 × rang).
 * @param {number} rank Rang de la créature (0 = aucun)
 * @returns {number} Difficulté, 0 si le rang n'est pas renseigné
 */
export function getVolDifficulty(rank) {
  return HORROR_RANK[rank]?.vol ?? 0
}

/**
 * Difficulté des rituels d'appel/protection d'une créature/entité de Rang donné (5 × rang).
 * @param {number} rank Rang de la créature (0 = aucun)
 * @returns {number} Difficulté, 0 si le rang n'est pas renseigné
 */
export function getRitualDifficulty(rank) {
  return rank ? rank * 5 : 0
}
