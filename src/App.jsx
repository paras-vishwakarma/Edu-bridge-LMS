import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Toaster } from 'react-hot-toast'

// Layout
import DashboardLayout from './components/layout/DashboardLayout'
import ProtectedRoute from './components/common/ProtectedRoute'

// Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Student
import StudentDashboard from './pages/student/StudentDashboard'
import CourseListPage from './pages/student/CourseListPage'
import MyCoursesPage from './pages/student/MyCoursesPage'
import CourseDetailPage from './pages/student/CourseDetailPage'


// Instructor
import InstructorDashboard from './pages/instructor/InstructorDashboard'
import InstructorCoursesPage from './pages/instructor/InstructorCoursesPage'
import CreateCoursePage from './pages/instructor/CreateCoursePage'


// Admin
import AdminDashboard from './pages/admin/AdminDashboard'
import ManageUsersPage from './pages/admin/ManageUsersPage'
import ManageCoursesPage from './pages/admin/ManageCoursesPage'
import DatabaseViewerPage from './pages/admin/DatabaseViewerPage'

import './App.css'

function DashboardRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />
  const routes = {
    student: '/student/dashboard',
    instructor: '/instructor/dashboard',
    admin: '/admin/dashboard',
  }
  return <Navigate to={routes[user.role] || '/student/dashboard'} />
}

function SettingsPlaceholder() {
  const { user } = useAuth()
  return (
    <div className="course-list-page">
      <div className="course-list-header">
        <h2 className="page-title">Settings</h2>
        <p className="page-subtitle">Manage your account preferences</p>
      </div>
      <div className="deadline-item" style={{ flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-start', padding: '1.5rem' }}>
        <p style={{ fontSize: '0.9rem' }}><strong>Name:</strong> {user?.name}</p>
        <p style={{ fontSize: '0.9rem' }}><strong>Email:</strong> {user?.email}</p>
        <p style={{ fontSize: '0.9rem' }}><strong>Role:</strong> {user?.role}</p>
        <p style={{ fontSize: '0.9rem' }}><strong>Joined:</strong> {user?.joinedAt}</p>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a2e',
              color: '#f0f0f5',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px',
              fontSize: '0.88rem',
            },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardRedirect />} />

          {/* Student routes */}
          <Route element={
            <ProtectedRoute allowedRoles={['student']}>
              <DashboardLayout title="Student" />
            </ProtectedRoute>
          }>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/courses" element={<CourseListPage />} />
            <Route path="/student/my-courses" element={<MyCoursesPage />} />

            <Route path="/student/settings" element={<SettingsPlaceholder />} />
          </Route>

          {/* Instructor routes */}
          <Route element={
            <ProtectedRoute allowedRoles={['instructor']}>
              <DashboardLayout title="Instructor" />
            </ProtectedRoute>
          }>
            <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
            <Route path="/instructor/courses" element={<InstructorCoursesPage />} />
            <Route path="/instructor/create-course" element={<CreateCoursePage />} />

            <Route path="/instructor/settings" element={<SettingsPlaceholder />} />
          </Route>

          {/* Admin routes */}
          <Route element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout title="Admin" />
            </ProtectedRoute>
          }>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<ManageUsersPage />} />
            <Route path="/admin/courses" element={<ManageCoursesPage />} />
            <Route path="/admin/analytics" element={<AdminDashboard />} />
            <Route path="/admin/database" element={<DatabaseViewerPage />} />
            <Route path="/admin/settings" element={<SettingsPlaceholder />} />
          </Route>

          {/* Course detail (accessible by all authenticated users) */}
          <Route path="/course/:courseId" element={
            <ProtectedRoute allowedRoles={['student', 'instructor', 'admin']}>
              <div className="dashboard-layout">
                <div style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                  <CourseDetailPage />
                </div>
              </div>
            </ProtectedRoute>
          } />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
