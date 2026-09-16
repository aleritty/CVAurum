import { describe, expect, it, vi, afterEach } from 'vitest'
import { alignAsideVisualToMain } from './asideVisualAlign'

/**
 * No real DOM in this suite (vitest.config.ts runs plain node) - a fake root
 * stands in, the same way keywordFit.test.ts's fakeRoot does. Unlike that
 * one, this function's whole job is arithmetic on the boxes it measures, so
 * the stand-ins carry real (fake) geometry rather than empty query results.
 */
function el(top: number) {
  return { style: { marginBottom: '' }, getBoundingClientRect: () => ({ top }) } as unknown as HTMLElement
}

function fakeRoot(opts: { visual?: HTMLElement | null; mainFirst?: HTMLElement | null; asideFirst?: HTMLElement | null }) {
  return {
    querySelector: (selector: string): HTMLElement | null => {
      if (selector.includes('rm-visual-wrap')) return opts.visual ?? null
      if (selector.includes('rm-col-main')) return opts.mainFirst ?? null
      if (selector.includes('rm-col-aside')) return opts.asideFirst ?? null
      return null
    },
  } as unknown as HTMLElement
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('alignAsideVisualToMain', () => {
  it('grows the gap by exactly the shortfall between the two first lines', () => {
    vi.stubGlobal('getComputedStyle', () => ({ marginBottom: '12.8px' }))
    const visual = el(0)
    const root = fakeRoot({ visual, mainFirst: el(163.7), asideFirst: el(159.2) })
    alignAsideVisualToMain(root)
    // 12.8 (existing gap) + 4.5 (shortfall) = 17.3
    expect(parseFloat(visual.style.marginBottom)).toBeCloseTo(17.3, 1)
  })

  it('leaves the gap alone once the aside already reaches main’s first line', () => {
    vi.stubGlobal('getComputedStyle', () => ({ marginBottom: '12.8px' }))
    const visual = el(0)
    const root = fakeRoot({ visual, mainFirst: el(160), asideFirst: el(160) })
    alignAsideVisualToMain(root)
    expect(visual.style.marginBottom).toBe('')
  })

  it('never shrinks the gap when the aside already sits past main’s first line', () => {
    vi.stubGlobal('getComputedStyle', () => ({ marginBottom: '12.8px' }))
    const visual = el(0)
    const root = fakeRoot({ visual, mainFirst: el(160), asideFirst: el(170) })
    alignAsideVisualToMain(root)
    expect(visual.style.marginBottom).toBe('')
  })

  it('resets its own earlier adjustment before re-measuring, so repeat calls never compound', () => {
    vi.stubGlobal('getComputedStyle', () => ({ marginBottom: '12.8px' }))
    const visual = el(0)
    visual.style.marginBottom = '99px' // a stale value from a previous render
    const root = fakeRoot({ visual, mainFirst: el(163.7), asideFirst: el(159.2) })
    alignAsideVisualToMain(root)
    expect(parseFloat(visual.style.marginBottom)).toBeCloseTo(17.3, 1)
  })

  it('is a no-op with no aside visual at all (single-column template)', () => {
    const root = fakeRoot({ visual: null })
    expect(() => alignAsideVisualToMain(root)).not.toThrow()
  })

  it('is a no-op when either column has no first section to compare', () => {
    vi.stubGlobal('getComputedStyle', () => ({ marginBottom: '12.8px' }))
    const visual = el(0)
    const root = fakeRoot({ visual, mainFirst: null, asideFirst: el(159.2) })
    alignAsideVisualToMain(root)
    expect(visual.style.marginBottom).toBe('')
  })
})
