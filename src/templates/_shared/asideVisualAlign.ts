/**
 * Pushes the aside column's photo/monogram down just enough that the aside's
 * FIRST section starts level with the main column's first section.
 *
 * The header block (name + role + contacts) and the photo/monogram rarely
 * come out the same height - a longer name, a wrapped role line, or a
 * different photo size all change one but not the other - so a flat CSS
 * margin (artboard.css's `--rm-photo-gap`) only lines the two columns up by
 * coincidence. Measured instead of guessed, the same way fitHeadingWords and
 * applyKeywordFit (keywordFit.ts) already settle layout by measuring it.
 *
 * Idempotent: resets its own previous adjustment before measuring, so
 * calling it every render never compounds. A no-op wherever there is no
 * two-column aside, no photo/monogram, or no first section in either column
 * to compare - including once the aside's own margin already reaches or
 * passes main's first line, since only a SHORTFALL needs closing.
 */
export function alignAsideVisualToMain(root: HTMLElement): void {
  const visual = root.querySelector<HTMLElement>(
    '.rm-col-aside > .rm-visual-wrap, .rm-col-aside > .rm-photo, .rm-col-aside > .rm-monogram'
  )
  if (!visual) return
  visual.style.marginBottom = ''
  const mainFirst = root.querySelector<HTMLElement>('.rm-col-main .rm-section')
  const asideFirst = root.querySelector<HTMLElement>('.rm-col-aside .rm-section')
  if (!mainFirst || !asideFirst) return
  const shortfallPx = mainFirst.getBoundingClientRect().top - asideFirst.getBoundingClientRect().top
  if (shortfallPx <= 0) return
  const basePx = parseFloat(getComputedStyle(visual).marginBottom) || 0
  visual.style.marginBottom = `${basePx + shortfallPx}px`
}
