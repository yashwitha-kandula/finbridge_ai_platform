import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

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
}

const inputCls =
  'block w-full h-12 rounded-lg border border-slate-300 bg-white pl-11 pr-4 text-[15px] text-slate-900 ' +
  'placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
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

/* ──────────── Google OAuth via GSI (no npm package needed) ──────────── */
function useGoogleOneTap(onSuccess) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID_HERE') return
    // Load the Google Identity Services script
    if (!document.getElementById('google-gsi-script')) {
      const s = document.createElement('script')
      s.id = 'google-gsi-script'
      s.src = 'https://accounts.google.com/gsi/client'
      s.async = true
      s.defer = true
      s.onload = () => setReady(true)
      document.head.appendChild(s)
    } else if (window.google?.accounts) {
      setReady(true)
    }
  }, [clientId])

  const trigger = useCallback(() => {
    if (!ready || !window.google?.accounts) return
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        // response.credential is the JWT id_token
        const payload = JSON.parse(atob(response.credential.split('.')[1]))
        onSuccess({
          token: response.credential,
          email: payload.email,
          name: payload.name || payload.email,
        })
      },
    })
    window.google.accounts.id.prompt((notification) => {
      // If One Tap is dismissed/unavailable, fall back to the popup flow
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        window.google.accounts.oauth2.initCodeClient({
          client_id: clientId,
          scope: 'email profile',
          ux_mode: 'popup',
          callback: () => {}, // handled in id.initialize callback
        })
        // Use the Sign-in button approach as fallback
        const btn = document.createElement('div')
        btn.style.display = 'none'
        document.body.appendChild(btn)
        window.google.accounts.id.renderButton(btn, { type: 'standard' })
        btn.querySelector('div[role=button]')?.click?.()
        setTimeout(() => btn.remove(), 100)
      }
    })
  }, [ready, clientId, onSuccess])

  return { ready, trigger, configured: clientId && clientId !== 'YOUR_GOOGLE_CLIENT_ID_HERE' }
}

/* ──────────── Microsoft OAuth via popup (no npm package needed) ──────────── */
function useMicrosoftAuth(onSuccess) {
  const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID
  const configured = clientId && clientId !== 'YOUR_MICROSOFT_CLIENT_ID_HERE'

  const trigger = useCallback(async () => {
    if (!configured) return
    const redirectUri = window.location.origin + '/login'
    const scope = 'openid profile email User.Read'
    const state = Math.random().toString(36).slice(2)
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
      `client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scope)}&state=${state}&response_mode=fragment`

    // Open popup
    const w = 500, h = 650
    const left = window.screenX + (window.innerWidth - w) / 2
    const top = window.screenY + (window.innerHeight - h) / 2
    const popup = window.open(authUrl, 'ms-auth', `width=${w},height=${h},left=${left},top=${top}`)

    // Poll for the redirect
    const interval = setInterval(() => {
      try {
        if (!popup || popup.closed) { clearInterval(interval); return }
        const hash = popup.location.hash
        if (hash && hash.includes('access_token')) {
          clearInterval(interval)
          popup.close()
          const params = new URLSearchParams(hash.slice(1))
          const accessToken = params.get('access_token')
          // Fetch user info from MS Graph
          fetch('https://graph.microsoft.com/v1.0/me', {
            headers: { Authorization: `Bearer ${accessToken}` }
          })
            .then(r => r.json())
            .then(profile => {
              onSuccess({
                token: accessToken,
                email: profile.mail || profile.userPrincipalName || '',
                name: profile.displayName || '',
              })
            })
            .catch(() => {})
        }
      } catch {
        // Cross-origin — keep polling
      }
    }, 500)
  }, [configured, clientId, onSuccess])

  return { configured, trigger }
}

/* ──────────── Apple Sign In (requires Apple Developer account) ──────────── */
function useAppleAuth(onSuccess) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!document.getElementById('apple-auth-script')) {
      const s = document.createElement('script')
      s.id = 'apple-auth-script'
      s.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js'
      s.async = true
      s.onload = () => setReady(true)
      document.head.appendChild(s)
    } else if (window.AppleID) {
      setReady(true)
    }
  }, [])

  const trigger = useCallback(async () => {
    if (!ready || !window.AppleID) {
      alert('Apple Sign In requires an Apple Developer account with a configured Service ID. Set up Sign In with Apple at developer.apple.com, then add your Service ID here.')
      return
    }
    try {
      window.AppleID.auth.init({
        clientId: 'com.finbridge.ai', // Replace with your Apple Service ID
        scope: 'name email',
        redirectURI: window.location.origin + '/login',
        usePopup: true,
      })
      const res = await window.AppleID.auth.signIn()
      const idToken = res.authorization?.id_token
      if (idToken) {
        const payload = JSON.parse(atob(idToken.split('.')[1]))
        const name = res.user ? `${res.user.name?.firstName || ''} ${res.user.name?.lastName || ''}`.trim() : ''
        onSuccess({
          token: idToken,
          email: payload.email || '',
          name: name || payload.email || '',
        })
      }
    } catch {
      // User cancelled or Apple auth not configured
    }
  }, [ready, onSuccess])

  return { ready, trigger }
}

/* ════════════════ MAIN LOGIN COMPONENT ════════════════ */
export default function Login() {
  const { token, login, register, socialLogin } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' | 'register' | 'forgot' | 'reset'
  const [f, setF] = useState(initial)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNew, setConfirmNew] = useState('')

  if (token) return <Navigate to="/" replace />

  const set = (e) => {
    const { name, type, checked } = e.target
    let value = e.target.value
    if (name === 'mobile') {
      value = value.replace(/[^0-9+]/g, '')
      if (value.length > 15) value = value.slice(0, 15)
    } else if (name === 'fullName') {
      value = value.replace(/[^A-Za-z\s'-]/g, '')
      if (value.length > 50) value = value.slice(0, 50)
    } else if (name === 'email' && value.length > 100) {
      value = value.slice(0, 100)
    } else if ((name === 'password' || name === 'confirm') && value.length > 128) {
      value = value.slice(0, 128)
    }
    setF((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }))
    setError('')
    setSuccess('')
  }

  const switchMode = (m) => { setMode(m); setError(''); setSuccess(''); setF(initial); setResetToken(''); setNewPassword(''); setConfirmNew('') }

  /* ── Social auth handlers ── */
  const handleSocialSuccess = async ({ token: oauthToken, email, name }, provider) => {
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
  }

  const google = useGoogleOneTap((data) => handleSocialSuccess(data, 'google'))
  const microsoft = useMicrosoftAuth((data) => handleSocialSuccess(data, 'microsoft'))
  const apple = useAppleAuth((data) => handleSocialSuccess(data, 'apple'))

  /* ── Form submit ── */
  const submit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')

    // Forgot password flow
    if (mode === 'forgot') {
      if (!f.email || !/^\S+@\S+\.\S+$/.test(f.email)) return setError('Please enter a valid email address.')
      setBusy(true)
      try {
        const res = await fetch(`${API}/api/auth/forgot-password`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: f.email }),
        })
        const data = await res.json()
        if (data.reset_token) {
          setResetToken(data.reset_token)
          setMode('reset')
          setSuccess('Reset token generated! Enter your new password below.')
        } else {
          setSuccess(data.message || 'If the email exists, a reset link has been sent.')
        }
      } catch {
        setError('Cannot reach the server.')
      } finally { setBusy(false) }
      return
    }

    // Reset password flow
    if (mode === 'reset') {
      if (newPassword.length < 6) return setError('Password must be at least 6 characters.')
      if (newPassword !== confirmNew) return setError('Passwords do not match.')
      setBusy(true)
      try {
        const res = await fetch(`${API}/api/auth/reset-password`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: resetToken, new_password: newPassword }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.detail || 'Reset failed')
        setSuccess(data.message)
        setTimeout(() => switchMode('login'), 2000)
      } catch (err) {
        setError(err.message)
      } finally { setBusy(false) }
      return
    }

    // Login
    if (mode === 'login') {
      if (!f.email || !f.password) return setError('Enter your email and password.')
      setBusy(true)
      try {
        await login(f.email, f.password)
        navigate('/', { replace: true })
      } catch (err) {
        setError(err.message === 'Failed to fetch'
          ? 'Cannot reach the server. Make sure the backend is running on port 8000.'
          : err.message)
      } finally { setBusy(false) }
      return
    }

    // Register
    if (!f.fullName.trim()) return setError('Please enter your full name.')
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setError('Please enter a valid email address.')
    if (f.password.length < 6) return setError('Password must be at least 6 characters.')
    if (f.password !== f.confirm) return setError('Passwords do not match.')
    if (!f.agreed) return setError('Please agree to the Terms of Service and Privacy Policy.')
    setBusy(true)
    try {
      await register({
        full_name: f.fullName.trim(), email: f.email, password: f.password,
        mobile: f.mobile, preferred_language: f.language, country: f.country,
        currency: f.currency, dob: f.dob, profession: f.profession, income_type: f.incomeType,
      })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message === 'Failed to fetch'
        ? 'Cannot reach the server. Make sure the backend is running on port 8000.'
        : err.message)
    } finally { setBusy(false) }
  }

  const isLogin = mode === 'login'
  const isForgot = mode === 'forgot'
  const isReset = mode === 'reset'

  /* ── Password strength indicator ── */
  const getPasswordStrength = (pw) => {
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

  const strength = getPasswordStrength(mode === 'reset' ? newPassword : f.password)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Top bar */}
      <header className="bg-[#0f1b3d]">
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
          {!isForgot && !isReset && (
            <div className="text-sm text-slate-300">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button type="button" onClick={() => switchMode(isLogin ? 'register' : 'login')}
                      className="font-bold text-white underline-offset-4 hover:underline">
                {isLogin ? 'Register' : 'Sign In'}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Page body */}
      <main className="mx-auto max-w-[860px] px-6 py-12">
        {/* Back button for forgot/reset */}
        {(isForgot || isReset) && (
          <button onClick={() => switchMode('login')}
                  className="mb-4 flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition">
            <span className="h-5 w-5">{icons.arrowLeft}</span>
            Back to Sign In
          </button>
        )}

        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {isForgot ? 'Forgot Password' : isReset ? 'Reset Password' : isLogin ? 'Welcome Back' : 'Create Your Account'}
        </h1>
        <p className="mt-1.5 text-slate-500">
          {isForgot ? "Enter your email and we'll send you a reset link."
            : isReset ? 'Enter your new password below.'
            : isLogin ? 'Sign in to continue to your dashboard.'
            : 'Enter your details to get started.'}
        </p>

        {/* Error alert */}
        {error && (
          <div role="alert"
               className="mt-6 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="mt-px shrink-0">{icons.alert}</span>
            <span className="pt-0.5">{error}</span>
          </div>
        )}

        {/* Success alert */}
        {success && (
          <div role="status"
               className="mt-6 flex items-start gap-2.5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <span className="mt-px shrink-0">{icons.check}</span>
            <span className="pt-0.5">{success}</span>
          </div>
        )}

        <form onSubmit={submit} noValidate className="mt-8">
          {/* ──── FORGOT PASSWORD ──── */}
          {isForgot && (
            <div className="max-w-md space-y-5">
              <Field label="Email Address" icon="mail">
                <input type="email" name="email" value={f.email} onChange={set}
                       placeholder="your.email@example.com" autoComplete="email" className={inputCls} />
              </Field>
              <button type="submit" disabled={busy}
                      className="flex h-12 w-full items-center justify-center rounded-lg bg-[#0f1b3d] text-base font-semibold text-white transition hover:bg-[#1a2d5e] disabled:opacity-60">
                {busy ? 'Sending…' : 'Send Reset Link'}
              </button>
            </div>
          )}

          {/* ──── RESET PASSWORD ──── */}
          {isReset && (
            <div className="max-w-md space-y-5">
              <Field label="New Password" icon="lock">
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={newPassword}
                         onChange={e => { setNewPassword(e.target.value); setError('') }}
                         placeholder="Enter new password" className={inputCls} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <span className="h-5 w-5">{showPass ? icons.eyeOff : icons.eye}</span>
                  </button>
                </div>
              </Field>
              <Field label="Confirm New Password" icon="lock">
                <input type="password" value={confirmNew}
                       onChange={e => { setConfirmNew(e.target.value); setError('') }}
                       placeholder="Re-enter new password" className={inputCls} />
              </Field>
              {/* Password strength */}
              {newPassword && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition ${i <= strength.level ? strength.color : 'bg-slate-200'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">Password Strength: <span className="font-medium">{strength.label}</span></p>
                </div>
              )}
              <button type="submit" disabled={busy}
                      className="flex h-12 w-full items-center justify-center rounded-lg bg-[#0f1b3d] text-base font-semibold text-white transition hover:bg-[#1a2d5e] disabled:opacity-60">
                {busy ? 'Resetting…' : 'Reset Password'}
              </button>
            </div>
          )}

          {/* ──── LOGIN ──── */}
          {isLogin && (
            <div className="max-w-md space-y-5">
              <Field label="Email Address" icon="mail">
                <input type="email" name="email" value={f.email} onChange={set}
                       placeholder="your.email@example.com" autoComplete="email" className={inputCls} />
              </Field>
              <Field label="Password" icon="lock">
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} name="password" value={f.password} onChange={set}
                         placeholder="Enter your password" autoComplete="current-password"
                         className={inputCls} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <span className="h-5 w-5">{showPass ? icons.eyeOff : icons.eye}</span>
                  </button>
                </div>
              </Field>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-blue-600" />
                  Remember me
                </label>
                <button type="button" onClick={() => switchMode('forgot')}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition">
                  Forgot password?
                </button>
              </div>
            </div>
          )}

          {/* ──── REGISTER ──── */}
          {mode === 'register' && (
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
              <Field label="Full Name" icon="user">
                <input name="fullName" value={f.fullName} onChange={set} maxLength={50}
                       placeholder="Your full name" autoComplete="name" className={inputCls} />
              </Field>
              <Field label="Mobile Number" icon="phone">
                <input type="tel" name="mobile" value={f.mobile} onChange={set} maxLength={15}
                       placeholder="+91 98765 43210" autoComplete="tel" className={inputCls} />
              </Field>
              <Field label="Email Address" icon="mail">
                <input type="email" name="email" value={f.email} onChange={set} maxLength={100}
                       placeholder="your.email@example.com" autoComplete="email" className={inputCls} />
              </Field>
              <Select label="Preferred Language" icon="globe" name="language"
                      value={f.language} onChange={set} options={LANGUAGES} />
              <Field label="Password" icon="lock">
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} name="password" value={f.password} onChange={set} maxLength={128}
                         placeholder="Create a password" autoComplete="new-password" className={inputCls} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <span className="h-5 w-5">{showPass ? icons.eyeOff : icons.eye}</span>
                  </button>
                </div>
              </Field>
              <Select label="Country" icon="flag" name="country"
                      value={f.country} onChange={set} options={COUNTRIES} />
              <Field label="Confirm Password" icon="lock">
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} name="confirm" value={f.confirm} onChange={set} maxLength={128}
                         placeholder="Re-enter your password" autoComplete="new-password" className={inputCls} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <span className="h-5 w-5">{showConfirm ? icons.eyeOff : icons.eye}</span>
                  </button>
                </div>
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

              {/* Password strength bar for register */}
              {f.password && (
                <div className="space-y-1 md:col-span-2">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition ${i <= strength.level ? strength.color : 'bg-slate-200'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">Password Strength: <span className="font-medium">{strength.label}</span></p>
                </div>
              )}

              <label className="flex items-center gap-2.5 text-sm text-slate-700 md:col-span-2">
                <input type="checkbox" name="agreed" checked={f.agreed} onChange={set}
                       className="h-4 w-4 rounded border-slate-300 accent-blue-600" />
                <span>
                  I agree to the <a href="#" className="font-semibold text-blue-600 hover:underline">Terms of Service</a>{' '}
                  and <a href="#" className="font-semibold text-blue-600 hover:underline">Privacy Policy</a>
                </span>
              </label>
            </div>
          )}

          {/* Submit button (login / register only) */}
          {(isLogin || mode === 'register') && (
            <button type="submit" disabled={busy}
                    className={`mt-8 flex h-12 items-center justify-center rounded-lg bg-[#0f1b3d] text-base font-semibold text-white transition hover:bg-[#1a2d5e] disabled:opacity-60 ${isLogin ? 'w-full max-w-md' : 'w-full'}`}>
              {busy ? 'Please wait…' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          )}
        </form>

        {/* Social auth divider (login / register only) */}
        {(isLogin || mode === 'register') && (
          <div className={isLogin ? 'max-w-md' : ''}>
            <div className="my-7 flex items-center gap-4 text-xs font-medium uppercase tracking-wider text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              or continue with
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* Google */}
              <SocialBtn
                onClick={() => {
                  if (google.configured) {
                    google.trigger()
                  } else {
                    setError('Google Sign-In is not configured. Add your VITE_GOOGLE_CLIENT_ID to frontend/.env.local')
                  }
                }}
                disabled={busy}
                label="Google"
                configured={google.configured}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 010-4.18V7.07H2.18a11 11 0 000 9.86l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
                </svg>
              </SocialBtn>

              {/* Microsoft */}
              <SocialBtn
                onClick={() => {
                  if (microsoft.configured) {
                    microsoft.trigger()
                  } else {
                    setError('Microsoft Sign-In is not configured. Add your VITE_MICROSOFT_CLIENT_ID to frontend/.env.local')
                  }
                }}
                disabled={busy}
                label="Microsoft"
                configured={microsoft.configured}
              >
                <svg viewBox="0 0 21 21" className="h-5 w-5">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                </svg>
              </SocialBtn>

              {/* Apple */}
              <SocialBtn
                onClick={() => apple.trigger()}
                disabled={busy}
                label="Apple"
                configured={false}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-black">
                  <path d="M16.37 1.43c0 1.14-.46 2.22-1.2 3.01-.8.85-2.1 1.5-3.15 1.42-.13-1.1.42-2.25 1.15-3 .82-.85 2.2-1.46 3.2-1.43zM20.5 17.3c-.55 1.27-.81 1.84-1.52 2.96-1 1.56-2.4 3.5-4.13 3.51-1.54.02-1.94-1-4.03-.99-2.09.01-2.52 1.01-4.06.99-1.73-.02-3.05-1.77-4.05-3.33C-.2 15.9-.5 10.6 1.9 7.95c1.7-1.9 4.4-2.97 6.9-2.97 1.62 0 2.64 1.01 3.98 1.01 1.3 0 2.1-1.01 3.98-1.01 2.2 0 4.5 1.2 6.2 3.27-5.45 2.99-4.57 10.78-2.46 9.05z" />
                </svg>
              </SocialBtn>
            </div>

            <p className="mt-8 text-center text-xs text-slate-400">
              Your financial data is encrypted and never shared.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

function SocialBtn({ children, label, configured, ...rest }) {
  return (
    <button type="button" {...rest}
            className={`flex h-12 items-center justify-center gap-2.5 rounded-lg border text-sm font-semibold transition disabled:opacity-60
              ${configured
                ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400'
                : 'border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100 cursor-pointer'
              }`}>
      {children}
      <span>{label}</span>
      {!configured && <span className="text-[10px] font-normal text-slate-400">(Setup needed)</span>}
    </button>
  )
}
