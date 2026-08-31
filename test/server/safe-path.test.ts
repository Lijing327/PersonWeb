import { describe, it, expect } from 'vitest'
import path from 'node:path'
import {
  decodePathInput,
  resolveSafeBasename,
  resolveSafePath,
} from '~/server/utils/safe-path'

const BASE = path.resolve('/tmp/personweb-safe-path-test')

function expectInvalidPath(fn: () => unknown) {
  try {
    fn()
    expect.unreachable('Expected path validation to throw')
  } catch (error) {
    expect((error as { statusCode?: number }).statusCode).toBe(400)
  }
}

describe('resolveSafePath', () => {
  it('allows a normal relative markdown path', () => {
    const resolved = resolveSafePath(BASE, 'blog/hello-world.md', {
      allowedExtensions: ['.md'],
    })
    expect(resolved).toBe(path.resolve(BASE, 'blog/hello-world.md'))
  })

  it('rejects parent directory traversal with ../', () => {
    expectInvalidPath(() => resolveSafePath(BASE, '../etc/passwd'))
  })

  it('rejects nested traversal with ../../', () => {
    expectInvalidPath(() => resolveSafePath(BASE, 'blog/../../secret.env'))
  })

  it('rejects absolute paths', () => {
    expectInvalidPath(() => resolveSafePath(BASE, '/etc/passwd'))
  })

  it('rejects URL-encoded traversal', () => {
    expectInvalidPath(() => resolveSafePath(BASE, 'blog/%2e%2e%2fsecret.md'))
  })

  it('rejects double-encoded traversal', () => {
    expectInvalidPath(() => resolveSafePath(BASE, '%252e%252e%252fsecret.md'))
  })

  it('rejects disallowed extensions', () => {
    expectInvalidPath(() =>
      resolveSafePath(BASE, 'blog/evil.exe', { allowedExtensions: ['.md'] }),
    )
  })

  it('resolveSafeBasename rejects directory separators', () => {
    expectInvalidPath(() => resolveSafeBasename(BASE, 'nested/file.md'))
  })

  it('decodePathInput rejects malformed encoding', () => {
    expectInvalidPath(() => decodePathInput('%E0%A4%A'))
  })
})
