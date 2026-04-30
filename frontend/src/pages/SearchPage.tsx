import { useEffect, useState } from 'react'
import EntryCard from '../components/EntryCard'
import { fetchEntries } from '../services/api'
import type { GlossaryEntry } from '../types'
import { isFavorite, toggleFavorite } from '../utils/storage'

const RECENT_KEY = 'um-glossary-recent-keywords'

export default function SearchPage() {
  const [keyword, setKeyword] = useState('')
  const [entries, setEntries] = useState<GlossaryEntry[]>([])
  const [favoriteMap, setFavoriteMap] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchEntries(keyword)
        setEntries(data)
        const nextFavoriteMap: Record<string, boolean> = {}
        data.forEach((item) => {
          nextFavoriteMap[item.id] = isFavorite(item.id)
        })
        setFavoriteMap(nextFavoriteMap)
        if (keyword.trim()) {
          rememberKeyword(keyword.trim())
        }
      } catch {
        setError('無法取得資料，請確認後端已啟動在 8080。')
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [keyword])

  return (
    <section className="page-section">
      <h2>搜尋詞條</h2>
      <p>輸入中文、英文、縮寫或 code，系統會即時篩選結果。</p>
      <input
        className="search-input"
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
        placeholder="搜尋中文、英文、縮寫..."
        aria-label="搜尋詞條"
      />

      <div className="entry-list">
        {loading ? <p>讀取中...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
        {!loading && !error && entries.length === 0 ? <p>暫無結果</p> : null}
        {entries.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            favorite={Boolean(favoriteMap[entry.id])}
            onToggleFavorite={(id) => {
              const next = toggleFavorite(id)
              setFavoriteMap((prev) => ({ ...prev, [id]: next }))
            }}
          />
        ))}
      </div>
    </section>
  )
}

function rememberKeyword(keyword: string) {
  const oldItems = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as string[]
  const next = [keyword, ...oldItems.filter((item) => item !== keyword)].slice(0, 10)
  localStorage.setItem(RECENT_KEY, JSON.stringify(next))
}
