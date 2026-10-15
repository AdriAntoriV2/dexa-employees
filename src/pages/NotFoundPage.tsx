import { ArrowLeft, Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'
import './NotFoundPage.css'

export function NotFoundPage() {
  const { isAuthenticated } = useAuth()

  const homePath = isAuthenticated ? '/' : '/login'

  return (
    <main className="not-found-page">
      <Link className="not-found-brand" to={homePath} aria-label="Dexa home">
        <span className="not-found-brand-mark">D</span>
        <span>Dexa</span>
      </Link>

      <section className="not-found-content" aria-labelledby="not-found-title">
        <div className="not-found-icon" aria-hidden="true">
          <Compass size={28} strokeWidth={1.6} />
        </div>

        <p className="eyebrow">ERROR 404</p>

        <h1 id="not-found-title">We lost that page.</h1>

        <p className="not-found-description">
          The page you're looking for doesn't exist, may have moved,
          or isn't available at this address.
        </p>

        <Link className="not-found-action" to={homePath}>
          <ArrowLeft size={17} />
          <span>{isAuthenticated ? 'Back to dashboard' : 'Back to sign in'}</span>
        </Link>

        <p className="not-found-code">404 <span>·</span> Page not found</p>
      </section>

      <footer className="not-found-footer">
        Dexa WFH Attendance <span>·</span> Employee Portal
      </footer>
    </main>
  )
}
