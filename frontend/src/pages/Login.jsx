import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

/* ---------- icons (inline SVG: identical size everywhere, never overlap text) ---------- */
const I = ({ children }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
       strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    {children}
  </svg>
)
const icons = {
  user: <I><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0116 0" /></I>,
  phone: <I><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" /></I>,
  mail: <I><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></I>,
  globe: <I><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" /></I>,
  lock: <I><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></I>,
  flag: <I><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></I>,
  rupee: <I><path d="M6 4h12M6 9h12M9 4c5 0 6 5 0 5l6 11" /></I>,
  briefcase: <I><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M3 13h18" /></I>,
  wallet: <I><path d="M3 7a2 2 0 012-2h13v4M3 7v11a2 2 0 002 2h15V9H5a2 2 0 01-2-2z" /><circle cx="16.5" cy="14.5" r="1" /></I>,
  alert: <I><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.01" /></I>,
}

const inputCls =
  'block w-full h-12 rounded-lg border border-slate-300 bg-white pl-11 pr-4 text-[15px] text-slate-900 ' +
  'placeholder:text-slate-400 outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20'
const selectCls = inputCls + ' appearance-none pr-10 cursor-pointer'

function Field({ label, icon, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            {icons[icon]}
          </span>
        )}
        {children}
      </div>
    </div>
  )
}

function Select({ name, value, onChange, options, icon, label }) {
  return (
    <Field label={label} icon={icon}>
      <select name={name} value={value} onChange={onChange} className={selectCls}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <svg viewBox="0 0 20 20" fill="currentColor"
           className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500">
        <path d="M5.5 7.5l4.5 5 4.5-5z" />
      </svg>
    </Field>
  )
}

const LANGUAGES = ['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Marathi', 'Bengali']
const COUNTRIES = ['India', 'United States', 'United Kingdom', 'Singapore', 'UAE']
const CURRENCIES = ['INR (₹)', 'USD ($)', 'EUR (€)', 'GBP (£)']
const PROFESSIONS = ['Software Engineer', 'Freelancer / Consultant', 'Doctor / Healthcare',
  'Business Owner / Founder', 'Teacher / Professor', 'Financial Analyst', 'Student', 'Other']
const INCOME_TYPES = ['Salary / Fixed Income', 'Variable / Gig Income',
  'Mixed (Fixed + Variable)', 'Business Revenue']

const initial = {
  fullName: '', mobile: '', email: '', language: 'English', password: '', confirm: '',
  country: 'India', currency: 'INR (₹)', dob: '', profession: 'Software Engineer',
  incomeType: 'Salary / Fixed Income', agreed: false,
}

export default function Login() {
  const { token, login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('register') // 'register' | 'login'
  const [f, setF] = useState(initial)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (token) return <Navigate to="/" replace />

  const set = (e) => {
    const { name, value, type, checked } = e.target
    setF((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }))
    setError('')
  }
  const switchMode = (m) => { setMode(m); setError('') }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (mode === 'login') {
      if (!f.email || !f.password) return setError('Enter your email and password.')
    } else {
      if (!f.fullName.trim()) return setError('Please enter your full name.')
      if (!/^\S+@\S+\.\S+$/.test(f.email)) return setError('Please enter a valid email address.')
      if (f.password.length < 6) return setError('Password must be at least 6 characters.')
      if (f.password !== f.confirm) return setError('Passwords do not match.')
      if (!f.agreed) return setError('Please agree to the Terms of Service and Privacy Policy.')
    }
    setBusy(true)
    try {
      if (mode === 'login') {
        await login(f.email, f.password)
      } else {
        await register({
          full_name: f.fullName.trim(), email: f.email, password: f.password,
          mobile: f.mobile, preferred_language: f.language, country: f.country,
          currency: f.currency, dob: f.dob, profession: f.profession, income_type: f.incomeType,
        })
      }
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message === 'Failed to fetch'
        ? 'Cannot reach the server. Make sure the backend is running on port 8000.'
        : err.message)
    } finally {
      setBusy(false)
    }
  }

  // Quick-access accounts for Google / Microsoft / Apple (no OAuth keys configured yet)
  const social = async (provider) => {
    setError('')
    setBusy(true)
    const email = `${provider.toLowerCase()}.user@finbridge.ai`
    const password = 'Social@12345'
    try {
      try {
        await login(email, password)
      } catch {
        await register({ email, password, full_name: `${provider} User` })
      }
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const isLogin = mode === 'login'

  return (
    <div className="min-h-screen bg-white">
      {/* top bar */}
      <header className="bg-navy">
        <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-white">
                <rect x="3" y="12" width="4" height="8" rx="1" />
                <rect x="10" y="8" width="4" height="12" rx="1" />
                <rect x="17" y="4" width="4" height="16" rx="1" />
              </svg>
            </div>
            <div className="leading-tight">
              <div className="text-lg font-bold text-white">FinBridge AI</div>
              <div className="text-xs text-blue-200">Smart Financial Intelligence</div>
            </div>
          </div>
          <div className="text-sm text-slate-300">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button type="button" onClick={() => switchMode(isLogin ? 'register' : 'login')}
                    className="font-bold text-white underline-offset-4 hover:underline">
              {isLogin ? 'Register' : 'Login'}
            </button>
          </div>
        </div>
      </header>

      {/* page body */}
      <main className="mx-auto max-w-[860px] px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {isLogin ? 'Welcome Back' : 'Create Your Account'}
        </h1>
        <p className="mt-1.5 text-slate-500">
          {isLogin ? 'Sign in to continue to your dashboard.' : 'Enter your details to get started.'}
        </p>

        {error && (
          <div role="alert"
               className="mt-6 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="mt-px shrink-0">{icons.alert}</span>
            <span className="pt-0.5">{error}</span>
          </div>
        )}

        <form onSubmit={submit} noValidate className="mt-8">
          {isLogin ? (
            <div className="max-w-md space-y-5">
              <Field label="Email Address" icon="mail">
                <input type="email" name="email" value={f.email} onChange={set}
                       placeholder="arjun.kumar@gmail.com" autoComplete="email" className={inputCls} />
              </Field>
              <Field label="Password" icon="lock">
                <input type="password" name="password" value={f.password} onChange={set}
                       placeholder="Enter your password" autoComplete="current-password" className={inputCls} />
              </Field>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
              <Field label="Full Name" icon="user">
                <input name="fullName" value={f.fullName} onChange={set}
                       placeholder="Arjun Kumar" autoComplete="name" className={inputCls} />
              </Field>
              <Field label="Mobile Number" icon="phone">
                <input type="tel" name="mobile" value={f.mobile} onChange={set}
                       placeholder="+91 98765 43210" autoComplete="tel" className={inputCls} />
              </Field>

              <Field label="Email Address" icon="mail">
                <input type="email" name="email" value={f.email} onChange={set}
                       placeholder="arjun.kumar@gmail.com" autoComplete="email" className={inputCls} />
              </Field>
              <Select label="Preferred Language" icon="globe" name="language"
                      value={f.language} onChange={set} options={LANGUAGES} />

              <Field label="Password" icon="lock">
                <input type="password" name="password" value={f.password} onChange={set}
                       placeholder="Create a password" autoComplete="new-password" className={inputCls} />
              </Field>
              <Select label="Country" icon="flag" name="country"
                      value={f.country} onChange={set} options={COUNTRIES} />

              <Field label="Confirm Password" icon="lock">
                <input type="password" name="confirm" value={f.confirm} onChange={set}
                       placeholder="Re-enter your password" autoComplete="new-password" className={inputCls} />
              </Field>
              <Select label="Currency" icon="rupee" name="currency"
                      value={f.currency} onChange={set} options={CURRENCIES} />

              <Field label="Date of Birth">
                <input type="date" name="dob" value={f.dob} onChange={set}
                       className={inputCls.replace('pl-11', 'pl-4')} />
              </Field>
              <div className="hidden md:block" />

              <Select label="Profession" icon="briefcase" name="profession"
                      value={f.profession} onChange={set} options={PROFESSIONS} />
              <Select label="Income Type" icon="wallet" name="incomeType"
                      value={f.incomeType} onChange={set} options={INCOME_TYPES} />

              <label className="flex items-center gap-2.5 text-sm text-slate-700 md:col-span-2">
                <input type="checkbox" name="agreed" checked={f.agreed} onChange={set}
                       className="h-4 w-4 rounded border-slate-300 accent-navy" />
                <span>
                  I agree to the <a href="#" className="font-semibold text-blue-600 hover:underline">Terms of Service</a>{' '}
                  and <a href="#" className="font-semibold text-blue-600 hover:underline">Privacy Policy</a>
                </span>
              </label>
            </div>
          )}

          <button type="submit" disabled={busy}
                  className={`mt-8 flex h-12 items-center justify-center rounded-lg bg-navy text-base font-semibold text-white transition hover:bg-navy-light disabled:opacity-60 ${isLogin ? 'w-full max-w-md' : 'w-full'}`}>
            {busy ? 'Please wait…' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className={isLogin ? 'max-w-md' : ''}>
          <div className="my-7 flex items-center gap-4 text-xs font-medium uppercase tracking-wider text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            or continue with
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SocialBtn onClick={() => social('Google')} disabled={busy} label="Google">
              <svg viewBox="0 0 24 24" className="h-5 w-5">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 010-4.18V7.07H2.18a11 11 0 000 9.86l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
              </svg>
            </SocialBtn>
            <SocialBtn onClick={() => social('Microsoft')} disabled={busy} label="Microsoft">
              <svg viewBox="0 0 21 21" className="h-5 w-5">
                <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
              </svg>
            </SocialBtn>
            <SocialBtn onClick={() => social('Apple')} disabled={busy} label="Apple">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-black">
                <path d="M16.37 1.43c0 1.14-.46 2.22-1.2 3.01-.8.85-2.1 1.5-3.15 1.42-.13-1.1.42-2.25 1.15-3 .82-.85 2.2-1.46 3.2-1.43zM20.5 17.3c-.55 1.27-.81 1.84-1.52 2.96-1 1.56-2.4 3.5-4.13 3.51-1.54.02-1.94-1-4.03-.99-2.09.01-2.52 1.01-4.06.99-1.73-.02-3.05-1.77-4.05-3.33C-.2 15.9-.5 10.6 1.9 7.95c1.7-1.9 4.4-2.97 6.9-2.97 1.62 0 2.64 1.01 3.98 1.01 1.3 0 2.1-1.01 3.98-1.01 2.2 0 4.5 1.2 6.2 3.27-5.45 2.99-4.57 10.78-2.46 9.05z" />
              </svg>
            </SocialBtn>
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            Your financial data is encrypted and never shared.
          </p>
        </div>
      </main>
    </div>
  )
}

function SocialBtn({ children, label, ...rest }) {
  return (
    <button type="button" {...rest}
            className="flex h-12 items-center justify-center gap-2.5 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">
      {children}
      {label}
    </button>
  )
}
