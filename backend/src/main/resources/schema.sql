-- 註解：使用 Neon/Postgres 儲存 glossary；避免把整份資料載入 JVM 記憶體造成 OOM。

CREATE TABLE IF NOT EXISTS glossary_entries (
  id TEXT PRIMARY KEY,
  source_sheet TEXT,
  source_row INT,
  term_zh TEXT NOT NULL,
  term_en TEXT NOT NULL,
  code TEXT,
  example_zh TEXT,
  example_en TEXT,
  aliases_zh_json TEXT,
  aliases_en_json TEXT,
  abbreviations_json TEXT,
  remarks TEXT,
  updated_at TIMESTAMPTZ
);

-- 註解：最基本索引（未做全文檢索；後續若資料大可改用 GIN/FTS）。
CREATE INDEX IF NOT EXISTS idx_glossary_entries_term_zh ON glossary_entries (term_zh);
CREATE INDEX IF NOT EXISTS idx_glossary_entries_term_en ON glossary_entries (term_en);

