const FAVORITES_KEY = 'um-glossary-favorites'

export function getFavoriteIds(): string[] {
  return JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]') as string[]
}

export function isFavorite(id: string): boolean {
  return getFavoriteIds().includes(id)
}

export function toggleFavorite(id: string): boolean {
  const favorites = getFavoriteIds()
  const next = favorites.includes(id) ? favorites.filter((item) => item !== id) : [id, ...favorites]
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
  return next.includes(id)
}
