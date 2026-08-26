import { QuartzPluginData } from "../../plugins/vfile"

/**
 * Build-time data helpers shared by Homepage / GraphPage / FolderDirectory /
 * NotesIndex. Everything here reads straight off `componentData.allFiles`
 * (full frontmatter is available there — see created-modified-date's
 * `fileData.dates` and crawl-links' `fileData.links`), never off the
 * client-facing `static/contentIndex.json`, which strips `date`/`description`.
 */

export interface NoteSummary {
  slug: string
  title: string
  description: string
  folder: string
  folderLabel: string
  created: Date | undefined
  tags: string[]
  links: string[]
  backlinkCount: number
}

/** The four Blueprint virtual pages plus the tag directory are never "notes". */
export function isRealNote(slug: string | undefined): boolean {
  if (!slug) return false
  if (slug === "index" || slug === "graph" || slug === "folders" || slug === "notes") return false
  if (slug.startsWith("tags/")) return false
  if (slug.endsWith("/index")) return false
  return true
}

/** Mirrors `@quartz-community/backlinks`' own simplifySlug so backlink-count
 * lookups against `fileData.links` (which stores simplified slugs) line up. */
export function simplifySlug(slug: string): string {
  const withoutIndex = slug.endsWith("/index")
    ? slug.slice(0, -"/index".length)
    : slug === "index"
      ? ""
      : slug
  const trimmed = withoutIndex.replace(/^\/+|\/+$/g, "")
  return trimmed.length === 0 ? "/" : trimmed
}

/** The note's containing folder path, e.g. "go/concurrency" or "jenkins". */
export function folderOf(slug: string): string {
  const parts = slug.split("/")
  parts.pop()
  return parts.join("/")
}

function titleCaseSegment(segment: string): string {
  return segment.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

/** "go/concurrency" -> "Go · Concurrency"; "" -> "General". */
export function folderLabel(folder: string): string {
  if (!folder) return "General"
  return folder.split("/").map(titleCaseSegment).join(" · ")
}

export function buildNoteSummaries(allFiles: QuartzPluginData[]): NoteSummary[] {
  const notes = allFiles.filter((f) => isRealNote(f.slug))
  return notes.map((f) => {
    const slug = f.slug as string
    const key = simplifySlug(slug)
    const backlinkCount = allFiles.filter(
      (other) => other.unlisted !== true && (other.links as string[] | undefined)?.includes(key),
    ).length
    const folder = folderOf(slug)
    return {
      slug,
      title: (f.frontmatter?.title as string) ?? slug,
      description: f.description ?? "",
      folder,
      folderLabel: folderLabel(folder),
      created: f.dates?.created,
      tags: (f.frontmatter?.tags as string[]) ?? [],
      links: (f.links as string[] | undefined) ?? [],
      backlinkCount,
    }
  })
}

export interface SiteStats {
  noteCount: number
  linkCount: number
  tagCount: number
  weekStreak: number
  /** 26 buckets, oldest first, each the count of notes created that week. */
  activity: number[]
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export function computeStats(notes: NoteSummary[]): SiteStats {
  const now = Date.now()
  const buckets = new Array(26).fill(0) as number[] // index 0 = this week ... 25 = oldest
  for (const n of notes) {
    if (!n.created) continue
    const weeksAgo = Math.floor((now - n.created.getTime()) / WEEK_MS)
    if (weeksAgo >= 0 && weeksAgo < 26) buckets[weeksAgo]++
  }

  let weekStreak = 0
  for (const count of buckets) {
    if (count > 0) weekStreak++
    else break
  }

  const tagSet = new Set<string>()
  for (const n of notes) for (const t of n.tags) tagSet.add(t)

  const linkCount = notes.reduce((sum, n) => sum + n.links.length, 0)

  return {
    noteCount: notes.length,
    linkCount,
    tagCount: tagSet.size,
    weekStreak,
    activity: buckets.slice().reverse(),
  }
}

export interface FolderGroup {
  folder: string
  label: string
  notes: NoteSummary[]
}

/** Groups notes by their containing folder, sorted by most-recently-updated
 * folder first, notes within a folder newest-first. */
export function groupByFolder(notes: NoteSummary[]): FolderGroup[] {
  const byFolder = new Map<string, NoteSummary[]>()
  for (const n of notes) {
    const list = byFolder.get(n.folder) ?? []
    list.push(n)
    byFolder.set(n.folder, list)
  }
  const groups: FolderGroup[] = []
  for (const [folder, list] of byFolder) {
    list.sort((a, b) => (b.created?.getTime() ?? 0) - (a.created?.getTime() ?? 0))
    groups.push({ folder, label: folderLabel(folder), notes: list })
  }
  groups.sort(
    (a, b) => (b.notes[0]?.created?.getTime() ?? 0) - (a.notes[0]?.created?.getTime() ?? 0),
  )
  return groups
}

export function sortByCreatedDesc(notes: NoteSummary[]): NoteSummary[] {
  return notes.slice().sort((a, b) => (b.created?.getTime() ?? 0) - (a.created?.getTime() ?? 0))
}

export function formatDate(d: Date | undefined): string {
  if (!d) return ""
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short" }).toUpperCase()
}
