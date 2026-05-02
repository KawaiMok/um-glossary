import { useMemo, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import * as XLSX from 'xlsx'
import { uploadGlossaryXlsx } from '../services/api'
import type { ImportResponse, SheetInspection, SheetRecord } from '../types'

export default function ImportPage() {
  const theme = useTheme()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState('')
  const [uploadErrors, setUploadErrors] = useState<string[]>([])
  const [inspections, setInspections] = useState<SheetInspection[]>([])
  const [selectedSheets, setSelectedSheets] = useState<string[]>([])
  const [inspectionOpen, setInspectionOpen] = useState(false)
  const [expandedSheets, setExpandedSheets] = useState<string[]>([])
  const [showInvalidOnly, setShowInvalidOnly] = useState(false)

  const selectedSummary = useMemo(() => {
    const selected = inspections.filter((item) => selectedSheets.includes(item.name))
    return {
      sheets: selected.length,
      valid: selected.reduce((sum, item) => sum + item.validCount, 0),
      invalid: selected.reduce((sum, item) => sum + item.invalidCount, 0),
    }
  }, [inspections, selectedSheets])

  const inspectWorkbookBeforeUpload = async () => {
    if (!file) {
      setUploadMessage('請先選擇 Excel 檔案。')
      return
    }
    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })

      const nextInspections: SheetInspection[] = workbook.SheetNames.map((sheetName) => {
        const sheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, { header: 1, defval: '' })
        const headerRow = (rows[0] ?? []).map((value) => String(value).trim())
        const lowered = headerRow.map((value) => value.toLowerCase())
        const required = ['<cn>', '<en>']
        const missing = required.filter((key) => !lowered.includes(key))
        const cnCol = lowered.indexOf('<cn>')
        const enCol = lowered.indexOf('<en>')
        // 逐列檢驗：保留每一列結果，供 UI 在上傳前完整預覽。
        const records: SheetRecord[] = rows.slice(1).map((row, rowIdx) => {
          const cn = cnCol >= 0 ? String(row[cnCol] ?? '').trim() : ''
          const en = enCol >= 0 ? String(row[enCol] ?? '').trim() : ''
          const isRowEmpty = row.every((cell) => String(cell ?? '').trim() === '')
          if (isRowEmpty) return { rowNumber: rowIdx + 2, cn: '', en: '', isValid: false, reason: '空白列' }
          if (missing.length > 0) {
            return {
              rowNumber: rowIdx + 2,
              cn,
              en,
              isValid: false,
              reason: `缺少必要欄位：${missing.join(', ')}`,
            }
          }
          if (!cn || !en) return { rowNumber: rowIdx + 2, cn, en, isValid: false, reason: '缺少 <CN> 或 <EN>' }
          return { rowNumber: rowIdx + 2, cn, en, isValid: true, reason: '' }
        })
        const validCount = records.filter((item) => item.isValid).length
        return {
          name: sheetName,
          headerLabels: headerRow,
          dataRowCount: records.length,
          hasRequiredColumns: missing.length === 0,
          requiredMissing: missing,
          validCount,
          invalidCount: records.length - validCount,
          records,
        }
      })

      setInspections(nextInspections)
      setSelectedSheets(nextInspections.filter((item) => item.hasRequiredColumns).map((item) => item.name))
      setExpandedSheets([])
      setShowInvalidOnly(false)
      setInspectionOpen(true)
      setUploadMessage('')
      setUploadErrors([])
    } catch {
      setUploadMessage('無法解析檔案，請確認為合法 .xlsx 格式。')
      setInspectionOpen(false)
    }
  }

  const handleConfirmUpload = async () => {
    if (!file || selectedSheets.length === 0) {
      setUploadMessage('請先勾選至少一個工作表。')
      return
    }
    setUploading(true)
    try {
      const result = (await uploadGlossaryXlsx(file, selectedSheets)) as ImportResponse
      setUploadMessage(`上傳成功：匯入 ${result.successCount} 筆，錯誤 ${result.errorCount} 筆。`)
      setUploadErrors(result.errors ?? [])
      setInspectionOpen(false)
    } catch {
      setUploadMessage('上傳失敗，請稍後再試。')
      setUploadErrors([])
    } finally {
      setUploading(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>資料匯入</Typography>
      <Typography color="text.secondary">先做檢驗，再由你確認工作表與資料後才會正式上傳。</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}>
        <Button variant="outlined" component="label">
          選擇 Excel 檔案
          <input
            hidden
            type="file"
            accept=".xlsx"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null)
              setInspections([])
              setSelectedSheets([])
              setInspectionOpen(false)
            }}
          />
        </Button>
        <Button type="button" variant="contained" onClick={inspectWorkbookBeforeUpload}>
          開始上傳（先檢驗）
        </Button>
        <Chip label={file?.name ?? '未選擇檔案'} />
      </Stack>

      {uploadMessage ? <Alert severity={uploadMessage.includes('失敗') ? 'error' : 'success'}>{uploadMessage}</Alert> : null}
      {uploadErrors.length > 0 ? (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" color="error" gutterBottom>上傳錯誤明細</Typography>
          <ul>
            {uploadErrors.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        </Paper>
      ) : null}

      {inspectionOpen ? (
        <Dialog open={inspectionOpen} onClose={() => setInspectionOpen(false)} fullWidth maxWidth="lg">
          <DialogTitle>上傳前資料檢驗</DialogTitle>
          <DialogContent dividers>
            <Alert severity="info" sx={{ mb: 2 }}>
              已選 {selectedSummary.sheets} 個工作表，可匯入有效列 {selectedSummary.valid} 筆，無效列 {selectedSummary.invalid} 筆。
            </Alert>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2, justifyContent: 'space-between' }}>
              {/* 檢查大量 sheet 時可快速控制展開狀態，減少捲動成本。 */}
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="outlined" onClick={() => setExpandedSheets(inspections.map((item) => item.name))}>
                  全部展開
                </Button>
                <Button size="small" variant="outlined" onClick={() => setExpandedSheets([])}>
                  全部收合
                </Button>
              </Stack>
              <FormControlLabel
                control={<Checkbox checked={showInvalidOnly} onChange={(event) => setShowInvalidOnly(event.target.checked)} />}
                label="只顯示無效列"
              />
            </Stack>
            <Stack spacing={2}>
              {inspections.map((item) => {
                const isExpanded = expandedSheets.includes(item.name)
                return (
                // 每個 Excel sheet 用可摺疊區塊；縮短 Collapse 時間減少延遲感。
                <Accordion
                  key={item.name}
                  disableGutters
                  expanded={isExpanded}
                  onChange={(_, expanded) =>
                    setExpandedSheets((prev) =>
                      expanded
                        ? prev.includes(item.name)
                          ? prev
                          : [...prev, item.name]
                        : prev.filter((name) => name !== item.name),
                    )
                  }
                  slotProps={{
                    transition: {
                      timeout: { enter: 140, exit: 100 },
                      easing: {
                        enter: theme.transitions.easing.easeOut,
                        exit: theme.transitions.easing.sharp,
                      },
                    },
                  }}
                >
                  {/* 捲動長表格時標題列黏在對話框內容頂端，不必拉回最上方即可收合 */}
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 3,
                      bgcolor: 'background.paper',
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      boxShadow: isExpanded ? '0 2px 8px rgba(15, 23, 42, 0.06)' : 'none',
                    }}
                  >
                    <Stack direction="row" sx={{ width: '100%', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
                      <FormControlLabel
                        onClick={(event) => event.stopPropagation()}
                        onFocus={(event) => event.stopPropagation()}
                        control={
                          <Checkbox
                            checked={selectedSheets.includes(item.name)}
                            disabled={!item.hasRequiredColumns}
                            onChange={() =>
                              setSelectedSheets((prev) =>
                                prev.includes(item.name) ? prev.filter((name) => name !== item.name) : [...prev, item.name],
                              )
                            }
                          />
                        }
                        label={item.name}
                      />
                      <Typography variant="body2" color="text.secondary">
                        總列數：{item.dataRowCount}，有效：{item.validCount}，無效：{item.invalidCount}
                      </Typography>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 2, pt: 1, pb: 0 }}>
                    {!item.hasRequiredColumns ? (
                      <Alert severity="error" sx={{ mt: 1 }}>缺少必要欄位：{item.requiredMissing.join(', ')}</Alert>
                    ) : null}
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>逐列明細（有效 / 無效）</Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Row</TableCell>
                              <TableCell>CN</TableCell>
                              <TableCell>EN</TableCell>
                              <TableCell>狀態</TableCell>
                              <TableCell>原因</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(showInvalidOnly ? item.records.filter((record) => !record.isValid) : item.records).map((record) => (
                              <TableRow key={`${item.name}-${record.rowNumber}`} sx={{ bgcolor: record.isValid ? '#f0fdf4' : '#fef2f2' }}>
                                <TableCell>{record.rowNumber}</TableCell>
                                <TableCell>{record.cn || '-'}</TableCell>
                                <TableCell>{record.en || '-'}</TableCell>
                                <TableCell>{record.isValid ? '有效' : '無效'}</TableCell>
                                <TableCell>{record.reason || '-'}</TableCell>
                              </TableRow>
                            ))}
                            {showInvalidOnly && item.records.filter((record) => !record.isValid).length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5}>此工作表沒有無效列。</TableCell>
                              </TableRow>
                            ) : null}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                    {/* 長表格捲到底時仍可一鍵收合，不必拉回標題列 */}
                    <Box
                      sx={{
                        position: 'sticky',
                        bottom: 0,
                        zIndex: 2,
                        mt: 2,
                        py: 1.25,
                        mx: -2,
                        px: 2,
                        bgcolor: 'background.paper',
                        borderTop: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        justifyContent: 'center',
                        boxShadow: '0 -4px 12px rgba(15, 23, 42, 0.06)',
                      }}
                    >
                      <Button
                        type="button"
                        size="small"
                        variant="outlined"
                        color="primary"
                        startIcon={<ExpandLessIcon />}
                        onClick={(event) => {
                          event.stopPropagation()
                          setExpandedSheets((prev) => prev.filter((name) => name !== item.name))
                        }}
                      >
                        收合「{item.name}」
                      </Button>
                    </Box>
                  </AccordionDetails>
                </Accordion>
                )
              })}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button type="button" onClick={() => setInspectionOpen(false)}>
              取消
            </Button>
            <Button type="button" variant="contained" onClick={handleConfirmUpload} disabled={uploading || selectedSheets.length === 0}>
                {uploading ? '上傳中...' : '確認並上傳'}
            </Button>
          </DialogActions>
        </Dialog>
      ) : null}
    </Stack>
  )
}
