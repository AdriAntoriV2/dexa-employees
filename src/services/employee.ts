
import { apiRequest } from './api'
import type { Employee } from '../types/auth'

export interface UpdateMyProfileInput {
  phoneNumber?: string
  photoUrl?: string
}

export interface ChangeMyPasswordInput {
  currentPassword: string
  newPassword: string
}

export function getMyProfile(): Promise<Employee> {
  return apiRequest<Employee>('/employees/me')
}

export function updateMyProfile(
  input: UpdateMyProfileInput,
): Promise<Employee> {
  return apiRequest<Employee>('/employees/me', {
    method: 'PATCH',
    body: input,
  })
}

export function changeMyPassword(
  input: ChangeMyPasswordInput,
): Promise<void> {
  return apiRequest<void>('/employees/me/password', {
    method: 'PATCH',
    body: input,
  })
}
