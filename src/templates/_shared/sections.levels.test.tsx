import { describe, it, expect, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { createDocument } from '@/data/defaults'
import { getTemplate } from '@/templates/registry'

// The sanitizer wraps a DOM purifier that needs a window, and this suite runs
// under the plain node environment. Nothing rendered here is rich text.
vi.mock('@/lib/sanitize', () => ({ sanitizeHtml: (html: string) => html }))

import { SectionBody } from './sections'

/**
 * Every language meter starts at the same x, whatever its label is worth.
 *
 * Without this, each meter sits flush after its own label, so "EN" and
 * "Mandarin Chinese" put their dots ~90px apart and the list reads as ragged.
 * Alignment is the markup and the sheet together - a grid on the wrapper, its
 * tracks handed down through .rm-mini to the label/meter pair - so both halves
 * are asserted here: dropping either one silently un-aligns the list again,
 * and neither is visible to a test that only renders markup.
 */
const css = fs
  .readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../../styles/artboard.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')

const ruleFor = (selector: string) =>
  [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .map((m) => ({ selector: m[1].trim().replace(/\s+/g, ' '), body: m[2] }))
    .find((r) => r.selector === selector)?.body

describe('the languages list lines its meters up in one column', () => {
  it('wraps the rows in .rm-levels, the element the grid is declared on', () => {
    const doc = createDocument({ sample: true })
    doc.content.languages = [
      { id: 'l1', language: 'EN', fluency: 'Native', rating: 6 },
      { id: 'l2', language: 'Mandarin Chinese', fluency: 'Elementary', rating: 1 },
    ]
    doc.metadata.typography.proficiency = 'dots'
    const html = renderToStaticMarkup(<SectionBody sectionKey="languages" doc={doc} config={getTemplate('clarity')} />)
    expect(html).toContain('class="rm-levels"')
    expect(html.match(/class="rm-mini"/g)?.length).toBe(2)
    expect(html.match(/class="rm-dots"/g)?.length).toBe(2)
  })

  it('gives .rm-levels two tracks and hands them down to the label/meter pair', () => {
    // minmax(0, ...) on track 1, never bare max-content: a bare track cannot
    // shrink below the widest label's unwrapped width, which overflowed a
    // narrow sidebar and dragged the fluency text off the printable edge.
    expect(ruleFor('.rm-levels')).toMatch(/grid-template-columns:\s*minmax\(0,\s*max-content\)\s*minmax\(0,\s*1fr\)/)
    expect(ruleFor('.rm-levels')).toMatch(/display:\s*grid/)
    // .rm-mini stays its own box (the move/delete handles anchor to it) but
    // passes the tracks through, so every row shares one meter column.
    expect(ruleFor('.rm-levels > .rm-mini')).toMatch(/grid-template-columns:\s*subgrid/)
    // .rm-level is a flex row everywhere else; inside the grid it must vanish
    // so its two children become the actual subgrid cells.
    expect(ruleFor('.rm-levels > .rm-mini > .rm-level')).toMatch(/display:\s*contents/)
    // A row with no meter is one cell across both tracks, as it was.
    expect(ruleFor('.rm-levels > .rm-mini > .rm-item-head')).toMatch(/grid-column:\s*1\s*\/\s*-1/)
  })
})
