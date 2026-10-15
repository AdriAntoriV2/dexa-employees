import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LogIn,
  LogOut,
  RefreshCw,
} from 'lucide-react'
import { ApiError } from '../services/api'
import {
  checkIn,
  checkOut,
  getAttendanceHistory,
  getAttendanceSummary,
  getTodayAttendance,
} from '../services/attendance'
import type {
  AttendanceRecord,
  AttendanceSummary,
  TodayAttendance,
} from '../types/attendance'
import './AttendancePage.css'

const PAGE_SIZE = 10

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
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

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return 'Your session may have expired. Please sign in again.'
    }

    return error.message
  }

  return 'Something went wrong. Please try again.'
}

function getTimingLabel(status: AttendanceRecord['checkInStatus']): string {
  if (!status) return 'Not recorded'

  switch (status) {
    case 'EARLY':
      return 'Early'
    case 'ON_TIME':
      return 'On time'
    case 'LATE':
      return 'Late'
  }
}

function getAttendanceStatus(
  attendance: AttendanceRecord | null,
): { label: string; className: string } {
  if (!attendance) {
    return { label: 'Not checked in', className: 'not-started' }
  }

  if (attendance.checkOutAt) {
    return { label: 'Completed', className: 'completed' }
  }

  return { label: 'In progress', className: 'in-progress' }
}

export function AttendancePage() {
  const [today, setToday] = useState<TodayAttendance | null>(null)
  const [summary, setSummary] = useState<AttendanceSummary | null>(null)
  const [history, setHistory] = useState<Awaited<
    ReturnType<typeof getAttendanceHistory>
  > | null>(null)
  const [historyPage, setHistoryPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [action, setAction] = useState<'check-in' | 'check-out' | null>(null)
  const [pageError, setPageError] = useState('')
  const [actionError, setActionError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setPageError('')

    try {
      const [todayResult, summaryResult, historyResult] = await Promise.all([
        getTodayAttendance(),
        getAttendanceSummary(),
        getAttendanceHistory(historyPage, PAGE_SIZE),
      ])

      setToday(todayResult)
      setSummary(summaryResult)
      setHistory(historyResult)
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [historyPage])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const attendance = today?.attendance ?? null
  const status = getAttendanceStatus(attendance)
  const canCheckIn = Boolean(today && !attendance)
  const canCheckOut = Boolean(
    attendance && attendance.checkInAt && !attendance.checkOutAt,
  )

  async function handleAttendanceAction(
    actionType: 'check-in' | 'check-out',
  ) {
    setAction(actionType)
    setActionError('')
    setSuccessMessage('')

    try {
      if (actionType === 'check-in') {
        await checkIn()
        setSuccessMessage('Check-in recorded successfully.')
      } else {
        await checkOut()
        setSuccessMessage('Check-out recorded successfully.')
      }

      await loadData()
    } catch (error) {
      setActionError(getErrorMessage(error))
      // Refresh in case the server recorded the action before the request failed.
      await loadData()
    } finally {
      setAction(null)
    }
  }

  function changeHistoryPage(nextPage: number) {
    if (!history || nextPage < 1 || nextPage > history.totalPages) return
    setHistoryPage(nextPage)
  }

  return (
    <section className="attendance-page">
      <div className="attendance-heading">
        <div>
          <p className="eyebrow">YOUR WORKDAY</p>
          <h2>Attendance</h2>
          <p className="attendance-subtitle">
            Track your daily check-in, check-out, and working hours.
          </p>
        </div>

        <button
          className="attendance-refresh"
          type="button"
          onClick={() => void loadData()}
          disabled={isLoading || action !== null}
          aria-label="Refresh attendance"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {pageError && (
        <div className="attendance-alert error" role="alert">
          <AlertCircle size={18} />
          <span>{pageError}</span>
          <button type="button" onClick={() => void loadData()}>
            Try again
          </button>
        </div>
      )}

      {actionError && (
        <div className="attendance-alert error" role="alert">
          <AlertCircle size={18} />
          <span>{actionError}</span>
        </div>
      )}

      {successMessage && (
        <div className="attendance-alert success" role="status">
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
          <button type="button" onClick={() => setSuccessMessage('')}>
            Dismiss
          </button>
        </div>
      )}

      <div className="attendance-today-card">
        <div className="attendance-today-main">
          <div className="attendance-date-icon">
            <CalendarDays size={22} />
          </div>

          <div className="attendance-date-copy">
            <p className="attendance-card-label">TODAY · JAKARTA TIME</p>
            <h3>
              {today ? formatDate(today.attendanceDate) : 'Today'}
            </h3>
            <span className={`attendance-status ${status.className}`}>
              <span />
              {isLoading && !today ? 'Loading status…' : status.label}
            </span>
          </div>
        </div>

        <div className="attendance-time-grid">
          <div className="attendance-time-item">
            <span className="attendance-time-icon check-in">
              <ArrowDownRight size={18} />
            </span>
            <div>
              <p>Check-in</p>
              <strong>
                {formatTime(attendance?.checkInAt ?? null)}
              </strong>
              <span>
                {getTimingLabel(attendance?.checkInStatus ?? null)}
              </span>
            </div>
          </div>

          <div className="attendance-time-item">
            <span className="attendance-time-icon check-out">
              <ArrowUpRight size={18} />
            </span>
            <div>
              <p>Check-out</p>
              <strong>
                {formatTime(attendance?.checkOutAt ?? null)}
              </strong>
              <span>
                {getTimingLabel(attendance?.checkOutStatus ?? null)}
              </span>
            </div>
          </div>
        </div>

        <div className="attendance-action-area">
          {isLoading && !today ? (
            <p className="attendance-action-hint">
              Loading your attendance…
            </p>
          ) : canCheckIn ? (
            <>
              <button
                className="attendance-action primary"
                type="button"
                onClick={() => void handleAttendanceAction('check-in')}
                disabled={action !== null}
              >
                <LogIn size={18} />
                {action === 'check-in' ? 'Checking in…' : 'Check in'}
              </button>
              <p className="attendance-action-hint">
                Start your workday by recording your check-in.
              </p>
            </>
          ) : canCheckOut ? (
            <>
              <button
                className="attendance-action primary"
                type="button"
                onClick={() => void handleAttendanceAction('check-out')}
                disabled={action !== null}
              >
                <LogOut size={18} />
                {action === 'check-out' ? 'Checking out…' : 'Check out'}
              </button>
              <p className="attendance-action-hint">
                Your check-in is recorded. Check out when you finish work.
              </p>
            </>
          ) : (
            <p className="attendance-complete-note">
              <CheckCircle2 size={17} />
              Your attendance for today is complete.
            </p>
          )}
        </div>
      </div>

      <div className="attendance-section-heading">
        <div>
          <p className="eyebrow">MONTHLY OVERVIEW</p>
          <h3>{summary ? formatMonth(summary.month) : 'This month'}</h3>
        </div>
      </div>

      <div className="attendance-summary-grid">
        <article className="attendance-summary-card">
          <span className="attendance-summary-icon recorded">
            <CalendarDays size={19} />
          </span>
          <p>Recorded days</p>
          <strong>{isLoading && !summary ? '—' : summary?.recordedDays ?? 0}</strong>
          <span>Attendance entries</span>
        </article>

        <article className="attendance-summary-card">
          <span className="attendance-summary-icon completed">
            <CheckCircle2 size={19} />
          </span>
          <p>Completed days</p>
          <strong>{isLoading && !summary ? '—' : summary?.completedDays ?? 0}</strong>
          <span>Checked in and out</span>
        </article>

        <article className="attendance-summary-card">
          <span className="attendance-summary-icon incomplete">
            <Clock3 size={19} />
          </span>
          <p>Incomplete days</p>
          <strong>{isLoading && !summary ? '—' : summary?.incompleteDays ?? 0}</strong>
          <span>Awaiting check-out</span>
        </article>

        <article className="attendance-summary-card">
          <span className="attendance-summary-icon duration">
            <Clock3 size={19} />
          </span>
          <p>Total duration</p>
          <strong className="duration-value">
            {summary ? formatDuration(summary.totalDurationMinutes) : '—'}
          </strong>
          <span>Completed sessions</span>
        </article>
      </div>

      <div className="attendance-section-heading history-heading">
        <div>
          <p className="eyebrow">YOUR RECORDS</p>
          <h3>Attendance history</h3>
        </div>
        {history && (
          <span className="attendance-history-count">
            {history.total} {history.total === 1 ? 'record' : 'records'}
          </span>
        )}
      </div>

      <div className="attendance-history-card">
        {isLoading && !history ? (
          <div className="attendance-empty-state">Loading attendance history…</div>
        ) : history?.data.length ? (
          <>
            <div className="attendance-table-wrap">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Check-in status</th>
                    <th>Day status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.data.map((record) => {
                    const recordStatus = getAttendanceStatus(record)

                    return (
                      <tr key={record.id}>
                        <td className="attendance-history-date">
                          {formatDate(record.attendanceDate)}
                        </td>
                        <td>{formatTime(record.checkInAt)}</td>
                        <td>{formatTime(record.checkOutAt)}</td>
                        <td>
                          <span
                            className={`attendance-timing ${
                              record.checkInStatus?.toLowerCase() ?? 'unknown'
                            }`}
                          >
                            {getTimingLabel(record.checkInStatus)}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`attendance-status ${recordStatus.className}`}
                          >
                            <span />
                            {recordStatus.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="attendance-pagination">
              <span>
                Page {history.page} of {Math.max(history.totalPages, 1)}
              </span>
              <div>
                <button
                  type="button"
                  onClick={() => changeHistoryPage(historyPage - 1)}
                  disabled={historyPage <= 1 || isLoading}
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => changeHistoryPage(historyPage + 1)}
                  disabled={
                    historyPage >= history.totalPages || isLoading
                  }
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="attendance-empty-state">
            <CalendarDays size={26} />
            <strong>No attendance records yet</strong>
            <span>Your recorded workdays will appear here.</span>
          </div>
        )}
      </div>
    </section>
  )
}