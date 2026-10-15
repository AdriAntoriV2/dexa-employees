import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { ApiError } from '../services/api'
import { useAuth } from '../contexts/useAuth'
import './LoginPage.css'

interface LoginLocationState {
  from?: {
    pathname?: string
  }
}

export function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [companyEmail, setCompanyEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const locationState = location.state as LoginLocationState | null
  const redirectTo = locationState?.from?.pathname ?? '/'

  if (isLoading) {
    return (
      <main className="auth-loading" aria-live="polite">
        <span className="auth-loading-mark">D</span>
        <p>Restoring your session...</p>
      </main>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await login(companyEmail.trim(), password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError('The email or password you entered is incorrect.')
        } else {
          setError(err.message)
        }
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <Link className="auth-brand" to="/" aria-label="Dexa home">
          <span className="auth-brand-mark">D</span>
          <span>Dexa</span>
        </Link>

        <div className="auth-brand-message">
          <span className="auth-overline">EMPLOYEE WORKSPACE</span>
          <h1>Your workday,<br />in one place.</h1>
          <p>
            A simpler way to manage your attendance, review your work history,
            and keep your employee profile up to date.
          </p>
        </div>

        <p className="auth-panel-footer">
          Dexa WFH Attendance <span>·</span> Employee Portal
        </p>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          <div className="auth-mobile-brand">
            <span className="auth-brand-mark">D</span>
            <span>Dexa</span>
          </div>

          <div className="auth-heading">
            <span className="auth-overline">WELCOME BACK</span>
            <h2>Sign in to your account</h2>
            <p>Use your company email to access your workspace.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && (
              <div className="auth-error" role="alert">
                <span className="auth-error-indicator" />
                <p>{error}</p>
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="companyEmail">Company email</label>
              <div className="auth-input-wrap">
                <Mail size={18} aria-hidden="true" />
                <input
                  id="companyEmail"
                  name="companyEmail"
                  type="email"
                  autoComplete="username"
                  placeholder="you@company.com"
                  value={companyEmail}
                  onChange={(event) => setCompanyEmail(event.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <div className="auth-input-wrap">
                <LockKeyhole size={18} aria-hidden="true" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  disabled={isSubmitting}
                />
                <button
                  className="auth-password-toggle"
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((current) => !current)}
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <button
              className="auth-submit"
              type="submit"
              disabled={isSubmitting || !companyEmail.trim() || !password}
            >
              <span>{isSubmitting ? 'Signing in...' : 'Sign in'}</span>
              {!isSubmitting && <ArrowRight size={18} />}
            </button>

            <p className="auth-form-note">
              Having trouble signing in? Contact your company administrator.
            </p>
          </form>

          <p className="auth-form-footer">
            Secure access for authorized Dexa employees.
          </p>
        </div>
      </section>
    </main>
  )
}
