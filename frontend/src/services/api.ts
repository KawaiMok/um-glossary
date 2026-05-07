import type { GlossaryEntry, ImportResponse } from '../types'

// 註解：部署到 Render / Vercel 時，用環境變數注入 API 位置（Vite 只會暴露 VITE_*）。
const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8080/api'

export async function fetchEntries(keyword: string, signal?: AbortSignal): Promise<GlossaryEntry[]> {
  const response = await fetch(`${API_BASE_URL}/entries?q=${encodeURIComponent(keyword.trim())}`, { signal })
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }
  return (await response.json()) as GlossaryEntry[]
}

export async function fetchEntryDetail(id: string): Promise<GlossaryEntry> {
  const response = await fetch(`${API_BASE_URL}/entries/${encodeURIComponent(id)}`)
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }
  return (await response.json()) as GlossaryEntry
}

export async function uploadGlossaryXlsx(file: File, sheets: string[]): Promise<ImportResponse> {
  const formData = new FormData()
  formData.append('file', file)
  sheets.forEach((sheetName) => formData.append('sheets', sheetName))

  const response = await fetch(`${API_BASE_URL}/import/xlsx`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`)
  }
  return (await response.json()) as ImportResponse
}

export async function updateEntry(id: string, payload: Partial<GlossaryEntry>): Promise<GlossaryEntry> {
  const response = await fetch(`${API_BASE_URL}/entries/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(`Update failed: ${response.status}`)
  }
  return (await response.json()) as GlossaryEntry
}
