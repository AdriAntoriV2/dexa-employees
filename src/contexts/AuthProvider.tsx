import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { AuthContext } from './AuthContext'
import type { AuthContextValue } from './AuthContext'
import { apiRequest, ApiError, tokenStorage } from '../services/api'
import type {
  AuthUser,
  Employee,
  LoginResponse,
} from '../types/auth'

const ALLOWED_PORTAL_ROLES = new Set(['EMPLOYEE', 'HR'])

function isAllowedPortalRole(role: string): boolean {
  return ALLOWED_PORTAL_ROLES.has(role.toUpperCase())
}

function normalizeEmployeeRole<T extends { role: string }>(user: T): T {
  return { ...user, role: user.role.toUpperCase() }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    tokenStorage.clear()
    setEmployee(null)
  }, [])

  const updateEmployee = useCallback((updatedEmployee: Employee) => {
    setEmployee(normalizeEmployeeRole(updatedEmployee))
  }, [])

  const login = useCallback(
    async (companyEmail: string, password: string) => {
      const response = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        authenticated: false,
        body: { companyEmail, password },
      })

      const account = normalizeEmployeeRole(response.employee)

      if (!isAllowedPortalRole(account.role)) {
        tokenStorage.clear()
        setEmployee(null)
        throw new ApiError(
          'This account cannot access the employee portal.',
          403,
        )
      }

      tokenStorage.set(response.accessToken)
      setEmployee(account)
    },
    [],
  )

  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      const token = tokenStorage.get()

      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const user = await apiRequest<AuthUser>('/auth/me')
        const normalizedUser = normalizeEmployeeRole(user)

        if (!isAllowedPortalRole(normalizedUser.role)) {
          throw new ApiError(
            'This account cannot access the employee portal.',
            403,
          )
        }

        const profile = await apiRequest<Employee>('/employees/me')

        if (profile.id !== normalizedUser.id) {
          throw new ApiError('The session profile did not match.', 401)
        }

        if (!cancelled) {
          setEmployee(normalizeEmployeeRole(profile))
        }
      } catch {
        tokenStorage.clear()

        if (!cancelled) {
          setEmployee(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void restoreSession()

    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      employee,
      isAuthenticated: employee !== null,
      isLoading,
      login,
      logout,
      updateEmployee,
    }),
    [employee, isLoading, login, logout, updateEmployee],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}