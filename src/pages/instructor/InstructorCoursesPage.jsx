import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { courseService } from '../../services/courseService'
import { useNavigate } from 'react-router-dom'

export default function InstructorCoursesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [myCourses, setMyCourses] = useState([])
  const [allEnrollments, setAllEnrollments] = useState([])

  useEffect(() => {
    async function load() {
      const courses = await courseService.getCoursesByInstructor(user.id)
      const enrollments = await courseService.getEnrollmentStats()
      setMyCourses(courses || [])
      setAllEnrollments(enrollments || [])
    }
    load()
  }, [user.id])

  return (
    <div className="course-list-page">
      <div className="course-list-header">
        <h2 className="page-title">My Courses</h2>
        <p className="page-subtitle">Manage and organize your courses</p>
      </div>

      <div className="courses-grid">
        {myCourses.map(course => {
          const enrolled = allEnrollments.filter(e => e.courseId === course.id).length
          return (
            <div key={course.id} className="course-card" onClick={() => navigate(`/course/${course.id}`)}>
              <div className="course-card-thumbnail">
                <img src={course.thumbnail} alt={course.title} />
                <div className="course-card-overlay">
                  <span className="course-card-category" style={{
                    background: course.status === 'published' ? 'rgba(0,184,148,0.7)' : 'rgba(253,203,110,0.7)'
                  }}>
                    {course.status}
                  </span>
                </div>
              </div>
              <div className="course-card-body">
                <h3 className="course-card-title">{course.title}</h3>
                <div className="course-card-meta">
                  <span className="course-card-rating"> {course.rating > 0 ? course.rating : 'New'}</span>
                  <span className="course-card-students">{enrolled} students</span>
                </div>
                <div className="course-card-footer">
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {myCourses.length === 0 && (
        <div className="empty-state">
          <p>You haven't created any courses yet.</p>
          <button className="btn-link" onClick={() => navigate('/instructor/create-course')}>Create your first course →</button>
        </div>
      )}
    </div>
  )
}
