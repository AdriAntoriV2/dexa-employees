const apiUrl = import.meta.env.VITE_API_URL?.trim()

if (!apiUrl) {
  throw new Error(
    'Missing VITE_API_URL. Configure it in the employee app environment.',
  )
}

export const API_BASE_URL = apiUrl.replace(/\/+$/, '')