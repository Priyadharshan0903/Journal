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
    { title: "Go", slug: "go" },
    { title: "Jenkins", slug: "jenkins" },
    { title: "Tags", slug: "tags" },
  ],
}

export default ((userOpts?: Partial<NavOptions>) => {
  const opts = { ...defaultOptions, ...userOpts }

  const Nav: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
    // Links are built relative to the current page so the site works when served
    // from a subpath (e.g. a GitHub Pages project page) as well as from a root.
    const root = pathToRoot(fileData.slug!)
    const href = (slug: string) => (slug === "" ? root : `${root}/${slug}`)

    const links = opts.links.map(({ title, slug }) => (
      <a href={href(slug)} class="nav-link">
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
  Nav.css = `
nav.site-nav {
  position: relative;
  display: flex;
  align-items: center;
}

/* Pill cluster on desktop, hamburger + drawer below 800px. */
.nav-toggle,
.nav-drawer {
  display: none;
}

@media all and (max-width: 800px) {
  .nav-links {
    display: none !important;
  }
  .nav-toggle {
    display: block;
  }
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  padding: 0.2rem 0.35rem;
  border: 1px solid var(--lightgray);
  border-radius: 2em;
  background: var(--light);
}

.nav-link {
  font-family: var(--headerFont);
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1;
  padding: 0.5em 0.85em;
  border-radius: 2em;
  color: var(--darkgray);
  background: none;
  white-space: nowrap;
  transition:
    color 0.15s ease,
    background-color 0.15s ease;
}

.nav-link:hover {
  color: var(--tertiary);
  background: var(--highlight);
}

/* Hamburger: three bars that morph into an X when the drawer is open. */
.nav-toggle {
  position: relative;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  border: 1px solid var(--lightgray);
  border-radius: 50%;
  background: var(--light);
  cursor: pointer;
}

.nav-toggle span {
  position: absolute;
  left: 50%;
  display: block;
  width: 1.05rem;
  height: 2px;
  border-radius: 2px;
  background: var(--darkgray);
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.nav-toggle span:nth-child(1) { transform: translate(-50%, calc(-50% - 0.32rem)); top: 50%; }
.nav-toggle span:nth-child(2) { transform: translate(-50%, -50%); top: 50%; }
.nav-toggle span:nth-child(3) { transform: translate(-50%, calc(-50% + 0.32rem)); top: 50%; }

.nav-toggle[aria-expanded="true"] span:nth-child(1) {
  transform: translate(-50%, -50%) rotate(45deg);
}
.nav-toggle[aria-expanded="true"] span:nth-child(2) {
  opacity: 0;
}
.nav-toggle[aria-expanded="true"] span:nth-child(3) {
  transform: translate(-50%, -50%) rotate(-45deg);
}

.nav-drawer {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  z-index: 999;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 11rem;
  padding: 0.4rem;
  border: 1px solid var(--lightgray);
  border-radius: 0.75rem;
  background: var(--light);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* Opening the drawer clears the [hidden] attribute; it stays closed on desktop. */
@media all and (max-width: 800px) {
  .nav-drawer:not([hidden]) {
    display: flex;
  }
}

.nav-drawer .nav-link {
  text-align: left;
  padding: 0.6em 0.8em;
}

@media (prefers-reduced-motion: reduce) {
  .nav-link,
  .nav-toggle span {
    transition: none;
  }
}
`

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

  function setupNav() {
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
