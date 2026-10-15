import { API_BASE_URL } from '../config'

const TOKEN_KEY = 'dexa.employee.accessToken'

export class ApiError extends Error {
  public readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const tokenStorage = {
  get(): string | null {
    return sessionStorage.getItem(TOKEN_KEY)
  },

  set(token: string): void {
    sessionStorage.setItem(TOKEN_KEY, token)
  },

  clear(): void {
    sessionStorage.removeItem(TOKEN_KEY)
  },
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  authenticated?: boolean
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, authenticated = true, headers, ...requestOptions } = options

  const requestHeaders = new Headers(headers)
  requestHeaders.set('Accept', 'application/json')

  if (body !== undefined) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  if (authenticated) {
    const token = tokenStorage.get()

    if (token) {
      requestHeaders.set('Authorization', `Bearer ${token}`)
    }
  }

  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...requestOptions,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(
      'Unable to reach the server. Check your connection and try again.',
      0,
    )
  }

  if (!response.ok) {
    let message = `Request failed (${response.status}).`

    try {
      const payload = (await response.json()) as {
        message?: string | string[]
      }

      if (Array.isArray(payload.message)) {
        message = payload.message.join(' ')
      } else if (payload.message) {
        message = payload.message
      }
    } catch {
      // Keep the fallback message when the response isn't JSON.
    }

    if (response.status === 401 && authenticated) {
      tokenStorage.clear()
    }

    throw new ApiError(message, response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}