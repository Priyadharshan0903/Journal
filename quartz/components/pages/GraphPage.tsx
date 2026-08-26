import { QuartzComponent, QuartzComponentProps } from "../types"
import { resolveRelative, FullSlug } from "../../util/path"
import { buildNoteSummaries } from "../../plugins/directories/notes"

const GRAPH_FULL_CFG = {
  depth: -1,
  scale: 0.9,
  repelForce: 0.5,
  centerForce: 0.2,
  linkDistance: 34,
  fontSize: 0.65,
  opacityScale: 1,
  showTags: true,
  removeTags: [] as string[],
  drag: true,
  zoom: true,
  focusOnHover: true,
  enableRadial: true,
}

/**
 * Dedicated /graph page — a single always-expanded `.graph-container[data-cfg]`
 * sized full-height via blueprint.scss (`.bp-graph-full`), rather than reusing
 * the Graph plugin's fixed-position modal markup (`.global-graph-outer`),
 * which is designed to overlay the page, not sit inline in a page section.
 * No graph layout math is reimplemented — this is the same D3-force/PixiJS
 * client script every other `.graph-container` on the site already uses.
 */
const GraphPage: QuartzComponent = ({ fileData, allFiles }: QuartzComponentProps) => {
  const slug = fileData.slug!
  const notes = buildNoteSummaries(allFiles)
  const edgeCount = notes.reduce((sum, n) => sum + n.links.length, 0)
  const clusterCount = new Set(notes.map((n) => n.folder)).size
  const orphanCount = notes.filter((n) => n.links.length === 0 && n.backlinkCount === 0).length
  const hubs = notes
    .slice()
    .sort((a, b) => b.backlinkCount - a.backlinkCount)
    .slice(0, 6)

  return (
    <article class="popover-hint bp-graph-page">
      <section class="bp-graph-page-head">
        <div>
          <h1>Graph view</h1>
          <p>
            Every note and every link between them. Size is how many other notes point at it — hover
            to isolate a neighbourhood, click to read.
          </p>
        </div>
        <div class="bp-graph-meta">
          NODES {notes.length}
          <br />
          LINKS {edgeCount}
          <br />
          CLUSTERS {clusterCount}
          <br />
          ORPHANS {orphanCount}
        </div>
      </section>

      <section class="blueprint bp-graph-panel bp-graph-full">
        <i class="corner tl"></i>
        <i class="corner tr"></i>
        <i class="corner bl"></i>
        <i class="corner br"></i>
        <div class="graph-container" data-cfg={JSON.stringify(GRAPH_FULL_CFG)}></div>
      </section>

      {hubs.length > 0 && (
        <section class="bp-graph-hubs">
          <h6 class="bp-label">Most linked</h6>
          <div class="bp-hub-grid">
            {hubs.map((h) => (
              <a class="bp-hub-cell" href={resolveRelative(slug, h.slug as FullSlug)}>
                <div class="bp-hub-meta">
                  {h.backlinkCount} {h.backlinkCount === 1 ? "LINK" : "LINKS"} · {h.folderLabel}
                </div>
                <div class="bp-hub-title">{h.title}</div>
              </a>
            ))}
          </div>
        </section>
      )}
    </article>
  )
}

export default GraphPage
