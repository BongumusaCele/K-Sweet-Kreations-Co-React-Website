import { mediaUrl } from './api.js'
export function assetUrl(path, base = import.meta.env?.BASE_URL || '/') {
  if (!path) return `${base}images/celebration.jpg`
  if (!path.startsWith('/images/')) return mediaUrl(path)
  return `${base}${path.slice(1)}`
}
