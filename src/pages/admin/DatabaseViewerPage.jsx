import { useState, useEffect, useCallback } from 'react'
import './DatabaseViewerPage.css'

// ── localStorage keys used by the app ─────────────────────────────────────────
const DB_TABLES = [
  { key: 'lerno_users',       label: 'Users',       icon: 'U', color: '#6c63ff' },
  { key: 'lerno_courses',     label: 'Courses',     icon: 'C', color: '#00d4aa' },
  { key: 'lerno_enrollments', label: 'Enrollments', icon: 'E', color: '#f59e0b' },
]

const MOCK_TABLES = [
  {
    key: '__mock_assignments',
    label: 'Assignments',
    icon: 'A',
    color: '#ec4899',
    mockKey: 'mockAssignments',
  },
  {
    key: '__mock_submissions',
    label: 'Submissions',
    icon: 'S',
    color: '#3b82f6',
    mockKey: 'mockSubmissions',
  },
  {
    key: '__mock_quizzes',
    label: 'Quizzes',
    icon: 'Q',
    color: '#8b5cf6',
    mockKey: 'mockQuizzes',
  },
  {
    key: '__mock_notifications',
    label: 'Notifications',
    icon: 'N',
    color: '#10b981',
    mockKey: 'mockNotifications',
  },
]

function safeJson(str) {
  try { return typeof str === 'string' ? JSON.parse(str) : str } catch { return null }
}

function getValue(cell) {
  if (cell === null || cell === undefined) return <span className="db-null">null</span>
  if (typeof cell === 'boolean') return <span className={`db-bool db-bool--${cell}`}>{String(cell)}</span>
  if (Array.isArray(cell)) {
    if (cell.length === 0) return <span className="db-empty">[]</span>
    if (typeof cell[0] === 'string') {
      return (
        <div className="db-tags">
          {cell.slice(0, 4).map((t, i) => <span key={i} className="db-tag">{t}</span>)}
          {cell.length > 4 && <span className="db-tag db-tag--more">+{cell.length - 4}</span>}
        </div>
      )
    }
    return <span className="db-array">[Array · {cell.length}]</span>
  }
  if (typeof cell === 'object') return <span className="db-object">{'{Object}'}</span>
  if (typeof cell === 'string' && cell.startsWith('http')) {
    return (
      <a href={cell} target="_blank" rel="noreferrer" className="db-link">
        link
      </a>
    )
  }
  const str = String(cell)
  if (str.length > 60) return <span title={str}>{str.slice(0, 60)}<span className="db-ellipsis">…</span></span>
  return str
}

function StatusBadge({ value }) {
  const map = {
    active: 'db-status--active',
    banned: 'db-status--banned',
    published: 'db-status--published',
    draft: 'db-status--draft',
    graded: 'db-status--graded',
    submitted: 'db-status--submitted',
  }
  const cls = map[value] || ''
  return <span className={`db-status ${cls}`}>{value}</span>
}

function TableView({ data, search }) {
  if (!data || data.length === 0) {
    return (
      <div className="db-empty-state">
        <span className="db-empty-icon">—</span>
        <p>No records found</p>
      </div>
    )
  }

  // Flatten and filter columns
  const excludeKeys = ['sections', 'lessons', 'questions', 'answers']
  const allKeys = Array.from(
    new Set(data.flatMap(row => Object.keys(row)))
  ).filter(k => !excludeKeys.includes(k))

  const filtered = search
    ? data.filter(row =>
        Object.values(row).some(v =>
          String(v).toLowerCase().includes(search.toLowerCase())
        )
      )
    : data

  return (
    <div className="db-table-wrap">
      <div className="db-table-meta">
        <span className="db-record-count">
          {filtered.length} / {data.length} records
        </span>
      </div>
      <div className="db-scroll">
        <table className="db-table">
          <thead>
            <tr>
              <th className="db-th db-th--idx">#</th>
              {allKeys.map(k => (
                <th key={k} className="db-th">{k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={row.id || i} className="db-tr">
                <td className="db-td db-td--idx">{i + 1}</td>
                {allKeys.map(k => (
                  <td key={k} className="db-td">
                    {k === 'status' || k === 'role'
                      ? <StatusBadge value={row[k]} />
                      : getValue(row[k])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function JsonView({ data }) {
  const [copied, setCopied] = useState(false)
  const json = JSON.stringify(data, null, 2)

  const copy = () => {
    navigator.clipboard.writeText(json)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="db-json-wrap">
      <button className="db-copy-btn" onClick={copy}>
        {copied ? 'Copied!' : 'Copy JSON'}
      </button>
      <pre className="db-json">{json}</pre>
    </div>
  )
}

// ── Stat cards ─────────────────────────────────────────────────────────────────
function DbStatCard({ label, value, color }) {
  return (
    <div className="db-stat-card" style={{ '--accent': color }}>
      <div>
        <div className="db-stat-value">{value}</div>
        <div className="db-stat-label">{label}</div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function DatabaseViewerPage() {
  const [activeTable, setActiveTable] = useState('lerno_users')
  const [viewMode, setViewMode] = useState('table') // 'table' | 'json'
  const [search, setSearch] = useState('')
  const [tableData, setTableData] = useState({})
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // Dynamically import mockData for the non-LS tables
  const [mockDataCache, setMockDataCache] = useState(null)

  useEffect(() => {
    import('../../data/mockData').then(mod => setMockDataCache(mod))
  }, [])

  const loadAllData = useCallback(async () => {
    const result = {}
    
    // Fetch real users directly from SQLite backend!
    try {
      const res = await fetch('http://localhost:5000/api/users')
      const backendUsers = await res.json()
      result['lerno_users'] = backendUsers
    } catch {
      result['lerno_users'] = []
    }

    // LocalStorage tables for remaining data
    DB_TABLES.forEach(({ key }) => {
      if (key !== 'lerno_users') {
        const raw = localStorage.getItem(key)
        result[key] = safeJson(raw) || []
      }
    })
    
    // Mock tables (not in LS)
    if (mockDataCache) {
      MOCK_TABLES.forEach(({ key, mockKey }) => {
        result[key] = mockDataCache[mockKey] || []
      })
    }
    setTableData(result)
    setLastRefresh(new Date())
  }, [mockDataCache])

  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(loadAllData, 5000)
    return () => clearInterval(interval)
  }, [loadAllData])

  const allTables = [...DB_TABLES, ...MOCK_TABLES]
  const currentData = tableData[activeTable] || []
  const currentMeta = allTables.find(t => t.key === activeTable)

  // Stats
  const totalUsers = (tableData['lerno_users'] || []).length
  const totalCourses = (tableData['lerno_courses'] || []).length
  const totalEnrollments = (tableData['lerno_enrollments'] || []).length
  const publishedCourses = (tableData['lerno_courses'] || []).filter(c => c.status === 'published').length

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(currentData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentMeta?.label || 'data'}_export.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportAll = () => {
    const all = {}
    DB_TABLES.forEach(t => { all[t.label] = tableData[t.key] || [] })
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lerno_full_backup_${new Date().toISOString().slice(0,10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const resetToDefaults = () => {
    if (!window.confirm('This will delete ALL data (users, courses, enrollments) and restore default mock data. Are you sure?')) return
    localStorage.removeItem('lerno_users')
    localStorage.removeItem('lerno_courses')
    localStorage.removeItem('lerno_enrollments')
    localStorage.removeItem('lerno_token')
    localStorage.removeItem('lerno_user')
    localStorage.removeItem('lerno_seeded_v3')
    window.location.reload()
  }

  // Calculate storage usage
  const storageUsed = (() => {
    let total = 0
    try {
      for (const key of ['lerno_users', 'lerno_courses', 'lerno_enrollments']) {
        total += (localStorage.getItem(key) || '').length
      }
    } catch { /* ignore */ }
    return (total / 1024).toFixed(1)
  })()

  return (
    <div className="db-viewer">
      {/* Header */}
      <div className="db-header">
        <div>
          <h1 className="db-title">
            Database Viewer
          </h1>
          <p className="db-subtitle">
            Real-time view of all application data · Last sync:{' '}
            <span className="db-sync-time">{lastRefresh.toLocaleTimeString()}</span>
            {' · '}
            <span className="db-storage-badge">{storageUsed} KB stored</span>
          </p>
        </div>
        <div className="db-header-actions">
          <button className="db-refresh-btn" onClick={loadAllData} title="Refresh data">
            Refresh
          </button>
          <button className="db-export-all-btn" onClick={exportAll} title="Export all tables as JSON">
            Backup All
          </button>
          <button className="db-reset-btn" onClick={resetToDefaults} title="Reset all data to defaults">
            Reset
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="db-stats-row">
        <DbStatCard label="Total Users" value={totalUsers} color="#6c63ff" />
        <DbStatCard label="Total Courses" value={totalCourses} color="#00d4aa" />
        <DbStatCard label="Published" value={publishedCourses} color="#10b981" />
        <DbStatCard label="Enrollments" value={totalEnrollments} color="#f59e0b" />
      </div>

      {/* Body */}
      <div className="db-body">
        {/* Sidebar */}
        <aside className="db-sidebar">
          <p className="db-sidebar-label">localStorage Tables</p>
          {DB_TABLES.map(t => (
            <button
              key={t.key}
              className={`db-table-btn ${activeTable === t.key ? 'db-table-btn--active' : ''}`}
              style={{ '--accent': t.color }}
              onClick={() => { setActiveTable(t.key); setSearch('') }}
            >
              <span className="db-table-btn-icon">{t.icon}</span>
              <span>{t.label}</span>
              <span className="db-table-btn-count">{(tableData[t.key] || []).length}</span>
            </button>
          ))}

          <p className="db-sidebar-label" style={{ marginTop: '1.5rem' }}>Mock / Seed Data</p>
          {MOCK_TABLES.map(t => (
            <button
              key={t.key}
              className={`db-table-btn ${activeTable === t.key ? 'db-table-btn--active' : ''}`}
              style={{ '--accent': t.color }}
              onClick={() => { setActiveTable(t.key); setSearch('') }}
            >
              <span className="db-table-btn-icon">{t.icon}</span>
              <span>{t.label}</span>
              <span className="db-table-btn-count">{(tableData[t.key] || []).length}</span>
            </button>
          ))}
        </aside>

        {/* Content */}
        <main className="db-content">
          {/* Toolbar */}
          <div className="db-toolbar">
            <div className="db-toolbar-left">
              <span className="db-table-heading" style={{ color: currentMeta?.color }}>
                {currentMeta?.icon} {currentMeta?.label}
              </span>
              <span className="db-record-badge">{currentData.length} records</span>
            </div>
            <div className="db-toolbar-right">
              <div className="db-search-wrap">
                <span className="db-search-icon">S</span>
                <input
                  className="db-search"
                  type="text"
                  placeholder="Search records..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="db-view-toggle">
                <button
                  className={`db-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                  onClick={() => setViewMode('table')}
                >
                  ⊞ Table
                </button>
                <button
                  className={`db-toggle-btn ${viewMode === 'json' ? 'active' : ''}`}
                  onClick={() => setViewMode('json')}
                >
                  {'{ }'} JSON
                </button>
              </div>
              <button className="db-export-btn" onClick={exportJson}>
                Export
              </button>
            </div>
          </div>

          {/* Table / JSON */}
          <div className="db-panel">
            {viewMode === 'table'
              ? <TableView data={currentData} search={search} />
              : <JsonView data={currentData} />
            }
          </div>
        </main>
      </div>
    </div>
  )
}
