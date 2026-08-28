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

// quartz/plugins/recap/quiz.inline.ts
var quizInlineScript = `
(() => {
  var STORAGE_KEY = "recap-reviews";
  var STALE_DAYS = 21;

  function loadReviews() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (e) {
      return {};
    }
  }

  function saveReviews(reviews) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
    } catch (e) {
      // localStorage unavailable (private browsing, quota) \u2014 degrade silently.
    }
  }

  function daysSince(iso) {
    var t = new Date(iso).getTime();
    if (isNaN(t)) return Infinity;
    return (Date.now() - t) / 86400000;
  }

  // Never-reviewed first, then stale (>21 days), with a bonus for high-backlink
  // "hub" notes so they surface sooner once they're eligible at all.
  function dueScore(candidate, reviews) {
    var hubBonus = Math.min(candidate.backlinkCount || 0, 10) * 2;
    var review = reviews[candidate.slug];
    if (!review) return 10000 + hubBonus;
    var days = daysSince(review.lastReviewedAt);
    if (days < STALE_DAYS) return -1;
    return days + hubBonus;
  }

  function dueLabel(candidate, reviews) {
    var review = reviews[candidate.slug];
    if (!review) return "never reviewed";
    var days = Math.round(daysSince(review.lastReviewedAt));
    var weeks = Math.max(1, Math.round(days / 7));
    return "not reviewed in " + weeks + (weeks === 1 ? " week" : " weeks");
  }

  function computeDue(candidates, reviews, limit) {
    return candidates
      .map(function (c) {
        return { c: c, score: dueScore(c, reviews) };
      })
      .filter(function (x) {
        return x.score >= 0;
      })
      .sort(function (a, b) {
        return b.score - a.score;
      })
      .slice(0, limit)
      .map(function (x) {
        return x.c;
      });
  }

  function renderDueRail(container) {
    var raw = container.dataset.recapCandidates;
    if (!raw) return;
    var candidates;
    try {
      candidates = JSON.parse(raw);
    } catch (e) {
      return;
    }
    var root = container.dataset.recapRoot || ".";
    var reviews = loadReviews();
    var due = computeDue(candidates, reviews, 3);

    container.innerHTML = "";
    if (due.length === 0) {
      var empty = document.createElement("div");
      empty.className = "bp-recap-empty";
      empty.textContent = "Nothing due \u2014 everything's been reviewed recently.";
      container.appendChild(empty);
      return;
    }

    due.forEach(function (c) {
      var a = document.createElement("a");
      a.className = "blueprint bp-recap-card";
      a.href = root + "/" + c.slug;
      var tl = document.createElement("i");
      tl.className = "corner tl";
      var tr = document.createElement("i");
      tr.className = "corner tr";
      var bl = document.createElement("i");
      bl.className = "corner bl";
      var br = document.createElement("i");
      br.className = "corner br";
      var when = document.createElement("div");
      when.className = "bp-recap-when";
      when.textContent = dueLabel(c, reviews);
      var title = document.createElement("div");
      title.className = "bp-recap-title";
      title.textContent = c.title;
      a.appendChild(tl);
      a.appendChild(tr);
      a.appendChild(bl);
      a.appendChild(br);
      a.appendChild(when);
      a.appendChild(title);
      container.appendChild(a);
    });
  }

  function setupDueRail() {
    var containers = document.querySelectorAll(".bp-due-rail[data-recap-candidates]");
    containers.forEach(renderDueRail);
  }

  function setupQuiz() {
    var panels = document.querySelectorAll(".bp-recap-panel[data-recap-slug]");
    panels.forEach(function (panel) {
      if (panel.dataset.recapBound === "true") return;
      panel.dataset.recapBound = "true";

      var trigger = panel.querySelector(".bp-quiz-trigger");
      var overlay = panel.querySelector(".bp-quiz-overlay");
      if (!trigger || !overlay) return;

      var progressEl = overlay.querySelector(".bp-quiz-progress");
      var promptEl = overlay.querySelector(".bp-quiz-prompt");
      var revealActions = overlay.querySelector(".bp-quiz-actions[data-step='reveal']");
      var rateActions = overlay.querySelector(".bp-quiz-actions[data-step='rate']");
      var doneEl = overlay.querySelector(".bp-quiz-done");
      var revealBtn = overlay.querySelector(".bp-quiz-reveal");
      var rateBtns = overlay.querySelectorAll(".bp-quiz-rate");
      var article = document.querySelector("article");

      var prompts = [];
      try {
        var toc = JSON.parse(panel.dataset.recapToc || "[]");
        prompts = toc.map(function (t) {
          return t.text;
        });
      } catch (e) {
        prompts = [];
      }
      if (prompts.length === 0) {
        prompts = ["Recall the gist of this note, in one or two sentences."];
      }

      var idx = 0;

      function renderPrompt() {
        if (progressEl) progressEl.textContent = "QUESTION " + (idx + 1) + " OF " + prompts.length;
        if (promptEl) promptEl.textContent = prompts[idx];
        if (revealActions) revealActions.hidden = false;
        if (rateActions) rateActions.hidden = true;
        if (doneEl) doneEl.hidden = true;
      }

      function startQuiz() {
        idx = 0;
        overlay.hidden = false;
        if (article) article.classList.add("bp-quiz-active");
        renderPrompt();
        overlay.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }

      function reveal() {
        if (revealActions) revealActions.hidden = true;
        if (rateActions) rateActions.hidden = false;
      }

      function finishQuiz() {
        var slug = panel.dataset.recapSlug;
        if (slug) {
          var reviews = loadReviews();
          var prev = reviews[slug] || { reviewCount: 0 };
          reviews[slug] = {
            lastReviewedAt: new Date().toISOString(),
            reviewCount: (prev.reviewCount || 0) + 1,
          };
          saveReviews(reviews);
        }
        if (revealActions) revealActions.hidden = true;
        if (rateActions) rateActions.hidden = true;
        if (doneEl) doneEl.hidden = false;
        if (article) article.classList.remove("bp-quiz-active");
        // The homepage due-rail (if still mounted from a prior SPA nav, e.g.
        // opening the quiz from a popover) should reflect this review too.
        setupDueRail();
      }

      function rate() {
        idx++;
        if (idx >= prompts.length) {
          finishQuiz();
          return;
        }
        renderPrompt();
      }

      trigger.addEventListener("click", startQuiz);
      if (revealBtn) revealBtn.addEventListener("click", reveal);
      rateBtns.forEach(function (btn) {
        btn.addEventListener("click", rate);
      });

      window.addCleanup(function () {
        trigger.removeEventListener("click", startQuiz);
        if (revealBtn) revealBtn.removeEventListener("click", reveal);
        rateBtns.forEach(function (btn) {
          btn.removeEventListener("click", rate);
        });
      });
    });
  }

  function setup() {
    setupDueRail();
    setupQuiz();
  }

  document.addEventListener("nav", setup);
})();
`;

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
var RecapCard = () => {
  const Component = ({ fileData }) => {
    const slug = fileData.slug;
    const title = fileData.frontmatter?.title;
    if (!slug || !title) return null;
    const toc = fileData.toc ?? [];
    const questionCount = toc.length || 1;
    return /* @__PURE__ */ jsxs(
      "div",
      {
        class: "blueprint bp-recap-panel",
        "data-recap-slug": slug,
        "data-recap-title": title,
        "data-recap-toc": JSON.stringify(toc),
        children: [
          /* @__PURE__ */ jsx("i", { class: "corner tl" }),
          /* @__PURE__ */ jsx("i", { class: "corner tr" }),
          /* @__PURE__ */ jsx("i", { class: "corner bl" }),
          /* @__PURE__ */ jsx("i", { class: "corner br" }),
          /* @__PURE__ */ jsx("div", { class: "bp-eyebrow", children: "Recap this note" }),
          /* @__PURE__ */ jsxs("p", { children: [
            "Hide the note, answer the ",
            questionCount,
            " ",
            questionCount === 1 ? "question" : "questions",
            " ",
            "it implies."
          ] }),
          /* @__PURE__ */ jsx("button", { type: "button", class: "bp-btn bp-btn-primary bp-quiz-trigger", children: "Quiz me" }),
          /* @__PURE__ */ jsxs("div", { class: "bp-quiz-overlay", hidden: true, children: [
            /* @__PURE__ */ jsx("div", { class: "bp-quiz-progress" }),
            /* @__PURE__ */ jsx("div", { class: "bp-quiz-prompt" }),
            /* @__PURE__ */ jsx("div", { class: "bp-quiz-hint", children: "Try to recall it, then reveal to check yourself." }),
            /* @__PURE__ */ jsx("div", { class: "bp-quiz-actions", "data-step": "reveal", children: /* @__PURE__ */ jsx("button", { type: "button", class: "bp-btn bp-quiz-reveal", children: "Reveal" }) }),
            /* @__PURE__ */ jsxs("div", { class: "bp-quiz-actions", "data-step": "rate", hidden: true, children: [
              /* @__PURE__ */ jsx("button", { type: "button", class: "bp-btn bp-quiz-rate", "data-rating": "again", children: "Again" }),
              /* @__PURE__ */ jsx("button", { type: "button", class: "bp-btn bp-quiz-rate", "data-rating": "hard", children: "Hard" }),
              /* @__PURE__ */ jsx("button", { type: "button", class: "bp-btn bp-btn-primary bp-quiz-rate", "data-rating": "good", children: "Good" })
            ] }),
            /* @__PURE__ */ jsx("div", { class: "bp-quiz-done", hidden: true, children: "Reviewed just now." })
          ] })
        ]
      }
    );
  };
  Component.afterDOMLoaded = quizInlineScript;
  return Component;
};
export {
  RecapCard,
  RecapRail
};
