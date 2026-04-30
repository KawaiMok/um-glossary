import { Link } from 'react-router-dom'
import type { GlossaryEntry } from '../types'

type Props = {
  entry: GlossaryEntry
  favorite: boolean
  onToggleFavorite: (id: string) => void
}

export default function EntryCard({ entry, favorite, onToggleFavorite }: Props) {
  return (
    <article className="entry-card" key={entry.id}>
      <Link to={`/entry/${entry.id}`} className="edit-btn" aria-label="查看詳情（編輯）">
        ✎
      </Link>
      <button type="button" className="star-btn" onClick={() => onToggleFavorite(entry.id)} aria-label="切換收藏">
        {favorite ? '★' : '☆'}
      </button>
      <h3>{entry.termZh}</h3>
      <p>{entry.termEn}</p>
      {entry.code ? (
        <div className="text-block">
          <strong>Code</strong>
          <p>{entry.code}</p>
        </div>
      ) : null}
      {entry.remarks ? (
        <div className="text-block">
          <strong>Remark</strong>
          <p>{entry.remarks}</p>
        </div>
      ) : null}
      {entry.abbreviations?.length ? (
        <div className="text-block">
          <strong>Abbrev</strong>
          <p>{entry.abbreviations.join('\n')}</p>
        </div>
      ) : null}
    </article>
  )
}
