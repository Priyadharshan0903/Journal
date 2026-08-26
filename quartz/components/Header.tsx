import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

// Shared with the directories plugin so the header's count can't drift from
// what NotesIndex / FolderDirectory / the homepage stats actually list — it
// already had, by omitting the 404 exclusion.
import { isRealNote } from "../plugins/directories/notes"

const Header: QuartzComponent = ({ children, allFiles }: QuartzComponentProps) => {
  const notes = allFiles.filter((f) => isRealNote(f.slug))
  const linkCount = notes.reduce((sum, f) => sum + (f.links?.length ?? 0), 0)

  return children.length > 0 ? (
    <header>
      {children}
      <span class="bp-build-tag">
        {notes.length} NOTES · {linkCount} LINKS
      </span>
    </header>
  ) : null
}

// Topbar appearance lives in quartz/styles/blueprint.scss under
// `.page-header header`. The pre-redesign rules that used to live here
// (margin: 2rem 0, gap: 1.5rem) were shadowed by that higher-specificity
// selector rather than fighting it — unlike Nav's, which collided at equal
// specificity and silently won because component CSS links last. Removed
// anyway so there is one source of truth per component.
Header.css = `
header h1 {
  margin: 0;
  flex: auto;
}
`

export default (() => Header) satisfies QuartzComponentConstructor
