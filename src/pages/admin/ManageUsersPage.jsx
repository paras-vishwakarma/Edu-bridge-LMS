import { useState, useEffect } from 'react'
import { authService } from '../../services/authService'
import DataTable from '../../components/common/DataTable'
import toast from 'react-hot-toast'
import { ShieldCheck, ShieldX, Trash2 } from 'lucide-react'

export default function ManageUsersPage() {
  const [refresh, setRefresh] = useState(0)
  const [users, setUsers] = useState([])

  useEffect(() => {
    async function loadUsers() {
      const data = await authService.getAllUsers()
      setUsers(Array.isArray(data) ? data : [])
    }
    loadUsers()
  }, [refresh])

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'banned' : 'active'
    const result = await authService.updateUserStatus(userId, newStatus)
    if (result && result.success) {
      toast.success(`User ${newStatus === 'active' ? 'activated' : 'banned'}`)
      setRefresh(r => r + 1)
    } else {
      toast.error('Failed to update status')
    }
  }

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    const result = await authService.deleteUser(userId)
    if (result && result.success) {
      toast.success('User deleted')
      setRefresh(r => r + 1)
    } else {
      toast.error('Failed to delete user')
    }
  }

  const columns = [
    {
      header: 'User',
      accessor: 'name',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: 32, height: 32, minWidth: 32, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: 'white' }}>
            {row.name?.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{row.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.email}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Role',
      accessor: 'role',
      render: (row) => (
        <span style={{
          padding: '0.2rem 0.6rem',
          borderRadius: '999px',
          fontSize: '0.75rem',
          fontWeight: 600,
          background: row.role === 'admin' ? 'rgba(231,76,60,0.15)' : row.role === 'instructor' ? 'rgba(108,92,231,0.15)' : 'rgba(0,184,148,0.15)',
          color: row.role === 'admin' ? '#e74c3c' : row.role === 'instructor' ? '#a29bfe' : '#00b894',
        }}>{row.role}</span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span style={{
          padding: '0.2rem 0.6rem',
          borderRadius: '999px',
          fontSize: '0.75rem',
          fontWeight: 600,
          background: row.status === 'active' ? 'rgba(0,184,148,0.15)' : 'rgba(231,76,60,0.15)',
          color: row.status === 'active' ? '#00b894' : '#e74c3c',
        }}>{row.status}</span>
      )
    },
    {
      header: 'Joined',
      accessor: 'joinedAt',
      render: (row) => <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{row.joinedAt}</span>
    },
    {
      header: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {row.role !== 'admin' && (
            <>
              <button
                className="icon-btn"
                onClick={(e) => { e.stopPropagation(); handleToggleStatus(row.id, row.status) }}
                title={row.status === 'active' ? 'Ban user' : 'Activate user'}
                style={row.status === 'active' ? {} : { color: '#00b894' }}
              >
                {row.status === 'active' ? <ShieldX size={16} /> : <ShieldCheck size={16} />}
              </button>
              <button
                className="icon-btn danger"
                onClick={(e) => { e.stopPropagation(); handleDelete(row.id) }}
                title="Delete user"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="course-list-page" key={refresh}>
      <div className="course-list-header">
        <h2 className="page-title">Manage Users</h2>
        <p className="page-subtitle">{users.length} total users on the platform</p>
      </div>

      <DataTable
        columns={columns}
        data={users}
        searchPlaceholder="Search users..."
      />
    </div>
  )
}
