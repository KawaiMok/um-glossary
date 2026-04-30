import { useEffect, useState } from 'react'
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
    <section className="page-section">
      <h2>最近紀錄</h2>
      <h3>最近搜尋關鍵字</h3>
      {keywords.length === 0 ? <p>暫無關鍵字紀錄。</p> : null}
      <ul className="keyword-list">
        {keywords.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <h3>最近查看詞條</h3>
      {recentEntries.length === 0 ? <p>暫無詞條查看紀錄。</p> : null}
      <div className="entry-list">
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
      </div>
    </section>
  )
}
