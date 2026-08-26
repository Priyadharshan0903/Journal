import { QuartzPageTypePlugin } from "../types"
import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../../components/types"
import Homepage from "../../components/pages/Homepage"
import GraphPage from "../../components/pages/GraphPage"
import FolderDirectory from "../../components/pages/FolderDirectory"
import NotesIndex from "../../components/pages/NotesIndex"

/**
 * Generates the four Blueprint "directory" pages: the homepage (real content,
 * matched at slug "index"), and three virtual pages (/graph, /folders,
 * /notes).
 *
 * Collision handling for "index": `@quartz-community/content-page`'s
 * ContentPage also matches slug "index" (its matcher is only `!endsWith("/index")
 * && !startsWith("tags/")`, confirmed by reading its compiled dist — root
 * "index" passes both checks). `PageTypeDispatcher` sorts page types by
 * `priority` descending and takes the first match, with no dedup otherwise
 * (verified in quartz/plugins/pageTypes/dispatcher.ts). ContentPage's own
 * priority is 0, so this plugin sets `priority: 20` to win that match — the
 * simplest resolution the actual matching semantics support, and it keeps
 * content/index.md as the real source of the homepage's title/description
 * frontmatter rather than inventing a second content source.
 *
 * /graph, /folders and /notes are NOT claimed by any other page type, so they
 * need no such trick — they're plain virtual pages.
 */
const DirectoriesPageType: QuartzPageTypePlugin = () => {
  const body: QuartzComponentConstructor = () => {
    const DirectoriesBody: QuartzComponent = (props: QuartzComponentProps) => {
      switch (props.fileData.slug) {
        case "index":
          return Homepage(props)
        case "graph":
          return GraphPage(props)
        case "folders":
          return FolderDirectory(props)
        case "notes":
          return NotesIndex(props)
        default:
          return null
      }
    }
    return DirectoriesBody
  }

  return {
    name: "DirectoriesPageType",
    priority: 20,
    match: ({ slug }) => slug === "index",
    generate: () => [
      {
        slug: "graph",
        title: "Graph View",
        data: { frontmatter: { title: "Graph View", tags: [] }, description: "" },
      },
      {
        slug: "folders",
        title: "Folders",
        data: { frontmatter: { title: "Folders", tags: [] }, description: "" },
      },
      {
        slug: "notes",
        title: "All Notes",
        data: { frontmatter: { title: "All Notes", tags: [] }, description: "" },
      },
    ],
    layout: "directories",
    body,
  }
}

export default DirectoriesPageType
