import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchEntryDetail, updateEntry } from '../services/api'
import type { GlossaryEntry } from '../types'
import { isFavorite as isFavoriteStorage, toggleFavorite as toggleFavoriteStorage } from '../utils/storage'
const RECENT_ENTRIES_KEY = 'um-glossary-recent-entries'

export default function EntryDetailPage() {
  const { id } = useParams()
  const [entry, setEntry] = useState<GlossaryEntry | null>(null)
  const [form, setForm] = useState<Partial<GlossaryEntry>>({})
  const [abbreviationsText, setAbbreviationsText] = useState('')
  const [error, setError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const data = await fetchEntryDetail(id)
        setEntry(data)
        setForm({
          termZh: data.termZh,
          termEn: data.termEn,
          code: data.code ?? '',
          exampleZh: data.exampleZh ?? '',
          exampleEn: data.exampleEn ?? '',
          remarks: data.remarks ?? '',
        })
        setAbbreviationsText((data.abbreviations ?? []).join('\n'))
        setIsFavorite(isFavoriteStorage(data.id))
        rememberEntry(id)
      } catch {
        setError('查詢詳情失敗。')
      }
    }
    load()
  }, [id])

  const toggleFavorite = () => {
    if (!entry) return
    setIsFavorite(toggleFavoriteStorage(entry.id))
  }

  const handleSave = async () => {
    if (!id) return
    try {
      const updated = await updateEntry(id, {
        termZh: form.termZh?.trim() ?? '',
        termEn: form.termEn?.trim() ?? '',
        code: form.code ?? '',
        exampleZh: form.exampleZh ?? '',
        exampleEn: form.exampleEn ?? '',
        remarks: form.remarks ?? '',
        abbreviations: abbreviationsText
          .split(/\n|,|;/)
          .map((item) => item.trim())
          .filter(Boolean),
      } as Partial<GlossaryEntry>)
      setEntry(updated)
      setSaveMessage('已儲存修改。')
    } catch {
      setSaveMessage('儲存失敗，請稍後再試。')
    }
  }

  if (error) return <p className="error-text">{error}</p>
  if (!entry) return <p>載入中...</p>

  return (
    <section className="page-section">
      <h2>{entry.termZh}</h2>
      <p>{entry.termEn}</p>
      <button type="button" onClick={toggleFavorite}>
        {isFavorite ? '取消收藏' : '加入收藏'}
      </button>
      <div className="form-grid">
        <label>
          中文
          <input value={form.termZh ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, termZh: e.target.value }))} />
        </label>
        <label>
          英文
          <input value={form.termEn ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, termEn: e.target.value }))} />
        </label>
        <label>
          Code
          <input value={form.code ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))} />
        </label>
        <label>
          Example EN
          <textarea value={form.exampleEn ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, exampleEn: e.target.value }))} />
        </label>
        <label>
          Example ZH
          <textarea value={form.exampleZh ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, exampleZh: e.target.value }))} />
        </label>
        <label>
          Remark
          <textarea value={form.remarks ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))} />
        </label>
        <label>
          Abbrev (每行一個)
          <textarea
            value={abbreviationsText}
            onChange={(e) => setAbbreviationsText(e.target.value)}
          />
        </label>
      </div>
      <button type="button" onClick={handleSave}>儲存修改</button>
      {saveMessage ? <p>{saveMessage}</p> : null}
    </section>
  )
}

function readStringArray(key: string): string[] {
  return JSON.parse(localStorage.getItem(key) ?? '[]') as string[]
}

function rememberEntry(id: string) {
  const oldItems = readStringArray(RECENT_ENTRIES_KEY)
  const next = [id, ...oldItems.filter((item) => item !== id)].slice(0, 10)
  localStorage.setItem(RECENT_ENTRIES_KEY, JSON.stringify(next))
}
