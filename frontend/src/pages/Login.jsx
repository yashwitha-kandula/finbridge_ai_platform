import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useTheme } from '../theme/ThemeProvider'
import { COUNTRIES } from '../lib/countries'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/* ──────────────── inline SVG icons ──────────────── */
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
  eye: <I><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></I>,
  eyeOff: <I><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" /><path d="M14.12 14.12a3 3 0 01-4.24-4.24" /></I>,
  check: <I><polyline points="20 6 9 17 4 12" /></I>,
  arrowLeft: <I><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></I>,
  key: <I><circle cx="7.5" cy="15.5" r="5.5" /><path d="M11.5 11.5L22 1l-3 3 2 2-2 2 2 2-5.5 5.5" /></I>,
  sun: <I><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></I>,
  moon: <I><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></I>,
  shieldCheck: <I><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></I>,
}

const inputCls =
  'block w-full h-12 rounded-lg border border-slate-300 bg-white pl-11 pr-4 text-[15px] text-slate-900 ' +
  'placeholder:text-slate-400 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 ' +
  'dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-indigo-500'

const selectCls = inputCls + ' appearance-none pr-10 cursor-pointer'

function Field({ label, icon, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
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
           className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400">
        <path d="M5.5 7.5l4.5 5 4.5-5z" />
      </svg>
    </Field>
  )
}

const LANGUAGES = ['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Marathi', 'Bengali']
const CURRENCIES = ['INR (₹)', 'USD ($)', 'EUR (€)', 'GBP (£)']
const PROFESSIONS = ['Software Engineer', 'Freelancer / Consultant', 'Doctor / Healthcare',
  'Business Owner / Founder', 'Teacher / Professor', 'Financial Analyst', 'Student', 'Other']
const INCOME_TYPES = ['Salary / Fixed Income', 'Variable / Gig Income',
  'Mixed (Fixed + Variable)', 'Business Revenue']

// Strict email validator
const isValidEmail = (email) => {
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(email)
}

const initial = {
  fullName: '', mobile: '', email: '', language: 'English', password: '', confirm: '',
  country: 'India', currency: 'INR (₹)', dob: '', profession: 'Software Engineer',
  incomeType: 'Salary / Fixed Income', agreed: false,
}

function getPasswordStrength(pw) {
  if (!pw) return { level: 0, label: '', color: '' }
  let score = 0
  if (pw.length >= 6) score++
  if (pw.length >= 10) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 1) return { level: 1, label: 'Weak', color: 'bg-red-500' }
  if (score <= 2) return { level: 2, label: 'Fair', color: 'bg-orange-500' }
  if (score <= 3) return { level: 3, label: 'Good', color: 'bg-yellow-500' }
  if (score <= 4) return { level: 4, label: 'Strong', color: 'bg-green-500' }
  return { level: 5, label: 'Very Strong', color: 'bg-emerald-500' }
}

/* ════════════════ MAIN LOGIN COMPONENT ════════════════ */
export default function Login() {
  const { token, user, login, register, socialLogin, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login'
  const [mode, setMode] = useState(initialMode) // 'login' | 'register' | 'forgot_request' | 'forgot_otp' | 'forgot_reset'
  const [f, setF] = useState(initial)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Forgot Password & OTP State
  const [otpIdentifier, setOtpIdentifier] = useState('')
  const [otpChannel, setOtpChannel] = useState('email') // 'email' | 'sms'
  const [otpCode, setOtpCode] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNew, setConfirmNew] = useState('')
  const [otpTimer, setOtpTimer] = useState(0)

  // Terms & Privacy modal
  const [showTermsModal, setShowTermsModal] = useState(false)

  // Client ID configuration modal
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [configProvider, setConfigProvider] = useState('google')
  const [customGoogleId, setCustomGoogleId] = useState(
    () => localStorage.getItem('finbridge_google_client_id') || import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
  )
  const [customMsId, setCustomMsId] = useState(
    () => localStorage.getItem('finbridge_ms_client_id') || import.meta.env.VITE_MICROSOFT_CLIENT_ID || ''
  )

  const activeGoogleId = customGoogleId && customGoogleId !== 'YOUR_GOOGLE_CLIENT_ID_HERE' ? customGoogleId : ''
  const isGoogleConfigured = !!activeGoogleId

  const activeMsId = customMsId && customMsId !== 'YOUR_MICROSOFT_CLIENT_ID_HERE' ? customMsId : ''
  const isMsConfigured = !!activeMsId

  const [googleReady, setGoogleReady] = useState(false)

  // Load Google Identity Services script
  useEffect(() => {
    if (!isGoogleConfigured) return
    const existing = document.getElementById('google-gsi-script')
    if (!existing) {
      const s = document.createElement('script')
      s.id = 'google-gsi-script'
      s.src = 'https://accounts.google.com/gsi/client'
      s.async = true
      s.defer = true
      s.onload = () => setGoogleReady(true)
      document.head.appendChild(s)
    } else if (window.google?.accounts) {
      setGoogleReady(true)
    }
  }, [isGoogleConfigured])

  // OTP Countdown Timer
  useEffect(() => {
    if (otpTimer <= 0) return
    const t = setInterval(() => setOtpTimer((v) => v - 1), 1000)
    return () => clearInterval(t)
  }, [otpTimer])

  // Handle social login callback
  const handleSocialSuccess = useCallback(async (provider, oauthToken, email, name) => {
    setError('')
    setBusy(true)
    try {
      await socialLogin(provider, oauthToken, email, name)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || `${provider} login failed`)
    } finally {
      setBusy(false)
    }
  }, [socialLogin, navigate])

  // Trigger Google Sign-In popup
  const triggerGoogle = useCallback(() => {
    if (!isGoogleConfigured) {
      setConfigProvider('google')
      setShowConfigModal(true)
      return
    }
    if (!window.google?.accounts?.id) {
      setError('Google Identity Services script is loading. Please try again in a few seconds.')
      return
    }
    try {
      window.google.accounts.id.initialize({
        client_id: activeGoogleId,
        callback: (response) => {
          try {
            const payload = JSON.parse(atob(response.credential.split('.')[1]))
            handleSocialSuccess('google', response.credential, payload.email, payload.name || payload.email)
          } catch {
            setError('Failed to parse Google credentials token.')
          }
        },
      })
      window.google.accounts.id.prompt()
    } catch (err) {
      setError('Google Sign-In failed: ' + (err.message || 'unknown error'))
    }
  }, [isGoogleConfigured, activeGoogleId, handleSocialSuccess])

  // Trigger Microsoft Sign-In popup
  const triggerMicrosoft = useCallback(() => {
    if (!isMsConfigured) {
      setConfigProvider('microsoft')
      setShowConfigModal(true)
      return
    }
    const redirectUri = window.location.origin + '/login'
    const scope = 'openid profile email User.Read'
    const state = Math.random().toString(36).slice(2)
    const authUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?' +
      'client_id=' + activeMsId +
      '&response_type=token' +
      '&redirect_uri=' + encodeURIComponent(redirectUri) +
      '&scope=' + encodeURIComponent(scope) +
      '&state=' + state +
      '&response_mode=fragment'

    const w = 500, h = 650
    const left = window.screenX + (window.innerWidth - w) / 2
    const top = window.screenY + (window.innerHeight - h) / 2
    const popup = window.open(authUrl, 'ms-auth', 'width=' + w + ',height=' + h + ',left=' + left + ',top=' + top)

    const interval = setInterval(() => {
      try {
        if (!popup || popup.closed) { clearInterval(interval); return }
        const hash = popup.location.hash
        if (hash && hash.includes('access_token')) {
          clearInterval(interval)
          popup.close()
          const params = new URLSearchParams(hash.slice(1))
          const accessToken = params.get('access_token')
          fetch('https://graph.microsoft.com/v1.0/me', {
            headers: { Authorization: 'Bearer ' + accessToken }
          })
            .then(r => r.json())
            .then(profile => {
              handleSocialSuccess('microsoft', accessToken, profile.mail || profile.userPrincipalName || '', profile.displayName || '')
            })
            .catch(() => setError('Failed to fetch Microsoft profile.'))
        }
      } catch {
        // Cross-origin polling
      }
    }, 500)
  }, [isMsConfigured, activeMsId, handleSocialSuccess])

  // Trigger Apple Sign-In
  const triggerApple = useCallback(() => {
    setConfigProvider('apple')
    setShowConfigModal(true)
  }, [])

  // Input change handler with constraints
  const set = (e) => {
    const { name, type, checked } = e.target
    let value = e.target.value

    // 1. Phone number strictly accepting max 10 digits
    if (name === 'mobile') {
      value = value.replace(/\D/g, '')
      if (value.length > 10) value = value.slice(0, 10)
    }

    // 2. Full name formatting
    else if (name === 'fullName') {
      value = value.replace(/[^A-Za-z\s'-]/g, '')
      if (value.length > 50) value = value.slice(0, 50)
    }

    // 3. Email formatting
    else if (name === 'email' && value.length > 100) {
      value = value.slice(0, 100)
    }

    // 4. DOB year constraint (max 4 digits)
    else if (name === 'dob') {
      const parts = value.split('-')
      if (parts[0] && parts[0].length > 4) {
        parts[0] = parts[0].slice(0, 4)
        value = parts.join('-')
      }
    }

    // 5. Password max length
    else if ((name === 'password' || name === 'confirm') && value.length > 128) {
      value = value.slice(0, 128)
    }

    setF((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }))
    setError('')
    setSuccess('')
  }

  const switchMode = (m) => {
    setMode(m); setError(''); setSuccess(''); setF(initial)
    setOtpIdentifier(''); setOtpCode(''); setResetToken(''); setNewPassword(''); setConfirmNew('')
  }

  /* ── Send OTP for Forgot Password ── */
  const handleSendOtp = async (e) => {
    e?.preventDefault()
    const target = otpIdentifier.trim()
    if (!target) return setError('Please enter your registered email address or phone number.')

    if (otpChannel === 'email' && !isValidEmail(target)) {
      return setError('Please enter a properly formatted email address (e.g. name@domain.com).')
    }
    if (otpChannel === 'sms' && target.replace(/\D/g, '').length !== 10) {
      return setError('Please enter a valid 10-digit mobile number.')
    }

    setBusy(true)
    setError('')
    try {
      const res = await fetch(API + '/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: target, channel: otpChannel })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Could not send verification code.')

      setMode('forgot_otp')
      setOtpTimer(60)
      setSuccess(`Verification OTP sent! (Dev code: ${data.otp})`)
    } catch (err) {
      setError(err.message || 'Cannot reach server. Verify backend is running on port 8000.')
    } finally {
      setBusy(false)
    }
  }

  /* ── Verify OTP Code ── */
  const handleVerifyOtp = async (e) => {
    e?.preventDefault()
    if (!otpCode || otpCode.trim().length !== 6) {
      return setError('Please enter the full 6-digit verification code.')
    }

    setBusy(true)
    setError('')
    try {
      const res = await fetch(API + '/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: otpIdentifier.trim(), otp: otpCode.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Invalid OTP code.')

      setResetToken(data.reset_token)
      setMode('forgot_reset')
      setSuccess('OTP verified successfully! Please enter your new password.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  /* ── Reset Password ── */
  const handleResetPassword = async (e) => {
    e?.preventDefault()
    if (newPassword.length < 6) return setError('Password must be at least 6 characters.')
    if (newPassword !== confirmNew) return setError('Passwords do not match.')

    setBusy(true)
    setError('')
    try {
      const res = await fetch(API + '/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, new_password: newPassword })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Password reset failed.')

      setSuccess('Password updated successfully! Redirecting to Sign In...')
      setTimeout(() => switchMode('login'), 1800)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  /* ── Form submit (Login / Register) ── */
  const submit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')

    // Login flow
    if (mode === 'login') {
      if (!f.email || !f.password) return setError('Please enter your email and password.')
      if (!isValidEmail(f.email)) return setError('Please enter a valid email structure (e.g. name@domain.com).')

      setBusy(true)
      try {
        await login(f.email, f.password)
        navigate('/', { replace: true })
      } catch (err) {
        setError(err.message === 'Failed to fetch'
          ? 'Cannot reach backend server. Make sure Python uvicorn is running on port 8000.'
          : err.message)
      } finally { setBusy(false) }
      return
    }

    // Register flow
    if (!f.fullName.trim()) return setError('Please enter your full name.')
    if (!isValidEmail(f.email)) return setError('Please enter a valid email structure (e.g. name@domain.com).')
    if (f.mobile && f.mobile.length !== 10) return setError('Phone number must be exactly 10 digits.')
    if (f.password.length < 6) return setError('Password must be at least 6 characters.')
    if (f.password !== f.confirm) return setError('Passwords do not match.')

    // Direct redirect to Terms of Service if not checked
    if (!f.agreed) {
      setShowTermsModal(true)
      return
    }

    setBusy(true)
    try {
      await register({
        full_name: f.fullName.trim(),
        email: f.email,
        password: f.password,
        mobile: f.mobile,
        preferred_language: f.language,
        country: f.country,
        currency: f.currency,
        dob: f.dob,
        profession: f.profession,
        income_type: f.incomeType,
      })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message === 'Failed to fetch'
        ? 'Cannot reach backend server. Make sure Python uvicorn is running on port 8000.'
        : err.message)
    } finally { setBusy(false) }
  }

  const isLogin = mode === 'login'
  const isForgotRequest = mode === 'forgot_request'
  const isForgotOtp = mode === 'forgot_otp'
  const isForgotReset = mode === 'forgot_reset'
  const isForgotMode = isForgotRequest || isForgotOtp || isForgotReset
  const strength = getPasswordStrength(isForgotReset ? newPassword : f.password)

  return (
    <div className="min-h-screen bg-slate-50 transition-colors dark:bg-slate-950">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-[#0f1b3d] text-white dark:border-slate-800">
        <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                <rect x="3" y="12" width="4" height="8" rx="1" />
                <rect x="10" y="8" width="4" height="12" rx="1" />
                <rect x="17" y="4" width="4" height="16" rx="1" />
              </svg>
            </div>
            <div className="leading-tight">
              <div className="text-lg font-bold tracking-tight">FinBridge AI</div>
              <div className="text-xs text-indigo-200">Smart Financial Intelligence</div>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
              title="Toggle theme"
            >
              {theme === 'dark' ? icons.sun : icons.moon}
            </button>

            {!isForgotMode && (
              <div className="text-sm text-slate-300">
                {isLogin ? "Don't have an account?" : 'Already registered?'}{' '}
                <button
                  type="button"
                  onClick={() => switchMode(isLogin ? 'register' : 'login')}
                  className="font-bold text-white underline underline-offset-4 hover:text-indigo-200"
                >
                  {isLogin ? 'Create Account' : 'Sign In'}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-[760px] px-6 py-10">
        {/* Already Logged In Banner */}
        {token && (
          <div className="mb-8 rounded-xl border border-indigo-200 bg-indigo-50/90 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/40">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  Currently Logged In
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {user?.email || 'Active Session'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  Dashboard →
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-slate-700 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Back Button for Forgot Modes */}
        {isForgotMode && (
          <button
            onClick={() => switchMode('login')}
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            <span className="h-4 w-4">{icons.arrowLeft}</span>
            Back to Sign In
          </button>
        )}

        {/* Card Header & Tab Switcher */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {isForgotRequest ? 'Recover Your Account'
                  : isForgotOtp ? 'Enter Verification Code'
                  : isForgotReset ? 'Set New Password'
                  : isLogin ? 'Sign In to FinBridge AI'
                  : 'Create Your Account'}
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {isForgotRequest ? 'Choose whether to receive your confirmation code via Email or Phone.'
                  : isForgotOtp ? `Enter the 6-digit OTP code sent to ${otpIdentifier}.`
                  : isForgotReset ? 'Create a secure new password for your account.'
                  : isLogin ? 'Access your financial intelligence dashboard.'
                  : 'Get started with personal wealth intelligence.'}
              </p>
            </div>

            {/* In-Card Tabs for Login / Register */}
            {!isForgotMode && (
              <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className={`rounded-md px-4 py-1.5 text-xs font-bold transition ${
                    isLogin
                      ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-700 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className={`rounded-md px-4 py-1.5 text-xs font-bold transition ${
                    !isLogin
                      ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-700 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  Register
                </button>
              </div>
            )}
          </div>

          {/* Error Banner */}
          {error && (
            <div role="alert" className="mt-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              <span className="mt-0.5 shrink-0 text-red-500">{icons.alert}</span>
              <span className="flex-1">{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {success && (
            <div role="status" className="mt-6 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
              <span className="mt-0.5 shrink-0 text-emerald-500">{icons.check}</span>
              <span className="flex-1">{success}</span>
            </div>
          )}

          {/* Social Auth Providers (Sign In & Register) */}
          {!isForgotMode && (
            <div className="mt-6">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {/* Google */}
                <SocialBtn
                  onClick={triggerGoogle}
                  disabled={busy}
                  label="Google"
                  configured={isGoogleConfigured}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 010-4.18V7.07H2.18a11 11 0 000 9.86l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
                  </svg>
                </SocialBtn>

                {/* Microsoft */}
                <SocialBtn
                  onClick={triggerMicrosoft}
                  disabled={busy}
                  label="Microsoft"
                  configured={isMsConfigured}
                >
                  <svg viewBox="0 0 21 21" className="h-5 w-5 shrink-0">
                    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                  </svg>
                </SocialBtn>

                {/* Apple */}
                <SocialBtn
                  onClick={triggerApple}
                  disabled={busy}
                  label="Apple"
                  configured={false}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 shrink-0 text-black dark:text-white">
                    <path d="M16.37 1.43c0 1.14-.46 2.22-1.2 3.01-.8.85-2.1 1.5-3.15 1.42-.13-1.1.42-2.25 1.15-3 .82-.85 2.2-1.46 3.2-1.43zM20.5 17.3c-.55 1.27-.81 1.84-1.52 2.96-1 1.56-2.4 3.5-4.13 3.51-1.54.02-1.94-1-4.03-.99-2.09.01-2.52 1.01-4.06.99-1.73-.02-3.05-1.77-4.05-3.33C-.2 15.9-.5 10.6 1.9 7.95c1.7-1.9 4.4-2.97 6.9-2.97 1.62 0 2.64 1.01 3.98 1.01 1.3 0 2.1-1.01 3.98-1.01 2.2 0 4.5 1.2 6.2 3.27-5.45 2.99-4.57 10.78-2.46 9.05z" />
                  </svg>
                </SocialBtn>
              </div>

              {/* Or Divider */}
              <div className="my-6 flex items-center gap-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                or continue with credentials
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          )}

          {/* ──── FORGOT PASSWORD STEP 1: REQUEST OTP ──── */}
          {isForgotRequest && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Choose Verification Channel</label>
                <div className="mt-1.5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setOtpChannel('email'); setError('') }}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition ${
                      otpChannel === 'email'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-300'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    <span className="h-4 w-4">{icons.mail}</span>
                    Email OTP
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOtpChannel('sms'); setError('') }}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition ${
                      otpChannel === 'sms'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-300'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    <span className="h-4 w-4">{icons.phone}</span>
                    Phone SMS OTP
                  </button>
                </div>
              </div>

              <Field
                label={otpChannel === 'email' ? 'Registered Email Address' : '10-Digit Mobile Number'}
                icon={otpChannel === 'email' ? 'mail' : 'phone'}
              >
                <input
                  type={otpChannel === 'email' ? 'email' : 'tel'}
                  value={otpIdentifier}
                  onChange={(e) => {
                    const v = otpChannel === 'sms' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value
                    setOtpIdentifier(v)
                    setError('')
                  }}
                  placeholder={otpChannel === 'email' ? 'name@domain.com' : '9876543210'}
                  className={inputCls}
                />
              </Field>

              <button
                type="submit"
                disabled={busy}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {busy ? 'Sending OTP Code...' : `Send OTP to ${otpChannel === 'email' ? 'Email' : 'Phone'}`}
              </button>
            </form>
          )}

          {/* ──── FORGOT PASSWORD STEP 2: VERIFY OTP ──── */}
          {isForgotOtp && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <Field label="6-Digit Verification Code" icon="shieldCheck">
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setOtpCode(clean)
                    setError('')
                  }}
                  placeholder="e.g. 123456"
                  className={inputCls + ' tracking-widest text-center text-lg font-mono font-bold'}
                  autoFocus
                />
              </Field>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Code sent to: <strong className="text-slate-800 dark:text-slate-200">{otpIdentifier}</strong></span>
                {otpTimer > 0 ? (
                  <span>Resend in {otpTimer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="font-semibold text-indigo-600 underline dark:text-indigo-400"
                  >
                    Resend Code
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={busy}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {busy ? 'Verifying OTP...' : 'Verify OTP & Continue'}
              </button>
            </form>
          )}

          {/* ──── FORGOT PASSWORD STEP 3: RESET PASSWORD ──── */}
          {isForgotReset && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <Field label="New Password" icon="lock">
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setError('') }}
                    placeholder="Minimum 6 characters"
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <span className="h-5 w-5">{showPass ? icons.eyeOff : icons.eye}</span>
                  </button>
                </div>
              </Field>

              <Field label="Confirm New Password" icon="lock">
                <input
                  type="password"
                  value={confirmNew}
                  onChange={(e) => { setConfirmNew(e.target.value); setError('') }}
                  placeholder="Repeat new password"
                  className={inputCls}
                />
              </Field>

              {newPassword && (
                <div className="space-y-1.5">
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition ${
                          i <= strength.level ? strength.color : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Strength: <span className="font-semibold text-slate-800 dark:text-slate-200">{strength.label}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {busy ? 'Saving...' : 'Set Password & Sign In'}
              </button>
            </form>
          )}

          {/* ──── LOGIN / REGISTER FORMS ──── */}
          {!isForgotMode && (
            <form onSubmit={submit} noValidate className="space-y-5">
              {isLogin ? (
                <div className="space-y-4">
                  <Field label="Email Address" icon="mail">
                    <input
                      type="email"
                      name="email"
                      value={f.email}
                      onChange={set}
                      placeholder="name@domain.com"
                      autoComplete="email"
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Password" icon="lock">
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        name="password"
                        value={f.password}
                        onChange={set}
                        placeholder="Your account password"
                        autoComplete="current-password"
                        className={inputCls}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <span className="h-5 w-5">{showPass ? icons.eyeOff : icons.eye}</span>
                      </button>
                    </div>
                  </Field>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                      <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 accent-indigo-600" />
                      Remember this device
                    </label>
                    <button
                      type="button"
                      onClick={() => switchMode('forgot_request')}
                      className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    className="flex h-12 w-full items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {busy ? 'Signing In...' : 'Sign In'}
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Full Name" icon="user">
                      <input
                        name="fullName"
                        value={f.fullName}
                        onChange={set}
                        maxLength={50}
                        placeholder="e.g. Yashu Kandula"
                        autoComplete="name"
                        className={inputCls}
                      />
                    </Field>

                    <Field label="Mobile Number (10 digits)" icon="phone">
                      <input
                        type="tel"
                        name="mobile"
                        value={f.mobile}
                        onChange={set}
                        maxLength={10}
                        placeholder="9876543210"
                        autoComplete="tel"
                        className={inputCls}
                      />
                    </Field>

                    <Field label="Email Address" icon="mail">
                      <input
                        type="email"
                        name="email"
                        value={f.email}
                        onChange={set}
                        maxLength={100}
                        placeholder="name@domain.com"
                        autoComplete="email"
                        className={inputCls}
                      />
                    </Field>

                    <Select
                      label="Preferred Language"
                      icon="globe"
                      name="language"
                      value={f.language}
                      onChange={set}
                      options={LANGUAGES}
                    />

                    <Field label="Password" icon="lock">
                      <div className="relative">
                        <input
                          type={showPass ? 'text' : 'password'}
                          name="password"
                          value={f.password}
                          onChange={set}
                          maxLength={128}
                          placeholder="Create strong password"
                          autoComplete="new-password"
                          className={inputCls}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <span className="h-5 w-5">{showPass ? icons.eyeOff : icons.eye}</span>
                        </button>
                      </div>
                    </Field>

                    <Field label="Confirm Password" icon="lock">
                      <div className="relative">
                        <input
                          type={showConfirm ? 'text' : 'password'}
                          name="confirm"
                          value={f.confirm}
                          onChange={set}
                          maxLength={128}
                          placeholder="Re-enter password"
                          autoComplete="new-password"
                          className={inputCls}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <span className="h-5 w-5">{showConfirm ? icons.eyeOff : icons.eye}</span>
                        </button>
                      </div>
                    </Field>

                    <Select
                      label="Country (200+ Available)"
                      icon="flag"
                      name="country"
                      value={f.country}
                      onChange={set}
                      options={COUNTRIES}
                    />

                    <Select
                      label="Currency"
                      icon="rupee"
                      name="currency"
                      value={f.currency}
                      onChange={set}
                      options={CURRENCIES}
                    />

                    <Field label="Date of Birth (YYYY-MM-DD)">
                      <input
                        type="date"
                        name="dob"
                        min="1900-01-01"
                        max="2026-11-11"
                        value={f.dob}
                        onChange={set}
                        className={inputCls.replace('pl-11', 'pl-4')}
                      />
                    </Field>

                    <Select
                      label="Profession"
                      icon="briefcase"
                      name="profession"
                      value={f.profession}
                      onChange={set}
                      options={PROFESSIONS}
                    />

                    <div className="sm:col-span-2">
                      <Select
                        label="Income Type"
                        icon="wallet"
                        name="incomeType"
                        value={f.incomeType}
                        onChange={set}
                        options={INCOME_TYPES}
                      />
                    </div>
                  </div>

                  {f.password && (
                    <div className="space-y-1.5">
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition ${
                              i <= strength.level ? strength.color : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Password Strength: <span className="font-semibold text-slate-800 dark:text-slate-200">{strength.label}</span>
                      </div>
                    </div>
                  )}

                  <label className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                    <input
                      type="checkbox"
                      name="agreed"
                      checked={f.agreed}
                      onChange={set}
                      className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
                    />
                    <span>
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="font-semibold text-indigo-600 underline dark:text-indigo-400"
                      >
                        Terms of Service
                      </button>{' '}
                      and{' '}
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="font-semibold text-indigo-600 underline dark:text-indigo-400"
                      >
                        Privacy Policy
                      </button>
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={busy}
                    className="flex h-12 w-full items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {busy ? 'Creating Your Account...' : 'Complete Registration'}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Security Notice */}
        <p className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500">
          🔒 Your financial credentials and biometric tokens are end-to-end encrypted.
        </p>
      </main>

      {/* ── Terms of Service & Privacy Policy Modal ── */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Terms of Service & Privacy Policy</h3>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 max-h-[380px] space-y-3 overflow-y-auto pr-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <h4 className="font-bold text-slate-900 dark:text-white">1. Service Overview</h4>
              <p>
                FinBridge AI provides intelligent personal financial tracking, multi-currency budget analytics, and debt management tools for individual and family use.
              </p>
              <h4 className="font-bold text-slate-900 dark:text-white">2. Data Security & Privacy</h4>
              <p>
                All account transactions, bank records, and family budgets are encrypted. We never sell, lease, or monetize your individual financial records.
              </p>
              <h4 className="font-bold text-slate-900 dark:text-white">3. User Responsibilities</h4>
              <p>
                You are responsible for maintaining the confidentiality of your credentials. You can delete or export your financial data at any time from your settings panel.
              </p>
            </div>
            <div className="mt-5 flex justify-end gap-2 border-t pt-3 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setF((p) => ({ ...p, agreed: true }))
                  setShowTermsModal(false)
                  setError('')
                }}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                I Agree & Accept Terms
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── OAuth Configuration Modal ── */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-3 border-b dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{icons.key}</span>
                {configProvider === 'google' ? 'Google OAuth Setup'
                  : configProvider === 'microsoft' ? 'Microsoft OAuth Setup'
                  : 'Apple Sign In Requirements'}
              </h3>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-slate-600 dark:text-slate-300">
              {configProvider === 'google' && (
                <>
                  <p>
                    FinBridge AI connects directly to Google OAuth 2.0. To use your verified Google account:
                  </p>
                  <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed">
                    <li>Open <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-semibold dark:text-indigo-400">Google Cloud Credentials</a></li>
                    <li>Create an <strong>OAuth Client ID</strong> (Web Application)</li>
                    <li>Add <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800 font-mono">http://localhost:5173</code> to Authorized JavaScript Origins</li>
                    <li>Paste your Client ID below:</li>
                  </ol>
                  <input
                    type="text"
                    value={customGoogleId}
                    onChange={(e) => setCustomGoogleId(e.target.value.trim())}
                    placeholder="123456789-abcdefg.apps.googleusercontent.com"
                    className="block w-full rounded-lg border border-slate-300 p-2.5 text-xs font-mono text-slate-900 outline-none focus:border-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.setItem('finbridge_google_client_id', customGoogleId)
                        setShowConfigModal(false)
                        setSuccess('Google Client ID saved! Click the Google button to sign in.')
                      }}
                      className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700"
                    >
                      Save & Enable Google Login
                    </button>
                  </div>
                </>
              )}

              {configProvider === 'microsoft' && (
                <>
                  <p>
                    To sign in with Microsoft or Outlook, enter your Azure Active Directory Client ID:
                  </p>
                  <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed">
                    <li>Register an app in <a href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-semibold dark:text-indigo-400">Azure Portal</a></li>
                    <li>Add Redirect URI: <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800 font-mono">http://localhost:5173/login</code></li>
                    <li>Paste your Application (Client) ID below:</li>
                  </ol>
                  <input
                    type="text"
                    value={customMsId}
                    onChange={(e) => setCustomMsId(e.target.value.trim())}
                    placeholder="e.g. 11111111-2222-3333-4444-555555555555"
                    className="block w-full rounded-lg border border-slate-300 p-2.5 text-xs font-mono text-slate-900 outline-none focus:border-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.setItem('finbridge_ms_client_id', customMsId)
                        setShowConfigModal(false)
                        setSuccess('Microsoft Client ID saved!')
                      }}
                      className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700"
                    >
                      Save & Enable Microsoft Login
                    </button>
                  </div>
                </>
              )}

              {configProvider === 'apple' && (
                <>
                  <p>
                    <strong>Apple Sign In (iOS / macOS):</strong>
                  </p>
                  <p className="leading-relaxed">
                    Apple requires an active Apple Developer Program membership ($99/year), an Apple Service ID, and domain verification with SSL (HTTPS).
                  </p>
                  <p className="leading-relaxed">
                    For local testing on localhost, you can register and authenticate with standard email/password or use Google/Microsoft OAuth.
                  </p>
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowConfigModal(false)}
                      className="rounded-lg bg-slate-800 px-4 py-2 font-semibold text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
                    >
                      Understood
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SocialBtn({ children, label, configured, ...rest }) {
  return (
    <button
      type="button"
      {...rest}
      className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-xs font-bold transition disabled:opacity-60 ${
        configured
          ? 'border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-750'
          : 'border-slate-200 bg-slate-50/80 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-400 dark:hover:bg-slate-800'
      }`}
    >
      {children}
      <span>{label}</span>
      {!configured && (
        <span className="rounded bg-slate-200 px-1 py-0.5 text-[9px] font-normal text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          Setup
        </span>
      )}
    </button>
  )
}
