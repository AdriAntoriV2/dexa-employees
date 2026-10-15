import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '../config'
import { ApiError, apiRequest, tokenStorage } from './api'

describe('tokenStorage', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('returns null when no token is stored', () => {
    expect(tokenStorage.get()).toBeNull()
  })

  it('stores and retrieves an access token', () => {
    tokenStorage.set('test-access-token')

    expect(tokenStorage.get()).toBe('test-access-token')
  })

  it('removes the stored access token', () => {
    tokenStorage.set('test-access-token')
    tokenStorage.clear()

    expect(tokenStorage.get()).toBeNull()
  })
})

describe('apiRequest', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    sessionStorage.clear()
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns parsed JSON for a successful response', async () => {
    const payload = { id: 'employee-1', name: 'Test Employee' }

    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const result = await apiRequest<typeof payload>('/employees/me')

    expect(result).toEqual(payload)
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('sends JSON bodies with the correct content type', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const body = { companyEmail: 'employee@example.com', password: 'secret' }

    await apiRequest('/auth/login', {
      method: 'POST',
      authenticated: false,
      body,
    })

    const [url, options] = fetchMock.mock.calls[0]!

    expect(url).toBe(`${API_BASE_URL}/auth/login`)
    expect(options?.method).toBe('POST')
    expect(options?.body).toBe(JSON.stringify(body))

    const headers = new Headers(options?.headers)
    expect(headers.get('Accept')).toBe('application/json')
    expect(headers.get('Content-Type')).toBe('application/json')
    expect(headers.has('Authorization')).toBe(false)
  })

  it('attaches the stored bearer token to authenticated requests', async () => {
    tokenStorage.set('test-access-token')

    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await apiRequest('/employees/me')

    const [, options] = fetchMock.mock.calls[0]!
    const headers = new Headers(options?.headers)

    expect(headers.get('Authorization')).toBe('Bearer test-access-token')
  })

  it('does not attach a bearer token to unauthenticated requests', async () => {
    tokenStorage.set('test-access-token')

    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ accessToken: 'new-token' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await apiRequest('/auth/login', {
      method: 'POST',
      authenticated: false,
    })

    const [, options] = fetchMock.mock.calls[0]!
    const headers = new Headers(options?.headers)

    expect(headers.has('Authorization')).toBe(false)
    expect(tokenStorage.get()).toBe('test-access-token')
  })

  it('returns undefined for a 204 No Content response', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))

    const result = await apiRequest<void>('/attendance/check-out', {
      method: 'POST',
    })

    expect(result).toBeUndefined()
  })

  it('throws ApiError with the server message for a failed request', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'Employee not found.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await expect(apiRequest('/employees/missing')).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Employee not found.',
      status: 404,
    })
  })

  it('joins array-based API error messages', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ message: ['Email is required.', 'Password is required.'] }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )

    await expect(apiRequest('/auth/login')).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Email is required. Password is required.',
      status: 400,
    })
  })

  it('uses a fallback message when the error response is not JSON', async () => {
    fetchMock.mockResolvedValue(
      new Response('Internal Server Error', { status: 500 }),
    )

    await expect(apiRequest('/test')).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Request failed (500).',
      status: 500,
    })
  })

  it('clears the token when an authenticated request returns 401', async () => {
    tokenStorage.set('expired-token')

    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await expect(apiRequest('/employees/me')).rejects.toBeInstanceOf(ApiError)

    expect(tokenStorage.get()).toBeNull()
  })

  it('does not clear the token for a 401 from an unauthenticated request', async () => {
    tokenStorage.set('existing-token')

    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await expect(
      apiRequest('/auth/login', {
        method: 'POST',
        authenticated: false,
      }),
    ).rejects.toBeInstanceOf(ApiError)

    expect(tokenStorage.get()).toBe('existing-token')
  })

  it('converts network failures into an ApiError with status 0', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network failure'))

    await expect(apiRequest('/employees/me')).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Unable to reach the server. Check your connection and try again.',
      status: 0,
    })
  })
})
