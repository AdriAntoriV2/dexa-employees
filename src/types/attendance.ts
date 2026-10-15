export type AttendanceTimingStatus = 'EARLY' | 'ON_TIME' | 'LATE'

export interface AttendanceRecord {
  id: string
  employeeId: string
  attendanceDate: string
  checkInAt: string | null
  checkOutAt: string | null
  checkInStatus: AttendanceTimingStatus | null
  checkOutStatus: AttendanceTimingStatus | null
  createdAt: string
  updatedAt: string
}

export interface TodayAttendance {
  attendanceDate: string
  checkedIn: boolean
  attendance: AttendanceRecord | null
}

export interface AttendanceHistory {
  data: AttendanceRecord[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface AttendanceSummary {
  month: string
  employeeId: string
  recordedDays: number
  completedDays: number
  incompleteDays: number
  totalDurationMinutes: number
}