import { useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { uploadGlossaryXlsx } from '../services/api'
import type { ImportResponse, SheetInspection, SheetRecord } from '../types'

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState('')
  const [uploadErrors, setUploadErrors] = useState<string[]>([])
  const [inspections, setInspections] = useState<SheetInspection[]>([])
  const [selectedSheets, setSelectedSheets] = useState<string[]>([])
  const [inspectionOpen, setInspectionOpen] = useState(false)

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
    <section className="page-section">
      <h2>資料匯入</h2>
      <p>先做檢驗，再由你確認工作表與資料後才會正式上傳。</p>
      <div className="upload-panel">
        <input
          type="file"
          accept=".xlsx"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null)
            setInspections([])
            setSelectedSheets([])
            setInspectionOpen(false)
          }}
        />
        <button type="button" onClick={inspectWorkbookBeforeUpload}>
          開始上傳（先檢驗）
        </button>
      </div>
      {uploadMessage ? <p>{uploadMessage}</p> : null}
      {uploadErrors.length > 0 ? (
        <section className="upload-errors-panel">
          <h2>上傳錯誤明細</h2>
          <ul>
            {uploadErrors.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {inspectionOpen ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <section className="modal">
            <header className="modal__header">
              <h2>上傳前資料檢驗</h2>
              <button type="button" onClick={() => setInspectionOpen(false)}>
                關閉
              </button>
            </header>
            <p className="modal__summary">
              已選 {selectedSummary.sheets} 個工作表，可匯入有效列 {selectedSummary.valid} 筆，無效列 {selectedSummary.invalid} 筆。
            </p>
            <div className="modal__content">
              {inspections.map((item) => (
                <article key={item.name} className="inspection-card">
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedSheets.includes(item.name)}
                      disabled={!item.hasRequiredColumns}
                      onChange={() =>
                        setSelectedSheets((prev) =>
                          prev.includes(item.name) ? prev.filter((name) => name !== item.name) : [...prev, item.name],
                        )
                      }
                    />
                    <span>{item.name}</span>
                  </label>
                  <p>
                    總列數：{item.dataRowCount}，有效：{item.validCount}，無效：{item.invalidCount}
                  </p>
                  {!item.hasRequiredColumns ? (
                    <p className="error-text">缺少必要欄位：{item.requiredMissing.join(', ')}</p>
                  ) : null}

                  <details>
                    <summary>檢視逐列明細（有效 / 無效）</summary>
                    <div className="record-table-wrapper">
                      <table className="record-table">
                        <thead>
                          <tr>
                            <th>Row</th>
                            <th>CN</th>
                            <th>EN</th>
                            <th>狀態</th>
                            <th>原因</th>
                          </tr>
                        </thead>
                        <tbody>
                          {item.records.map((record) => (
                            <tr
                              key={`${item.name}-${record.rowNumber}`}
                              className={record.isValid ? 'ok-row' : 'bad-row'}
                            >
                              <td>{record.rowNumber}</td>
                              <td>{record.cn || '-'}</td>
                              <td>{record.en || '-'}</td>
                              <td>{record.isValid ? '有效' : '無效'}</td>
                              <td>{record.reason || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                </article>
              ))}
            </div>
            <footer className="modal__footer">
              <button type="button" onClick={() => setInspectionOpen(false)}>
                取消
              </button>
              <button type="button" onClick={handleConfirmUpload} disabled={uploading || selectedSheets.length === 0}>
                {uploading ? '上傳中...' : '確認並上傳'}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </section>
  )
}
