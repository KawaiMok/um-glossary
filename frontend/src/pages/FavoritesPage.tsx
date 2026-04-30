import { useEffect, useState } from 'react'
import EntryCard from '../components/EntryCard'
import { fetchEntryDetail } from '../services/api'
import type { GlossaryEntry } from '../types'
import { getFavoriteIds, toggleFavorite } from '../utils/storage'

export default function FavoritesPage() {
  const [items, setItems] = useState<GlossaryEntry[]>([])

  useEffect(() => {
    const load = async () => {
      const ids = getFavoriteIds()
      const list = await Promise.all(ids.map((id) => fetchEntryDetail(id).catch(() => null)))
      setItems(list.filter((item): item is GlossaryEntry => item !== null))
    }
    load()
  }, [])

  return (
    <section className="page-section">
      <h2>Favorites</h2>
      {items.length === 0 ? <p>尚未收藏任何詞條。</p> : null}
      <div className="entry-list">
        {items.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            favorite={true}
            onToggleFavorite={(id) => {
              toggleFavorite(id)
              setItems((prev) => prev.filter((item) => item.id !== id))
            }}
          />
        ))}
      </div>
    </section>
  )
}
