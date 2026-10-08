export const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/** JSON fetch with bearer token. Throws Error(message) with the server's detail. */
export async function authFetch(token, path, options = {}) {
  let res
  try {
    res = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    })
  } catch {
    throw new Error('Cannot reach the server. Make sure the backend is running on port 8000.')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(
      typeof data.detail === 'string' ? data.detail
        : Array.isArray(data.detail) ? data.detail.map((d) => d.msg).join(', ')
        : 'Something went wrong'
    )
    err.status = res.status
    throw err
  }
  return data
}
