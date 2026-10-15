
import { useCallback, useEffect, useState } from 'react'
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  RefreshCw,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { ApiError } from '../services/api'
import {
  getAttendanceSummary,
  getTodayAttendance,
} from '../services/attendance'
import type {
  AttendanceSummary,
  TodayAttendance,
} from '../types/attendance'
import './DashboardPage.css'

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(`${date}T12:00:00+07:00`))
}

function formatTime(timestamp: string | null): string {
  if (!timestamp) return '—'

  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  }).format(new Date(timestamp))
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  return `${hours}h ${remainingMinutes.toString().padStart(2, '0')}m`
}

function formatMonth(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number)

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(Date.UTC(year, monthNumber - 1, 1, 12)))
}

function getGreeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      hourCycle: 'h23',
      timeZone: 'Asia/Jakarta',
    }).format(new Date()),
  )

  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return 'Your session may have expired. Please sign in again.'
    }

    return error.message
  }

  return 'Unable to load your dashboard. Please try again.'
}

export function DashboardPage() {
  const [today, setToday] = useState<TodayAttendance | null>(null)
  const [summary, setSummary] = useState<AttendanceSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  const loadDashboard = useCallback(async () => {
    try {
      const [todayResult, summaryResult] = await Promise.all([
        getTodayAttendance(),
        getAttendanceSummary(),
      ])

      setToday(todayResult)
      setSummary(summaryResult)
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      void loadDashboard()
    })
  }, [loadDashboard])

  const attendance = today?.attendance ?? null
  const isComplete = Boolean(attendance?.checkOutAt)
  const isInProgress = Boolean(
    attendance?.checkInAt && !attendance.checkOutAt,
  )

  const statusLabel = isComplete
    ? 'Day completed'
    : isInProgress
      ? 'Workday in progress'
      : 'Not checked in'

  const statusClass = isComplete
    ? 'complete'
    : isInProgress
      ? 'progress'
      : 'pending'

  return (
    <section className="dashboard-page">
      <section className="dashboard-welcome">
        <div className="dashboard-welcome-copy">
          <span className="dashboard-welcome-tag">
            DEXA · WFH ATTENDANCE
          </span>
          <h2>{getGreeting()}, welcome back.</h2>
          <p>
            Here’s your workday at a glance. Check your attendance status
            and keep track of your progress.
          </p>
        </div>

        <div className="dashboard-welcome-icon" aria-hidden="true">
          <Clock3 size={34} strokeWidth={1.5} />
        </div>
      </section>

      {pageError && (
        <div className="dashboard-alert" role="alert">
          <span>{pageError}</span>
          <button
            type="button"
            onClick={() => void loadDashboard()}
            disabled={isLoading}
          >
            Try again
          </button>
        </div>
      )}

      <div className="dashboard-section-heading">
        <div>
          <p className="eyebrow">YOUR WORKDAY</p>
          <h2>Today at a glance</h2>
        </div>

        <button
          className="dashboard-refresh"
          type="button"
          onClick={() => {
            setIsLoading(true)
            setPageError('')
            void loadDashboard()
          }}
          disabled={isLoading}
          aria-label="Refresh dashboard"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      <article className="dashboard-today-card">
        <div className="dashboard-today-heading">
          <div className="dashboard-date-icon">
            <CalendarDays size={21} />
          </div>

          <div>
            <p className="dashboard-card-label">TODAY · JAKARTA TIME</p>
            <h3>{today ? formatDate(today.attendanceDate) : 'Your workday'}</h3>
            <span className={`dashboard-status ${statusClass}`}>
              <span />
              {isLoading && !today ? 'Loading status…' : statusLabel}
            </span>
          </div>
        </div>

        <div className="dashboard-time-grid">
          <div className="dashboard-time-item">
            <span className="dashboard-time-icon">
              <ArrowDownRight size={18} />
            </span>
            <div>
              <p>Check-in</p>
              <strong>
                {isLoading && !today
                  ? '…'
                  : formatTime(attendance?.checkInAt ?? null)}
              </strong>
            </div>
          </div>

          <div className="dashboard-time-item">
            <span className="dashboard-time-icon checkout">
              <ArrowUpRight size={18} />
            </span>
            <div>
              <p>Check-out</p>
              <strong>
                {isLoading && !today
                  ? '…'
                  : formatTime(attendance?.checkOutAt ?? null)}
              </strong>
            </div>
          </div>
        </div>

        <div className="dashboard-today-footer">
          <p>
            {isComplete
              ? 'Your attendance for today is complete.'
              : isInProgress
                ? 'Your check-in is recorded. Remember to check out when you finish work.'
                : 'Ready to start your workday? Head to attendance to check in.'}
          </p>

          <Link className="dashboard-primary-link" to="/attendance">
            Open attendance
            <ArrowRight size={16} />
          </Link>
        </div>
      </article>

      <div className="dashboard-section-heading monthly-heading">
        <div>
          <p className="eyebrow">YOUR PROGRESS</p>
          <h2>
            {summary ? formatMonth(summary.month) : 'Monthly overview'}
          </h2>
        </div>

        <Link className="dashboard-text-link" to="/attendance">
          View history <ArrowRight size={15} />
        </Link>
      </div>

      <div className="dashboard-summary-grid">
        <article className="dashboard-summary-card">
          <span className="dashboard-summary-icon recorded">
            <CalendarDays size={19} />
          </span>
          <p>Recorded days</p>
          <strong>
            {isLoading && !summary ? '—' : summary?.recordedDays ?? 0}
          </strong>
          <span>Attendance entries</span>
        </article>

        <article className="dashboard-summary-card">
          <span className="dashboard-summary-icon completed">
            <CheckCircle2 size={19} />
          </span>
          <p>Completed days</p>
          <strong>
            {isLoading && !summary ? '—' : summary?.completedDays ?? 0}
          </strong>
          <span>Checked in and out</span>
        </article>

        <article className="dashboard-summary-card">
          <span className="dashboard-summary-icon duration">
            <Clock3 size={19} />
          </span>
          <p>Total duration</p>
          <strong className="dashboard-duration-value">
            {summary ? formatDuration(summary.totalDurationMinutes) : '—'}
          </strong>
          <span>Recorded work duration</span>
        </article>
      </div>

      <section className="dashboard-next-step">
        <div>
          <p className="eyebrow">QUICK ACCESS</p>
          <h3>Everything you need, one click away.</h3>
          <p>
            Review your attendance records or keep your employee details
            up to date.
          </p>
        </div>

        <div className="dashboard-quick-links">
          <Link to="/attendance">Attendance <ArrowRight size={15} /></Link>
          <Link to="/profile">My profile <ArrowRight size={15} /></Link>
        </div>
      </section>
    </section>
  )
}
