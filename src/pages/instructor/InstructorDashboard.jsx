import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { courseService } from '../../services/courseService'

import { authService } from '../../services/authService'
import StatsCard from '../../components/common/StatsCard'
import { BookOpen, Users, Star, ClipboardList } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function InstructorDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [myCourses, setMyCourses] = useState([])
  const [allEnrollments, setAllEnrollments] = useState([])


  useEffect(() => {
    async function fetchData() {
      const courses = await courseService.getCoursesByInstructor(user.id)
      const enrollments = await courseService.getEnrollmentStats()
      setMyCourses(Array.isArray(courses) ? courses : [])
      setAllEnrollments(Array.isArray(enrollments) ? enrollments : [])

    }
    fetchData()
  }, [user.id])

  const totalStudents = myCourses.reduce((sum, c) => {
    return sum + allEnrollments.filter(e => e.courseId === c.id).length
  }, 0)

  const avgRating = myCourses.length > 0
    ? (myCourses.reduce((sum, c) => sum + (c.rating || 0), 0) / myCourses.length).toFixed(1)
    : '0.0'



  return (
    <div className="student-dashboard">
      <div className="welcome-banner">
        <div className="welcome-banner-content">
          <h2 className="welcome-title">
            Hello, <span className="gradient-text">{user.name?.split(' ')[0]}</span>
          </h2>
          <p className="welcome-subtitle">Here's what's happening with your courses today.</p>
        </div>
        <div className="welcome-banner-art"><div className="welcome-orb"></div></div>
      </div>

      <div className="stats-grid">
        <StatsCard icon={<BookOpen size={22} />} value={myCourses.length} label="My Courses" color="rgba(108, 92, 231, 0.15)" />
        <StatsCard icon={<Users size={22} />} value={totalStudents} label="Total Students" color="rgba(0, 184, 148, 0.15)" trend="up" trendValue="+12" />
        <StatsCard icon={<Star size={22} />} value={avgRating} label="Avg Rating" color="rgba(253, 203, 110, 0.15)" />

      </div>

      <section className="dashboard-section">
        <div className="section-header-row">
          <h3 className="section-heading">My Courses</h3>
          <button className="btn btn-primary" style={{ fontSize: '0.82rem', padding: '0.4rem 1rem' }} onClick={() => navigate('/instructor/create-course')}>
            + Create Course
          </button>
        </div>
        <div className="courses-grid">
          {myCourses.map(course => (
            <div key={course.id} className="course-card" onClick={() => navigate(`/instructor/manage/${course.id}`)}>
              <div className="course-card-thumbnail">
                <img src={course.thumbnail} alt={course.title} />
                <div className="course-card-overlay">
                  <span className="course-card-category">{course.status}</span>
                </div>
              </div>
              <div className="course-card-body">
                <h3 className="course-card-title">{course.title}</h3>
                <div className="course-card-meta">
                  <span className="course-card-rating">{course.rating > 0 ? course.rating : 'New'}</span>
                  <span className="course-card-students">{allEnrollments.filter(e => e.courseId === course.id).length} enrolled</span>
                </div>
                <div className="course-card-footer">
                  <span className="course-card-level" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{course.sections?.length || 0} sections</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>


    </div>
  )
}
