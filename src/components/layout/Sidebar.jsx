import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, BookOpen, PlusCircle, Users, ClipboardList,
  FileQuestion, Settings, LogOut, GraduationCap, BarChart3,
  Flag, ChevronLeft, ChevronRight, Database
} from 'lucide-react'
import { useState } from 'react'
import './Sidebar.css'

const menuConfig = {
  student: [
    { path: '/student/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/student/courses', icon: <BookOpen size={20} />, label: 'Browse Courses' },
    { path: '/student/my-courses', icon: <GraduationCap size={20} />, label: 'My Courses' },
  ],
  instructor: [
    { path: '/instructor/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/instructor/courses', icon: <BookOpen size={20} />, label: 'My Courses' },
    { path: '/instructor/create-course', icon: <PlusCircle size={20} />, label: 'Create Course' },
  ],
  admin: [
    { path: '/admin/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/admin/users', icon: <Users size={20} />, label: 'Manage Users' },
    { path: '/admin/courses', icon: <BookOpen size={20} />, label: 'Manage Courses' },
    { path: '/admin/analytics', icon: <BarChart3 size={20} />, label: 'Analytics' },
    { path: '/admin/database', icon: <Database size={20} />, label: 'Database' },
  ],
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const menu = menuConfig[user?.role] || []

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'admin': return { label: 'Admin', color: '#e74c3c' }
      case 'instructor': return { label: 'Instructor', color: '#6c5ce7' }
      default: return { label: 'Student', color: '#00b894' }
    }
  }

  const badge = getRoleBadge()

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo" onClick={() => navigate('/')}>
          <img src="/edubridge-logo-v2.png" alt="Edubridge" style={{ height: '36px', objectFit: 'contain' }} />
          {!collapsed && <span className="sidebar-logo-text">EDUBRIDGE</span>}
        </div>
        <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {menu.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title={collapsed ? item.label : ''}
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            {!collapsed && <span className="sidebar-link-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <NavLink
          to={`/${user?.role}/settings`}
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          title={collapsed ? 'Settings' : ''}
        >
          <span className="sidebar-link-icon"><Settings size={20} /></span>
          {!collapsed && <span className="sidebar-link-label">Settings</span>}
        </NavLink>

        <button className="sidebar-link sidebar-logout" onClick={handleLogout}>
          <span className="sidebar-link-icon"><LogOut size={20} /></span>
          {!collapsed && <span className="sidebar-link-label">Logout</span>}
        </button>

        {!collapsed && (
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.name}</span>
              <span className="sidebar-user-role" style={{ color: badge.color }}>{badge.label}</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
