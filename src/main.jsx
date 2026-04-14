import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ── Database Initialization ────────────────────────────────────────────────
// Seeds all localStorage tables from mockData on first ever run.
// On subsequent runs, it finds existing data and does nothing — preserving
// all registered users, created courses, and enrollment records.
import { initializeDatabase } from './services/courseService'
import { mockUsers } from './data/mockData'

function bootDatabase() {
  // Seed users if not already stored
  const USERS_KEY  = 'lerno_users'
  const SEEDED_KEY = 'lerno_seeded_v3'
  try {
    const stored = localStorage.getItem(USERS_KEY)
    if (!stored || JSON.parse(stored).length === 0) {
      localStorage.setItem(USERS_KEY, JSON.stringify(mockUsers))
      localStorage.setItem(SEEDED_KEY, 'true')
      console.info('[Boot] Users seeded from mockData.')
    }
  } catch { /* ignore */ }

  // Seed courses + enrollments
  initializeDatabase()
}

bootDatabase()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
