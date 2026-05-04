import { useNavigate } from 'react-router-dom'
import ProgressBar from './ProgressBar'

export default function CourseCard({ course, enrollment, onClick, showProgress = false, actionLabel }) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (onClick) {
      onClick(course)
    } else {
      navigate(`/course/${course.id}`)
    }
  }

  return (
    <div className="course-card" onClick={handleClick} id={`course-card-${course.id}`}>
      <div className="course-card-thumbnail">
        <img src={course.thumbnail} alt={course.title} loading="lazy" />
        <div className="course-card-overlay">
          <span className="course-card-category">{course.category}</span>
          {course.level && <span className="course-card-level">{course.level}</span>}
        </div>
      </div>
      <div className="course-card-body">
        <h3 className="course-card-title">{course.title}</h3>
        <p className="course-card-instructor">
          {course.instructorName}
        </p>
        <div className="course-card-meta">
          <span className="course-card-rating">
            {course.rating > 0 ? course.rating.toFixed(1) : 'New'}
            {course.reviewCount > 0 && <span className="review-count">({course.reviewCount})</span>}
          </span>
          <span className="course-card-students">
            {course.enrollmentCount?.toLocaleString()}
          </span>
        </div>
        {showProgress && enrollment && (
          <div className="course-card-progress">
            <ProgressBar value={enrollment.progress} size="sm" />
          </div>
        )}
        <div className="course-card-footer">

          {actionLabel && (
            <button className="course-card-action" onClick={(e) => { e.stopPropagation() }}>
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
