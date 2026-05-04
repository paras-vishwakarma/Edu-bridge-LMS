import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { courseService } from '../../services/courseService'

import CourseCard from '../../components/common/CourseCard'
import StatsCard from '../../components/common/StatsCard'
import ProgressBar from '../../components/common/ProgressBar'
import { BookOpen, Trophy, Clock, Target } from 'lucide-react'
import './StudentDashboard.css'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState([])
  const [allCourses, setAllCourses] = useState([])

  
  useEffect(() => {
    async function load() {
      const enr = await courseService.getStudentEnrollments(user.id)
      const courses = await courseService.getPublishedCourses()
      setEnrollments(Array.isArray(enr) ? enr : [])
      setAllCourses(Array.isArray(courses) ? courses : [])

    }
    load()
  }, [user.id])

  const enrolledCourses = enrollments.map(enr => {
    const course = allCourses.find(c => c.id === enr.courseId)
    return { ...course, enrollment: enr }
  }).filter(c => c.id)

  const avgProgress = enrollments.length > 0
    ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)
    : 0

  const completedCourses = enrollments.filter(e => e.progress === 100).length


  return (
    <div className="student-dashboard">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-banner-content">
          <h2 className="welcome-title">
            Welcome back, <span className="gradient-text">{user.name?.split(' ')[0]}</span>
          </h2>
          <p className="welcome-subtitle">Continue your learning journey. You're doing great!</p>
        </div>
        <div className="welcome-banner-art">
          <div className="welcome-orb"></div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatsCard
          icon={<BookOpen size={22} />}
          value={enrollments.length}
          label="Enrolled Courses"
          trend="up"
          trendValue="+2"
          color="rgba(108, 92, 231, 0.15)"
        />
        <StatsCard
          icon={<Target size={22} />}
          value={`${avgProgress}%`}
          label="Avg. Progress"
          color="rgba(0, 184, 148, 0.15)"
        />
        <StatsCard
          icon={<Trophy size={22} />}
          value={completedCourses}
          label="Completed"
          color="rgba(253, 203, 110, 0.15)"
        />

      </div>

      {/* My Courses */}
      <section className="dashboard-section">
        <div className="section-header-row">
          <h3 className="section-heading">Continue Learning</h3>
          <a href="/student/my-courses" className="section-link">View all →</a>
        </div>
        {enrolledCourses.length > 0 ? (
          <div className="courses-grid">
            {enrolledCourses.slice(0, 3).map(course => (
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
      </section>


    </div>
  )
}
