import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'
import './LoginPage.css'


export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }
    setLoading(true)
    // Simulate network delay
    await new Promise(r => setTimeout(r, 600))
    const result = await login(email, password)
    setLoading(false)

    if (result.success) {
      toast.success(`Welcome back, ${result.user.name}!`)
      const roleRoutes = {
        student: '/student/dashboard',
        instructor: '/instructor/dashboard',
        admin: '/admin/dashboard',
      }
      navigate(roleRoutes[result.user.role] || '/student/dashboard')
    } else {
      toast.error(result.error)
    }
  }



  return (
    <div className="auth-page">
      <div className="auth-bg-orbs">
        <div className="auth-orb auth-orb-1"></div>
        <div className="auth-orb auth-orb-2"></div>
      </div>

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-card-header">
            <div className="auth-logo" onClick={() => navigate('/')}>
              <img src="/edubridge-logo-v2.png" alt="Edubridge" style={{ height: '48px', objectFit: 'contain' }} />
              <span className="auth-logo-text">EDUBRIDGE</span>
            </div>
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in to continue learning</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email</label>
              <div className="form-input-wrapper">
                <Mail size={18} className="form-input-icon" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="form-input"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <div className="form-input-wrapper">
                <Lock size={18} className="form-input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="form-input"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="form-input-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-actions-row">
              <label className="form-checkbox">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <a href="#" className="form-forgot-link">Forgot password?</a>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading} id="login-submit">
              {loading ? (
                <span className="auth-spinner"></span>
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In
                </>
              )}
            </button>
          </form>



          <p className="auth-footer-text">
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
