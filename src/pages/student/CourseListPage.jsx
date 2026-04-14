import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { courseService } from '../../services/courseService'
import { categories } from '../../data/mockData'
import CourseCard from '../../components/common/CourseCard'
import { Search, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import './CourseListPage.css'

export default function CourseListPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedLevel, setSelectedLevel] = useState('All')
  const [courses, setCourses] = useState([])

  const [enrolledIds, setEnrolledIds] = useState([])

  useEffect(() => {
    async function load() {
      try {
        const data = await courseService.getPublishedCourses()
        const enrData = user ? await courseService.getStudentEnrollments(user.id) : []
        setCourses(Array.isArray(data) ? data : [])
        setEnrolledIds(Array.isArray(enrData) ? enrData.map(e => e.courseId) : [])
      } catch (err) {
        console.error(err)
      }
    }
    load()
  }, [user])

  const filtered = courses.filter(c => {
    const matchSearch = !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
    const matchCategory = selectedCategory === 'All' || c.category === selectedCategory
    const matchLevel = selectedLevel === 'All' || c.level === selectedLevel
    return matchSearch && matchCategory && matchLevel
  })

  const handleEnroll = async (course) => {
    if (!user) return
    const result = await courseService.enrollStudent(user.id, course.id)
    if (result.success) {
      toast.success(`Enrolled in "${course.title}"!`)
      setEnrolledIds([...enrolledIds, course.id])
    } else {
      toast.error(result.error || 'Failed to enroll')
    }
  }

  return (
    <div className="course-list-page">
      <div className="course-list-header">
        <h2 className="page-title">Explore Courses</h2>
        <p className="page-subtitle">Discover courses taught by industry experts</p>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search courses, topics..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
            id="course-search"
          />
        </div>

        <div className="filter-pills">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="filter-select"
            id="category-filter"
          >
            <option value="All">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={selectedLevel}
            onChange={e => setSelectedLevel(e.target.value)}
            className="filter-select"
            id="level-filter"
          >
            <option value="All">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Beginner to Advanced">Beginner to Advanced</option>
          </select>
        </div>
      </div>

      <p className="results-count">{filtered.length} course{filtered.length !== 1 ? 's' : ''} found</p>

      <div className="courses-grid">
        {filtered.map(course => {
          const isEnrolled = enrolledIds.includes(course.id)
          return (
            <CourseCard
              key={course.id}
              course={course}
              actionLabel={isEnrolled ? 'Enrolled ✓' : 'Enroll'}
              onClick={() => !isEnrolled && handleEnroll(course)}
            />
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <p>No courses match your search. Try different keywords or filters.</p>
        </div>
      )}
    </div>
  )
}
