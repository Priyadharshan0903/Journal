import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../../../components/types"
import { pathToRoot, resolveRelative } from "../../../util/path"
import { isRealNote, folderOf, folderLabel } from "../../directories/notes"

/**
 * Left-rail "IN {folder}" sibling list on a note page — replaces the
 * persistent explorer (now disabled) with a folder-scoped list, matching the
 * design. Excluded from folder/tag/directories pages via their `left: []`
 * layout override in quartz.config.yaml, so this only ever renders where
 * `content: {}` is the active byPageType (real notes).
 */
export const NoteSiblings: QuartzComponentConstructor = () => {
  const Component: QuartzComponent = ({ fileData, allFiles }: QuartzComponentProps) => {
    const slug = fileData.slug
    if (!slug || !isRealNote(slug)) return null

    const folder = folderOf(slug)
    const siblings = allFiles
      .filter((f) => isRealNote(f.slug) && folderOf(f.slug as string) === folder)
      .sort((a, b) => (b.dates?.created?.getTime() ?? 0) - (a.dates?.created?.getTime() ?? 0))

    if (siblings.length <= 1) return null

    const root = pathToRoot(slug)

    return (
      <div class="bp-note-siblings">
        <h6 class="bp-label">In {folderLabel(folder)}</h6>
        {siblings.map((s) => (
          <a
            class="bp-note-sibling"
            aria-current={s.slug === slug ? "page" : undefined}
            href={resolveRelative(slug, s.slug!)}
          >
            {(s.frontmatter?.title as string) ?? s.slug}
          </a>
        ))}
        <a class="bp-note-sibling bp-note-sibling-all" href={`${root}/folders`}>
          All folders →
        </a>
      </div>
    )
  }

  return Component
}
