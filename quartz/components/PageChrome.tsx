import { QuartzComponent, QuartzComponentConstructor } from "./types"

/**
 * Small page-level chrome that has no markup of its own beyond the reading
 * progress bar: it also upgrades code blocks with a language label and a copy
 * button once the DOM is in place.
 *
 * Styling lives in quartz/styles/custom.scss rather than here, because that file
 * is emitted unlayered and so wins over the @layer-wrapped component CSS.
 */
const PageChrome: QuartzComponent = () => {
  return (
    <div class="reading-progress" aria-hidden="true">
      <span></span>
    </div>
  )
}

PageChrome.afterDOMLoaded = `
(() => {
  function setupProgress() {
    const bar = document.querySelector(".reading-progress > span")
    if (!bar) return

    let queued = false
    const update = () => {
      queued = false
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0
      bar.style.width = Math.max(0, Math.min(100, pct)) + "%"
    }
    const onScroll = () => {
      if (queued) return
      queued = true
      requestAnimationFrame(update)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll, { passive: true })
    window.addCleanup(() => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    })
    update()
  }

  function enhanceCodeBlocks() {
    const figures = document.querySelectorAll("figure[data-rehype-pretty-code-figure]")
    figures.forEach((fig) => {
      // Guard against double-decorating: SPA navigation re-runs this, and a
      // transcluded page can surface the same figure twice.
      if (fig.dataset.chrome === "true") return
      const pre = fig.querySelector("pre")
      if (!pre) return
      fig.dataset.chrome = "true"

      const bar = document.createElement("div")
      bar.className = "code-bar"

      const lang = document.createElement("span")
      lang.className = "code-lang"
      lang.textContent = pre.dataset.language || "text"

      const button = document.createElement("button")
      button.className = "code-copy"
      button.type = "button"
      button.setAttribute("aria-label", "Copy code to clipboard")
      button.textContent = "Copy"

      // navigator.clipboard is undefined on non-secure origins (e.g. serving the
      // built site over plain http on a LAN address), so fall back to the old
      // execCommand path rather than leaving the button silently inert.
      const legacyCopy = (text) => {
        const scratch = document.createElement("textarea")
        scratch.value = text
        scratch.setAttribute("readonly", "")
        scratch.style.position = "fixed"
        scratch.style.opacity = "0"
        document.body.appendChild(scratch)
        scratch.select()
        let ok = false
        try {
          ok = document.execCommand("copy")
        } catch {
          ok = false
        }
        document.body.removeChild(scratch)
        return ok
      }

      // writeText can sit pending forever when the permission can't be resolved,
      // which would leave the button showing "Copy" and the reader unsure whether
      // anything happened. Cap the wait and fall back instead of hanging.
      const withTimeout = (promise, ms) =>
        Promise.race([
          promise.then(() => true),
          new Promise((resolve) => setTimeout(() => resolve(false), ms)),
        ])

      let resetTimer
      button.addEventListener("click", async () => {
        const text = pre.innerText
        let ok = false
        try {
          if (navigator.clipboard?.writeText) {
            ok = await withTimeout(navigator.clipboard.writeText(text), 1000)
          }
          if (!ok) {
            ok = legacyCopy(text)
          }
        } catch {
          ok = legacyCopy(text)
        }

        button.textContent = ok ? "Copied" : "Failed"
        button.classList.toggle("copied", ok)
        clearTimeout(resetTimer)
        resetTimer = setTimeout(() => {
          button.textContent = "Copy"
          button.classList.remove("copied")
        }, 1600)
      })

      bar.append(lang, button)
      fig.prepend(bar)
    })
  }

  function setup() {
    setupProgress()
    enhanceCodeBlocks()
  }

  document.addEventListener("nav", setup)
})()
`

export default (() => PageChrome) satisfies QuartzComponentConstructor
