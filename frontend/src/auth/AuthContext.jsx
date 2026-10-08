import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const AuthContext = createContext(null)
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('finbridge_token'))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(!!localStorage.getItem('finbridge_token'))

  useEffect(() => {
    if (!token) {
      localStorage.removeItem('finbridge_token')
      setUser(null)
      setLoading(false)
      return
    }
    localStorage.setItem('finbridge_token', token)
    setLoading(true)
    fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false))
  }, [token])

  const login = useCallback(async (email, password) => {
    const body = new URLSearchParams({ username: email, password })
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.detail || 'Login failed')
    setToken(data.access_token)
  }, [])

  const register = useCallback(async (payload) => {
    const res = await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.detail || 'Registration failed')
    setToken(data.access_token)
  }, [])

  const logout = useCallback(() => setToken(null), [])

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
