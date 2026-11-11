import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const AuthContext = createContext(null)
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('finbridge_token'))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(!!localStorage.getItem('finbridge_token'))

  const refreshUser = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const u = await res.json()
        setUser(u)
        return u
      }
    } catch (err) {
      console.error('Failed to fetch user', err)
    }
  }, [token])

  useEffect(() => {
    if (!token) {
      localStorage.removeItem('finbridge_token')
      setUser(null)
      setLoading(false)
      return
    }
    localStorage.setItem('finbridge_token', token)
    setLoading(true)
    refreshUser().finally(() => setLoading(false))
  }, [token, refreshUser])

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

  const socialLogin = useCallback(async (provider, oauthToken, email, name) => {
    const res = await fetch(`${API}/api/auth/social`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, token: oauthToken, email, name }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.detail || 'Social login failed')
    setToken(data.access_token)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('finbridge_token')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ token, user, setUser, loading, login, register, socialLogin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
