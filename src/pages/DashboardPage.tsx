import { Clock3 } from 'lucide-react'

export function DashboardPage() {
  return (
    <>
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
    </>
  )
}
