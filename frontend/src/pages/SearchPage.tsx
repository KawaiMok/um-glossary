import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import {
  Alert,
  Box,
  Fade,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { visuallyHidden } from '@mui/utils'
import EntryCard from '../components/EntryCard'
import { fetchEntries } from '../services/api'
import type { GlossaryEntry } from '../types'
import { isFavorite, toggleFavorite } from '../utils/storage'

const RECENT_KEY = 'um-glossary-recent-keywords'

export default function SearchPage() {
  const [keywordInput, setKeywordInput] = useState('')
  const [queryKeyword, setQueryKeyword] = useState('')
  const [entries, setEntries] = useState<GlossaryEntry[]>([])
  const [favoriteMap, setFavoriteMap] = useState<Record<string, boolean>>({})
  /** 首次進入搜尋頁即顯示載入區，避免資料未到時誤觸發「已繪製」邏輯 */
  const [loading, setLoading] = useState(true)
  /** API 完成後再等瀏覽器繪製一幀，詞條列表才算「準備好」，避免閃一下空白或卡頓感 */
  const [listPainted, setListPainted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // 輸入節流：先更新 input，再延遲更新 query，減少 API 與重繪頻率。
    const timer = window.setTimeout(() => {
      setQueryKeyword(keywordInput.trim())
    }, 350)
    return () => window.clearTimeout(timer)
  }, [keywordInput])

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchEntries(queryKeyword, controller.signal)
        setEntries(data)
        const nextFavoriteMap: Record<string, boolean> = {}
        data.forEach((item) => {
          nextFavoriteMap[item.id] = isFavorite(item.id)
        })
        setFavoriteMap(nextFavoriteMap)
        if (queryKeyword) {
          rememberKeyword(queryKeyword)
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setError('無法取得資料，請確認後端已啟動在 8080。')
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }
    load()

    return () => {
      controller.abort()
    }
  }, [queryKeyword])

  useEffect(() => {
    if (loading) {
      setListPainted(false)
    }
  }, [loading])

  useLayoutEffect(() => {
    if (loading) return
    // 雙層 rAF：等 React commit 後再等到下一幀 paint，再顯示詞條（列表長時較平滑）
    let raf1 = 0
    let raf2 = 0
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setListPainted(true)
      })
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [loading, entries])

  const showResultsLoading = loading || !listPainted

  const handleToggleFavorite = useCallback((id: string) => {
    const next = toggleFavorite(id)
    setFavoriteMap((prev) => ({ ...prev, [id]: next }))
  }, [])

  return (
    <Stack spacing={2.2}>
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, md: 2.5 },
          borderRadius: 3,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06), 0 4px 12px rgba(37, 99, 235, 0.06)',
        }}
      >
        <Stack spacing={1.2}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            搜尋詞條
          </Typography>
          <Typography variant="body2" color="text.secondary">
            輸入中文、英文、縮寫或 code，系統會即時篩選結果。
          </Typography>
          {/* 聚焦狀態加強外框（WCAG 可見焦點） */}
          <TextField
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            placeholder="搜尋中文、英文、縮寫..."
            aria-label="搜尋詞條"
            size="small"
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: '#f8fafc',
                '& fieldset': { borderColor: '#cbd5e1' },
                '&:hover fieldset': { borderColor: '#94a3b8' },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                  boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.18)',
                },
              },
            }}
          />
        </Stack>
      </Paper>

      <Box component="section" aria-labelledby="search-results-heading">
        <Typography id="search-results-heading" variant="subtitle2" component="h2" sx={visuallyHidden}>
          搜尋結果
        </Typography>

        {error ? <Alert severity="error">{error}</Alert> : null}

        {showResultsLoading && !error ? (
          <Stack
            spacing={1.5}
            role="status"
            aria-live="polite"
            aria-busy="true"
            aria-label="載入詞條列表中"
          >
            <LinearProgress aria-hidden sx={{ borderRadius: 1, height: 3 }} />
            <Stack spacing={1.5}>
              {Array.from({ length: 5 }).map((_, index) => (
                <EntryCardSkeleton key={index} />
              ))}
            </Stack>
          </Stack>
        ) : null}

        {!showResultsLoading ? (
          <Fade in timeout={280}>
            <Stack spacing={1.5}>
              {!error && entries.length === 0 ? <Alert severity="info">暫無結果</Alert> : null}
              {entries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  favorite={Boolean(favoriteMap[entry.id])}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </Stack>
          </Fade>
        ) : null}
      </Box>
    </Stack>
  )
}

/** 與 EntryCard 版面相近的骨架屏，載入過渡用（ui-ux-pro-max：避免長時間空白、CLS） */
function EntryCardSkeleton() {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 3,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Stack spacing={1.25}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1, pr: 1 }}>
            <Skeleton variant="text" width="52%" height={32} sx={{ maxWidth: 280 }} />
            <Skeleton variant="text" width="78%" height={22} sx={{ mt: 0.5, maxWidth: 420 }} />
          </Box>
          <Stack direction="row" spacing={0.5}>
            <Skeleton variant="rounded" width={34} height={34} />
            <Skeleton variant="rounded" width={34} height={34} />
          </Stack>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Skeleton variant="rounded" width={88} height={26} sx={{ borderRadius: 999 }} />
          <Skeleton variant="rounded" width={140} height={26} sx={{ borderRadius: 999 }} />
        </Stack>
        <Skeleton variant="rounded" width="100%" height={56} sx={{ borderRadius: 1 }} />
      </Stack>
    </Paper>
  )
}

function rememberKeyword(keyword: string) {
  const oldItems = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as string[]
  const next = [keyword, ...oldItems.filter((item) => item !== keyword)].slice(0, 10)
  localStorage.setItem(RECENT_KEY, JSON.stringify(next))
}
