import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../../../components/types"
import { pathToRoot } from "../../../util/path"

/**
 * Replaces TagPage's near-empty default `tags/index` listing with a real
 * tag-count grid. `tags/index` is already claimed by @quartz-community/tag-page
 * as a virtual page (dispatcher has no dedup across page types), so this is a
 * `beforeBody` component that self-guards to that one slug rather than a
 * second page type competing for the same slug. blueprint.scss hides
 * TagContent's own markup on this page via a `:has()` selector scoped to the
 * `.bp-tag-directory` marker this component renders.
 */
export const TagDirectory: QuartzComponentConstructor = () => {
  const Component: QuartzComponent = ({ fileData, allFiles }: QuartzComponentProps) => {
    if (fileData.slug !== "tags/index") return null

    const counts = new Map<string, number>()
    for (const f of allFiles) {
      if (f.unlisted === true) continue
      const tags = (f.frontmatter?.tags as string[] | undefined) ?? []
      for (const t of tags) counts.set(t, (counts.get(t) ?? 0) + 1)
    }
    const entries = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    const max = Math.max(1, ...entries.map(([, c]) => c))
    const root = pathToRoot(fileData.slug)

    return (
      <div class="bp-tag-directory">
        <header class="bp-page-head">
          <h1>Tags</h1>
          <p>
            The cross-cutting index. A note sits in one folder and belongs to several conversations
            — the bar is how many.
          </p>
        </header>
        {entries.length === 0 ? (
          <p class="bp-recap-empty">No tags yet.</p>
        ) : (
          <div class="bp-tag-grid">
            {entries.map(([tag, count]) => (
              <a class="bp-tag-cell" href={`${root}/tags/${tag}`}>
                <div class="bp-tag-cell-head">
                  <span class="bp-tag-name">{tag}</span>
                  <span class="bp-tag-count">{count}</span>
                </div>
                <div class="bp-tag-bar-track">
                  <div
                    class="bp-tag-bar-fill"
                    style={{ width: `${Math.round((count / max) * 100)}%` }}
                  ></div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    )
  }

  return Component
}
