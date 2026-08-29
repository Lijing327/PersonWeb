import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '..')

function readPngHeader(relativePath: string) {
  const buffer = readFileSync(resolve(root, relativePath))
  return {
    exists: true,
    isPng: buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    hasIhdr: buffer.includes(Buffer.from('IHDR')),
    byteLength: buffer.byteLength
  }
}

describe('brand logo assets', () => {
  it('publishes favicon and in-page logo files as PNG', () => {
    const files = [
      'public/favicon.png',
      'public/brand/logo-favicon.png',
      'public/brand/logo-wordmark.png',
      'public/brand/logo-full.png'
    ]

    for (const file of files) {
      expect(existsSync(resolve(root, file)), file).toBe(true)
      const header = readPngHeader(file)
      expect(header.isPng, `${file} should be a PNG`).toBe(true)
      expect(header.byteLength).toBeGreaterThan(1024)
    }
  })
})
