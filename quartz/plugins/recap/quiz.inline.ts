/**
 * Client-side script for the recap feature: hydrates the homepage's "due for
 * a recap" rail (build-time skeleton -> real due list, since due-ness needs
 * localStorage which doesn't exist at build time) and drives the per-note
 * quiz flow (hide article -> walk TOC headings as self-rated recall prompts
 * -> reveal/rate Again/Hard/Good -> write lastReviewedAt).
 *
 * Registered once as `RecapCard.afterDOMLoaded` (see components/index.tsx),
 * so it ships in the site-wide script bundle and no-ops via querySelector
 * guards on pages that don't have a due-rail or a recap panel — the same
 * pattern the Graph plugin's own script uses.
 *
 * A plain exported string (not the special esbuild inline-import mechanism
 * other Quartz scripts use) so it works unbundled, straight from source, the
 * same way Nav.tsx's afterDOMLoaded template string does.
 */
export const quizInlineScript = `
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
      // localStorage unavailable (private browsing, quota) — degrade silently.
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
      empty.textContent = "Nothing due — everything's been reviewed recently.";
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
`
