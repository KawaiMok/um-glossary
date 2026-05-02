import { useEffect, useState } from 'react'
import { Alert, Chip, Stack, Typography } from '@mui/material'
import EntryCard from '../components/EntryCard'
import { fetchEntryDetail } from '../services/api'
import type { GlossaryEntry } from '../types'
import { isFavorite, toggleFavorite } from '../utils/storage'

const RECENT_KEYWORDS_KEY = 'um-glossary-recent-keywords'
const RECENT_ENTRIES_KEY = 'um-glossary-recent-entries'

export default function RecentPage() {
  const [keywords, setKeywords] = useState<string[]>([])
  const [recentEntries, setRecentEntries] = useState<GlossaryEntry[]>([])

  useEffect(() => {
    const load = async () => {
      const storedKeywords = JSON.parse(localStorage.getItem(RECENT_KEYWORDS_KEY) ?? '[]') as string[]
      setKeywords(storedKeywords.slice(0, 10))
      const ids = (JSON.parse(localStorage.getItem(RECENT_ENTRIES_KEY) ?? '[]') as string[]).slice(0, 10)
      const list = await Promise.all(ids.map((id) => fetchEntryDetail(id).catch(() => null)))
      setRecentEntries(list.filter((item): item is GlossaryEntry => item !== null))
    }
    load()
  }, [])

  return (
    <Stack spacing={2}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>最近紀錄</Typography>
      <Typography variant="h6">最近搜尋關鍵字</Typography>
      {keywords.length === 0 ? <Alert severity="info">暫無關鍵字紀錄。</Alert> : null}
      <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
        {keywords.map((item) => (
          <Chip key={item} label={item} size="small" color="primary" variant="outlined" />
        ))}
      </Stack>

      <Typography variant="h6">最近查看詞條</Typography>
      {recentEntries.length === 0 ? <Alert severity="info">暫無詞條查看紀錄。</Alert> : null}
      <Stack spacing={1.5}>
        {recentEntries.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            favorite={isFavorite(entry.id)}
            onToggleFavorite={(id) => {
              toggleFavorite(id)
              setRecentEntries((prev) => [...prev])
            }}
          />
        ))}
      </Stack>
    </Stack>
  )
}
