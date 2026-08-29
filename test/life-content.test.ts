import { describe, expect, it } from 'vitest'
import {
  isLifeNoteSlug,
  isSafeContentSlug,
  LIFE_RESERVED_MARKDOWN_SLUGS,
} from '../constants/life-content'
import {
  parseYamlSafe,
  readLifeMoments,
  readMarkdownCollection,
} from '../server/utils/content-files'

describe('Life content slug safety', () => {
  it('rejects path traversal and empty slugs', () => {
    expect(isSafeContentSlug('../blog/secret')).toBe(false)
    expect(isSafeContentSlug('foo/bar')).toBe(false)
    expect(isSafeContentSlug('..')).toBe(false)
    expect(isSafeContentSlug('')).toBe(false)
    expect(isSafeContentSlug('  hello')).toBe(false)
    expect(isSafeContentSlug('weekend-ride')).toBe(true)
  })

  it('never treats reserved page files as notes', () => {
    for (const slug of LIFE_RESERVED_MARKDOWN_SLUGS) {
      expect(isLifeNoteSlug(slug)).toBe(false)
    }
    expect(isLifeNoteSlug('profile')).toBe(false)
  })
})

describe('Life markdown collection', () => {
  it('excludes profile.md from the notes list', () => {
    const notes = readMarkdownCollection('life')
    expect(notes.some(item => item.slug === 'profile')).toBe(false)
    expect(notes.some(item => item.path === '/life/profile')).toBe(false)
    expect(notes.some(item => item._path === '/life/profile')).toBe(false)
  })
})

describe('Life YAML parsing', () => {
  it('returns null for invalid YAML instead of throwing', () => {
    expect(parseYamlSafe('not: [unterminated')).toBeNull()
    expect(parseYamlSafe('[\n- unterminated')).toBeNull()
  })

  it('sorts moments by date descending', () => {
    const moments = readLifeMoments()
    expect(Array.isArray(moments)).toBe(true)
    const dates = moments.map(item => item.date)
    const sorted = [...dates].sort((left, right) => new Date(right).getTime() - new Date(left).getTime())
    expect(dates).toEqual(sorted)
  })
})
