import path from 'node:path'
import { createError } from 'h3'

export interface SafePathOptions {
  /** If set, the resolved file must have one of these extensions (lowercase, with dot). */
  allowedExtensions?: string[]
}

const PATH_TRAVERSAL_PATTERN = /(?:^|[\\/])\.\.(?:[\\/]|$)|\0/

/**
 * Decode URL-encoded path segments; reject malformed encoding.
 */
export function decodePathInput(input: string): string {
  let decoded = input.trim()
  if (!decoded) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid path' })
  }

  for (let i = 0; i < 3; i++) {
    try {
      const next = decodeURIComponent(decoded)
      if (next === decoded) break
      decoded = next
    } catch {
      throw createError({ statusCode: 400, statusMessage: 'Invalid path encoding' })
    }
  }

  return decoded
}

function assertRelativeSafeSegments(normalized: string): void {
  if (path.isAbsolute(normalized)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid path' })
  }

  if (PATH_TRAVERSAL_PATTERN.test(normalized)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid path' })
  }

  const segments = normalized.split(/[\\/]/).filter(Boolean)
  for (const segment of segments) {
    if (segment === '.' || segment === '..') {
      throw createError({ statusCode: 400, statusMessage: 'Invalid path' })
    }
  }
}

/**
 * Resolve a user-supplied relative path under baseDir.
 * The resolved absolute path must remain inside baseDir.
 */
export function resolveSafePath(
  baseDir: string,
  userPath: string,
  options?: SafePathOptions,
): string {
  const decoded = decodePathInput(userPath)
  const normalized = decoded.replace(/\\/g, '/')
  assertRelativeSafeSegments(normalized)

  const baseResolved = path.resolve(baseDir)
  const targetResolved = path.resolve(baseResolved, normalized)

  const baseWithSep = baseResolved.endsWith(path.sep)
    ? baseResolved
    : baseResolved + path.sep

  if (targetResolved !== baseResolved && !targetResolved.startsWith(baseWithSep)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid path' })
  }

  if (options?.allowedExtensions?.length) {
    const ext = path.extname(targetResolved).toLowerCase()
    const allowed = options.allowedExtensions.map((e) => e.toLowerCase())
    if (!allowed.includes(ext)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid file type' })
    }
  }

  return targetResolved
}

/**
 * Resolve a single-segment basename (no directory separators) under baseDir.
 */
export function resolveSafeBasename(
  baseDir: string,
  basename: string,
  options?: SafePathOptions,
): string {
  const decoded = decodePathInput(basename)
  if (/[\\/]/.test(decoded)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid path' })
  }
  return resolveSafePath(baseDir, decoded, options)
}
