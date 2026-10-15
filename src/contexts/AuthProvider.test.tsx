import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiRequest, tokenStorage } from '../services/api'
import type { Employee, AuthUser, LoginResponse } from '../types/auth'
import { AuthProvider } from './AuthProvider'
import { useAuth } from './useAuth'

vi.mock('../services/api', () => ({
  apiRequest: vi.fn(),
  ApiError: class ApiError extends Error {
    readonly status: number

    constructor(message: string, status: number) {
      super(message)
      this.name = 'ApiError'
      this.status = status
    }
  },
  tokenStorage: {
    get: vi.fn(),
    set: vi.fn(),
    clear: vi.fn(),
  },
}))

const mockApiRequest = vi.mocked(apiRequest)
const mockTokenGet = vi.mocked(tokenStorage.get)
const mockTokenSet = vi.mocked(tokenStorage.set)
const mockTokenClear = vi.mocked(tokenStorage.clear)

const employee = {
  id: 'employee-1',
  companyEmail: 'employee@example.com',
  role: 'EMPLOYEE',
} as Employee

const hrEmployee = {
  id: 'hr-1',
  companyEmail: 'hr@example.com',
  role: 'HR',
} as Employee

const loginResponse = {
  accessToken: 'test-access-token',
  employee,
} as LoginResponse

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

function mockApiResponses(responses: unknown[]) {
  mockApiRequest.mockImplementation(async () => {
    return responses.shift() as never
  })
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTokenGet.mockReturnValue(null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('finishes loading when no saved token exists', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.employee).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(mockApiRequest).not.toHaveBeenCalled()
  })

  it('restores a valid employee session', async () => {
    const profile = { ...employee, role: 'employee' } as Employee
    const user = {
      id: employee.id,
      role: 'employee',
    } as AuthUser

    mockTokenGet.mockReturnValue('saved-access-token')
    mockApiResponses([user, profile])

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isAuthenticated).toBe(true)
    })

    expect(result.current.employee?.id).toBe(employee.id)
    expect(result.current.employee?.role).toBe('EMPLOYEE')
    expect(mockApiRequest).toHaveBeenNthCalledWith(1, '/auth/me')
    expect(mockApiRequest).toHaveBeenNthCalledWith(2, '/employees/me')
    expect(mockTokenClear).not.toHaveBeenCalled()
  })

  it('restores an HR session and normalizes the role', async () => {
    mockTokenGet.mockReturnValue('saved-access-token')
    mockApiResponses([
      { id: hrEmployee.id, role: 'hr' } as AuthUser,
      { ...hrEmployee, role: 'hr' } as Employee,
    ])

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.employee?.role).toBe('HR')
    })

    expect(result.current.isAuthenticated).toBe(true)
  })

  it('clears the session when the restored role is not allowed', async () => {
    mockTokenGet.mockReturnValue('saved-access-token')
    mockApiResponses([
      { id: employee.id, role: 'ADMIN' } as AuthUser,
    ])

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.employee).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(mockTokenClear).toHaveBeenCalledOnce()
    expect(mockApiRequest).toHaveBeenCalledOnce()
  })

  it('clears the session when the restored profile belongs to another user', async () => {
    mockTokenGet.mockReturnValue('saved-access-token')
    mockApiResponses([
      { id: employee.id, role: 'EMPLOYEE' } as AuthUser,
      { ...employee, id: 'different-employee' } as Employee,
    ])

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.employee).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(mockTokenClear).toHaveBeenCalledOnce()
  })

  it('clears the session when restoring the session fails', async () => {
    mockTokenGet.mockReturnValue('expired-access-token')
    mockApiRequest.mockRejectedValue(new Error('Unauthorized'))

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.employee).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(mockTokenClear).toHaveBeenCalledOnce()
  })

  it('logs in and stores the access token for an allowed employee', async () => {
    mockApiRequest.mockResolvedValue(loginResponse as never)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login('employee@example.com', 'password123')
    })

    expect(mockApiRequest).toHaveBeenCalledWith('/auth/login', {
      method: 'POST',
      authenticated: false,
      body: {
        companyEmail: 'employee@example.com',
        password: 'password123',
      },
    })
    expect(mockTokenSet).toHaveBeenCalledWith('test-access-token')
    expect(result.current.employee?.id).toBe(employee.id)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('normalizes the employee role after login', async () => {
    mockApiRequest.mockResolvedValue({
      ...loginResponse,
      employee: { ...employee, role: 'employee' },
    } as never)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login('employee@example.com', 'password123')
    })

    expect(result.current.employee?.role).toBe('EMPLOYEE')
  })

  it('rejects login for a role that cannot access the portal', async () => {
    mockApiRequest.mockResolvedValue({
      accessToken: 'admin-token',
      employee: { ...employee, role: 'ADMIN' },
    } as never)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await expect(
      act(async () => {
        await result.current.login('admin@example.com', 'password123')
      }),
    ).rejects.toMatchObject({
      name: 'ApiError',
      message: 'This account cannot access the employee portal.',
      status: 403,
    })

    expect(mockTokenClear).toHaveBeenCalledOnce()
    expect(mockTokenSet).not.toHaveBeenCalled()
    expect(result.current.employee).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('propagates login API errors without storing a token', async () => {
    const error = new ApiError('Invalid credentials', 401)
    mockApiRequest.mockRejectedValue(error)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await expect(
      act(async () => {
        await result.current.login('employee@example.com', 'wrong-password')
      }),
    ).rejects.toBe(error)

    expect(mockTokenSet).not.toHaveBeenCalled()
    expect(result.current.employee).toBeNull()
  })

  it('logs out and clears the stored token', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login('employee@example.com', 'password123').catch(
        () => undefined,
      )
    })

    // Establish an authenticated state before testing logout.
    mockApiRequest.mockResolvedValue(loginResponse as never)

    await act(async () => {
      await result.current.login('employee@example.com', 'password123')
    })

    act(() => {
      result.current.logout()
    })

    expect(mockTokenClear).toHaveBeenCalled()
    expect(result.current.employee).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('updates the employee profile and normalizes the role', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    act(() => {
      result.current.updateEmployee({
        ...employee,
        role: 'employee',
      })
    })

    expect(result.current.employee?.id).toBe(employee.id)
    expect(result.current.employee?.role).toBe('EMPLOYEE')
    expect(result.current.isAuthenticated).toBe(true)
  })
})
