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

// quartz/plugins/tag-directory/components/index.tsx
import { jsx, jsxs } from "preact/jsx-runtime";
var TagDirectory = () => {
  const Component = ({ fileData, allFiles }) => {
    if (fileData.slug !== "tags/index") return null;
    const counts = /* @__PURE__ */ new Map();
    for (const f of allFiles) {
      if (f.unlisted === true) continue;
      const tags = f.frontmatter?.tags ?? [];
      for (const t of tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    const entries = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const max = Math.max(1, ...entries.map(([, c]) => c));
    const root = pathToRoot(fileData.slug);
    return /* @__PURE__ */ jsxs("div", { class: "bp-tag-directory", children: [
      /* @__PURE__ */ jsxs("header", { class: "bp-page-head", children: [
        /* @__PURE__ */ jsx("h1", { children: "Tags" }),
        /* @__PURE__ */ jsx("p", { children: "The cross-cutting index. A note sits in one folder and belongs to several conversations \u2014 the bar is how many." })
      ] }),
      entries.length === 0 ? /* @__PURE__ */ jsx("p", { class: "bp-recap-empty", children: "No tags yet." }) : /* @__PURE__ */ jsx("div", { class: "bp-tag-grid", children: entries.map(([tag, count]) => /* @__PURE__ */ jsxs("a", { class: "bp-tag-cell", href: `${root}/tags/${tag}`, children: [
        /* @__PURE__ */ jsxs("div", { class: "bp-tag-cell-head", children: [
          /* @__PURE__ */ jsx("span", { class: "bp-tag-name", children: tag }),
          /* @__PURE__ */ jsx("span", { class: "bp-tag-count", children: count })
        ] }),
        /* @__PURE__ */ jsx("div", { class: "bp-tag-bar-track", children: /* @__PURE__ */ jsx(
          "div",
          {
            class: "bp-tag-bar-fill",
            style: { width: `${Math.round(count / max * 100)}%` }
          }
        ) })
      ] })) })
    ] });
  };
  return Component;
};
export {
  TagDirectory
};
