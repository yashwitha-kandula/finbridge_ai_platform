import { useState, useEffect } from 'react'
import {
  User, Building2, Sliders, Bell, Shield, Lock, Smartphone, Monitor, History,
  Check, Eye, EyeOff, Plus, ChevronRight, AlertCircle, RefreshCw, Moon, Sun, Laptop,
  CheckCircle2, X
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useTheme } from '../theme/ThemeProvider'
import { authFetch } from '../lib/api'

export default function Settings() {
  const { token, user, refreshUser } = useAuth()
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState('Profile')
  const [toast, setToast] = useState('')
  const [saving, setSaving] = useState(false)

  // Tab 1: Profile State
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    dob: '',
    country: 'India',
    language: 'English',
    timezone: '(GMT +05:30) Asia/Kolkata'
  })

  // Sync profile when user object loads/changes
  useEffect(() => {
    if (user) {
      setProfile({
        fullName: user.full_name || '',
        email: user.email || '',
        phone: user.mobile || '',
        dob: user.dob || '',
        country: user.country || 'India',
        language: user.preferred_language || 'English',
        timezone: '(GMT +05:30) Asia/Kolkata'
      })
    }
  }, [user])

  // Tab 2: Accounts State
  const [accounts, setAccounts] = useState(() => {
    const saved = localStorage.getItem('finbridge_connected_accounts')
    return saved ? JSON.parse(saved) : [
      { id: 1, bank: 'State Bank of India', accNum: '•••• 4821', type: 'Savings Account', synced: 'Today, 10:30 AM', status: 'Connected', color: 'bg-blue-600' },
      { id: 2, bank: 'HDFC Bank', accNum: '•••• 8793', type: 'Savings Account', synced: 'Today • 08:45 PM', status: 'Connected', color: 'bg-rose-600' }
    ]
  })
  const [showAddModal, setShowAddModal] = useState(false)
  const [newAcc, setNewAcc] = useState({ bank: 'ICICI Bank', accNum: '', type: 'Savings Account' })

  // Tab 3: Preferences State
  const [prefs, setPrefs] = useState(() => {
    const saved = localStorage.getItem('finbridge_user_preferences')
    return saved ? JSON.parse(saved) : {
      currency: 'INR (₹)',
      dateFormat: 'DD-MM-YYYY',
      dashboardPeriod: 'Last 3 Months',
      budgetCycle: 'Monthly',
      weekStarts: 'Monday',
      runningBalance: true,
      categoryIcons: true,
      autoCategorize: true,
    }
  })

  // Tab 4: Notifications State
  const [notifs, setNotifs] = useState(() => {
    const saved = localStorage.getItem('finbridge_user_notifications')
    return saved ? JSON.parse(saved) : {
      spendingAlerts: true,
      budgetWarnings: true,
      unusualSpending: true,
      loanReminders: true,
      goalReminders: true,
      forecastUpdates: true,
      aiInsights: true,
      email: true,
      inApp: true,
      push: false,
      quietHours: true,
      quietFrom: '22:00',
      quietTo: '07:00',
      frequency: 'Instant'
    }
  })

  // Tab 5: Security State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  // Handle Real Profile Save to Backend Database
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!profile.fullName.trim()) return showToast('Full name cannot be empty')
    setSaving(true)
    try {
      await authFetch(token, '/api/auth/me', {
        method: 'PUT',
        body: JSON.stringify({
          full_name: profile.fullName.trim(),
          mobile: profile.phone.trim(),
          dob: profile.dob,
          country: profile.country,
          preferred_language: profile.language
        })
      })
      if (refreshUser) await refreshUser()
      showToast('Profile updated and saved to database!')
    } catch (err) {
      showToast(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  // Handle Add Account
  const handleAddAccount = (e) => {
    e.preventDefault()
    if (!newAcc.accNum || newAcc.accNum.length < 4) return showToast('Please enter at least 4 digits')
    const created = {
      id: Date.now(),
      bank: newAcc.bank,
      accNum: `•••• ${newAcc.accNum.slice(-4)}`,
      type: newAcc.type,
      synced: 'Just now',
      status: 'Connected',
      color: 'bg-emerald-600'
    }
    const updated = [...accounts, created]
    setAccounts(updated)
    localStorage.setItem('finbridge_connected_accounts', JSON.stringify(updated))
    setShowAddModal(false)
    setNewAcc({ bank: 'ICICI Bank', accNum: '', type: 'Savings Account' })
    showToast(`${created.bank} account linked successfully!`)
  }

  // Password strength calculation
  const getStrength = (pass) => {
    if (!pass) return { score: 0, text: '', color: 'bg-slate-200' }
    let score = 0
    if (pass.length >= 8) score++
    if (/[A-Z]/.test(pass)) score++
    if (/[0-9]/.test(pass)) score++
    if (/[^A-Za-z0-9]/.test(pass)) score++

    if (score <= 2) return { score: 33, text: 'Weak', color: 'bg-red-500' }
    if (score === 3) return { score: 66, text: 'Medium', color: 'bg-amber-500' }
    return { score: 100, text: 'Very Strong', color: 'bg-emerald-500' }
  }

  const strength = getStrength(newPassword)

  const handlePasswordUpdate = (e) => {
    e.preventDefault()
    if (!currentPassword) return showToast('Please enter your current password')
    if (newPassword.length < 8) return showToast('Password must be at least 8 characters')
    if (newPassword !== confirmPassword) return showToast('Passwords do not match')
    showToast('Password updated successfully!')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const tabs = [
    { id: 'Profile', label: 'Profile', icon: User },
    { id: 'Accounts', label: 'Accounts', icon: Building2 },
    { id: 'Preferences', label: 'Preferences', icon: Sliders },
    { id: 'Notifications', label: 'Notifications', icon: Bell },
    { id: 'Security', label: 'Security', icon: Shield },
  ]

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-12 fade-in">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl dark:bg-white dark:text-slate-900">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
          {toast}
        </div>
      )}

      {/* Modal: Add Account */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Connect Financial Account</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddAccount} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Select Bank / Institution</label>
                <select
                  value={newAcc.bank}
                  onChange={(e) => setNewAcc({ ...newAcc, bank: e.target.value })}
                  className="mt-1 block h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option>State Bank of India</option>
                  <option>HDFC Bank</option>
                  <option>ICICI Bank</option>
                  <option>Axis Bank</option>
                  <option>Kotak Mahindra Bank</option>
                  <option>Punjab National Bank</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Account Number</label>
                <input
                  type="text"
                  maxLength={18}
                  placeholder="e.g. 501004821987"
                  value={newAcc.accNum}
                  onChange={(e) => setNewAcc({ ...newAcc, accNum: e.target.value.replace(/\D/g, '') })}
                  className="mt-1 block h-10 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Account Type</label>
                <select
                  value={newAcc.type}
                  onChange={(e) => setNewAcc({ ...newAcc, type: e.target.value })}
                  className="mt-1 block h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option>Savings Account</option>
                  <option>Current Account</option>
                  <option>Salary Account</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  Connect &amp; Verify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Sliders className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage your account, connected financial data, and preferences
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Pill Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3 dark:border-slate-800">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? 'border border-blue-600 bg-white text-blue-600 shadow-sm dark:border-blue-500 dark:bg-slate-800 dark:text-blue-400'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* TAB 1: PROFILE */}
      {activeTab === 'Profile' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
            {/* Avatar section */}
            <div className="flex flex-col items-center justify-start border-b pb-6 lg:border-b-0 lg:border-r lg:pr-8 dark:border-slate-800">
              <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-blue-50 text-3xl font-bold text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                {profile.fullName ? profile.fullName.trim().charAt(0).toUpperCase() : 'U'}
              </div>
              <button
                type="button"
                onClick={() => showToast('Profile avatar updated')}
                className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Change Photo
              </button>
            </div>

            {/* Form section */}
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Personal Information</h3>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Full Name</label>
                    <input
                      type="text"
                      value={profile.fullName}
                      onChange={(e) => setProfile({ ...profile, fullName: e.target.value.replace(/[^A-Za-z\s'-]/g, '') })}
                      className="mt-1 block h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Email Address</label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="mt-1 block h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 outline-none dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Phone Number</label>
                    <input
                      type="tel"
                      maxLength={15}
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value.replace(/[^0-9+]/g, '') })}
                      placeholder="+91 98765 43210"
                      className="mt-1 block h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Date of Birth</label>
                    <input
                      type="date"
                      value={profile.dob}
                      onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
                      className="mt-1 block h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Location &amp; Language</h3>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Country / Region</label>
                    <select
                      value={profile.country}
                      onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                      className="mt-1 block h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option>India</option>
                      <option>United States</option>
                      <option>United Kingdom</option>
                      <option>Singapore</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Preferred Language</label>
                    <select
                      value={profile.language}
                      onChange={(e) => setProfile({ ...profile, language: e.target.value })}
                      className="mt-1 block h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option>English</option>
                      <option>Hindi</option>
                      <option>Telugu</option>
                      <option>Tamil</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Time Zone</label>
                    <select
                      value={profile.timezone}
                      onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                      className="mt-1 block h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option>(GMT +05:30) Asia/Kolkata</option>
                      <option>(GMT +00:00) UTC</option>
                      <option>(GMT -05:00) Eastern Time</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: ACCOUNTS */}
      {activeTab === 'Accounts' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Connected Financial Accounts</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Your linked bank and financial institutions</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" /> Add Account
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {accounts.map((acc) => (
                <div key={acc.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex items-center gap-3.5">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${acc.color} text-white font-bold text-sm`}>
                      {acc.bank.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{acc.bank}</span>
                        <span className="text-xs text-slate-400 font-mono">{acc.accNum}</span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{acc.type} • Last synced: {acc.synced}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {acc.status}
                    </span>
                    <button
                      onClick={() => showToast(`Sync refreshed for ${acc.bank}`)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Consent Box */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-950 dark:bg-blue-950/20">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Data Access Consent Details</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">You have authorized FinBridge AI to access your transactions for financial intelligence and automated insights.</div>
                </div>
              </div>
              <button
                onClick={() => showToast('Consent details verified and active under Account Aggregator framework')}
                className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:bg-slate-800 dark:text-blue-300"
              >
                Manage Consent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PREFERENCES */}
      {activeTab === 'Preferences' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* General Preferences */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">General Preferences</h3>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Currency</label>
                <select
                  value={prefs.currency}
                  onChange={(e) => setPrefs({ ...prefs, currency: e.target.value })}
                  className="mt-1 block h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option>INR (₹)</option>
                  <option>USD ($)</option>
                  <option>EUR (€)</option>
                  <option>GBP (£)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Date Format</label>
                <select
                  value={prefs.dateFormat}
                  onChange={(e) => setPrefs({ ...prefs, dateFormat: e.target.value })}
                  className="mt-1 block h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option>DD-MM-YYYY</option>
                  <option>MM/DD/YYYY</option>
                  <option>YYYY-MM-DD</option>
                </select>
              </div>

              {/* Theme Picker */}
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Theme</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {[
                    { id: 'light', label: 'Light', icon: Sun },
                    { id: 'dark', label: 'Dark', icon: Moon },
                    { id: 'system', label: 'System', icon: Laptop },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTheme(t.id)
                        showToast(`Theme switched to ${t.label}`)
                      }}
                      className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition ${
                        theme === t.id
                          ? 'border-blue-600 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-400'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                      }`}
                    >
                      <t.icon className="h-4 w-4" />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Financial & Display Preferences */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Financial &amp; Display</h3>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Budget Cycle</label>
                <select
                  value={prefs.budgetCycle}
                  onChange={(e) => setPrefs({ ...prefs, budgetCycle: e.target.value })}
                  className="mt-1 block h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option>Monthly</option>
                  <option>Weekly</option>
                  <option>Bi-Weekly</option>
                </select>
              </div>

              <div className="space-y-3 pt-3">
                {[
                  { key: 'runningBalance', label: 'Show Running Balance in Transactions' },
                  { key: 'categoryIcons', label: 'Show Category Icons' },
                  { key: 'autoCategorize', label: 'Auto-Categorize Transactions via ML' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                    <button
                      type="button"
                      onClick={() => setPrefs({ ...prefs, [item.key]: !prefs[item.key] })}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                        prefs[item.key] ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${prefs[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end border-t pt-4 dark:border-slate-800">
            <button
              onClick={() => {
                localStorage.setItem('finbridge_user_preferences', JSON.stringify(prefs))
                showToast('Preferences updated and saved')
              }}
              className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Save Preferences
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: NOTIFICATIONS */}
      {activeTab === 'Notifications' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Alert Preferences */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Alert Preferences</h3>
              <div className="space-y-3">
                {[
                  { key: 'spendingAlerts', title: 'Spending Alerts', desc: 'Get notified when spending exceeds limits' },
                  { key: 'budgetWarnings', title: 'Budget Warnings', desc: 'Receive alerts when you are close to budget limit' },
                  { key: 'unusualSpending', title: 'Unusual Transaction Alerts', desc: 'Get notified about irregular spending patterns' },
                  { key: 'loanReminders', title: 'Loan / EMI Reminders', desc: 'Never miss an upcoming bill or EMI payment' },
                  { key: 'goalReminders', title: 'Goal Reminders', desc: 'Progress updates on your financial goals' },
                  { key: 'aiInsights', title: 'AI Insights & Recommendations', desc: 'Receive actionable AI personal finance insights' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">{item.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotifs({ ...notifs, [item.key]: !notifs[item.key] })}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                        notifs[item.key] ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifs[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Notification Channels & Quiet Hours */}
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Notification Channels</h3>
                <div className="mt-3 space-y-2.5">
                  {[
                    { key: 'email', label: 'Email Notifications' },
                    { key: 'inApp', label: 'In-App Notifications' },
                    { key: 'push', label: 'Push Notifications (Mobile)' },
                  ].map((ch) => (
                    <label key={ch.key} className="flex items-center gap-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifs[ch.key]}
                        onChange={(e) => setNotifs({ ...notifs, [ch.key]: e.target.checked })}
                        className="h-4 w-4 rounded accent-blue-600"
                      />
                      {ch.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Quiet Hours</h4>
                    <p className="text-xs text-slate-500">Do not send notifications during these hours</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifs({ ...notifs, quietHours: !notifs.quietHours })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                      notifs.quietHours ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifs.quietHours ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {notifs.quietHours && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] text-slate-500">From</span>
                      <input
                        type="time"
                        value={notifs.quietFrom}
                        onChange={(e) => setNotifs({ ...notifs, quietFrom: e.target.value })}
                        className="mt-1 block h-9 w-full rounded-lg border border-slate-300 px-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500">To</span>
                      <input
                        type="time"
                        value={notifs.quietTo}
                        onChange={(e) => setNotifs({ ...notifs, quietTo: e.target.value })}
                        className="mt-1 block h-9 w-full rounded-lg border border-slate-300 px-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end border-t pt-4 dark:border-slate-800">
            <button
              onClick={() => {
                localStorage.setItem('finbridge_user_notifications', JSON.stringify(notifs))
                showToast('Notification settings saved')
              }}
              className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Save Notification Settings
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: SECURITY (Primary Mockup Screen) */}
      {activeTab === 'Security' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
          {/* Left Column: Change Password Card */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3 border-b pb-4 dark:border-slate-800">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Change Password</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Keep your account secure with a strong password</p>
                </div>
              </div>

              <form onSubmit={handlePasswordUpdate} className="mt-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Current Password</label>
                  <div className="relative mt-1">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 pr-10 text-sm text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">New Password</label>
                  <div className="relative mt-1">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 pr-10 text-sm text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Confirm New Password</label>
                  <div className="relative mt-1">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 pr-10 text-sm text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Strength Meter */}
                {newPassword && (
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Password Strength</span>
                      <span className="font-semibold text-emerald-600">{strength.text}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className={`h-full rounded-full transition-all ${strength.color}`} style={{ width: `${strength.score}%` }} />
                    </div>
                  </div>
                )}

                {/* Requirements info */}
                <div className="rounded-xl bg-blue-50/70 p-3 text-xs text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                  <div className="font-semibold">Password Requirements:</div>
                  <div className="mt-0.5 text-[11px] text-blue-600/90 dark:text-blue-400/90">
                    At least 8 characters, including uppercase, lowercase, number and symbol.
                  </div>
                </div>

                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  <Lock className="h-4 w-4" /> Update Password
                </button>
              </form>
            </div>

            {/* Account Security Banner */}
            <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 dark:border-emerald-950 dark:bg-emerald-950/20">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Account Security</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Your account is protected</p>
                </div>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                <Check className="h-3.5 w-3.5" /> All systems secure
              </span>
            </div>
          </div>

          {/* Right Column: 2FA, Active Sessions, Recent Activity */}
          <div className="space-y-6">
            {/* 2FA Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Two-Factor Authentication</h4>
                    <p className="text-xs text-slate-500">Add an extra layer of security to your account</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTwoFactorEnabled(!twoFactorEnabled)
                    showToast(twoFactorEnabled ? '2FA Disabled' : '2FA Enabled')
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                    twoFactorEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {twoFactorEnabled && (
                <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-emerald-50/80 p-3 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold">2FA is enabled.</span> Your account is protected with authentication code verification.
                  </div>
                </div>
              )}
            </div>

            {/* Active Sessions Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2.5">
                <Monitor className="h-4 w-4 text-blue-600" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Active Sessions</h4>
              </div>
              <p className="mt-1 text-xs text-slate-500">Manage devices where you are currently logged in</p>

              <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <Monitor className="h-5 w-5 text-slate-400" />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">This Device</div>
                    <div className="text-[11px] text-slate-500">Chrome • Windows</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active Now
                  </span>
                  <button
                    onClick={() => showToast('Session signed out')}
                    className="ml-2 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Security Activity */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2.5">
                <History className="h-4 w-4 text-blue-600" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Recent Security Activity</h4>
              </div>
              <p className="mt-1 text-xs text-slate-500">Your latest account security events</p>

              <div className="mt-4 space-y-3">
                {[
                  { event: 'Successful login', time: 'Today • Just now', icon: CheckCircle2, color: 'text-emerald-500' },
                  { event: 'Password verified', time: 'Recent', icon: AlertCircle, color: 'text-blue-500' },
                  { event: 'Active session started', time: 'Today', icon: CheckCircle2, color: 'text-emerald-500' },
                ].map((act, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <act.icon className={`h-4 w-4 ${act.color}`} />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{act.event}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">{act.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
