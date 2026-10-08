import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, Search, Bell, ChevronDown, LogOut, User, Sun, Moon, Laptop } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useDashboard } from '../dashboard/DashboardContext'
import { useTheme } from '../theme/ThemeProvider'
import { firstName, initials, inr } from '../lib/format'

function useClickOutside(ref, handler) {
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) handler() }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [ref, handler])
}

export default function Header({ onMenu }) {
  const { token, user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const { data } = useDashboard()
  const navigate = useNavigate()
  const searchRef = useRef(null)
  const bellRef = useRef(null)
  const profileRef = useRef(null)
  const [bellOpen, setBellOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [q, setQ] = useState('')

  useClickOutside(bellRef, () => setBellOpen(false))
  useClickOutside(profileRef, () => setProfileOpen(false))

  useEffect(() => {
    const fn = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])

  const name = data?.user?.full_name || user?.full_name || ''
  const profession = data?.user?.profession || user?.profession || ''
  const bills = data?.bills || []
  const dueSoon = data?.due_soon || 0

  const submitSearch = (e) => {
    e.preventDefault()
    if (q.trim()) navigate(`/transactions?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
      <button
        onClick={onMenu}
        aria-label="Toggle menu"
        className="rounded-lg p-2 text-slate-700 transition hover:bg-slate-100"
      >
        <Menu size={22} />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
          {token ? `Welcome back, ${firstName(name)} 👋` : 'Welcome to FinBridge AI 👋'}
        </h1>
        <p className="truncate text-xs text-slate-500 sm:text-sm">
          {token ? "Here's your financial overview for today." : 'Sign in to see your own financial overview.'}
        </p>
      </div>

      {/* search */}
      <form onSubmit={submitSearch} className="relative hidden md:block">
        <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          ref={searchRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search anything..."
          className="h-10 w-[290px] rounded-lg border border-slate-200 bg-white pl-10 pr-20 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
          Ctrl + K
        </kbd>
      </form>

      {token ? (
        <>
          {/* theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
            className="rounded-lg p-2 text-slate-700 transition hover:bg-slate-100"
            title={`Current theme: ${theme}. Click to cycle.`}
          >
            {theme === 'dark' ? <Moon size={21} /> : theme === 'light' ? <Sun size={21} /> : <Laptop size={21} />}
          </button>

          {/* notifications */}
          <div ref={bellRef} className="relative">
            <button
              onClick={() => setBellOpen((v) => !v)}
              aria-label="Notifications"
              className="relative rounded-lg p-2 text-slate-700 transition hover:bg-slate-100"
            >
              <Bell size={21} />
              {dueSoon > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {dueSoon}
                </span>
              )}
            </button>
            {bellOpen && (
              <div className="absolute right-0 top-12 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                <div className="px-2 pb-2 text-sm font-bold text-slate-900">Upcoming bills</div>
                {bills.length === 0 ? (
                  <p className="px-2 py-4 text-sm text-slate-500">You have no upcoming bills.</p>
                ) : (
                  bills.map((b, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-slate-50">
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{b.title}</div>
                        <div className="text-xs text-slate-500">
                          {b.days_left === 0 ? 'Due today' : `Due in ${b.days_left} day${b.days_left === 1 ? '' : 's'}`}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-slate-900">{inr(b.amount)}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* profile */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-3 rounded-lg p-1.5 pr-2 transition hover:bg-slate-100"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                {initials(name)}
              </span>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block max-w-[140px] truncate text-sm font-semibold text-slate-900">{name}</span>
                <span className="block max-w-[140px] truncate text-xs text-slate-500">{profession}</span>
              </span>
              <ChevronDown size={16} className="hidden text-slate-500 sm:block" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-14 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                <Link
                  to="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <User size={16} /> My profile
                </Link>
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut size={16} /> Log out
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <Link
            to="/login?mode=login"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Log in
          </Link>
          <Link
            to="/login?mode=register"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Sign up
          </Link>
        </div>
      )}
    </header>
  )
}
