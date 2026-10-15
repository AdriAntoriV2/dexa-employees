import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from './api'
import {
  checkIn,
  checkOut,
  getAttendanceHistory,
  getAttendanceSummary,
  getTodayAttendance,
} from './attendance'

vi.mock('./api', () => ({
  apiRequest: vi.fn(),
}))

const mockApiRequest = vi.mocked(apiRequest)

describe('attendance service', () => {
  beforeEach(() => {
    mockApiRequest.mockReset()
  })

  it('fetches today attendance from the correct endpoint', async () => {
    const response = {
      date: '2026-10-15',
      attendance: null,
    }

    mockApiRequest.mockResolvedValue(response)

    await expect(getTodayAttendance()).resolves.toEqual(response)

    expect(mockApiRequest).toHaveBeenCalledWith('/attendance/me/today')
    expect(mockApiRequest).toHaveBeenCalledOnce()
  })

  it('sends a POST request to check in', async () => {
    const response = {
      id: 'attendance-1',
    }

    mockApiRequest.mockResolvedValue(response)

    await expect(checkIn()).resolves.toEqual(response)

    expect(mockApiRequest).toHaveBeenCalledWith(
      '/attendance/check-in',
      { method: 'POST' },
    )
    expect(mockApiRequest).toHaveBeenCalledOnce()
  })

  it('sends a POST request to check out', async () => {
    const response = {
      id: 'attendance-1',
    }

    mockApiRequest.mockResolvedValue(response)

    await expect(checkOut()).resolves.toEqual(response)

    expect(mockApiRequest).toHaveBeenCalledWith(
      '/attendance/check-out',
      { method: 'POST' },
    )
    expect(mockApiRequest).toHaveBeenCalledOnce()
  })

  it('fetches attendance history with default pagination', async () => {
    const response = {
      items: [],
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    }

    mockApiRequest.mockResolvedValue(response)

    await expect(getAttendanceHistory()).resolves.toEqual(response)

    expect(mockApiRequest).toHaveBeenCalledWith(
      '/attendance/me/history?page=1&limit=10',
    )
    expect(mockApiRequest).toHaveBeenCalledOnce()
  })

  it('fetches attendance history with custom pagination', async () => {
    mockApiRequest.mockResolvedValue({
      items: [],
      page: 3,
      limit: 5,
      total: 0,
      totalPages: 0,
    })

    await getAttendanceHistory(3, 5)

    expect(mockApiRequest).toHaveBeenCalledWith(
      '/attendance/me/history?page=3&limit=5',
    )
  })

  it('URL-encodes pagination parameters correctly', async () => {
    mockApiRequest.mockResolvedValue({})

    await getAttendanceHistory(2, 25)

    const [endpoint] = mockApiRequest.mock.calls[0]!

    expect(endpoint).toBe('/attendance/me/history?page=2&limit=25')
  })

  it('fetches the attendance summary from the correct endpoint', async () => {
    const response = {
      totalDays: 20,
      presentDays: 18,
      lateDays: 2,
    }

    mockApiRequest.mockResolvedValue(response)

    await expect(getAttendanceSummary()).resolves.toEqual(response)

    expect(mockApiRequest).toHaveBeenCalledWith('/attendance/me/summary')
    expect(mockApiRequest).toHaveBeenCalledOnce()
  })

  it('propagates API errors to the caller', async () => {
    const error = new Error('Unable to reach the server.')

    mockApiRequest.mockRejectedValue(error)

    await expect(getTodayAttendance()).rejects.toBe(error)
  })
})
