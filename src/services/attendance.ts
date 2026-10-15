import { apiRequest } from './api'
import type {
  AttendanceHistory,
  AttendanceRecord,
  AttendanceSummary,
  TodayAttendance,
} from '../types/attendance'

export function getTodayAttendance(): Promise<TodayAttendance> {
  return apiRequest<TodayAttendance>('/attendance/me/today')
}

export function checkIn(): Promise<AttendanceRecord> {
  return apiRequest<AttendanceRecord>('/attendance/check-in', {
    method: 'POST',
  })
}

export function checkOut(): Promise<AttendanceRecord> {
  return apiRequest<AttendanceRecord>('/attendance/check-out', {
    method: 'POST',
  })
}

export function getAttendanceHistory(
  page = 1,
  limit = 10,
): Promise<AttendanceHistory> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  })

  return apiRequest<AttendanceHistory>(
    `/attendance/me/history?${params.toString()}`,
  )
}

export function getAttendanceSummary(): Promise<AttendanceSummary> {
  return apiRequest<AttendanceSummary>('/attendance/me/summary')
}