import { createContext } from 'react'
import type { Employee } from '../types/auth'

export interface AuthContextValue {
  employee: Employee | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (companyEmail: string, password: string) => Promise<void>
  logout: () => void
  updateEmployee: (employee: Employee) => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
)