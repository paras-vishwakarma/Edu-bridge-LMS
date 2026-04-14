import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { courseService } from '../../services/courseService'
import VideoPlayer from '../../components/common/VideoPlayer'
import ProgressBar from '../../components/common/ProgressBar'
import { Play, FileText, ChevronDown, ChevronUp, Clock, Users, Star, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import './CourseDetailPage.css'

export default function CourseDetailPage() {
  const { courseId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [course, setCourse] = useState(null)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [enrollment, setEnrollment] = useState(null)
  
  const [expandedSections, setExpandedSections] = useState([])
  const [activeLesson, setActiveLesson] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const fetchedCourse = await courseService.getCourseById(courseId)
        setCourse(fetchedCourse)
        
        if (fetchedCourse && fetchedCourse.sections?.length > 0) {
          setExpandedSections([fetchedCourse.sections[0].id])
        }

        if (user && fetchedCourse) {
          const enrolled = await courseService.isEnrolled(user.id, courseId)
          setIsEnrolled(enrolled)
          
          if (enrolled) {
            const enrollments = await courseService.getStudentEnrollments(user.id)
            const enrolArr = Array.isArray(enrollments) ? enrollments : []
            setEnrollment(enrolArr.find(e => e.courseId === courseId))
          }
        }
      } catch (err) {
        console.error(err)
      }
    }
    load()
  }, [courseId, user])

  if (!course) {
    return (
      <div className="empty-state">
        <p>Course not found</p>
        <button onClick={() => navigate(-1)} className="btn-link">← Go back</button>
      </div>
    )
  }

  const totalLessons = course.sections?.reduce((acc, s) => acc + s.lessons.length, 0) || 0

  const toggleSection = (sectionId) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const handleEnroll = async () => {
    const result = await courseService.enrollStudent(user.id, course.id)
    if (result && !result.error) {
      toast.success('Successfully enrolled!')
      window.location.reload()
    } else {
      toast.error(result.error || 'Failed to enroll')
    }
  }

  const handleCompleteLesson = async (lessonId) => {
    await courseService.completeLesson(user.id, courseId, lessonId)
    toast.success('Lesson marked as complete!')
    window.location.reload()
  }

  const isLessonCompleted = (lessonId) => {
    return enrollment?.completedLessons?.includes(lessonId) || false
  }

  return (
    <div className="course-detail-page">
      {/* Course Hero */}
      <div className="course-hero">
        <div className="course-hero-info">
          <span className="course-category-badge">{course.category}</span>
          <h1 className="course-detail-title">{course.title}</h1>
          <p className="course-detail-desc">{course.description}</p>
          <div className="course-meta-row">
            <span className="meta-item"><Star size={16} /> {course.rating > 0 ? `${course.rating} (${course.reviewCount})` : 'New'}</span>
            <span className="meta-item"><Users size={16} /> {course.enrollmentCount?.toLocaleString()} students</span>
            <span className="meta-item"><Clock size={16} /> {course.duration}</span>
          </div>
          <p className="course-instructor-name">By {course.instructorName}</p>
          <div className="course-tags">
            {course.tags?.map(tag => (
              <span key={tag} className="course-tag">{tag}</span>
            ))}
          </div>

          {!isEnrolled ? (
            <button className="btn btn-primary enroll-btn" onClick={handleEnroll} id="enroll-btn">
              Enroll Now
            </button>
          ) : (
            <div className="enrolled-status">
              <CheckCircle size={18} /> Enrolled
              <ProgressBar value={enrollment?.progress || 0} size="sm" />
            </div>
          )}
        </div>
        <div className="course-hero-thumbnail">
          <img src={course.thumbnail} alt={course.title} />
        </div>
      </div>

      <div className="course-detail-layout">
        {/* Video Player */}
        {activeLesson && (activeLesson.type === 'video' || activeLesson.type === 'upload') && (
          <div className="course-player-section">
            <h3 className="player-lesson-title">{activeLesson.title}</h3>
            <VideoPlayer
              videoUrl={activeLesson.videoUrl}
              title={activeLesson.title}
              onComplete={isEnrolled ? () => handleCompleteLesson(activeLesson.id) : undefined}
            />
          </div>
        )}

        {activeLesson && activeLesson.type === 'pdf' && (
          <div className="course-player-section pdf-section">
            <h3 className="player-lesson-title">{activeLesson.title}</h3>
            <div className="pdf-placeholder">
              <FileText size={48} />
              <p>PDF Content: {activeLesson.title}</p>
              <span className="pdf-duration">{activeLesson.duration}</span>
              {isEnrolled && (
                <button className="btn btn-primary" onClick={() => handleCompleteLesson(activeLesson.id)}>
                  Mark as Complete
                </button>
              )}
            </div>
          </div>
        )}

        {/* Curriculum */}
        <div className="curriculum-section">
          <h3 className="curriculum-heading">
            Course Curriculum
            <span className="curriculum-stats">{course.sections?.length} sections · {totalLessons} lessons</span>
          </h3>

          <div className="curriculum-list">
            {course.sections?.map(section => (
              <div key={section.id} className="curriculum-section-item">
                <button
                  className="curriculum-section-header"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="curriculum-section-info">
                    {expandedSections.includes(section.id) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    <span className="curriculum-section-title">{section.title}</span>
                  </div>
                  <span className="curriculum-section-count">{section.lessons.length} lessons</span>
                </button>

                {expandedSections.includes(section.id) && (
                  <div className="curriculum-lessons">
                    {section.lessons.map(lesson => (
                      <button
                        key={lesson.id}
                        className={`curriculum-lesson ${activeLesson?.id === lesson.id ? 'active' : ''} ${isLessonCompleted(lesson.id) ? 'completed' : ''}`}
                        onClick={() => isEnrolled && setActiveLesson(lesson)}
                        disabled={!isEnrolled}
                      >
                        <span className="lesson-icon">
                          {isLessonCompleted(lesson.id) ? (
                            <CheckCircle size={16} className="lesson-check" />
                          ) : (lesson.type === 'video' || lesson.type === 'upload') ? (
                            <Play size={16} />
                          ) : (
                            <FileText size={16} />
                          )}
                        </span>
                        <span className="lesson-title">{lesson.title}</span>
                        <span className="lesson-duration">{lesson.duration}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
