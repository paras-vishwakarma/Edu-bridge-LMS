import { Link, useLocation } from 'react-router-dom'

export default function Footer() {
  const location = useLocation()
  const isLanding = location.pathname === '/'

  return (
    <footer className="footer" style={{ marginTop: 'auto' }}>
      <div className="footer-inner">
        <p className="footer-text">© {new Date().getFullYear()} EDUBRIDGE LMS — all rights reserved by EDUBRIDGE "ANSP"</p>
        <ul className="footer-links">
          {isLanding ? (
            <>
              <li><a href="#features">Features</a></li>
              <li><a href="#courses">Courses</a></li>
              <li><a href="#cta">Get Started</a></li>
            </>
          ) : (
            <>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/student/courses">Courses</Link></li>
              <li><a href="mailto:support@edubridge.com">Support</a></li>
            </>
          )}
        </ul>
      </div>
    </footer>
  )
}
