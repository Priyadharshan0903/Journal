import { QuartzComponent, QuartzComponentProps } from "../types"
import { resolveRelative, FullSlug } from "../../util/path"
import {
  buildNoteSummaries,
  sortByCreatedDesc,
  formatDate,
  NoteSummary,
} from "../../plugins/directories/notes"

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

interface MonthGroup {
  key: string
  label: string
  notes: NoteSummary[]
}

/**
 * Bucket by calendar month, preserving the newest-first order of the input.
 * Undated notes collect in a trailing group rather than being dropped —
 * a note with no `created` frontmatter is still a note.
 */
function groupByMonth(notes: NoteSummary[]): MonthGroup[] {
  const groups: MonthGroup[] = []
  const byKey = new Map<string, MonthGroup>()

  for (const n of notes) {
    const d = n.created
    const key = d ? `${d.getFullYear()}-${d.getMonth()}` : "undated"
    const label = d ? `${MONTHS[d.getMonth()]} ${d.getFullYear()}` : "Undated"

    let group = byKey.get(key)
    if (!group) {
      group = { key, label, notes: [] }
      byKey.set(key, group)
      groups.push(group)
    }
    group.notes.push(n)
  }

  // Undated last, whatever order it was encountered in.
  return groups.filter((g) => g.key !== "undated").concat(groups.filter((g) => g.key === "undated"))
}

/**
 * /notes ("Reading" in the nav) — every note in the vault, newest first,
 * bucketed by month. Folder grouping is /folders' job; this is the
 * chronological view.
 *
 * Layout follows two idioms straight out of the design: the topic view's
 * 180px mono label column for the month headings, and the search view's
 * `1fr + fixed` result row for each entry (title/blurb/tags on the left,
 * folder + date + link count right-aligned).
 */
const NotesIndex: QuartzComponent = ({ fileData, allFiles }: QuartzComponentProps) => {
  const slug = fileData.slug!
  const notes = sortByCreatedDesc(buildNoteSummaries(allFiles))
  const groups = groupByMonth(notes)

  return (
    <article class="popover-hint bp-notes-page">
      <header class="bp-page-head">
        <h1>All notes</h1>
        <p>Every note in the vault, newest first — {notes.length} so far.</p>
      </header>

      {groups.map((g) => (
        <section class="bp-notes-group">
          <h2 class="bp-notes-group-label">
            {g.label}
            <span class="bp-notes-group-count">{g.notes.length}</span>
          </h2>
          <ul class="bp-notes-group-list">
            {g.notes.map((n) => (
              <li>
                <a class="bp-note-entry" href={resolveRelative(slug, n.slug as FullSlug)}>
                  <div class="bp-note-entry-main">
                    <div class="bp-note-entry-title">{n.title}</div>
                    {n.description && <p class="bp-note-entry-blurb">{n.description}</p>}
                    {n.tags.length > 0 && (
                      <div class="bp-note-entry-tags">
                        {n.tags.slice(0, 5).map((t) => (
                          <span>#{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div class="bp-note-entry-meta">
                    <span class="bp-note-entry-folder">{n.folderLabel}</span>
                    <span class="bp-note-entry-date">{formatDate(n.created)}</span>
                    {n.backlinkCount > 0 && (
                      <span class="bp-note-entry-links">
                        {n.backlinkCount} {n.backlinkCount === 1 ? "link" : "links"}
                      </span>
                    )}
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </article>
  )
}

export default NotesIndex
