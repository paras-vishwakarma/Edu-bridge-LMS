import { useState, useEffect } from 'react'
import { courseService } from '../../services/courseService'
import DataTable from '../../components/common/DataTable'
import toast from 'react-hot-toast'
import { Trash2, Eye, EyeOff } from 'lucide-react'

export default function ManageCoursesPage() {
  const [refresh, setRefresh] = useState(0)
  const [courses, setCourses] = useState([])

  useEffect(() => {
    async function load() {
      try {
        const data = await courseService.getAllCourses()
        setCourses(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error(err)
      }
    }
    load()
  }, [refresh])

  const handleToggleStatus = async (courseId, currentStatus) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published'
    const result = await courseService.updateCourse(courseId, { status: newStatus })
    if (result && !result.error) {
      toast.success(`Course ${newStatus === 'published' ? 'published' : 'unpublished'}`)
      setRefresh(r => r + 1)
    } else {
      toast.error('Failed to update course status')
    }
  }

  const handleDelete = async (courseId) => {
    if (!confirm('Are you sure you want to delete this course?')) return
    const result = await courseService.deleteCourse(courseId)
    if (result && result.success) {
      toast.success('Course deleted')
      setRefresh(r => r + 1)
    } else {
      toast.error('Failed to delete course')
    }
  }

  const columns = [
    {
      header: 'Course',
      accessor: 'title',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: 48, height: 32, minWidth: 48, borderRadius: 6, overflow: 'hidden', background: 'var(--bg-glass)' }}>
            <img src={row.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{row.title}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.instructorName}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (row) => <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{row.category}</span>
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
          background: row.status === 'published' ? 'rgba(0,184,148,0.15)' : 'rgba(253,203,110,0.15)',
          color: row.status === 'published' ? '#00b894' : '#fdcb6e',
        }}>{row.status}</span>
      )
    },

    {
      header: 'Rating',
      accessor: 'rating',
      render: (row) => <span style={{ fontSize: '0.85rem' }}>⭐ {row.rating > 0 ? row.rating : '—'}</span>
    },
    {
      header: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            className="icon-btn"
            onClick={(e) => { e.stopPropagation(); handleToggleStatus(row.id, row.status) }}
            title={row.status === 'published' ? 'Unpublish' : 'Publish'}
          >
            {row.status === 'published' ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button
            className="icon-btn danger"
            onClick={(e) => { e.stopPropagation(); handleDelete(row.id) }}
            title="Delete course"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="course-list-page" key={refresh}>
      <div className="course-list-header">
        <h2 className="page-title">Manage Courses</h2>
        <p className="page-subtitle">{courses.length} total courses on the platform</p>
      </div>

      <DataTable
        columns={columns}
        data={courses}
        searchPlaceholder="Search courses..."
      />
    </div>
  )
}
