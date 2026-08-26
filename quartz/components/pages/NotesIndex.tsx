import { QuartzComponent, QuartzComponentProps } from "../types"
import { resolveRelative, FullSlug } from "../../util/path"
import { buildNoteSummaries, sortByCreatedDesc, formatDate } from "../../plugins/directories/notes"

/**
 * /notes ("Reading" in the nav) — every note in the vault, newest first, no
 * folder grouping (that's /folders' job). A flat companion to the graph and
 * folder views for "just show me everything, in order."
 */
const NotesIndex: QuartzComponent = ({ fileData, allFiles }: QuartzComponentProps) => {
  const slug = fileData.slug!
  const notes = sortByCreatedDesc(buildNoteSummaries(allFiles))

  return (
    <article class="popover-hint bp-notes-page">
      <header class="bp-page-head">
        <h1>All notes</h1>
        <p>Every note in the vault, newest first — {notes.length} so far.</p>
      </header>
      <ul class="bp-notes-list">
        {notes.map((n) => (
          <li>
            <a class="bp-recent-row" href={resolveRelative(slug, n.slug as FullSlug)}>
              <span class="bp-recent-date">{formatDate(n.created)}</span>
              <div>
                <div class="bp-recent-title">{n.title}</div>
                {n.description && <div class="bp-recent-blurb">{n.description}</div>}
              </div>
              <span class="bp-folder-chip">{n.folderLabel}</span>
            </a>
          </li>
        ))}
      </ul>
    </article>
  )
}

export default NotesIndex
