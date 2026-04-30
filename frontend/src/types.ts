export type GlossaryEntry = {
  id: string
  sourceSheet: string
  sourceRow: number
  termZh: string
  termEn: string
  code?: string
  exampleZh?: string
  exampleEn?: string
  remarks?: string
  abbreviations?: string[]
  aliasesZh?: string[]
  aliasesEn?: string[]
}

export type ImportResponse = {
  successCount: number
  errorCount: number
  backupFileName?: string
  errors?: string[]
}

export type SheetRecord = {
  rowNumber: number
  cn: string
  en: string
  isValid: boolean
  reason: string
}

export type SheetInspection = {
  name: string
  headerLabels: string[]
  dataRowCount: number
  hasRequiredColumns: boolean
  requiredMissing: string[]
  validCount: number
  invalidCount: number
  records: SheetRecord[]
}
