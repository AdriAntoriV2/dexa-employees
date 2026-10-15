import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { apiRequest, ApiError, tokenStorage } from '../services/api'
import type {
  AuthUser,
  Employee,
  LoginResponse,
} from '../types/auth'

interface AuthContextValue {
  employee: Employee | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (companyEmail: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function isEmployeeRole(role: string): boolean {
  return role.toUpperCase() === 'EMPLOYEE'
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

  const login = useCallback(
    async (companyEmail: string, password: string) => {
      const response = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        authenticated: false,
        body: { companyEmail, password },
      })

      const account = normalizeEmployeeRole(response.employee)

      if (!isEmployeeRole(account.role)) {
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

        if (!isEmployeeRole(normalizedUser.role)) {
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
    }),
    [employee, isLoading, login, logout],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.')
  }

  return context
}