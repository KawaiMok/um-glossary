import { memo } from 'react'
import { Link } from 'react-router-dom'
import { Box, Card, CardContent, Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import type { GlossaryEntry } from '../types'

type Props = {
  entry: GlossaryEntry
  favorite: boolean
  onToggleFavorite: (id: string) => void
}

function EntryCard({ entry, favorite, onToggleFavorite }: Props) {
  return (
    <Card
      key={entry.id}
      variant="outlined"
      sx={{
        borderColor: 'divider',
        borderRadius: 3,
        bgcolor: 'background.paper',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          borderColor: 'rgba(37, 99, 235, 0.35)',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08), 0 2px 8px rgba(37, 99, 235, 0.08)',
        },
      }}
    >
      <CardContent>
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '0.01em', color: 'text.primary' }}>
              {entry.termZh}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {entry.termEn}
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="查看/編輯">
              <IconButton
                size="small"
                component={Link}
                to={`/entry/${entry.id}`}
                aria-label="查看或編輯詞條"
                sx={{
                  color: 'primary.main',
                  border: '1px solid',
                  borderColor: 'rgba(37, 99, 235, 0.25)',
                  bgcolor: 'rgba(37, 99, 235, 0.06)',
                  '&:hover': { bgcolor: 'rgba(37, 99, 235, 0.12)' },
                }}
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={favorite ? '取消收藏' : '加入收藏'}>
              <IconButton
                size="small"
                aria-label={favorite ? '取消收藏' : '加入收藏'}
                color={favorite ? 'warning' : 'default'}
                onClick={() => onToggleFavorite(entry.id)}
                sx={{
                  border: '1px solid',
                  borderColor: favorite ? 'rgba(217, 119, 6, 0.45)' : 'divider',
                  bgcolor: favorite ? 'rgba(254, 243, 199, 0.55)' : '#f8fafc',
                  '&:hover': {
                    bgcolor: favorite ? 'rgba(254, 243, 199, 0.85)' : 'rgba(37, 99, 235, 0.06)',
                  },
                }}
              >
                {favorite ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mt: 1.25, flexWrap: 'wrap', gap: 0.75 }}>
          {entry.code ? (
            <Chip
              size="small"
              label={`Code: ${entry.code}`}
              variant="outlined"
              color="primary"
              sx={{ bgcolor: 'rgba(37, 99, 235, 0.06)', fontWeight: 500 }}
            />
          ) : null}
          {entry.abbreviations?.length ? (
            <Chip
              size="small"
              label={`Abbrev: ${entry.abbreviations.join(', ')}`}
              variant="outlined"
              sx={{
                borderColor: '#cbd5e1',
                color: 'text.secondary',
                bgcolor: '#f8fafc',
                fontWeight: 500,
              }}
            />
          ) : null}
        </Stack>

        {entry.remarks ? (
          <Typography variant="body2" sx={{ mt: 1.25, whiteSpace: 'pre-wrap', color: 'text.primary' }}>
            {entry.remarks}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  )
}

export default memo(EntryCard)
