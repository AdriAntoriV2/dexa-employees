import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">EMPLOYEE PORTAL</p>
            <h1>Workspace</h1>
          </div>

          <span className="environment-label">Development</span>
        </header>

        <Outlet />

        <footer className="page-footer">
          Dexa WFH Attendance <span>·</span> Employee Portal
        </footer>
      </main>
    </div>
  )
}
