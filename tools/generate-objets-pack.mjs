// Génère les sources YAML des compendiums du module (src/packs/<pack>), compilés ensuite par
// `npm run YMLtoLDB`.
//
// « CTH Témoin » (cth-temoin), ouvert aux joueurs :
//   Armes                          (armes de contact, de trait, de lancer, à feu, explosifs)
//   Armures
//   Capacités / <voie de base>     (5 capacités par voie, rangs 1 à 5)
//   Équipement divers              (objets courants et kits complets)
//   Voies                          (voies de base)
//
// « CTH Archiviste » (cth-archiviste), réservé au MJ (l'accès se règle par compendium dans
// module.json, pas par dossier) :
//   Magie mondaine / <voie>        (5 capacités par voie de magie mondaine)
//   Voies de la magie mondaine
//   Artefacts
//   Rituels / <rituel>             (un objet par rang, de 1 à 5)
//   Sortilèges / Rang <n>
//
// Les voies et capacités (noms, rangs, modifiers/actions) sont lues dans les macros de source/,
// utilisées telles quelles : macro-generate-objets-cth.js (voies de base, Livre du Témoin) et
// macro-generate-magie-mondaine-cth.js (magie mondaine, Livre de l'Archiviste). Le reste n'existant
// dans aucune macro, il est transcrit ci-dessous : armes, armures et objets depuis le chapitre IV du
// Livre du Témoin ; artefacts, rituels et sortilèges depuis le chapitre IV du Livre de l'Archiviste.
//
// Aucune description n'est reprise du livre : chaque objet renvoie à la page imprimée où il est
// décrit (page imprimée = page du PDF − 2 dans les deux livres).
//
// Les identifiants sont dérivés du nom de l'objet : régénérer le compendium conserve les UUID,
// et donc les liens voie ↔ capacités et les objets déjà glissés dans les mondes.
//
// Usage : node ./tools/generate-objets-pack.mjs (depuis la racine du module), puis npm run YMLtoLDB.

import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"
import vm from "node:vm"
import { dump } from "js-yaml"

const MODULE_ID = "cth-base"
const PACK_TEMOIN = "cth-temoin"
const PACK_ARCHIVISTE = "cth-archiviste"
const FOUNDRY_ICONS = "/mnt/c/Foundry14/public/icons"
const FALLBACK_ICON = "icons/svg/item-bag.svg"

const TEMOIN = "Livre du Témoin"
const ARCHIVISTE = "Livre de l'Archiviste"

const STATS = {
  compendiumSource: null,
  duplicateSource: null,
  coreVersion: "14.368",
  systemId: "co2",
  systemVersion: "2.3.12",
  createdTime: 1790553600000,
  modifiedTime: 1790553600000,
  lastModifiedBy: null,
  exportSource: null,
}

// ---------------------------------------------------------------------------------------------
// Pages imprimées : [page de la voie, [pages des capacités de rang 1 à 5]]
// ---------------------------------------------------------------------------------------------

const PAGES_VOIES = {
  "Voie des armes de contact": [74, [74, 74, 74, 74, 74]],
  "Voie des armes à distance": [74, [74, 74, 74, 75, 75]],
  "Voie des arts et des artisanats": [75, [75, 75, 75, 75, 76]],
  "Voie du combat à mains nues": [76, [76, 76, 76, 76, 76]],
  "Voie des corporations": [78, [78, 78, 78, 78, 78]],
  "Voie du discours": [78, [78, 78, 78, 79, 79]],
  "Voie de l'ésotérisme et de l'occultisme": [79, [79, 79, 79, 79, 79]],
  "Voie des exploits physiques": [79, [79, 79, 80, 80, 81]],
  "Voie de la furtivité": [81, [81, 81, 81, 81, 82]],
  "Voie de l'investigation": [82, [82, 82, 82, 82, 82]],
  "Voie des langues": [82, [82, 82, 82, 83, 83]],
  "Voie du malfrat": [83, [83, 83, 84, 84, 84]],
  "Voie de la mécanique": [84, [84, 84, 84, 84, 85]],
  "Voie de la médecine": [85, [85, 85, 85, 85, 87]],
  "Voie de la psychologie": [87, [87, 87, 87, 87, 87]],
  "Voie des sciences": [87, [88, 88, 88, 88, 88]],
  "Voie de la survie": [88, [88, 88, 89, 89, 89]],
  "Voie des véhicules": [89, [89, 89, 89, 89, 89]],
}

const PAGES_MAGIE = {
  "Voie de l’alchimie": [17, [17, 17, 17, 17, 17]],
  "Voie du chamanisme": [18, [18, 18, 18, 19, 19]],
  "Voie de la divination": [19, [19, 19, 20, 20, 20]],
  "Voie de l’exorcisme": [20, [20, 20, 21, 21, 21]],
  "Voie de l’hypnose": [21, [21, 22, 22, 22, 22]],
  "Voie de l’illusion": [22, [22, 22, 22, 23, 23]],
  "Voie de la magie astrale": [23, [23, 23, 23, 24, 24]],
  "Voie du magnétisme": [24, [24, 24, 26, 26, 26]],
  "Voie de la nécromancie": [26, [26, 26, 26, 27, 27]],
  "Voie de la providence": [27, [27, 27, 27, 28, 28]],
  "Voie du rêveur": [28, [28, 28, 28, 28, 28]],
  "Voie de la sorcellerie des campagnes": [30, [30, 30, 30, 30, 30]],
  "Voie du spiritisme": [32, [32, 32, 32, 32, 32]],
  "Voie du vaudou": [33, [33, 33, 33, 33, 33]],
}

// ---------------------------------------------------------------------------------------------
// Armes, armures et équipement (Livre du Témoin, chapitre IV)
// pages : page(s) de description + page du tableau ; prix en dollars, arrondi au dollar supérieur
// (le système n'accepte que des prix entiers) ; null = prix non donné par le livre.
// ---------------------------------------------------------------------------------------------

// Armes de contact : { nom, pages, dm, prix, img, deuxMains?, type, mods? }
const ARMES_CONTACT = [
  // Incapacitantes (description p. 100-101, tableau p. 102)
  { nom: "Batte de baseball", pages: [100, 102], dm: "1d6 + @for", prix: 10, img: "weapons/clubs/bat-baseball-wood.webp", type: "bludgeoning" },
  { nom: "Canne de combat", pages: [100, 102], dm: "1d4 + @for", prix: 120, img: "weapons/staves/staff-simple.webp", type: "bludgeoning" },
  { nom: "Fouet", pages: [100, 101, 102], dm: "1d4 + @for", prix: 90, img: "weapons/misc/whip-leather.webp", type: "bludgeoning" },
  { nom: "Matraque", pages: [100, 102], dm: "1d4+1 + @for", prix: 50, img: "weapons/clubs/baton-night-stick-truncheon.webp", type: "bludgeoning" },
  { nom: "Nunchaku", pages: [100, 101, 102], dm: "1d6 + @for", prix: 75, img: "weapons/misc/nunchaku.webp", type: "bludgeoning" },
  { nom: "Poing américain", pages: [101, 102], dm: "1d4 + @for", prix: 30, img: "weapons/fist/fist-knuckles-brass.webp", type: "bludgeoning" },
  { nom: "Tonfa", pages: [101, 102], dm: "1d4+1 + @for", prix: 25, img: "weapons/clubs/club-baton-brown.webp", type: "bludgeoning" },
  { nom: "Bâton", pages: [100, 102], dm: "1d6", prix: 10, img: "weapons/staves/staff-simple-gold.webp", type: "bludgeoning", deuxMains: true },
  { nom: "Grand maillet", pages: [100, 101, 102], dm: "1d8", prix: 75, img: "weapons/hammers/hammer-mallet-wood.webp", type: "bludgeoning", deuxMains: true,
    mods: [{ subtype: "combat", target: "init", value: "-4" }] },
  { nom: "Mains nues", pages: [100, 102], dm: "1d4 + @for", prix: null, img: "weapons/fist/boxing-gloves.webp", type: "bludgeoning" },
  // Létales (description p. 101-104, tableau p. 104)
  { nom: "Canne-épée", pages: [101, 104], dm: "1d6 + @for", prix: 250, img: "weapons/swords/sword-cane.webp", type: "piercing" },
  { nom: "Couteau, poignard", pages: [101, 104], dm: "1d4 + @for", prix: 10, img: "weapons/daggers/knife-simple.webp", type: "piercing" },
  { nom: "Épée", pages: [102, 104], dm: "1d8 + @for", prix: 250, img: "weapons/swords/sword-guard.webp", type: "slashing" },
  { nom: "Fleuret, rapière", pages: [102, 104], dm: "1d6 + @for", prix: 450, img: "weapons/swords/sword-guard-brass-worn.webp", type: "piercing" },
  { nom: "Hachette", pages: [102, 104], dm: "1d6 + @for", prix: 40, img: "weapons/axes/axe-broad-simple.webp", type: "slashing" },
  { nom: "Katana", pages: [102, 104], dm: "1d8 + @for", prix: 500, img: "weapons/swords/sword-katana-tan.webp", type: "slashing", uneOuDeuxMains: true },
  { nom: "Machette", pages: [104], dm: "1d6 + @for", prix: 40, img: "weapons/swords/machete.webp", type: "slashing" },
  { nom: "Sabre", pages: [104], dm: "1d8 + @for", prix: 350, img: "weapons/swords/scimitar-guard.webp", type: "slashing" },
  { nom: "Épieu, lance", pages: [102, 104], dm: "1d8 + @for", prix: 180, img: "weapons/polearms/spear-flared-steel.webp", type: "piercing", deuxMains: true },
  { nom: "Hache à deux mains", pages: [102, 104], dm: "1d10 + @for", prix: 80, img: "weapons/axes/axe-battle-simple.webp", type: "slashing", deuxMains: true },
]

// Armes à distance : { nom, pages, dm, portee, prix, img, deuxMains?, type, munitions?, atd? }
const ARMES_DISTANCE = [
  // Armes de trait (description p. 105, tableau p. 106)
  { nom: "Arbalète", pages: [105, 106], dm: "1d10", portee: 150, prix: 250, img: "weapons/crossbows/crossbow-heavy.webp", type: "piercing", deuxMains: true },
  { nom: "Arc", pages: [105, 106], dm: "1d8", portee: 100, prix: 150, img: "weapons/bows/shortbow-recurve.webp", type: "piercing", deuxMains: true },
  { nom: "Balestrin", pages: [105, 106], dm: "2d4", portee: 100, prix: 200, img: "weapons/crossbows/handcrossbow-black.webp", type: "piercing" },
  { nom: "Fronde", pages: [105, 106], dm: "1d4", portee: 30, prix: 5, img: "weapons/slings/slingshot-wood.webp", type: "bludgeoning" },
  { nom: "Sarbacane", pages: [105, 106], dm: "1d4", portee: 20, prix: 20, img: "weapons/ammunition/arrow-simple.webp", type: "piercing" },
  // Armes de lancer (description p. 105, tableau p. 106)
  { nom: "Bolas", pages: [105, 106], dm: "1d4", portee: 30, prix: 80, img: "weapons/thrown/bolas-stone.webp", type: "bludgeoning" },
  { nom: "Boomerang", pages: [105, 106], dm: "1d4 + @for", portee: 50, prix: 30, img: "weapons/thrown/boomerang.webp", type: "bludgeoning" },
  { nom: "Couteau de lancer", pages: [105, 106], dm: "1d6 + @for", portee: 20, prix: 20, img: "weapons/thrown/throwing-knife-flat-steel.webp", type: "piercing" },
  { nom: "Fléchette", pages: [105, 106], dm: "1d4 + @for", portee: 20, prix: 5, img: "weapons/thrown/dart-feathered.webp", type: "piercing" },
  { nom: "Hache de jet", pages: [105, 106], dm: "1d8 + @for", portee: 30, prix: 45, img: "weapons/thrown/throwing-axe-steel.webp", type: "slashing" },
  { nom: "Sagaie, javelot et harpon", pages: [105, 106], dm: "1d8 + @for", portee: 50, prix: 50, img: "weapons/polearms/javelin-simple.webp", type: "piercing" },
  // Armes à feu (description p. 106-108, tableau p. 108)
  { nom: "Arme de poing (petit calibre)", pages: [106, 107, 108], dm: "1d6", portee: 30, munitions: 6, prix: 30, img: "weapons/guns/pistol-revolver-short.webp", type: "piercing" },
  { nom: "Arme de poing (calibre moyen)", pages: [106, 107, 108], dm: "1d8", portee: 50, munitions: 6, prix: 150, img: "weapons/guns/pistol-revolver-steel.webp", type: "piercing" },
  { nom: "Arme de poing (gros calibre)", pages: [106, 107, 108], dm: "1d10", portee: 75, munitions: 7, prix: 250, img: "weapons/guns/pistol-handgun-large.webp", type: "piercing" },
  { nom: "Carabine", pages: [107, 108], dm: "1d8", portee: 80, munitions: 1, prix: 70, img: "weapons/guns/rifle-bolt-action.webp", type: "piercing", deuxMains: true },
  { nom: "Fusil de chasse", pages: [107, 108], dm: "1d10", portee: 50, munitions: 2, prix: 90, img: "weapons/guns/gun-double-barrel.webp", type: "piercing", deuxMains: true },
  { nom: "Fusil de précision", pages: [107, 108], dm: "1d8+2 + @per", atd: "@atd + @per", portee: 100, munitions: 5, prix: 200, img: "weapons/guns/rifle-sniper-long.webp", type: "piercing", deuxMains: true },
  { nom: "Fusil mitrailleur", pages: [107, 108], dm: "2d6", portee: 100, munitions: 25, prix: 600, img: "weapons/guns/machine-gun-silver.webp", type: "piercing", deuxMains: true },
  { nom: "Lance-flamme", pages: [107, 108], dm: "1d8+2", portee: 30, munitions: 10, prix: null, img: "weapons/guns/flamethrower-spray-fire-orange.webp", type: "", deuxMains: true },
  { nom: "Mitrailleuse", pages: [108], dm: "2d6", portee: 500, munitions: 50, prix: null, img: "weapons/guns/gun-chain-gatling-belt.webp", type: "piercing", deuxMains: true },
  { nom: "Pistolet mitrailleur", pages: [108], dm: "1d8", portee: 50, munitions: 25, prix: 150, img: "weapons/guns/gun-submachine-drum-magazine.webp", type: "piercing", deuxMains: true },
]

// Explosifs (p. 109) : le livre ne donne ni tableau de caractéristiques ni prix → aucune attaque
const EXPLOSIFS = [
  { nom: "Grenade à fragmentation", pages: [109], portee: 40, img: "weapons/thrown/grenade-round.webp" },
  { nom: "Grenade lacrymogène", pages: [109], portee: 40, img: "weapons/thrown/grenade-gas.webp" },
  { nom: "Dynamite", pages: [109], img: "weapons/thrown/explosive-dynamite-fuse.webp" },
  { nom: "Mine", pages: [109], img: "weapons/thrown/bomb-pressure-black.webp" },
]

// Armures : le seul équipement de protection du livre est l'encadré « Gilets pare-balles ? » (p. 108)
const ARMURES = [
  { nom: "Gilet rembourré", pages: [108], prix: null, img: "equipment/chest/vest-cloth-tattered-tan.webp",
    mods: [{ subtype: "combat", target: "dr", value: "3" }] },
]

// Équipement divers : objets courants (description p. 92-98, tableau p. 96) et kits complets (p. 97-98)
const DIVERS = [
  { nom: "Appareil photo à soufflet (portatif)", pages: [92, 96], prix: 10, img: "tools/tech/camera.webp" },
  { nom: "Appareil photo à soufflet (sur pied)", pages: [92, 96], prix: 30, img: "tools/tech/camera.webp" },
  { nom: "Camera box (Kodak No. 2)", pages: [92, 96], prix: 2, img: "tools/tech/camera-film.webp" },
  { nom: "Pellicule (6 poses)", pages: [92, 96], prix: 1, img: "tools/tech/projector-film.webp" },
  { nom: "Pellicule (36 poses)", pages: [92, 96], prix: 1, img: "tools/tech/projector-film.webp" },
  { nom: "Plaque photosensible", pages: [92, 96], prix: 1, img: "sundries/documents/document-bound-white.webp" },
  { nom: "Boussole", pages: [92, 96], prix: 1, img: "tools/navigation/compass-worn-copper.webp" },
  { nom: "Bouteille isotherme", pages: [93, 96], prix: 4, img: "sundries/survival/canteen-drinking.webp" },
  { nom: "Briquet", pages: [93, 96], prix: 1, img: "sundries/survival/fire-lighter-windproof.webp" },
  { nom: "Caisse à outils", pages: [93, 96], prix: null, img: "tools/hand/hammer-and-nail.webp" },
  { nom: "Couteau multifonction", pages: [93, 96], prix: 2, img: "weapons/daggers/knife-utility-red.webp" },
  { nom: "Couteau pliant de poche", pages: [93, 96], prix: 1, img: "weapons/daggers/knife-flat-bar.webp" },
  { nom: "Couteau suisse", pages: [93, 96], prix: 3, img: "weapons/daggers/knife-utility-red.webp" },
  { nom: "Jumelles (faible grossissement)", pages: [93, 96], prix: 10, img: "tools/navigation/spyglass-telescope-brass.webp" },
  { nom: "Jumelles (fort grossissement)", pages: [93, 96], prix: 24, img: "tools/navigation/spyglass-telescope-brass.webp" },
  { nom: "Lampe à carbure", pages: [95, 96], prix: 4, img: "sundries/lights/lantern-iron-lit-yellow.webp" },
  { nom: "Lampe à pétrole", pages: [95, 96], prix: 2, img: "sundries/lights/lantern-steel.webp" },
  { nom: "Lampe tempête à pétrole", pages: [95, 96], prix: 4, img: "sundries/lights/lantern-emergency-lit.webp" },
  { nom: "Lampe torche", pages: [95, 96], prix: 3, img: "sundries/lights/flash-light.webp" },
  { nom: "Machine à écrire", pages: [95, 96], prix: 60, img: "sundries/documents/document-letter-tan.webp" },
  { nom: "Malle de voyage (tôle)", pages: [95, 96], prix: 10, img: "containers/chest/chest-reinforced-steel-brown.webp" },
  { nom: "Malle de voyage (cuir)", pages: [95, 96], prix: 30, img: "containers/chest/chest-worn-oak-tan.webp" },
  { nom: "Phonographe (électrique)", pages: [95, 96], prix: 50, img: "tools/instruments/gramophone-vinyl-record-player.webp" },
  { nom: "Phonographe (mécanique)", pages: [95, 96], prix: 38, img: "tools/instruments/gramophone-vinyl-record-player.webp" },
  { nom: "Phonographe (de voyage)", pages: [95, 96], prix: 43, img: "tools/instruments/gramophone-vinyl-record-player.webp" },
  { nom: "Disque", pages: [95, 96], prix: 1, img: "tools/instruments/gramophone-vinyl-record-player.webp" },
  { nom: "Poste de radio (émetteur-récepteur)", pages: [96], prix: 130, img: "tools/instruments/microphone-stand-short.webp" },
  { nom: "Poste de radio (grand public)", pages: [96], prix: 50, img: "tools/instruments/microphone-stand-short.webp" },
  { nom: "Sac de couchage", pages: [96], prix: null, img: "sundries/survival/bedroll-grey.webp" },
  { nom: "Cartable (tissu)", pages: [96, 97], prix: 1, img: "containers/bags/satchel-leather-brown.webp" },
  { nom: "Cartable (cuir)", pages: [96, 97], prix: 3, img: "containers/bags/satchel-leather-brown.webp" },
  { nom: "Stylo-plume (classique)", pages: [96, 97], prix: 1, img: "tools/scribal/pen-steel-grey-brown.webp" },
  { nom: "Stylo-plume (de luxe)", pages: [96, 97], prix: 5, img: "tools/scribal/pen-steel-grey-brown.webp" },
  { nom: "Tente (une place)", pages: [96, 97], prix: 5, img: "sundries/survival/shelter-tent-small.webp" },
  { nom: "Tente (huit places)", pages: [96, 97], prix: 35, img: "sundries/survival/shelter-tent-small.webp" },
  { nom: "Valise (simple)", pages: [96, 98], prix: 2, img: "containers/bags/case-simple-brown.webp" },
  { nom: "Valise (de luxe)", pages: [96, 98], prix: 40, img: "containers/bags/case-embossed-leather-tan.webp" },
  // Kits complets
  { nom: "Matériel d'alpinisme", pages: [97, 98], prix: 20, img: "sundries/survival/rope-coiled-brown.webp" },
  { nom: "Matériel de camping", pages: [97, 98], prix: 50, img: "sundries/survival/shelter-tent-small.webp" },
  { nom: "Matériel de crochetage", pages: [97, 98], prix: 2, img: "sundries/misc/key-ring-long-silver.webp" },
  { nom: "Matériel de fouille", pages: [97, 98], prix: 10, img: "tools/hand/shovel-spade-steel-grey.webp" },
  { nom: "Matériel pour développer des photos", pages: [97, 98], prix: 30, img: "tools/laboratory/vials-blue-pink.webp" },
  { nom: "Trousse de secours", pages: [97, 98], prix: 10, img: "tools/medical/medkit-pills-silver.webp" },
]

// ---------------------------------------------------------------------------------------------
// Artefacts, rituels et sortilèges (Livre de l'Archiviste, chapitre IV)
// ---------------------------------------------------------------------------------------------

// Artefacts (p. 68-73) : sans prix ni attaque ; seul le bonus permanent de la Pierre de vision est encodé
const ARTEFACTS = [
  { nom: "Baguette tordue d'Einemarh", pages: [69], img: "magic/air/fog-gas-smoke-swirling-gray.webp" },
  { nom: "Clé des rêves", pages: [69], img: "sundries/misc/key-ornate-iron-black.webp" },
  { nom: "Cloche des morts", pages: [69], img: "tools/instruments/bell-brass-brown.webp" },
  { nom: "Masque vivant", pages: [70], img: "commodities/treasure/mask-bone-white.webp" },
  { nom: "Pierre de vision", pages: [70], img: "commodities/treasure/gem-framed-spiral-purple.webp",
    mods: [{ subtype: "skill", target: "per", value: "+3" }] },
  { nom: "Planétaire d'alignement", pages: [70], img: "tools/navigation/sextant-brass-brown.webp" },
  { nom: "Poteries d'Eltdown", pages: [70], img: "magic/symbols/runes-carved-stone-green.webp" },
  { nom: "Statuettes d'Yr-gastu", pages: [70, 71], img: "commodities/treasure/figurine-idol.webp" },
  { nom: "Tiare de l'Ordre ésotérique de Dagon", pages: [71], img: "equipment/head/crown-gold-blue.webp" },
  { nom: "Trapézoèdre luisant", pages: [71, 73], img: "commodities/gems/gem-faceted-round-black.webp" },
]

// Rituels (p. 73-79) : un objet par rang, le livre imposant d'apprendre un rituel pour un rang donné
const RITUELS = [
  { nom: "Rituel d'appel", pages: [77, 78, 79], img: "magic/unholy/silhouette-robe-evil-power.webp" },
  { nom: "Rituel d'ouverture de portail", pages: [75], img: "magic/unholy/orb-swirling-teal.webp" },
  { nom: "Rituel de protection", pages: [74, 75], img: "magic/unholy/barrier-shield-glowing-pink.webp" },
]

// Sortilèges (p. 79-87), par rang
const SORTILEGES = [
  { rang: 1, nom: "Égrégore", pages: [81], img: "magic/unholy/hands-circle-light-green.webp" },
  { rang: 1, nom: "Fermeture d'un portail dimensionnel", pages: [80], img: "magic/unholy/orb-contained-pink.webp" },
  { rang: 1, nom: "Sceau de N'Gah", pages: [80], img: "magic/symbols/rune-sigil-black-pink.webp" },
  { rang: 2, nom: "Appel du monde souterrain", pages: [81], img: "magic/death/hand-dirt-undead-zombie.webp" },
  { rang: 2, nom: "Au-delà du miroir", pages: [81], img: "magic/perception/orb-crystal-ball-scrying.webp" },
  { rang: 2, nom: "Feu des enfers", pages: [81], img: "magic/unholy/projectile-fireball-green.webp" },
  { rang: 2, nom: "Lien du sang", pages: [82], img: "magic/unholy/projectile-helix-blood-red.webp" },
  { rang: 2, nom: "Signes des Anciens", pages: [82], img: "magic/symbols/star-inverted-yellow.webp" },
  { rang: 2, nom: "Voix d'Azathoth", pages: [82], img: "magic/sonic/scream-wail-shout-teal.webp" },
  { rang: 3, nom: "Appeler/Congédier une nuée de Choses rats", pages: [82, 83], img: "magic/death/skull-pile-glowing-pink.webp" },
  { rang: 3, nom: "Bascule onirique", pages: [83], img: "commodities/treasure/dreamcatcher-purple.webp" },
  { rang: 3, nom: "Chasseur infernal", pages: [83], img: "magic/death/undead-ghost-scream-teal.webp" },
  { rang: 3, nom: "Envoûtement de l'âme", pages: [83], img: "magic/control/control-influence-puppet.webp" },
  { rang: 3, nom: "Familier innommable", pages: [83], img: "magic/death/skeleton-eye-skull-glow-orange.webp" },
  { rang: 3, nom: "Signe de Koth", pages: [83, 84], img: "magic/symbols/rune-sigil-green-purple.webp" },
  { rang: 4, nom: "Aspect innommable", pages: [84], img: "magic/unholy/silhouette-evil-horned-giant.webp" },
  { rang: 4, nom: "Clé onirique", pages: [84, 85], img: "sundries/misc/key-short-glowing.webp" },
  { rang: 4, nom: "Flétrissure", pages: [85], img: "magic/death/hand-withered-gray.webp" },
  { rang: 4, nom: "Réservoir d'âme", pages: [85, 86], img: "commodities/treasure/doll-mummy.webp" },
  { rang: 4, nom: "Sans visage aux cent visages", pages: [85], img: "magic/symbols/mask-metal-silver-white.webp" },
  { rang: 4, nom: "Signe du Bouc", pages: [85], img: "magic/death/skull-horned-goat-pentagram-red.webp" },
  { rang: 5, nom: "Homoncule de chair", pages: [86], img: "magic/death/blood-corruption-vomit-red.webp" },
  { rang: 5, nom: "Invoquer les hordes de Yog-Sothoth", pages: [86], img: "magic/perception/eye-tendrils-web-purple.webp" },
  { rang: 5, nom: "Mue ophidienne", pages: [87], img: "magic/death/skeleton-snake-skull-pink.webp" },
  { rang: 5, nom: "Totem maudit", pages: [87], img: "commodities/treasure/doll-voodoo.webp" },
]

// ---------------------------------------------------------------------------------------------
// Outils
// ---------------------------------------------------------------------------------------------

/** Identifiant Foundry (16 caractères alphanumériques) stable, dérivé d'une clé. */
function stableId(key) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  const bytes = createHash("sha256").update(key).digest()
  return Array.from(bytes.subarray(0, 16), (b) => alphabet[b % alphabet.length]).join("")
}

const uuid = (pack, id) => `Compendium.${MODULE_ID}.${pack}.Item.${id}`

/** « Livre du Témoin page 74 », « … pages 100-101 », « … pages 100 et 102 », « … pages 100, 101 et 102 » */
function reference(livre, pages) {
  const p = [...new Set(pages)].sort((a, b) => a - b)
  if (p.length === 1) return `<p>${livre} page ${p[0]}</p>`
  if (p.length === 2 && p[1] === p[0] + 1) return `<p>${livre} pages ${p[0]}-${p[1]}</p>`
  return `<p>${livre} pages ${p.slice(0, -1).join(", ")} et ${p.at(-1)}</p>`
}

// Les icônes sont vérifiées dans l'installation Foundry locale lorsqu'elle est présente
const missingIcons = new Set()
const checkIcons = existsSync(FOUNDRY_ICONS)
function icon(relative) {
  if (relative.startsWith("icons/")) return relative
  if (!checkIcons || existsSync(path.join(FOUNDRY_ICONS, relative))) return `icons/${relative}`
  missingIcons.add(relative)
  return FALLBACK_ICON
}

/** Charge une macro de source/ sans l'exécuter et renvoie les constantes demandées. */
function loadMacro(file, names) {
  let code = readFileSync(file, "utf8").replace(/^main\(\)\s*$/m, "")
  code += `\n;globalThis.__export = { ${names.join(", ")} }`
  const context = vm.createContext({})
  vm.runInContext(code, context, { filename: file })
  return context.__export
}

function folderDoc({ id, name, parent = null, sort, sorting = "m" }) {
  return {
    name, sorting, folder: parent, type: "Item", _id: id, description: "", sort, color: null, flags: {},
    _stats: { ...STATS }, _key: `!folders!${id}`,
  }
}

function itemDoc({ id, name, type, img, folder, sort, system }) {
  return {
    folder, name, type, img, _id: id, system, effects: [], sort,
    ownership: { default: 0 }, flags: {}, _stats: { ...STATS }, _key: `!items!${id}`,
  }
}

function buffAction(source, mods) {
  return {
    source, indice: 1, label: "", chatFlavor: "", type: "buff", img: "icons/svg/d20-highlight.svg",
    properties: { visible: false, enabled: false, activable: false, temporary: false, noManaCost: false },
    conditions: [{ predicate: "isEquipped" }],
    modifiers: mods.map((m) => ({
      type: "equipment", source, additionalInfos: "", subtype: m.subtype, target: m.target, apply: "self", value: m.value,
    })),
    resolvers: [],
  }
}

function attackAction(source, { melee, skill, dmg }) {
  return {
    source, indice: 0, label: "", chatFlavor: "", type: melee ? "melee" : "ranged", img: "icons/svg/d20-highlight.svg",
    properties: { visible: false, enabled: false, activable: true, temporary: false, noManaCost: false },
    conditions: [{ predicate: "isEquipped" }],
    resolvers: [{
      type: "attack", bonusDiceAdd: false, malusDiceAdd: false,
      skill: { formula: skill, crit: "", difficulty: "@cible.def" },
      dmg: { formula: dmg },
      target: { type: "none", number: "0", scope: "all" },
      additionalEffect: { active: false, applyOn: "success", statuses: [], duration: "0", unit: "round" },
    }],
    modifiers: [],
  }
}

const noRange = () => ({ value: null, unit: "", base: 0, ability: null, details: null, min: null, max: null, bonuses: { sheet: 0, effects: 0 } })
const rangeOf = (m) => ({ base: 0, ability: null, details: null, unit: "m", min: null, max: null, bonuses: { sheet: 0, effects: 0 }, value: m })

function equipmentSystem({ livre = TEMOIN, pages, subtype, martialCategory, damagetype = "", prix, equipable, reloadable = false, oneHand = false, twoHand = false, actions = [], extra = {} }) {
  return {
    description: reference(livre, pages),
    subtype, martialCategory, damagetype,
    price: { value: prix ?? 0, unit: "usd" },
    equipped: false,
    properties: { equipable, reloadable, stackable: false },
    usage: { oneHand, twoHand },
    actions, tags: [],
    ...extra,
  }
}

/** Rituel ou sortilège : capacité hors voie, action limitée, de rang donné. */
function capacitySystem({ pages, rank, spell }) {
  return {
    description: reference(ARCHIVISTE, pages), rank, learned: false, actionType: "l", properties: { spell },
  }
}

// ---------------------------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------------------------

const docs = { [PACK_TEMOIN]: [], [PACK_ARCHIVISTE]: [] }

const F = {
  armes: stableId("folder:Armes"),
  armures: stableId("folder:Armures"),
  capacites: stableId("folder:Capacités"),
  divers: stableId("folder:Équipement divers"),
  voies: stableId("folder:Voies"),
  magie: stableId("folder:Magie mondaine"),
  voiesMagie: stableId("folder:Voies de la magie mondaine"),
  artefacts: stableId("folder:Artefacts"),
  rituels: stableId("folder:Rituels"),
  sortileges: stableId("folder:Sortilèges"),
}
docs[PACK_TEMOIN].push(
  folderDoc({ id: F.armes, name: "Armes", sort: 100000, sorting: "a" }),
  folderDoc({ id: F.armures, name: "Armures", sort: 200000, sorting: "a" }),
  folderDoc({ id: F.capacites, name: "Capacités", sort: 300000 }),
  folderDoc({ id: F.divers, name: "Équipement divers", sort: 400000, sorting: "a" }),
  folderDoc({ id: F.voies, name: "Voies", sort: 500000 }),
)
docs[PACK_ARCHIVISTE].push(
  folderDoc({ id: F.magie, name: "Magie mondaine", sort: 100000 }),
  folderDoc({ id: F.voiesMagie, name: "Voies de la magie mondaine", sort: 200000 }),
  folderDoc({ id: F.artefacts, name: "Artefacts", sort: 300000, sorting: "a" }),
  folderDoc({ id: F.rituels, name: "Rituels", sort: 400000 }),
  folderDoc({ id: F.sortileges, name: "Sortilèges", sort: 500000 }),
)

/**
 * Crée une voie (dans voiesFolder) et ses capacités (dans un dossier à son nom sous capsFolder),
 * reliées dans les deux sens comme le font les macros.
 */
function addVoies({ pack, voies, pages, livre, prefix, voiesFolder, capsFolder, iconVoie, iconCap, subtype, buildAction }) {
  voies.forEach((voie, index) => {
    const pagesVoie = pages[voie.nom]
    if (!pagesVoie) throw new Error(`Page inconnue pour « ${voie.nom} »`)
    const [pageVoie, pagesCaps] = pagesVoie
    const sort = (index + 1) * 100000
    const voieId = stableId(`${prefix}:path:${voie.nom}`)
    const capFolderId = stableId(`${prefix}:folder:${voie.nom}`)
    docs[pack].push(folderDoc({ id: capFolderId, name: voie.nom, parent: capsFolder, sort }))

    const caps = [...voie.capacites].sort((a, b) => a.rang - b.rang)
    const capIds = caps.map((c) => stableId(`${prefix}:capacity:${voie.nom}:${c.rang}`))
    caps.forEach((c, i) => {
      const system = { description: reference(livre, [pagesCaps[c.rang - 1]]), rank: c.rang, learned: false, path: uuid(pack, voieId) }
      if (c.modifiers?.length) system.actions = [buildAction(uuid(pack, capIds[i]), c.nom, c.modifiers)]
      docs[pack].push(itemDoc({ id: capIds[i], name: c.nom, type: "capacity", img: iconCap, folder: capFolderId, sort: (i + 1) * 100000, system }))
    })

    docs[pack].push(itemDoc({
      id: voieId, name: voie.nom, type: "path", img: iconVoie, folder: voiesFolder, sort,
      system: { subtype, description: reference(livre, [pageVoie]), capacities: capIds.map((id) => uuid(pack, id)) },
    }))
  })
}

const base = loadMacro("source/macro-generate-objets-cth.js", ["VOIES", "buildAction", "ICON_VOIE", "ICON_CAP"])
addVoies({
  pack: PACK_TEMOIN, voies: base.VOIES, pages: PAGES_VOIES, livre: TEMOIN, prefix: "base",
  voiesFolder: F.voies, capsFolder: F.capacites, iconVoie: base.ICON_VOIE, iconCap: base.ICON_CAP,
  subtype: "profile", buildAction: base.buildAction,
})

const magie = loadMacro("source/macro-generate-magie-mondaine-cth.js", ["VOIES", "ICON_VOIE", "ICON_CAP"])
addVoies({
  pack: PACK_ARCHIVISTE, voies: magie.VOIES, pages: PAGES_MAGIE, livre: ARCHIVISTE, prefix: "magie",
  voiesFolder: F.voiesMagie, capsFolder: F.magie, iconVoie: magie.ICON_VOIE, iconCap: magie.ICON_CAP,
  subtype: "profile", buildAction: base.buildAction,
})

for (const a of ARMES_CONTACT) {
  const id = stableId(`equipment:${a.nom}`)
  const actions = [attackAction(uuid(PACK_TEMOIN, id), { melee: true, skill: "@atc", dmg: a.dm })]
  if (a.mods) actions.push(buffAction(uuid(PACK_TEMOIN, id), a.mods))
  docs[PACK_TEMOIN].push(itemDoc({
    id, name: a.nom, type: "equipment", img: icon(a.img), folder: F.armes, sort: 0,
    system: equipmentSystem({
      pages: a.pages, subtype: "weapon", martialCategory: "contact", damagetype: a.type, prix: a.prix, equipable: true,
      oneHand: !a.deuxMains, twoHand: !!a.deuxMains || !!a.uneOuDeuxMains, actions, extra: { range: noRange() },
    }),
  }))
}

for (const a of ARMES_DISTANCE) {
  const id = stableId(`equipment:${a.nom}`)
  const extra = { range: rangeOf(a.portee) }
  if (a.munitions) extra.charges = { current: a.munitions, max: a.munitions, destroyIfEmpty: false }
  docs[PACK_TEMOIN].push(itemDoc({
    id, name: a.nom, type: "equipment", img: icon(a.img), folder: F.armes, sort: 0,
    system: equipmentSystem({
      pages: a.pages, subtype: "weapon", martialCategory: a.munitions ? "feu" : "distance", damagetype: a.type, prix: a.prix,
      equipable: true, reloadable: !!a.munitions, oneHand: !a.deuxMains, twoHand: !!a.deuxMains,
      actions: [attackAction(uuid(PACK_TEMOIN, id), { melee: false, skill: a.atd ?? "@atd", dmg: a.dm })], extra,
    }),
  }))
}

for (const e of EXPLOSIFS) {
  const id = stableId(`equipment:${e.nom}`)
  docs[PACK_TEMOIN].push(itemDoc({
    id, name: e.nom, type: "equipment", img: icon(e.img), folder: F.armes, sort: 0,
    system: equipmentSystem({
      pages: e.pages, subtype: "weapon", martialCategory: "explosif", prix: null, equipable: true,
      extra: { range: e.portee ? rangeOf(e.portee) : noRange() },
    }),
  }))
}

for (const a of ARMURES) {
  const id = stableId(`equipment:${a.nom}`)
  const action = { ...buffAction(uuid(PACK_TEMOIN, id), a.mods), indice: 0 }
  docs[PACK_TEMOIN].push(itemDoc({
    id, name: a.nom, type: "equipment", img: icon(a.img), folder: F.armures, sort: 0,
    system: equipmentSystem({
      pages: a.pages, subtype: "armor", martialCategory: "protection", prix: a.prix, equipable: true,
      actions: [action], extra: { defense: null, magicalDefense: null },
    }),
  }))
}

for (const o of DIVERS) {
  const id = stableId(`equipment:${o.nom}`)
  docs[PACK_TEMOIN].push(itemDoc({
    id, name: o.nom, type: "equipment", img: icon(o.img), folder: F.divers, sort: 0,
    system: equipmentSystem({ pages: o.pages, subtype: "misc", martialCategory: "divers", prix: o.prix, equipable: false }),
  }))
}

for (const a of ARTEFACTS) {
  const id = stableId(`artefact:${a.nom}`)
  const actions = a.mods ? [{ ...buffAction(uuid(PACK_ARCHIVISTE, id), a.mods), indice: 0 }] : []
  docs[PACK_ARCHIVISTE].push(itemDoc({
    id, name: a.nom, type: "equipment", img: icon(a.img), folder: F.artefacts, sort: 0,
    system: equipmentSystem({
      livre: ARCHIVISTE, pages: a.pages, subtype: "misc", martialCategory: "artefact", prix: null, equipable: true, actions,
    }),
  }))
}

RITUELS.forEach((r, index) => {
  const folder = stableId(`rituel:folder:${r.nom}`)
  docs[PACK_ARCHIVISTE].push(folderDoc({ id: folder, name: r.nom, parent: F.rituels, sort: (index + 1) * 100000 }))
  for (let rang = 1; rang <= 5; rang++) {
    docs[PACK_ARCHIVISTE].push(itemDoc({
      id: stableId(`rituel:${r.nom}:${rang}`), name: `${r.nom} (rang ${rang})`, type: "capacity", img: icon(r.img),
      folder, sort: rang * 100000, system: capacitySystem({ pages: r.pages, rank: rang, spell: false }),
    }))
  }
})

for (let rang = 1; rang <= 5; rang++) {
  const folder = stableId(`sortilege:folder:${rang}`)
  docs[PACK_ARCHIVISTE].push(folderDoc({ id: folder, name: `Rang ${rang}`, parent: F.sortileges, sort: rang * 100000, sorting: "a" }))
  for (const s of SORTILEGES.filter((x) => x.rang === rang)) {
    docs[PACK_ARCHIVISTE].push(itemDoc({
      id: stableId(`sortilege:${s.nom}`), name: s.nom, type: "capacity", img: icon(s.img), folder, sort: 0,
      system: capacitySystem({ pages: s.pages, rank: rang, spell: true }),
    }))
  }
}

// ---------------------------------------------------------------------------------------------
// Écriture
// ---------------------------------------------------------------------------------------------

for (const [pack, packDocs] of Object.entries(docs)) {
  const ids = new Set()
  for (const d of packDocs) {
    if (ids.has(d._id)) throw new Error(`Identifiant en double dans ${pack} : ${d._id} (${d.name})`)
    ids.add(d._id)
  }

  const outDir = path.join("src", "packs", pack)
  rmSync(outDir, { recursive: true, force: true })
  mkdirSync(outDir, { recursive: true })
  for (const d of packDocs) {
    const prefix = d._key.startsWith("!folders!") ? "folders" : d.type
    const file = `${prefix}_${d.name.replace(/[^a-zA-Z0-9А-я]/g, "_")}_${d._id}.yml`
    writeFileSync(path.join(outDir, file), dump(structuredClone(d), { lineWidth: -1 }))
  }

  const count = (pred) => packDocs.filter(pred).length
  console.log(`${packDocs.length} documents écrits dans ${outDir} :`)
  console.log(`  ${count((d) => d._key.startsWith("!folders!"))} dossiers, ${count((d) => d.type === "path")} voies, ${count((d) => d.type === "capacity")} capacités, ${count((d) => d.type === "equipment")} équipements`)
}
if (missingIcons.size) console.warn(`Icônes introuvables (remplacées par ${FALLBACK_ICON}) :\n  ${[...missingIcons].join("\n  ")}`)
