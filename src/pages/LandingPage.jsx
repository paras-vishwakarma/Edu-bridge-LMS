import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { courseService } from '../services/courseService'
import { BookOpen, Users, Award, Zap, Shield, Globe } from 'lucide-react'
import Footer from '../components/layout/Footer'
import './LandingPage.css'

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      const data = await courseService.getPublishedCourses()
      setCourses(data || [])
    }
    fetchData()
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const features = [
    { icon: <Zap size={24} />, title: 'Interactive Learning', description: 'Engage with video lectures, hands-on assignments, and real-time quizzes designed for maximum retention.' },
    { icon: <BookOpen size={24} />, title: 'Rich Course Library', description: 'Access courses across web development, data science, AI, design, and more from industry experts.' },
    { icon: <Award size={24} />, title: 'Track Progress', description: 'Monitor your learning journey with detailed progress tracking, grades, and achievement milestones.' },
    { icon: <Users size={24} />, title: 'Expert Instructors', description: 'Learn from professionals with real-world experience who are passionate about teaching.' },
    { icon: <Shield size={24} />, title: 'Role-Based Access', description: 'Separate dashboards for students, instructors, and admins with tailored features for each.' },
    { icon: <Globe size={24} />, title: 'Learn Anywhere', description: 'Fully responsive design means you can learn on any device — desktop, tablet, or mobile.' },
  ]

  return (
    <div className="landing-page">
      {/* Background Orbs */}
      <div className="bg-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      {/* Navbar */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} id="landing-nav">
        <div className="navbar-inner">
          <a href="#" className="logo">
            <img src="/edubridge-logo-v2.png" alt="Edubridge Logo" style={{ height: '36px', objectFit: 'contain' }} />
            <span>EDUBRIDGE</span>
          </a>
          <ul className="nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#courses">Courses</a></li>
            <li><a href="#cta">Get Started</a></li>
          </ul>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/login')} style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>Sign In</button>
            <button className="nav-cta" onClick={() => navigate('/register')}>Get Started →</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero" id="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot"></span>
            Open for enrollment — Start learning today
          </div>
          <h1>
            Master New Skills with{' '}
            <span className="gradient-text">EDUBRIDGE LMS</span>
          </h1>
          <p className="hero-subtitle">
            A modern learning management system with video lectures, interactive quizzes,
            assignments, and progress tracking — all in a beautiful dark interface.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => navigate('/register')}>
              Start Learning Free
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/login')}>
              Sign In ↗
            </button>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <div className="stat-value">{courses.length}+</div>
              <div className="stat-label">Courses</div>
            </div>
            <div className="stat">
              <div className="stat-value">5k+</div>
              <div className="stat-label">Students</div>
            </div>
            <div className="stat">
              <div className="stat-value">4.8</div>
              <div className="stat-label">Avg Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section" id="features">
        <div className="section-header">
          <span className="section-label">Features</span>
          <h2 className="section-title">Everything you need to learn & teach</h2>
          <p className="section-description">
            EDUBRIDGE provides a complete platform for students, instructors, and administrators.
          </p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div className="feature-card" key={index}>
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Courses */}
      <section className="section" id="courses">
        <div className="section-header">
          <span className="section-label">Popular Courses</span>
          <h2 className="section-title">Start learning today</h2>
          <p className="section-description">Browse our top-rated courses from expert instructors.</p>
        </div>
        <div className="landing-courses-grid">
          {courses.slice(0, 3).map(course => (
            <div key={course.id} className="landing-course-card" onClick={() => navigate('/login')}>
              <div className="landing-course-thumb">
                <img src={course.thumbnail} alt={course.title} />
                <span className="landing-course-badge">{course.category}</span>
              </div>
              <div className="landing-course-body">
                <h3>{course.title}</h3>
                <p>{course.instructorName}</p>
                <div className="landing-course-meta">
                  <span>{course.rating} stars</span>
                  <span>{course.enrollmentCount?.toLocaleString()} students</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section" id="cta">
        <div className="cta-card">
          <h2>Ready to start your learning journey?</h2>
          <p>Join thousands of students already learning on EDUBRIDGE. It's free to get started.</p>
          <button className="btn btn-primary" onClick={() => navigate('/register')}>
            Create Free Account
          </button>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
