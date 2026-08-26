import { QuartzComponent, QuartzComponentProps } from "../types"
import { resolveRelative, FullSlug } from "../../util/path"
import { buildNoteSummaries, groupByFolder } from "../../plugins/directories/notes"

/**
 * /folders hub — every folder in the vault, grouped, newest folder first.
 * `folder-page`'s own `showSubfolders` option already produces this grouping
 * shape for individual folder pages; this is the top-level index across all
 * of them, generated as a virtual page by the `directories` plugin.
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
        {groups.map((g) => (
          <div class="bp-folder-group">
            <h3 class="bp-folder-group-name">{g.label}</h3>
            <div>
              {g.notes.map((n) => (
                <a class="bp-folder-note-row" href={resolveRelative(slug, n.slug as FullSlug)}>
                  <div class="bp-folder-note-title">{n.title}</div>
                  {n.description && <div class="bp-folder-note-blurb">{n.description}</div>}
                </a>
              ))}
            </div>
          </div>
        ))}
      </section>
    </article>
  )
}

export default FolderDirectory
