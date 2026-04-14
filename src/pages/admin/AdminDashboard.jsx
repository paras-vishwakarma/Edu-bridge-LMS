import { useState, useEffect } from 'react'
import { courseService } from '../../services/courseService'
import { authService } from '../../services/authService'
import StatsCard from '../../components/common/StatsCard'
import { Users, BookOpen, TrendingUp } from 'lucide-react'

export default function AdminDashboard() {
  const [allUsers, setAllUsers] = useState([])
  const [allCourses, setAllCourses] = useState([])

  useEffect(() => {
    async function loadData() {
      const users = await authService.getAllUsers()
      const courses = await courseService.getAllCourses()
      
      setAllUsers(Array.isArray(users) ? users : [])
      setAllCourses(Array.isArray(courses) ? courses : [])
    }
    loadData()
  }, [])

  const students = allUsers.filter(u => u.role === 'student')
  const instructors = allUsers.filter(u => u.role === 'instructor')
  const publishedCourses = allCourses.filter(c => c.status === 'published')

  const recentUsers = [...allUsers].sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt)).slice(0, 5)

  return (
    <div className="student-dashboard">
      <div className="welcome-banner">
        <div className="welcome-banner-content">
          <h2 className="welcome-title">
            Admin <span className="gradient-text">Dashboard</span>
          </h2>
          <p className="welcome-subtitle">Platform overview and management</p>
        </div>
        <div className="welcome-banner-art"><div className="welcome-orb"></div></div>
      </div>

      <div className="stats-grid">
        <StatsCard icon={<Users size={22} />} value={allUsers.length} label="Total Users" color="rgba(108, 92, 231, 0.15)" trend="up" trendValue={`+${students.length}`} />
        <StatsCard icon={<BookOpen size={22} />} value={publishedCourses.length} label="Active Courses" color="rgba(0, 184, 148, 0.15)" />
      </div>

      {/* User Breakdown */}
      <section className="dashboard-section">
        <h3 className="section-heading">User Breakdown</h3>
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="deadline-item" style={{ justifyContent: 'center', gap: '0.5rem', textAlign: 'center', flexDirection: 'column', padding: '1.5rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#00b894' }}>{students.length}</span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Students</span>
          </div>
          <div className="deadline-item" style={{ justifyContent: 'center', gap: '0.5rem', textAlign: 'center', flexDirection: 'column', padding: '1.5rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#6c5ce7' }}>{instructors.length}</span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Instructors</span>
          </div>
          <div className="deadline-item" style={{ justifyContent: 'center', gap: '0.5rem', textAlign: 'center', flexDirection: 'column', padding: '1.5rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#e74c3c' }}>1</span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Admins</span>
          </div>
        </div>
      </section>

      {/* Recent Users */}
      <section className="dashboard-section">
        <div className="section-header-row">
          <h3 className="section-heading">Recent Users</h3>
          <a href="/admin/users" className="section-link">View all →</a>
        </div>
        <div className="deadlines-list">
          {recentUsers.map(u => (
            <div key={u.id} className="deadline-item">
              <div style={{ width: 32, height: 32, minWidth: 32, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: 'white' }}>
                {u.name?.charAt(0)}
              </div>
              <div className="deadline-info">
                <span className="deadline-title">{u.name}</span>
                <span className="deadline-course">{u.email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  padding: '0.15rem 0.5rem',
                  borderRadius: '999px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  background: u.role === 'admin' ? 'rgba(231,76,60,0.15)' : u.role === 'instructor' ? 'rgba(108,92,231,0.15)' : 'rgba(0,184,148,0.15)',
                  color: u.role === 'admin' ? '#e74c3c' : u.role === 'instructor' ? '#a29bfe' : '#00b894',
                }}>{u.role}</span>
                <span style={{
                  padding: '0.15rem 0.5rem',
                  borderRadius: '999px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  background: u.status === 'active' ? 'rgba(0,184,148,0.15)' : 'rgba(231,76,60,0.15)',
                  color: u.status === 'active' ? '#00b894' : '#e74c3c',
                }}>{u.status}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
