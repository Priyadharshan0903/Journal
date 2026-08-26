import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

/**
 * Real content notes only — excludes the four Blueprint virtual pages
 * (index/graph/folders/notes) and every tag page, so the header's count
 * matches what NotesIndex/FolderDirectory actually list.
 */
function isRealNote(slug: string | undefined): boolean {
  if (!slug) return false
  if (slug === "index" || slug === "graph" || slug === "folders" || slug === "notes") return false
  if (slug.startsWith("tags/")) return false
  if (slug.endsWith("/index")) return false
  return true
}

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

Header.css = `
header {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 2rem 0;
  gap: 1.5rem;
}

header h1 {
  margin: 0;
  flex: auto;
}
`

export default (() => Header) satisfies QuartzComponentConstructor
