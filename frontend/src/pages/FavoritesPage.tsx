import { useEffect, useState } from 'react'
import { Alert, Stack, Typography } from '@mui/material'
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
    <Stack spacing={2}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>我的收藏</Typography>
      {items.length === 0 ? <Alert severity="info">尚未收藏任何詞條。</Alert> : null}
      <Stack spacing={1.5}>
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
      </Stack>
    </Stack>
  )
}
