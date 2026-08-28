// quartz/util/path.ts
import {
  isFilePath,
  isFullSlug,
  isSimpleSlug,
  isRelativeURL,
  isAbsoluteURL,
  getFullSlug,
  slugifyFilePath,
  simplifySlug,
  joinSegments,
  endsWith,
  trimSuffix,
  stripSlashes,
  getFileExtension,
  isFolderPath,
  getAllSegmentPrefixes,
  pathToRoot,
  resolveRelative,
  splitAnchor,
  slugTag,
  transformInternalLink,
  transformLink,
  normalizeHastElement
} from "@quartz-community/utils";

// quartz/plugins/directories/notes.ts
function isRealNote(slug) {
  if (!slug) return false;
  if (slug === "index" || slug === "graph" || slug === "folders" || slug === "notes") return false;
  if (slug === "404") return false;
  if (slug.startsWith("tags/")) return false;
  if (slug.endsWith("/index")) return false;
  return true;
}
function simplifySlug2(slug) {
  const withoutIndex = slug.endsWith("/index") ? slug.slice(0, -"/index".length) : slug === "index" ? "" : slug;
  const trimmed = withoutIndex.replace(/^\/+|\/+$/g, "");
  return trimmed.length === 0 ? "/" : trimmed;
}
function folderOf(slug) {
  const parts = slug.split("/");
  parts.pop();
  return parts.join("/");
}
function titleCaseSegment(segment) {
  return segment.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function folderLabel(folder) {
  if (!folder) return "General";
  return folder.split("/").map(titleCaseSegment).join(" \xB7 ");
}
function buildNoteSummaries(allFiles) {
  const notes = allFiles.filter((f) => isRealNote(f.slug));
  return notes.map((f) => {
    const slug = f.slug;
    const key = simplifySlug2(slug);
    const backlinkCount = allFiles.filter(
      (other) => other.unlisted !== true && other.links?.includes(key)
    ).length;
    const folder = folderOf(slug);
    return {
      slug,
      title: f.frontmatter?.title ?? slug,
      description: f.description ?? "",
      folder,
      folderLabel: folderLabel(folder),
      created: f.dates?.created,
      tags: f.frontmatter?.tags ?? [],
      links: f.links ?? [],
      backlinkCount
    };
  });
}
var WEEK_MS = 7 * 24 * 60 * 60 * 1e3;
function computeStats(notes) {
  const now = Date.now();
  const buckets = new Array(26).fill(0);
  for (const n of notes) {
    if (!n.created) continue;
    const weeksAgo = Math.floor((now - n.created.getTime()) / WEEK_MS);
    if (weeksAgo >= 0 && weeksAgo < 26) buckets[weeksAgo]++;
  }
  let weekStreak = 0;
  for (const count of buckets) {
    if (count > 0) weekStreak++;
    else break;
  }
  const tagSet = /* @__PURE__ */ new Set();
  for (const n of notes) for (const t of n.tags) tagSet.add(t);
  const linkCount = notes.reduce((sum, n) => sum + n.links.length, 0);
  return {
    noteCount: notes.length,
    linkCount,
    tagCount: tagSet.size,
    weekStreak,
    activity: buckets.slice().reverse()
  };
}
function groupByFolder(notes) {
  const byFolder = /* @__PURE__ */ new Map();
  for (const n of notes) {
    const list = byFolder.get(n.folder) ?? [];
    list.push(n);
    byFolder.set(n.folder, list);
  }
  const groups = [];
  for (const [folder, list] of byFolder) {
    list.sort((a, b) => (b.created?.getTime() ?? 0) - (a.created?.getTime() ?? 0));
    groups.push({ folder, label: folderLabel(folder), notes: list });
  }
  groups.sort(
    (a, b) => (b.notes[0]?.created?.getTime() ?? 0) - (a.notes[0]?.created?.getTime() ?? 0)
  );
  return groups;
}
function sortByCreatedDesc(notes) {
  return notes.slice().sort((a, b) => (b.created?.getTime() ?? 0) - (a.created?.getTime() ?? 0));
}
function formatDate(d) {
  if (!d) return "";
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short" }).toUpperCase();
}

// quartz/plugins/recap/due.ts
function toCandidates(notes) {
  return notes.slice().sort((a, b) => b.backlinkCount - a.backlinkCount).map((n) => ({
    slug: n.slug,
    title: n.title,
    folder: n.folderLabel,
    created: n.created ? n.created.toISOString() : "",
    backlinkCount: n.backlinkCount
  }));
}

// quartz/plugins/recap/components/index.tsx
import { jsx, jsxs } from "preact/jsx-runtime";
function RecapRail({
  fileData,
  candidates
}) {
  const root = pathToRoot(fileData.slug);
  return /* @__PURE__ */ jsx(
    "div",
    {
      class: "bp-due-rail",
      "data-recap-candidates": JSON.stringify(candidates),
      "data-recap-root": root,
      children: /* @__PURE__ */ jsx("div", { class: "bp-recap-empty", children: "Loading\u2026" })
    }
  );
}

// quartz/components/pages/Homepage.tsx
import { jsx as jsx2, jsxs as jsxs2 } from "preact/jsx-runtime";
var GRAPH_MINI_CFG = {
  depth: -1,
  scale: 0.9,
  repelForce: 0.5,
  centerForce: 0.25,
  linkDistance: 30,
  fontSize: 0.6,
  opacityScale: 1,
  showTags: false,
  removeTags: [],
  drag: false,
  zoom: false,
  focusOnHover: true
};
var Homepage = (props) => {
  const { fileData, allFiles } = props;
  const slug = fileData.slug;
  const notes = buildNoteSummaries(allFiles);
  const stats = computeStats(notes);
  const recent = sortByCreatedDesc(notes).slice(0, 7);
  const folders = groupByFolder(notes).slice(0, 8);
  const candidates = toCandidates(notes);
  const title = fileData.frontmatter?.title ?? "Journal";
  const description = fileData.description || "One idea per note, written the day I hit it. Everything here links to something else, which is the whole point of keeping it.";
  const graphHref = resolveRelative(slug, "graph");
  const foldersHref = resolveRelative(slug, "folders");
  const startHref = recent[0] ? resolveRelative(slug, recent[0].slug) : graphHref;
  const maxBucket = Math.max(1, ...stats.activity);
  return /* @__PURE__ */ jsxs2("article", { class: "popover-hint bp-homepage", children: [
    /* @__PURE__ */ jsxs2("section", { class: "bp-hero", children: [
      /* @__PURE__ */ jsxs2("div", { class: "bp-hero-main", children: [
        /* @__PURE__ */ jsx2("div", { class: "bp-eyebrow", children: "Platform engineering \xB7 working notes" }),
        /* @__PURE__ */ jsx2("h1", { children: title }),
        /* @__PURE__ */ jsx2("p", { children: description }),
        /* @__PURE__ */ jsxs2("div", { class: "bp-hero-actions", children: [
          /* @__PURE__ */ jsxs2("a", { class: "blueprint bp-btn bp-btn-primary", href: graphHref, children: [
            /* @__PURE__ */ jsx2("i", { class: "corner tl" }),
            /* @__PURE__ */ jsx2("i", { class: "corner tr" }),
            /* @__PURE__ */ jsx2("i", { class: "corner bl" }),
            /* @__PURE__ */ jsx2("i", { class: "corner br" }),
            "Open the graph"
          ] }),
          /* @__PURE__ */ jsx2("a", { class: "bp-btn", href: startHref, children: "Read the latest note" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs2("div", { class: "bp-stats-rail", children: [
        /* @__PURE__ */ jsxs2("div", { class: "bp-stat", children: [
          /* @__PURE__ */ jsx2("span", { class: "bp-stat-label", children: "Notes" }),
          /* @__PURE__ */ jsx2("span", { class: "bp-stat-value", children: stats.noteCount })
        ] }),
        /* @__PURE__ */ jsxs2("div", { class: "bp-stat", children: [
          /* @__PURE__ */ jsx2("span", { class: "bp-stat-label", children: "Links" }),
          /* @__PURE__ */ jsx2("span", { class: "bp-stat-value", children: stats.linkCount })
        ] }),
        /* @__PURE__ */ jsxs2("div", { class: "bp-stat", children: [
          /* @__PURE__ */ jsx2("span", { class: "bp-stat-label", children: "Tags" }),
          /* @__PURE__ */ jsx2("span", { class: "bp-stat-value", children: stats.tagCount })
        ] }),
        /* @__PURE__ */ jsxs2("div", { class: "bp-stat", children: [
          /* @__PURE__ */ jsx2("span", { class: "bp-stat-label", children: "Week streak" }),
          /* @__PURE__ */ jsx2("span", { class: "bp-stat-value", children: stats.weekStreak })
        ] }),
        /* @__PURE__ */ jsxs2("div", { class: "bp-activity-chart", children: [
          /* @__PURE__ */ jsx2("div", { class: "bp-label", children: "Weeks written \xB7 26" }),
          /* @__PURE__ */ jsx2("div", { class: "bp-activity-bars", children: stats.activity.map((count) => {
            const level = count === 0 ? void 0 : count >= maxBucket ? "high" : "mid";
            const h = count === 0 ? 3 : Math.max(4, Math.round(count / maxBucket * 44));
            return /* @__PURE__ */ jsx2(
              "div",
              {
                class: "bp-activity-bar",
                "data-level": level,
                style: { height: `${h}px` }
              }
            );
          }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs2("section", { class: "bp-graph-section", children: [
      /* @__PURE__ */ jsxs2("div", { class: "bp-section-head", children: [
        /* @__PURE__ */ jsx2("h2", { children: "The graph" }),
        /* @__PURE__ */ jsx2("a", { class: "bp-section-link", href: graphHref, children: "Full view \u2192" })
      ] }),
      /* @__PURE__ */ jsxs2("div", { class: "blueprint bp-graph-panel bp-graph-mini", children: [
        /* @__PURE__ */ jsx2("i", { class: "corner tl" }),
        /* @__PURE__ */ jsx2("i", { class: "corner tr" }),
        /* @__PURE__ */ jsx2("i", { class: "corner bl" }),
        /* @__PURE__ */ jsx2("i", { class: "corner br" }),
        /* @__PURE__ */ jsx2("div", { class: "graph-container", "data-cfg": JSON.stringify(GRAPH_MINI_CFG) }),
        /* @__PURE__ */ jsxs2("div", { class: "bp-graph-caption", children: [
          stats.noteCount,
          " NOTES \xB7 ",
          stats.linkCount,
          " LINKS",
          /* @__PURE__ */ jsx2("br", {}),
          "CLICK A NODE TO READ IT"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs2("section", { class: "bp-two-col", children: [
      /* @__PURE__ */ jsxs2("div", { class: "bp-recent-main", children: [
        /* @__PURE__ */ jsx2("h2", { children: "Recently written" }),
        /* @__PURE__ */ jsx2("div", { class: "bp-label", children: "newest first, across every folder" }),
        /* @__PURE__ */ jsx2("ul", { class: "bp-recent-list", children: recent.map((n) => /* @__PURE__ */ jsx2("li", { children: /* @__PURE__ */ jsxs2("a", { class: "bp-recent-row", href: resolveRelative(slug, n.slug), children: [
          /* @__PURE__ */ jsx2("span", { class: "bp-recent-date", children: formatDate(n.created) }),
          /* @__PURE__ */ jsxs2("div", { children: [
            /* @__PURE__ */ jsx2("div", { class: "bp-recent-title", children: n.title }),
            n.description && /* @__PURE__ */ jsx2("div", { class: "bp-recent-blurb", children: n.description })
          ] }),
          /* @__PURE__ */ jsx2("span", { class: "bp-folder-chip", children: n.folderLabel })
        ] }) })) })
      ] }),
      /* @__PURE__ */ jsxs2("aside", { class: "bp-aside", children: [
        /* @__PURE__ */ jsx2("h6", { class: "bp-label", children: "Due for a recap" }),
        /* @__PURE__ */ jsx2(RecapRail, { ...props, candidates }),
        /* @__PURE__ */ jsx2("h6", { class: "bp-label", style: "margin-top: 1.75rem", children: "Folders" }),
        /* @__PURE__ */ jsx2("ul", { class: "bp-folder-rows", children: folders.map((g) => /* @__PURE__ */ jsx2("li", { children: /* @__PURE__ */ jsxs2(
          "a",
          {
            class: "bp-folder-row",
            href: resolveRelative(slug, `${g.folder}/index`),
            children: [
              /* @__PURE__ */ jsx2("span", { class: "bp-folder-row-name", children: g.label }),
              /* @__PURE__ */ jsx2("span", { class: "bp-folder-row-count", children: g.notes.length })
            ]
          }
        ) })) }),
        /* @__PURE__ */ jsx2("a", { class: "bp-section-link", href: foldersHref, children: "All folders \u2192" })
      ] })
    ] })
  ] });
};
var Homepage_default = Homepage;

// quartz/components/pages/GraphPage.tsx
import { jsx as jsx3, jsxs as jsxs3 } from "preact/jsx-runtime";
var GRAPH_FULL_CFG = {
  depth: -1,
  scale: 0.9,
  repelForce: 0.5,
  centerForce: 0.2,
  linkDistance: 34,
  fontSize: 0.65,
  opacityScale: 1,
  showTags: true,
  removeTags: [],
  drag: true,
  zoom: true,
  focusOnHover: true,
  enableRadial: true
};
var GraphPage = ({ fileData, allFiles }) => {
  const slug = fileData.slug;
  const notes = buildNoteSummaries(allFiles);
  const edgeCount = notes.reduce((sum, n) => sum + n.links.length, 0);
  const clusterCount = new Set(notes.map((n) => n.folder)).size;
  const orphanCount = notes.filter((n) => n.links.length === 0 && n.backlinkCount === 0).length;
  const hubs = notes.slice().sort((a, b) => b.backlinkCount - a.backlinkCount).slice(0, 6);
  return /* @__PURE__ */ jsxs3("article", { class: "popover-hint bp-graph-page", children: [
    /* @__PURE__ */ jsxs3("section", { class: "bp-graph-page-head", children: [
      /* @__PURE__ */ jsxs3("div", { children: [
        /* @__PURE__ */ jsx3("h1", { children: "Graph view" }),
        /* @__PURE__ */ jsx3("p", { children: "Every note and every link between them. Size is how many other notes point at it \u2014 hover to isolate a neighbourhood, click to read." })
      ] }),
      /* @__PURE__ */ jsxs3("div", { class: "bp-graph-meta", children: [
        "NODES ",
        notes.length,
        /* @__PURE__ */ jsx3("br", {}),
        "LINKS ",
        edgeCount,
        /* @__PURE__ */ jsx3("br", {}),
        "CLUSTERS ",
        clusterCount,
        /* @__PURE__ */ jsx3("br", {}),
        "ORPHANS ",
        orphanCount
      ] })
    ] }),
    /* @__PURE__ */ jsxs3("section", { class: "blueprint bp-graph-panel bp-graph-full", children: [
      /* @__PURE__ */ jsx3("i", { class: "corner tl" }),
      /* @__PURE__ */ jsx3("i", { class: "corner tr" }),
      /* @__PURE__ */ jsx3("i", { class: "corner bl" }),
      /* @__PURE__ */ jsx3("i", { class: "corner br" }),
      /* @__PURE__ */ jsx3("div", { class: "graph-container", "data-cfg": JSON.stringify(GRAPH_FULL_CFG) })
    ] }),
    hubs.length > 0 && /* @__PURE__ */ jsxs3("section", { class: "bp-graph-hubs", children: [
      /* @__PURE__ */ jsx3("h6", { class: "bp-label", children: "Most linked" }),
      /* @__PURE__ */ jsx3("div", { class: "bp-hub-grid", children: hubs.map((h) => /* @__PURE__ */ jsxs3("a", { class: "bp-hub-cell", href: resolveRelative(slug, h.slug), children: [
        /* @__PURE__ */ jsxs3("div", { class: "bp-hub-meta", children: [
          h.backlinkCount,
          " ",
          h.backlinkCount === 1 ? "LINK" : "LINKS",
          " \xB7 ",
          h.folderLabel
        ] }),
        /* @__PURE__ */ jsx3("div", { class: "bp-hub-title", children: h.title })
      ] })) })
    ] })
  ] });
};
var GraphPage_default = GraphPage;

// quartz/components/pages/FolderDirectory.tsx
import { jsx as jsx4, jsxs as jsxs4 } from "preact/jsx-runtime";
var FolderDirectory = ({ fileData, allFiles }) => {
  const slug = fileData.slug;
  const notes = buildNoteSummaries(allFiles);
  const groups = groupByFolder(notes);
  return /* @__PURE__ */ jsxs4("article", { class: "popover-hint bp-folders-page", children: [
    /* @__PURE__ */ jsxs4("header", { class: "bp-page-head", children: [
      /* @__PURE__ */ jsx4("h1", { children: "Folders" }),
      /* @__PURE__ */ jsx4("p", { children: "Every note sits in exactly one folder \u2014 browse by where it lives instead of by topic." })
    ] }),
    /* @__PURE__ */ jsx4("section", { class: "bp-folder-groups", children: groups.map((g) => {
      const last = g.notes[0]?.created;
      return /* @__PURE__ */ jsxs4("div", { class: "bp-folder-group", children: [
        /* @__PURE__ */ jsxs4("div", { class: "bp-folder-group-head", children: [
          /* @__PURE__ */ jsx4("h3", { class: "bp-folder-group-name", children: g.label }),
          /* @__PURE__ */ jsxs4("div", { class: "bp-folder-group-meta", children: [
            /* @__PURE__ */ jsxs4("span", { children: [
              g.notes.length,
              " ",
              g.notes.length === 1 ? "note" : "notes"
            ] }),
            last && /* @__PURE__ */ jsxs4("span", { children: [
              "Last ",
              formatDate(last)
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx4("ul", { class: "bp-folder-note-list", children: g.notes.map((n) => /* @__PURE__ */ jsx4("li", { children: /* @__PURE__ */ jsxs4("a", { class: "bp-note-entry", href: resolveRelative(slug, n.slug), children: [
          /* @__PURE__ */ jsxs4("div", { class: "bp-note-entry-main", children: [
            /* @__PURE__ */ jsx4("div", { class: "bp-note-entry-title", children: n.title }),
            n.description && /* @__PURE__ */ jsx4("p", { class: "bp-note-entry-blurb", children: n.description }),
            n.tags.length > 0 && /* @__PURE__ */ jsx4("div", { class: "bp-note-entry-tags", children: n.tags.slice(0, 5).map((t) => /* @__PURE__ */ jsxs4("span", { children: [
              "#",
              t
            ] })) })
          ] }),
          /* @__PURE__ */ jsxs4("div", { class: "bp-note-entry-meta", children: [
            /* @__PURE__ */ jsx4("span", { class: "bp-note-entry-date", children: formatDate(n.created) }),
            n.backlinkCount > 0 && /* @__PURE__ */ jsxs4("span", { class: "bp-note-entry-links", children: [
              n.backlinkCount,
              " ",
              n.backlinkCount === 1 ? "link" : "links"
            ] })
          ] })
        ] }) })) })
      ] });
    }) })
  ] });
};
var FolderDirectory_default = FolderDirectory;

// quartz/components/pages/NotesIndex.tsx
import { jsx as jsx5, jsxs as jsxs5 } from "preact/jsx-runtime";
var MONTHS = [
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
  "December"
];
function groupByMonth(notes) {
  const groups = [];
  const byKey = /* @__PURE__ */ new Map();
  for (const n of notes) {
    const d = n.created;
    const key = d ? `${d.getFullYear()}-${d.getMonth()}` : "undated";
    const label = d ? `${MONTHS[d.getMonth()]} ${d.getFullYear()}` : "Undated";
    let group = byKey.get(key);
    if (!group) {
      group = { key, label, notes: [] };
      byKey.set(key, group);
      groups.push(group);
    }
    group.notes.push(n);
  }
  return groups.filter((g) => g.key !== "undated").concat(groups.filter((g) => g.key === "undated"));
}
var NotesIndex = ({ fileData, allFiles }) => {
  const slug = fileData.slug;
  const notes = sortByCreatedDesc(buildNoteSummaries(allFiles));
  const groups = groupByMonth(notes);
  return /* @__PURE__ */ jsxs5("article", { class: "popover-hint bp-notes-page", children: [
    /* @__PURE__ */ jsxs5("header", { class: "bp-page-head", children: [
      /* @__PURE__ */ jsx5("h1", { children: "All notes" }),
      /* @__PURE__ */ jsxs5("p", { children: [
        "Every note in the vault, newest first \u2014 ",
        notes.length,
        " so far."
      ] })
    ] }),
    groups.map((g) => /* @__PURE__ */ jsxs5("section", { class: "bp-notes-group", children: [
      /* @__PURE__ */ jsxs5("h2", { class: "bp-notes-group-label", children: [
        g.label,
        /* @__PURE__ */ jsx5("span", { class: "bp-notes-group-count", children: g.notes.length })
      ] }),
      /* @__PURE__ */ jsx5("ul", { class: "bp-notes-group-list", children: g.notes.map((n) => /* @__PURE__ */ jsx5("li", { children: /* @__PURE__ */ jsxs5("a", { class: "bp-note-entry", href: resolveRelative(slug, n.slug), children: [
        /* @__PURE__ */ jsxs5("div", { class: "bp-note-entry-main", children: [
          /* @__PURE__ */ jsx5("div", { class: "bp-note-entry-title", children: n.title }),
          n.description && /* @__PURE__ */ jsx5("p", { class: "bp-note-entry-blurb", children: n.description }),
          n.tags.length > 0 && /* @__PURE__ */ jsx5("div", { class: "bp-note-entry-tags", children: n.tags.slice(0, 5).map((t) => /* @__PURE__ */ jsxs5("span", { children: [
            "#",
            t
          ] })) })
        ] }),
        /* @__PURE__ */ jsxs5("div", { class: "bp-note-entry-meta", children: [
          /* @__PURE__ */ jsx5("span", { class: "bp-note-entry-folder", children: n.folderLabel }),
          /* @__PURE__ */ jsx5("span", { class: "bp-note-entry-date", children: formatDate(n.created) }),
          n.backlinkCount > 0 && /* @__PURE__ */ jsxs5("span", { class: "bp-note-entry-links", children: [
            n.backlinkCount,
            " ",
            n.backlinkCount === 1 ? "link" : "links"
          ] })
        ] })
      ] }) })) })
    ] }))
  ] });
};
var NotesIndex_default = NotesIndex;

// quartz/plugins/directories/index.ts
var DirectoriesPageType = () => {
  const body = () => {
    const DirectoriesBody = (props) => {
      switch (props.fileData.slug) {
        case "index":
          return Homepage_default(props);
        case "graph":
          return GraphPage_default(props);
        case "folders":
          return FolderDirectory_default(props);
        case "notes":
          return NotesIndex_default(props);
        default:
          return null;
      }
    };
    return DirectoriesBody;
  };
  return {
    name: "DirectoriesPageType",
    priority: 20,
    match: ({ slug }) => slug === "index",
    generate: () => [
      {
        slug: "graph",
        title: "Graph View",
        data: { frontmatter: { title: "Graph View", tags: [] }, description: "" }
      },
      {
        slug: "folders",
        title: "Folders",
        data: { frontmatter: { title: "Folders", tags: [] }, description: "" }
      },
      {
        slug: "notes",
        title: "All Notes",
        data: { frontmatter: { title: "All Notes", tags: [] }, description: "" }
      }
    ],
    layout: "directories",
    body
  };
};
var index_default = DirectoriesPageType;
export {
  index_default as default
};
