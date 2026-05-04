import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import Footer from './Footer'
import './DashboardLayout.css'

export default function DashboardLayout({ title }) {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-main">
        <TopBar title={title} />
        <main className="dashboard-content">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  )
}
