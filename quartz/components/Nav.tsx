import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { pathToRoot } from "../util/path"
import { classNames } from "../util/lang"

export interface NavLink {
  title: string
  /** Slug relative to the site root, e.g. "go" or "tags". Empty string is the home page. */
  slug: string
}

interface NavOptions {
  links: NavLink[]
}

const defaultOptions: NavOptions = {
  links: [
    { title: "Home", slug: "" },
    { title: "Graph", slug: "graph" },
    { title: "Folders", slug: "folders" },
    { title: "Reading", slug: "notes" },
    { title: "Tags", slug: "tags" },
  ],
}

/** Normalizes a nav link's target slug ("" for home) against the current page's
 * slug so the right tab reads as active — the home link and the tag directory
 * both need special-casing since they don't match by simple prefix. */
function isActiveLink(linkSlug: string, currentSlug: string): boolean {
  const current = currentSlug.replace(/\/index$/, "")
  if (linkSlug === "") return current === "index" || current === ""
  if (linkSlug === "tags") return current === "tags" || current.startsWith("tags/")
  return current === linkSlug
}

export default ((userOpts?: Partial<NavOptions>) => {
  const opts = { ...defaultOptions, ...userOpts }

  const Nav: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
    // Links are built relative to the current page so the site works when served
    // from a subpath (e.g. a GitHub Pages project page) as well as from a root.
    const root = pathToRoot(fileData.slug!)
    const href = (slug: string) => (slug === "" ? root : `${root}/${slug}`)
    const currentSlug = fileData.slug ?? ""

    const links = opts.links.map(({ title, slug }) => (
      <a
        href={href(slug)}
        class="nav-link"
        aria-current={isActiveLink(slug, currentSlug) ? "page" : undefined}
      >
        {title}
      </a>
    ))

    // NB: deliberately not using Quartz's .desktop-only / .mobile-only helpers —
    // both resolve to `display: contents`, which would drop the box on the pill
    // and the drawer. Nav.css does the responsive switching itself.
    return (
      <nav class={classNames(displayClass, "site-nav")} aria-label="Site">
        <div class="nav-links">{links}</div>

        <button
          class="nav-toggle"
          aria-label="Toggle navigation menu"
          aria-expanded="false"
          aria-controls="nav-drawer"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div class="nav-drawer" id="nav-drawer" hidden>
          {links}
        </div>
      </nav>
    )
  }

  // Plain CSS, not SCSS — the 800px breakpoint must stay in sync with
  // $breakpoints.mobile in quartz/styles/variables.scss.
  // Nav appearance lives entirely in quartz/styles/blueprint.scss, which
  // already defines every rule this file used to (.nav-links, .nav-link and
  // its hover/active states, .nav-toggle + hamburger transforms, .nav-drawer).
  // Keeping a second copy here was actively harmful: component CSS is linked
  // *after* the main stylesheet, so the old sandalwood pill treatment
  // (border-radius: 2em on .nav-links/.nav-link, plus a larger font-size and
  // padding) silently beat Blueprint's flat bar — which is what drew the
  // capsule outline around the tabs and bent the active underline into a
  // curve. Left empty so blueprint.scss is the single source of truth.
  Nav.css = ``

  Nav.afterDOMLoaded = `
(() => {
  // The explorer calls scrollIntoView({behavior:"smooth"}) on its active item
  // whenever sessionStorage has no saved position. That aligns the item to the
  // top of the *document* scrollport, not just the sidebar, so landing on any
  // note scrolled the page down ~180px and took this nav off-screen with it.
  // Seeding the key makes the explorer take its restore branch instead.
  // ("0" is a non-empty string, so its truthiness check passes.)
  if (!sessionStorage.getItem("explorerScrollTop")) {
    sessionStorage.setItem("explorerScrollTop", "0")
  }

  // The explorer only tags a row .active on an exact slug match, so on a folder
  // index page (e.g. /jenkins/) nothing at all is highlighted. Mark the folder
  // itself instead, matching against the data-folderpath the explorer already
  // writes onto each .folder-container.
  function markCurrentFolder() {
    // Normalise "/jenkins/index.html" and "/jenkins/" down to "/jenkins" so both
    // the folder's own page and a note inside it compare the same way.
    const path = decodeURIComponent(location.pathname)
      .replace(/\\/index\\.html?$/, "")
      .replace(/\\.html?$/, "")
      .replace(/\\/+$/, "")

    const containers = document.querySelectorAll(".folder-container[data-folderpath]")
    containers.forEach((el) => {
      // The explorer stores the folder's index slug, e.g. "jenkins/index".
      const fp = (el.dataset.folderpath || "").replace(/\\/index$/, "")
      // endsWith covers the folder's own page; includes covers notes nested
      // inside it. Both are anchored on "/" so "go" cannot match "golang".
      const isCurrent = !!fp && (path.endsWith("/" + fp) || path.includes("/" + fp + "/"))
      el.classList.toggle("folder-active", isCurrent)
    })
  }

  // The explorer builds its tree asynchronously (it awaits the content index),
  // so the containers usually do not exist yet when "nav" fires. Watch for them.
  function watchExplorer() {
    markCurrentFolder()
    const root = document.querySelector(".explorer-content")
    if (!root) return
    const observer = new MutationObserver(() => markCurrentFolder())
    observer.observe(root, { childList: true, subtree: true })
    window.addCleanup(() => observer.disconnect())
  }

  function setupNav() {
    watchExplorer()

    const toggle = document.querySelector(".nav-toggle")
    const drawer = document.querySelector(".nav-drawer")
    if (!toggle || !drawer) return

    const close = () => {
      toggle.setAttribute("aria-expanded", "false")
      drawer.hidden = true
    }
    const onToggle = (e) => {
      e.stopPropagation()
      const open = toggle.getAttribute("aria-expanded") === "true"
      toggle.setAttribute("aria-expanded", String(!open))
      drawer.hidden = open
    }
    const onDocClick = (e) => {
      if (!drawer.hidden && !drawer.contains(e.target) && !toggle.contains(e.target)) close()
    }
    const onKeydown = (e) => {
      if (e.key === "Escape") close()
    }

    toggle.addEventListener("click", onToggle)
    document.addEventListener("click", onDocClick)
    document.addEventListener("keydown", onKeydown)

    // Quartz swaps the DOM on SPA navigation, so every listener registered here
    // must be torn down before the next page binds its own.
    window.addCleanup(() => {
      toggle.removeEventListener("click", onToggle)
      document.removeEventListener("click", onDocClick)
      document.removeEventListener("keydown", onKeydown)
    })
  }

  document.addEventListener("nav", setupNav)
})()
`

  return Nav
}) satisfies QuartzComponentConstructor<Partial<NavOptions>>
