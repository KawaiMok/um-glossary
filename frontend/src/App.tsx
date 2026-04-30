import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import EntryDetailPage from './pages/EntryDetailPage'
import FavoritesPage from './pages/FavoritesPage'
import ImportPage from './pages/ImportPage'
import RecentPage from './pages/RecentPage'
import SearchPage from './pages/SearchPage'

function App() {
  return (
    <main className="app">
      <header className="app__header">
        <h1>UM Glossary</h1>
        <p>中英詞彙查詢平台（支援 Excel 檢驗上傳與多工作表匯入）</p>
        <nav className="nav-links">
          <NavLink to="/search">搜尋</NavLink>
          <NavLink to="/favorites">收藏</NavLink>
          <NavLink to="/recent">最近</NavLink>
          <NavLink to="/import">匯入</NavLink>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Navigate to="/search" replace />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/entry/:id" element={<EntryDetailPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/recent" element={<RecentPage />} />
        <Route path="/import" element={<ImportPage />} />
      </Routes>
    </main>
  )
}

export default App
