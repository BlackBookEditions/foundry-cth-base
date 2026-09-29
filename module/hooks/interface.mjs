import { CTHReleaseNotes } from "../applications/_module.mjs"

/*
 * Hook renderCOSidebarMenu : section Cthulhu Origines, avec le bouton des notes de version.
 * Ajoutée en fin de menu et non après la section support comme le fait coc2-base : les deux hooks
 * attendent un rendu de template, l'ordre de leurs insertions n'est donc pas garanti. En fin de menu,
 * la section cth reste sous celle de coc2-base quel que soit celui qui termine le premier.
 */
export async function onRenderSidebarMenu(application, html, context, options) {
  const container = html.querySelector(".co.support")?.parentElement
  if (!container) return

  const renderedHtml = await foundry.applications.handlebars.renderTemplate("modules/cth-base/templates/sidebar-menu.hbs", {
    user: game.user,
  })
  if (renderedHtml === "") return

  container.insertAdjacentHTML("beforeend", renderedHtml)
  // Pas d'ApplicationV2 ici (template injecté en HTML brut) : câblage manuel, garde anti-double-ouverture
  // sur le même principe que coc2-base
  container.querySelector(".cth-base-release-notes")?.addEventListener("click", () => {
    if (!foundry.applications.instances.has("cth-base-release-notes")) CTHReleaseNotes.displayAll()
  })
}
