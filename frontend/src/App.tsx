import { Link, Navigate, Route, Routes } from 'react-router-dom'
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
        <p>無 Database MVP：Excel 匯入 -&gt; JSON 查詢</p>
        <nav className="nav-links">
          <Link to="/search">Search</Link>
          <Link to="/favorites">Favorites</Link>
          <Link to="/recent">Recent</Link>
          <Link to="/import">Import</Link>
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
