import { NoteSummary } from "../directories/notes"

/**
 * Per-note data handed to the client as JSON. Due-ness itself is computed in
 * the browser (quiz.inline.ts) because it depends on `localStorage`, which
 * doesn't exist at build time — this is just the deterministic, build-time
 * half of the picture (backlink count reused from the same `links` data
 * Backlinks/crawl-links already compute, not recomputed here).
 */
export interface RecapCandidate {
  slug: string
  title: string
  folder: string
  /** ISO date string, or "" if unknown. */
  created: string
  backlinkCount: number
}

/** Every real note, ranked by backlink count so the embedded JSON already
 * favors "hub" notes even before the client applies the staleness heuristic. */
export function toCandidates(notes: NoteSummary[]): RecapCandidate[] {
  return notes
    .slice()
    .sort((a, b) => b.backlinkCount - a.backlinkCount)
    .map((n) => ({
      slug: n.slug,
      title: n.title,
      folder: n.folderLabel,
      created: n.created ? n.created.toISOString() : "",
      backlinkCount: n.backlinkCount,
    }))
}
