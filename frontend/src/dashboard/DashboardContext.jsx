import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { authFetch } from '../lib/api'

const Ctx = createContext(null)

export function DashboardProvider({ children }) {
  const { token, logout } = useAuth()
  const [trendMonths, setTrendMonths] = useState(6)
  const [breakdown, setBreakdown] = useState('this_month')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!token) { setData(null); setError(''); return }
    setLoading(true)
    setError('')
    try {
      setData(await authFetch(token, `/api/dashboard?trend_months=${trendMonths}&breakdown=${breakdown}`))
    } catch (e) {
      if (e.status === 401) logout()
      else setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [token, trendMonths, breakdown, logout])

  useEffect(() => { load() }, [load])

  return (
    <Ctx.Provider value={{ data, loading, error, reload: load,
                           trendMonths, setTrendMonths, breakdown, setBreakdown }}>
      {children}
    </Ctx.Provider>
  )
}

export const useDashboard = () => useContext(Ctx)
