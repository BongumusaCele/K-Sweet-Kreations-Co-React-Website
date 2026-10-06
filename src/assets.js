// Keep preview records portable between localhost and repository-based hosting.
export function assetUrl(path, base = import.meta.env?.BASE_URL || '/') {
  if (!path || !path.startsWith('/images/')) return path
  return `${base}${path.slice(1)}`
}
