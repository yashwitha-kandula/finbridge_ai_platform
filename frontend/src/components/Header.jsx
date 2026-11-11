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

  // Prioritize active authenticated user's full name over cached dashboard
  const name = user?.full_name || data?.user?.full_name || 'User'
  const profession = user?.profession || data?.user?.profession || ''
  const bills = data?.bills || []
  const dueSoon = data?.due_soon || 0

  const submitSearch = (e) => {
    e.preventDefault()
    if (q.trim()) navigate(`/transactions?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center gap-4 border-b border-slate-200 bg-white px-4 transition-colors dark:border-slate-800 dark:bg-slate-900 sm:px-6">
      <button
        onClick={onMenu}
        aria-label="Toggle menu"
        className="rounded-lg p-2 text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <Menu size={22} />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
          {token ? `Welcome back, ${firstName(name)}` : 'Welcome to FinBridge AI'}
        </h1>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
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
          className="h-10 w-[290px] rounded-lg border border-slate-200 bg-white pl-10 pr-20 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          Ctrl + K
        </kbd>
      </form>

      {token ? (
        <>
          {/* theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-lg p-2 text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            title={`Current theme: ${theme}. Click to toggle.`}
          >
            {theme === 'dark' ? <Sun size={21} className="text-amber-400" /> : <Moon size={21} />}
          </button>

          {/* notifications */}
          <div ref={bellRef} className="relative">
            <button
              onClick={() => setBellOpen((v) => !v)}
              aria-label="Notifications"
              className="relative rounded-lg p-2 text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Bell size={21} />
              {dueSoon > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {dueSoon}
                </span>
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b pb-2 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Upcoming Due Reminders</h3>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {bills.length}
                  </span>
                </div>
                <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
                  {bills.length === 0 ? (
                    <p className="py-4 text-center text-xs text-slate-400">No due payments pending!</p>
                  ) : (
                    bills.map((b, i) => (
                      <div key={i} className="flex items-center justify-between py-2 text-xs">
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{b.title}</div>
                          <div className="text-[10px] text-slate-400">Due: {b.due_date}</div>
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white">{inr(b.amount)}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* user profile dropdown */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2.5 rounded-xl p-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 font-bold text-white shadow-sm">
                {initials(name)}
              </div>
              <div className="hidden text-left sm:block">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{name}</div>
                <div className="text-[10px] text-slate-400 leading-tight">{profession || 'Member'}</div>
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-slate-200 bg-white py-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <div className="border-b px-4 py-2 dark:border-slate-800">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
                </div>
                <Link
                  to="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <User size={15} /> Account Settings
                </Link>
                <button
                  onClick={() => {
                    setProfileOpen(false)
                    logout()
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <Link
          to="/login"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          Sign In
        </Link>
      )}
    </header>
  )
}
