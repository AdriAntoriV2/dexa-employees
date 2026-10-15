export type EmployeeRole = 'EMPLOYEE' | 'HR' | string

export interface Employee {
  id: string
  companyEmail: string
  fullName: string
  photoUrl: string | null
  position: string | null
  phoneNumber: string | null
  role: EmployeeRole
}

export interface LoginResponse {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
  employee: Employee
}

export interface AuthUser {
  id: string
  role: EmployeeRole
}

export interface ApiErrorResponse {
  message?: string | string[]
  statusCode?: number
}
