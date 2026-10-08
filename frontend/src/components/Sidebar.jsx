import { NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard, CircleDollarSign, Receipt, ArrowLeftRight, Landmark, Target, Users,
  BarChart3, TrendingUp, Sparkles, FileText, FolderOpen, Settings, Crown, TrendingUp as Logo,
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useDashboard } from '../dashboard/DashboardContext'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/income', label: 'Income', icon: CircleDollarSign },
  { to: '/expenses', label: 'Expenses', icon: Receipt },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/debts', label: 'Debts / Loans', icon: Landmark },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/family', label: 'Family Planning', icon: Users },
  { to: '/investments', label: 'Investments', icon: BarChart3 },
  { to: '/forecast', label: 'Forecast & Analytics', icon: TrendingUp },
  { to: '/assistant', label: 'AI Financial Assistant', icon: Sparkles },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/documents', label: 'Documents', icon: FolderOpen },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ open, onClose }) {
  const { token } = useAuth()
  const { data } = useDashboard()
  const closeOnMobile = () => { if (window.innerWidth < 1024) onClose() }

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[250px] shrink-0 flex-col border-r border-slate-200 bg-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full lg:hidden'
        }`}
      >
        {/* brand */}
        <Link to="/" onClick={closeOnMobile} className="flex items-center gap-3 px-6 pb-4 pt-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Logo size={22} strokeWidth={2.4} />
          </div>
          <div className="leading-tight">
            <div className="text-[17px] font-bold text-slate-900">FinBridge AI</div>
            <div className="text-[11px] font-medium text-slate-500">Smart Financial Intelligence</div>
          </div>
        </Link>

        {/* nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-2">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={closeOnMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon size={19} strokeWidth={1.9} className="shrink-0" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* account card */}
        <div className="p-4">
          {token ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs text-slate-500">Account Type</div>
              <div className="mt-1.5 flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <Crown size={16} />
                </span>
                <span className="text-[15px] font-bold text-slate-900">Premium Plan</span>
              </div>
              <div className="mt-3 text-xs text-slate-500">Member since</div>
              <div className="text-sm font-semibold text-slate-800">{data?.user?.member_since || '—'}</div>
              <Link
                to="/settings"
                onClick={closeOnMobile}
                className="mt-3 block rounded-lg border border-slate-200 py-2 text-center text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50"
              >
                Manage Plan
              </Link>
            </div>
          ) : (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
              <div className="text-sm font-bold text-slate-900">Save your progress</div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Create a free account to track your own income, spending and goals.
              </p>
              <Link
                to="/login?mode=register"
                className="mt-3 block rounded-lg bg-indigo-600 py-2 text-center text-xs font-semibold text-white transition hover:bg-indigo-700"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
