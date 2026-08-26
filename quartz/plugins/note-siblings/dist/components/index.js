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
  if (slug.startsWith("tags/")) return false;
  if (slug.endsWith("/index")) return false;
  return true;
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
var WEEK_MS = 7 * 24 * 60 * 60 * 1e3;

// quartz/plugins/note-siblings/components/index.tsx
import { jsx, jsxs } from "preact/jsx-runtime";
var NoteSiblings = () => {
  const Component = ({ fileData, allFiles }) => {
    const slug = fileData.slug;
    if (!slug || !isRealNote(slug)) return null;
    const folder = folderOf(slug);
    const siblings = allFiles.filter((f) => isRealNote(f.slug) && folderOf(f.slug) === folder).sort((a, b) => (b.dates?.created?.getTime() ?? 0) - (a.dates?.created?.getTime() ?? 0));
    if (siblings.length <= 1) return null;
    const root = pathToRoot(slug);
    return /* @__PURE__ */ jsxs("div", { class: "bp-note-siblings", children: [
      /* @__PURE__ */ jsxs("h6", { class: "bp-label", children: [
        "In ",
        folderLabel(folder)
      ] }),
      siblings.map((s) => /* @__PURE__ */ jsx(
        "a",
        {
          class: "bp-note-sibling",
          "aria-current": s.slug === slug ? "page" : void 0,
          href: resolveRelative(slug, s.slug),
          children: s.frontmatter?.title ?? s.slug
        }
      )),
      /* @__PURE__ */ jsx("a", { class: "bp-note-sibling bp-note-sibling-all", href: `${root}/folders`, children: "All folders \u2192" })
    ] });
  };
  return Component;
};
export {
  NoteSiblings
};
