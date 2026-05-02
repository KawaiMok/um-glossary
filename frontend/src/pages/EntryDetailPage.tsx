import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
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

  if (error) return <Alert severity="error">{error}</Alert>
  if (!entry) return <Alert severity="info">載入中...</Alert>

  return (
    <Stack spacing={2}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>詞條詳情 / 編輯</Typography>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' } }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{entry.termZh}</Typography>
            <Typography color="text.secondary">{entry.termEn}</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              color="warning"
              onClick={toggleFavorite}
              startIcon={isFavorite ? <StarIcon /> : <StarBorderIcon />}
            >
              {isFavorite ? '已收藏' : '加入收藏'}
            </Button>
            <Button variant="contained" onClick={handleSave}>儲存修改</Button>
          </Stack>
        </Stack>
      </Paper>

      {saveMessage ? <Alert severity={saveMessage.includes('失敗') ? 'error' : 'success'}>{saveMessage}</Alert> : null}

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Typography variant="h6">編輯內容</Typography>
          <TextField label="中文" value={form.termZh ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, termZh: e.target.value }))} size="small" />
          <TextField label="英文" value={form.termEn ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, termEn: e.target.value }))} size="small" />
          <TextField label="Code" value={form.code ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))} size="small" />
          <TextField label="Example EN" value={form.exampleEn ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, exampleEn: e.target.value }))} multiline minRows={3} />
          <TextField label="Example ZH" value={form.exampleZh ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, exampleZh: e.target.value }))} multiline minRows={3} />
          <TextField label="Remark" value={form.remarks ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))} multiline minRows={3} />
          <TextField label="Abbrev (每行一個)" value={abbreviationsText} onChange={(e) => setAbbreviationsText(e.target.value)} multiline minRows={3} />
        </Stack>
      </Paper>
    </Stack>
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
