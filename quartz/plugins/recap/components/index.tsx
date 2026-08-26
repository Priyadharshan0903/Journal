import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../../../components/types"
import { pathToRoot } from "../../../util/path"
import { RecapCandidate } from "../due"
import { quizInlineScript } from "../quiz.inline"

/**
 * "Due for a recap" rail on the homepage. Build-time only computes the
 * candidate list (real note data — title/folder/created/backlinkCount, all
 * reused from directories/notes.ts); due-ness itself needs `localStorage`, so
 * this renders a skeleton that quiz.inline.ts replaces on the client. Not
 * registered through the component registry — Homepage.tsx renders it
 * directly, like any other Preact component.
 */
export function RecapRail({
  fileData,
  candidates,
}: QuartzComponentProps & { candidates: RecapCandidate[] }) {
  const root = pathToRoot(fileData.slug!)
  return (
    <div
      class="bp-due-rail"
      data-recap-candidates={JSON.stringify(candidates)}
      data-recap-root={root}
    >
      <div class="bp-recap-empty">Loading…</div>
    </div>
  )
}

/**
 * "Recap this note" card in a note's right rail (see package.json's
 * `quartz.components.RecapCard` — defaultPosition "right", after the local
 * graph and table of contents). Walks the note's own TOC headings (already
 * computed by table-of-contents, reused here rather than re-parsed) as
 * self-rated recall prompts once "Quiz me" is clicked; quiz.inline.ts owns
 * the actual interaction and the localStorage write.
 */
export const RecapCard: QuartzComponentConstructor = () => {
  const Component: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
    const slug = fileData.slug
    const title = fileData.frontmatter?.title as string | undefined
    if (!slug || !title) return null

    const toc = (fileData.toc as { depth: number; text: string; slug: string }[] | undefined) ?? []
    const questionCount = toc.length || 1

    return (
      <div
        class="blueprint bp-recap-panel"
        data-recap-slug={slug}
        data-recap-title={title}
        data-recap-toc={JSON.stringify(toc)}
      >
        <i class="corner tl"></i>
        <i class="corner tr"></i>
        <i class="corner bl"></i>
        <i class="corner br"></i>
        <div class="bp-eyebrow">Recap this note</div>
        <p>
          Hide the note, answer the {questionCount} {questionCount === 1 ? "question" : "questions"}{" "}
          it implies.
        </p>
        <button type="button" class="bp-btn bp-btn-primary bp-quiz-trigger">
          Quiz me
        </button>
        <div class="bp-quiz-overlay" hidden>
          <div class="bp-quiz-progress"></div>
          <div class="bp-quiz-prompt"></div>
          <div class="bp-quiz-hint">Try to recall it, then reveal to check yourself.</div>
          <div class="bp-quiz-actions" data-step="reveal">
            <button type="button" class="bp-btn bp-quiz-reveal">
              Reveal
            </button>
          </div>
          <div class="bp-quiz-actions" data-step="rate" hidden>
            <button type="button" class="bp-btn bp-quiz-rate" data-rating="again">
              Again
            </button>
            <button type="button" class="bp-btn bp-quiz-rate" data-rating="hard">
              Hard
            </button>
            <button type="button" class="bp-btn bp-btn-primary bp-quiz-rate" data-rating="good">
              Good
            </button>
          </div>
          <div class="bp-quiz-done" hidden>
            Reviewed just now.
          </div>
        </div>
      </div>
    )
  }

  Component.afterDOMLoaded = quizInlineScript
  return Component
}
