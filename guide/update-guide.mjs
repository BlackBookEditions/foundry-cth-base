// Met à jour les pages du guide du module
main()

async function main() {
  const compendiumName = "cth-base.cth-guide-du-module"

  // Fait le lien entre un fichier html et l'id d'une page de journal (synchronisé avec tools/build-guide.mjs)
  const fileName_pageId = {
    introduction: "dJUM8yoGhs5xK9A9",
    acteurs: "xPwQzUwLYw109xz4",
    objets: "sKx50bOKg27q6s1Q",
    jets_messages: "uDmnz5sdiuFhz5Ut",
    autres_fonctionnalites: "eRGefwUr8xqT3HlJ",
  }

  // Répertoire où se trouvent les fichiers html à partir du répertoire data
  const folderRef = "modules/cth-base/guide/html/"
  const filesList = await foundry.applications.apps.FilePicker.implementation.browse("data", folderRef)
  console.log("Liste des fichiers", filesList)

  // Seulement les fichiers html
  const htmlFiles = filesList.files.filter((f) => f.includes(".html"))
  console.log("Liste des fichiers html", htmlFiles)

  for (let file of htmlFiles) {
    let filebase = file.replace(".html", "").replace(folderRef, "")
    let targetId = fileName_pageId[filebase]

    console.log("targetId", targetId)
    if (targetId) {
      for (let journal of game.packs.get(compendiumName)) {
        let journalpage = journal.pages.get(targetId)
        if (journalpage) {
          const fileData = await fetch(file)
          let filecontent = await fileData.text()
          journalpage.update({ "text.content": filecontent })
          console.log("Mise à jour réussie depuis le fichier :", file)
        }
      }
    }
  }
}
