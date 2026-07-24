import COC2EncounterData from "../../../coc2-base/module/models/encounter.mjs"
import { SECOND_SCALE } from "../../../coc2-base/module/config/coc2.mjs"

/**
 * Data model des adversaires cth-base : ajoute au modèle coc2-base deux notions propres à Cthulhu Origines.
 * - details.rank : Rang d'horreur (1 à 5) d'une créature, INDÉPENDANT de la TAI (details.size). Les deux
 *   coexistent sur le statblock du bestiaire (« TAI n | RANG n »). Le Rang pilote la difficulté du test de
 *   VOL de prise de conscience et celle des rituels d'appel/protection (Livre de l'Archiviste, « Rang de la
 *   source »).
 * - attributes.secondScale : Échelle de conscience, comme les personnages. Les antagonistes humains la
 *   portent sur leur profil (ex. « Échelle de conscience 5/20 (Profane) »). Le schéma character ne l'exposant
 *   que sur les personnages, on la recopie ici pour les adversaires.
 */
export default class CTHEncounterData extends COC2EncounterData {
  /** @inheritDoc */
  static defineSchema() {
    const fields = foundry.data.fields
    const schema = super.defineSchema()

    // Rang d'horreur d'une créature. 0 = non renseigné. Le champ reste au schéma quel que soit le type
    // d'adversaire ; il n'est proposé à la saisie que pour les créatures (cf. la fiche).
    const rank = new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0, min: 0, max: 5 })
    rank.name = "rank"
    rank.parent = schema.details
    schema.details.fields.rank = rank

    // Échelle de conscience : value = nombre d'échelons cochés (0 = échelle vide). max dérivé en
    // prepareDerivedData. Schéma identique à celui des personnages (cf. COC2CharacterData.defineSchema).
    const attributes = schema.attributes
    const secondScale = new fields.SchemaField({
      value: new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0, min: 0 }),
    })
    secondScale.name = "secondScale"
    secondScale.parent = attributes
    attributes.fields.secondScale = secondScale

    return schema
  }

  /** @inheritDoc */
  prepareDerivedData() {
    super.prepareDerivedData()
    // Taille fixe issue de la config, comme pour les personnages
    this.attributes.secondScale.max = SECOND_SCALE.max
    if (this.attributes.secondScale.value > this.attributes.secondScale.max) this.attributes.secondScale.value = this.attributes.secondScale.max
  }
}
