import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { courseService } from '../../services/courseService'
import CourseCard from '../../components/common/CourseCard'

export default function MyCoursesPage() {
  const { user } = useAuth()
  const [enrolledCourses, setEnrolledCourses] = useState([])

  useEffect(() => {
    async function load() {
      try {
        const enrollments = await courseService.getStudentEnrollments(user.id)
        const allCourses = await courseService.getPublishedCourses()
        const enrolArr = Array.isArray(enrollments) ? enrollments : []
        const coursesArr = Array.isArray(allCourses) ? allCourses : []

        const validEnrolled = enrolArr.map(enr => {
          const course = coursesArr.find(c => c.id === enr.courseId)
          return course ? { ...course, enrollment: enr } : null
        }).filter(Boolean)
        setEnrolledCourses(validEnrolled)
      } catch (err) {
        console.error(err)
      }
    }
    load()
  }, [user.id])

  return (
    <div className="course-list-page">
      <div className="course-list-header">
        <h2 className="page-title">My Courses</h2>
        <p className="page-subtitle">Continue learning where you left off</p>
      </div>

      {enrolledCourses.length > 0 ? (
        <div className="courses-grid">
          {enrolledCourses.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              enrollment={course.enrollment}
              showProgress={true}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>You haven't enrolled in any courses yet.</p>
          <a href="/student/courses" className="btn-link">Browse Courses →</a>
        </div>
      )}
    </div>
  )
}
