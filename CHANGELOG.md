# 0.9.0
- Ajout du compendium du témoin. Armes, armures, capacités par voie, équipement divers, voies de base. Les descriptions renvoient à la page au lieu de reprendre le texte.
- Ajout du compendium de l'archiviste. Artefacts, rituels, sortilèges, voies de la magie mondaine. Les descriptions renvoient à la page au lieu de reprendre le texte.
- Ajout du compendium « CTH Guide du module » : guide des fonctionnalités propres à Cthulhu Origines (échelle de conscience, rang d'horreur, états, compendiums, thème visuel), avec la mise en forme du guide COC2.
- Notes de version intégrées, comme dans COC2 : une fenêtre s'ouvre au MJ après une mise à jour (case « Ne plus afficher les notes de ces versions »), et reste consultable via le bouton « Notes de version » de la section Cthulhu Origines du menu latéral.

# 0.8.2
- Statuts propres à Cthulhu Origines :
  - Aveuglé : -5 en Initiative et en Défense, et -10 aux actions basées sur la vue (réduit à -5 sur un test de Perception réussi)
  - Étourdi : -5 en Défense, aucune action possible
  - Immobilisé : aucune action physique ni déplacement possible, toute attaque reçue est automatiquement une réussite critique
  - Inconscient n'est plus un statut autonome : il est remplacé par Immobilisé, y compris depuis une capacité héritée de COC2
- Ajout des effets de l'échelle de conscience :
  - Echelon 5 (Profane) : +1 aux tests de VOL requis lors d’événements traumatisants (et -1 aux tests de CHA d'empathie)
  - Échelon 10 (Initié) : +3 aux tests de VOL (et -3 aux tests de CHA)
  - Échelon 15 (Éveillé) : +5 aux tests de VOL (et -5 aux tests de CHA)
  - Échelon 20 (Illuminé) : +10 aux tests de VOL (et -10 aux tests de CHA)


# 0.8.0

## Adversaires

- Rang d'horreur des créatures (1 à 5), distinct de la Taille et coexistant avec elle sur le statblock du bestiaire. Il détermine la difficulté du test de VOL de prise de conscience (5 × Rang), sa plage d'échec critique (résultats 1 à Rang) et la difficulté des rituels d'appel et de protection concernant la créature
- En lecture, le libellé « Rang X » porte en infobulle le détail VOL + rituel ; l'icône d20 accolée, visible du MJ, déclenche le test de VOL sur les témoins ciblés (tokens sélectionnés)
- Échelle de conscience sur les adversaires, comme sur les personnages : les antagonistes humains la portent sur leur profil
- Sélecteur de taille des créatures préfixé « Taille … », le champ n'ayant pas de libellé propre dans l'en-tête. Les archétypes humains conservent les libellés de `coc2-base`
- Aides à la création affichées uniquement en cas d'écart avec le profil — points de caractéristiques, plafond par caractéristique ou nombre de capacités. Tout conforme, rien ne s'affiche ; l'écart n'est jamais bloquant

## Interface

- Identité visuelle propre à l'univers cthulhien : polices de grimoire pour les titres et manuscrite pour le nom du personnage, spirales décoratives, palette et habillage propres des échelles
- Échelle de conscience : échelons cochés et jalons atteints en rouge sang, comme l'échelle de Santé
- Cartes de chat lisibles en thème sombre : même correctif que `coc2-base`, dont la feuille était écrasée par la palette de `cth-base`, chargée après
- Noms longs : l'ellipse est rétablie sur les fiches d'adversaire et de personnage, le nom n'étant plus rogné verticalement ni recouvert par le ruban de l'échelle de conscience

## Réglages

- Le réglage « Afficher la seconde échelle » de `coc2-base` est retiré du menu des réglages de monde : l'Échelle de conscience est toujours visible en Cthulhu Origines, le réglage y était donc sans effet

## Technique

- Imports du point d'entrée alignés sur le mécanisme du système `co2` : un barrel `_module.mjs` par dossier, consommé par des imports de namespace
- Le module expose son API sous `game.modules.get("cth-base").api` (`models`, `applications`, `config`), sur le modèle de `game.system.api`

# 0.7.0

Première version du module : surcouche de `coc2-base` adaptant l'univers aux règles de Chroniques Oubliées Cthulhu Origines.

## Fiche de personnage

- Échelle de santé : l'échelon « mourant » s'affiche « Meurtri »
- Seconde échelle forcée visible et renommée « Échelle de conscience »
- Paliers de conscience Profane / Initié / Éveillé / Illuminé aux échelons 5, 10, 15 et 20 (affichage seul, sans statut ni modificateur)

