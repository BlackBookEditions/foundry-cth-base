import COC2EncounterSheet from "../../../coc2-base/module/applications/encounter-sheet.mjs"
import { getSecondScaleContext, updateSecondScale } from "../../../coc2-base/module/config/coc2.mjs"
import { getVolDifficulty, getRitualDifficulty, HORROR_RANK } from "../config/cth.mjs"

/**
 * Fiche d'adversaire cth-base : ajoute à la fiche coc2-base deux notions propres à Cthulhu Origines.
 * - Créatures (pas d'archétype, une TAI) : un Rang d'horreur (1-5), les difficultés VOL/rituel dérivées,
 *   et un bouton qui provoque un test de VOL de prise de conscience chez les témoins ciblés.
 * - Antagonistes humains (archétype) : le ruban de l'Échelle de conscience, comme les personnages.
 * Seul le header est surchargé ; la barre latérale (Init/DEF/RD/furtivité/santé…) reste celle de coc2-base.
 */
export default class CTHEncounterSheet extends COC2EncounterSheet {
  static DEFAULT_OPTIONS = {
    classes: ["coc2"],
    actions: {
      clickSecondScale: CTHEncounterSheet.#onClickSecondScale,
      rollHorrorSave: CTHEncounterSheet.#onRollHorrorSave,
    },
  }

  /** @override */
  static PARTS = foundry.utils.mergeObject(
    super.PARTS,
    {
      header: { template: "modules/cth-base/templates/actors/encounter-header.hbs" },
    },
    { inplace: false },
  )

  /** @inheritDoc */
  async _prepareContext() {
    const context = await super._prepareContext()

    // Antagonistes humains : ruban de l'Échelle de conscience. Réutilise tout le contexte du ruban de
    // coc2-base (libellés « Échelle de conscience » + paliers Profane/Initié/… déjà posés par cth au init).
    Object.assign(context, getSecondScaleContext(this.document))

    // Créatures : Rang d'horreur et rappels de difficulté (VOL et rituels).
    const rank = this.document.system.details.rank
    context.rank = rank
    // 0 = « aucun rang » comme option explicite (et non une option vide, qui enverrait null au NumberField)
    context.rankChoices = { 0: game.i18n.localize("CTHBASE.encounter.rank.none"), ...Object.fromEntries(Object.keys(HORROR_RANK).map((r) => [r, r])) }
    if (context.isCreature && rank) {
      context.volDifficulty = getVolDifficulty(rank)
      context.ritualDifficulty = getRitualDifficulty(rank)
      context.fumbleRange = rank > 1 ? `1-${rank}` : "1"
    }

    return context
  }

  /**
   * Clic sur un échelon de l'Échelle de conscience : coche jusqu'à l'échelon cliqué, ou décoche le dernier.
   * @param {PointerEvent} event
   * @param {HTMLElement} target
   */
  static async #onClickSecondScale(event, target) {
    await updateSecondScale(this.document, Number(target.dataset.echelon))
  }

  /**
   * Provoque un test de VOL de prise de conscience chez les témoins ciblés sur le canevas.
   * Chaque acteur ciblé effectue un test de VOL à la difficulté dérivée du Rang de la créature
   * (rollSkill accepte nativement une difficulté numérique, cf. co2 Actor#rollSkill).
   * @param {PointerEvent} event
   * @param {HTMLElement} target
   */
  static async #onRollHorrorSave(event, target) {
    const rank = this.document.system.details.rank
    const difficulty = getVolDifficulty(rank)
    if (!difficulty) return ui.notifications.warn(game.i18n.localize("CTHBASE.encounter.volTest.noRank"))

    const witnesses = Array.from(game.user.targets)
      .map((token) => token.actor)
      .filter(Boolean)
    if (!witnesses.length) return ui.notifications.warn(game.i18n.localize("CTHBASE.encounter.volTest.noWitness"))

    const chatFlavor = game.i18n.format("CTHBASE.encounter.volTest.flavor", { name: this.document.name, difficulty })
    for (const witness of witnesses) {
      await witness.rollSkill("vol", { difficulty, chatFlavor })
    }
  }
}
