import { Clock3, LayoutDashboard, UserRound } from 'lucide-react'
import './App.css'

function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Dexa home">
          <span className="brand-mark">D</span>
          <span>Dexa</span>
        </a>

        <p className="sidebar-label">WORKSPACE</p>

        <nav className="navigation" aria-label="Main navigation">
          <a className="nav-link active" href="#dashboard">
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </a>

          <a className="nav-link" href="#attendance">
            <Clock3 size={18} />
            <span>Attendance</span>
          </a>

          <a className="nav-link" href="#profile">
            <UserRound size={18} />
            <span>My Profile</span>
          </a>
        </nav>

        <div className="sidebar-footer">
          <span className="status-dot" />
          Employee workspace
        </div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div>
            <p className="eyebrow">EMPLOYEE PORTAL</p>
            <h1>Workspace</h1>
          </div>

          <span className="environment-label">Development</span>
        </header>

        <section className="welcome-card">
          <div className="welcome-content">
            <span className="welcome-tag">DEXA · WFH ATTENDANCE</span>
            <h2>Your workday, in one place.</h2>
            <p>
              Manage your attendance, review your work history, and keep your
              employee profile up to date.
            </p>
          </div>

          <div className="welcome-icon" aria-hidden="true">
            <Clock3 size={36} strokeWidth={1.5} />
          </div>
        </section>

        <section className="setup-section" aria-labelledby="setup-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">GETTING STARTED</p>
              <h2 id="setup-title">Your workspace is being set up</h2>
            </div>
            <span className="setup-count">01 / 04</span>
          </div>

          <div className="setup-card">
            <div className="setup-number">01</div>
            <div className="setup-copy">
              <h3>Frontend foundation</h3>
              <p>
                The app shell and API configuration are ready for the next
                development step.
              </p>
            </div>
            <span className="setup-status">In progress</span>
          </div>

          <div className="setup-card">
            <div className="setup-number muted">02</div>
            <div className="setup-copy">
              <h3>Secure employee login</h3>
              <p>Connect your employee account to the Dexa backend.</p>
            </div>
            <span className="setup-status pending">Next</span>
          </div>
        </section>

        <footer className="page-footer">
          Dexa WFH Attendance <span>·</span> Employee Portal
        </footer>
      </main>
    </div>
  )
}

export default App