import { describe, expect, it } from 'vitest'
import { ProfileSchema } from '@/types/resume'
import { profileWords } from './atoms'

const url = 'https://github.com/someone'

describe('profileWords follows the fork order', () => {
  it('prefers the label', () => {
    expect(profileWords({ label: ' Code ', username: 'someone', network: 'GitHub', url })).toBe('Code')
  })

  it('then the handle, without its @', () => {
    expect(profileWords({ label: ' ', username: '@someone', network: 'GitHub', url })).toBe('someone')
  })

  it('then the network', () => {
    expect(profileWords({ network: 'GitHub', url })).toBe('GitHub')
  })

  it('and the address only when nothing else names the link', () => {
    expect(profileWords({ url })).toBe('github.com/someone')
  })
})

// DA RIMUOVERE IN FUTURO, together with migrateProfileText in types/resume.ts.
describe('a profile saved with the old text field', () => {
  it('moves text to label', () => {
    const p = ProfileSchema.parse({ network: 'GitHub', url, text: 'Code' })
    expect(p.label).toBe('Code')
    expect(p).not.toHaveProperty('text')
  })

  it('keeps a label that is already set', () => {
    expect(ProfileSchema.parse({ url, text: 'Old', label: 'New' }).label).toBe('New')
  })

  it('leaves a profile without text alone', () => {
    expect(ProfileSchema.parse({ url }).label).toBeUndefined()
  })
})
