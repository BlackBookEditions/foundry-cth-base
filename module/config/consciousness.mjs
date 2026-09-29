/*
 * Échelle de conscience : la seconde échelle de coc2-base, forcée visible et renommée dans l'univers
 * cthulhien. Ce fichier ne porte que les données ; leur application à CONFIG.COC2BASE se fait au hook
 * init, cf. config/system-patch.mjs.
 */

/** Profil mécanique forcé de l'Échelle de conscience. */
export const CONSCIOUSNESS_MODIFIER_PROFILE = {
  bonus: {
    ability: "vol",
    label: "CTHBASE.consciousness.modifiers.trauma",
    contextId: "cthTrauma",
    values: { secondState1: 1, secondState2: 3, secondState3: 5, secondState4: 10 },
  },
  malus: {
    ability: "cha",
    label: "CTHBASE.consciousness.modifiers.empathy",
    contextId: "",
    values: { secondState1: -1, secondState2: -3, secondState3: -5, secondState4: -10 },
  },
}

/**
 * Paliers de conscience, atteints aux échelons 5/10/15/20 (seuils 25/50/75/100 %).
 * Les clés sont celles des paliers de la seconde échelle de coc2-base ; les valeurs, le suffixe des
 * clés i18n `CTHBASE.consciousness.status.<clé>` et `…Description`.
 */
export const CONSCIOUSNESS_STATES = {
  secondState1: "profane",
  secondState2: "initie",
  secondState3: "eveille",
  secondState4: "illumine",
}
