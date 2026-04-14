import { useAuth } from '../../context/AuthContext'
import { Bell, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './TopBar.css'

export default function TopBar({ title }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/${user.role === 'student' ? 'student' : user.role}/courses?search=${searchQuery}`)
    }
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="topbar-title">{title}</h1>
      </div>

      <div className="topbar-right">
        <form className="topbar-search" onSubmit={handleSearch}>
          <Search size={16} className="topbar-search-icon" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="topbar-search-input"
          />
        </form>

        <button className="topbar-icon-btn" aria-label="Notifications">
          <Bell size={20} />
          <span className="topbar-badge">3</span>
        </button>

        <div className="topbar-user">
          <div className="topbar-user-avatar">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  )
}
