import type { Source } from '@/data/types'

/**
 * Turns a regular Figma file URL into the embeddable one:
 * https://www.figma.com/design/<key>/<name>?node-id=1-2
 *   -> https://embed.figma.com/design/<key>/<name>?node-id=1-2&embed-host=share
 */
export function toFigmaEmbedUrl(url: string, embedHost = 'share'): string | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  if (!/(^|\.)figma\.com$/.test(parsed.hostname)) return null

  parsed.hostname = 'embed.figma.com'
  // `t=` is a per-session tracking token and breaks nothing, but it is noise.
  parsed.searchParams.delete('t')
  parsed.searchParams.set('embed-host', embedHost)
  return parsed.toString()
}

export function figmaNodeId(url: string): string | null {
  try {
    return new URL(url).searchParams.get('node-id')
  } catch {
    return null
  }
}

/** The URL that actually goes into the iframe, or null when nothing can be embedded. */
export function embedUrlFor(source: Source): string | null {
  if (!source.url) return null
  if (source.kind === 'figma') return toFigmaEmbedUrl(source.url)
  if (source.kind === 'google-doc') return null
  return source.url
}

export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}
