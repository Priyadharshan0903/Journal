import { QuartzComponent, QuartzComponentProps } from "../types"
import { resolveRelative, FullSlug } from "../../util/path"
import { buildNoteSummaries, groupByFolder, formatDate } from "../../plugins/directories/notes"

/**
 * /folders hub — every folder in the vault, grouped, most recently written
 * folder first. `folder-page`'s own `showSubfolders` option already produces
 * this grouping shape for individual folder pages; this is the top-level index
 * across all of them, generated as a virtual page by the `directories` plugin.
 *
 * Layout mirrors /notes: the design's 180px mono label column on the left
 * (from its topic view) with a stat block under the folder name, and each note
 * laid out as a search-result row — title/blurb left, date + link count
 * right-aligned in a mono rail.
 */
const FolderDirectory: QuartzComponent = ({ fileData, allFiles }: QuartzComponentProps) => {
  const slug = fileData.slug!
  const notes = buildNoteSummaries(allFiles)
  const groups = groupByFolder(notes)

  return (
    <article class="popover-hint bp-folders-page">
      <header class="bp-page-head">
        <h1>Folders</h1>
        <p>Every note sits in exactly one folder — browse by where it lives instead of by topic.</p>
      </header>

      <section class="bp-folder-groups">
        {groups.map((g) => {
          const last = g.notes[0]?.created
          return (
            <div class="bp-folder-group">
              <div class="bp-folder-group-head">
                <h3 class="bp-folder-group-name">{g.label}</h3>
                <div class="bp-folder-group-meta">
                  <span>
                    {g.notes.length} {g.notes.length === 1 ? "note" : "notes"}
                  </span>
                  {last && <span>Last {formatDate(last)}</span>}
                </div>
              </div>

              <ul class="bp-folder-note-list">
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
            </div>
          )
        })}
      </section>
    </article>
  )
}

export default FolderDirectory
