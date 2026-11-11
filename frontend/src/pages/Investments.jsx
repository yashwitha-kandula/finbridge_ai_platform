import { useState, useEffect, useRef, useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import {
  ShieldCheck, BookOpen, Star, Briefcase, Info, Check, Lightbulb, CalendarDays,
  ShieldHalf, Scale, TrendingUp, Flame, Rocket, ArrowRight, BarChart3,
  Sparkles, X, Globe, Download, CheckCircle2
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { authFetch } from '../lib/api'

/* ---------------- options ---------------- */
const RISKS = [
  { v: 'Very Conservative', sub: 'Very low risk', icon: ShieldHalf },
  { v: 'Conservative', sub: 'Low risk', icon: ShieldCheck },
  { v: 'Moderate', sub: 'Moderate risk', icon: Scale },
  { v: 'Aggressive', sub: 'High risk', icon: TrendingUp },
  { v: 'Very Aggressive', sub: 'Very high risk', icon: Rocket },
]
const KNOWLEDGE = ['Beginner', 'Intermediate', 'Advanced', 'Expert']
const EXPERIENCE = ['No Experience', '< 2 Years', '2 - 5 Years', '5 - 10 Years', '10+ Years']
const PRODUCTS = ['Stocks / Shares', 'Mutual Funds', 'Bonds', 'ETFs', 'Derivatives', 'Commodities', 'Crypto']
const GOALS = ['Wealth Creation', 'Retirement', 'Child Education', 'Home Purchase', 'Tax Saving', 'Emergency Corpus']
const HORIZONS = ['< 1 Year', '1 - 3 Years', '3 - 5 Years', '5 - 10 Years', '10+ Years']
const RETURNS = ['4 - 6%', '6 - 8%', '8 - 10%', '10 - 12%', '12 - 15%', '15%+']
const MODES = ['SIP (Systematic Investment Plan)', 'Lump Sum', 'Both SIP and Lump Sum']
const RISK_NOTE = {
  'Very Conservative': 'You prefer capital safety above all, with minimal exposure to market swings.',
  Conservative: 'You prefer stable returns and can tolerate only small market dips.',
  Moderate: 'You are open to some market ups and downs for better long-term returns.',
  Aggressive: 'You are comfortable with large swings in pursuit of higher returns.',
  'Very Aggressive': 'You seek maximum growth and can accept significant short-term losses.',
}
const ALLOC_COLORS = { Equity: '#2563eb', Debt: '#16a34a', Gold: '#f59e0b', Cash: '#8b5cf6' }
const DEFAULT_ALLOC = { Equity: 60, Debt: 30, Gold: 5, Cash: 5 }

const todayISO = () => new Date().toISOString().slice(0, 10)
const fmtINR = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')

const card = 'rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800'
const fieldCls =
  'block h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none ' +
  'focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100'
const lbl = 'mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300'

function SectionTitle({ n, icon: Icon, children }) {
  return (
    <div className="mb-4 flex items-center gap-2.5 text-[15px] font-semibold text-blue-700 dark:text-blue-400">
      <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
      {n}. {children}
    </div>
  )
}

/* ---------------- risk gauge (SVG) ---------------- */
function RiskGauge({ score, label }) {
  const cx = 110, cy = 105, r = 80
  const pt = (deg, rad = r) => {
    const a = (Math.PI * (180 - deg)) / 180
    return [cx + rad * Math.cos(a), cy - rad * Math.sin(a)]
  }
  const arc = (from, to, color) => {
    const [x1, y1] = pt(from), [x2, y2] = pt(to)
    return <path d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`} stroke={color} strokeWidth="20" fill="none" />
  }
  const angle = 180 * Math.min(Math.max(score, 0), 100) / 100
  const [nx, ny] = pt(angle, r - 14)
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 220 125" className="w-full max-w-[220px]">
        {arc(0, 58, '#16a34a')}
        {arc(62, 118, '#f59e0b')}
        {arc(122, 180, '#ef4444')}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#1e293b" strokeWidth="4" strokeLinecap="round"
              className="dark:stroke-slate-200" />
        <circle cx={cx} cy={cy} r="7" fill="#1e293b" className="dark:fill-slate-200" />
      </svg>
      <div className="-mt-1 text-xl font-bold text-amber-500">{label}</div>
    </div>
  )
}

export default function Investments() {
  const { token } = useAuth()
  const [f, setF] = useState({
    risk_tolerance: 'Moderate',
    knowledge: 'Intermediate',
    experience: '2 - 5 Years',
    invested_before: true,
    products: ['Stocks / Shares', 'Mutual Funds', 'Bonds'],
    goal: 'Wealth Creation',
    time_horizon: '10+ Years',
    expected_return: '10 - 12%',
    purpose: 'Long term wealth creation, financial freedom and early retirement.',
    monthly_investment: '25000',
    mode: MODES[0],
    start_date: todayISO(),
  })
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState(1)
  const [showAiSummaryModal, setShowAiSummaryModal] = useState(false)
  const refs = { 1: useRef(null), 2: useRef(null), 3: useRef(null), 4: useRef(null) }

  const set = (name, value) => setF((p) => ({ ...p, [name]: value }))
  const toggleProduct = (p) =>
    setF((x) => ({ ...x, products: x.products.includes(p) ? x.products.filter((i) => i !== p) : [...x.products, p] }))

  const payload = useMemo(() => ({
    ...f,
    monthly_investment: Number(f.monthly_investment) || 0,
    purpose: f.purpose || null,
  }), [f])

  /* live ML preview (debounced) */
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const data = await authFetch(token, '/api/investments/profile', {
          method: 'POST', body: JSON.stringify(payload),
        })
        setResult(data)
        setError('')
      } catch (e) {
        setError(e.message)
      }
    }, 350)
    return () => clearTimeout(t)
  }, [payload, token])

  const goTab = (n) => {
    setTab(n)
    refs[n].current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const save = async () => {
    if (!Number(f.monthly_investment)) return setError('Enter the amount you can invest monthly.')
    setBusy(true)
    try {
      const data = await authFetch(token, '/api/investments/profile', { method: 'POST', body: JSON.stringify(payload) })
      setResult(data)
      localStorage.setItem('finbridge_investment_profile', JSON.stringify({ ...f, result: data }))
      setToast('Investment profile saved — your ML risk profile is "' + data.risk_profile + '".')
      setShowAiSummaryModal(true)
      setTimeout(() => setToast(null), 3500)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const alloc = result?.allocation || DEFAULT_ALLOC
  const allocData = Object.entries(alloc).map(([name, value]) => ({ name, value }))
  const riskLabel = result?.risk_profile || f.risk_tolerance
  const bandLabel = riskLabel.includes('Conservative') ? 'Conservative' : riskLabel.includes('Aggressive') ? 'Aggressive' : 'Moderate'

  const tabs = [
    [1, 'Risk Profile', ShieldCheck], [2, 'Investment Knowledge', BookOpen],
    [3, 'Preferences', Star], [4, 'Existing Investments', Briefcase],
  ]

  return (
    <div className="mx-auto max-w-[1400px]">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border border-slate-700/20 bg-slate-900/90 px-5 py-3 text-sm font-medium text-white shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-slate-800/95 transition-all">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Investment Profile &amp; Market Understanding</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Help us understand you better to suggest the right investment strategies.</p>
        </div>
        <button type="button" onClick={() => goTab(4)}
                className="flex items-center gap-2 rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-slate-700">
          <BarChart3 className="h-4 w-4" /> View Investment Dashboard
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* ============ left: form ============ */}
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-700">
            {tabs.map(([n, name, Icon]) => (
              <button key={n} type="button" onClick={() => goTab(n)}
                      className={`flex items-center gap-2 rounded-t-lg border border-b-0 px-4 py-2.5 text-sm font-medium ${
                        tab === n
                          ? 'border-slate-200 bg-white text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400'
                          : 'border-transparent bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400'}`}>
                <Icon className="h-4 w-4" /> {n}. {name}
              </button>
            ))}
          </div>

          {/* 1. risk */}
          <section ref={refs[1]} className={`${card} scroll-mt-24`}>
            <SectionTitle n={1} icon={ShieldCheck}>Risk Tolerance</SectionTitle>
            <div className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">What is your risk appetite?</div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {RISKS.map(({ v, sub, icon: Icon }) => {
                const on = f.risk_tolerance === v
                return (
                  <button key={v} type="button" onClick={() => set('risk_tolerance', v)}
                          className={`relative flex items-center gap-2.5 rounded-lg border px-3 py-3 text-left transition ${
                            on ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600 dark:bg-blue-950' : 'border-slate-200 hover:border-slate-300 dark:border-slate-600'}`}>
                    <Icon className={`h-6 w-6 shrink-0 ${on ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-slate-800 dark:text-slate-100">{v}</span>
                      <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">{sub}</span>
                    </span>
                    {on && <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white"><Check className="h-3 w-3" /></span>}
                  </button>
                )
              })}
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2.5 text-xs text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <Info className="h-4 w-4 shrink-0" />
              You selected {f.risk_tolerance} risk. {RISK_NOTE[f.risk_tolerance]}
            </div>
          </section>

          {/* 2. knowledge */}
          <section ref={refs[2]} className={`${card} scroll-mt-24`}>
            <SectionTitle n={2} icon={BookOpen}>Investment Knowledge &amp; Experience</SectionTitle>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className={lbl}>How would you rate your investment knowledge?</label>
                <select className={fieldCls} value={f.knowledge} onChange={(e) => set('knowledge', e.target.value)}>
                  {KNOWLEDGE.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Years of Investment Experience</label>
                <select className={fieldCls} value={f.experience} onChange={(e) => set('experience', e.target.value)}>
                  {EXPERIENCE.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Have you invested in the stock market before?</label>
                <div className="flex h-10 items-center gap-6 text-sm text-slate-700 dark:text-slate-200">
                  {[true, false].map((b) => (
                    <label key={String(b)} className="flex cursor-pointer items-center gap-2">
                      <input type="radio" name="before" checked={f.invested_before === b}
                             onChange={() => set('invested_before', b)} className="h-4 w-4 accent-blue-600" />
                      {b ? 'Yes' : 'No'}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <label className={lbl}>Which of the following do you understand? <span className="text-blue-600">(Select all that apply)</span></label>
              <div className="flex flex-wrap gap-2.5">
                {PRODUCTS.map((p) => {
                  const on = f.products.includes(p)
                  return (
                    <label key={p} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                      on ? 'border-blue-600 bg-blue-50 dark:bg-blue-950' : 'border-slate-200 dark:border-slate-600'} text-slate-700 dark:text-slate-200`}>
                      <input type="checkbox" checked={on} onChange={() => toggleProduct(p)} className="h-4 w-4 accent-blue-600" />
                      {p}
                    </label>
                  )
                })}
              </div>
            </div>
          </section>

          {/* 3. goals */}
          <section ref={refs[3]} className={`${card} scroll-mt-24`}>
            <SectionTitle n={3} icon={Star}>Investment Goals &amp; Time Horizon</SectionTitle>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className={lbl}>Primary Investment Goal</label>
                <select className={fieldCls} value={f.goal} onChange={(e) => set('goal', e.target.value)}>
                  {GOALS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Time Horizon</label>
                <select className={fieldCls} value={f.time_horizon} onChange={(e) => set('time_horizon', e.target.value)}>
                  {HORIZONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Expected Annual Return (%)</label>
                <select className={fieldCls} value={f.expected_return} onChange={(e) => set('expected_return', e.target.value)}>
                  {RETURNS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className={lbl}>Purpose of Investment (Optional)</label>
              <div className="relative">
                <textarea rows={2} maxLength={200} value={f.purpose}
                          onChange={(e) => set('purpose', e.target.value)}
                          className={fieldCls + ' h-auto resize-none py-2'} />
                <span className="absolute bottom-2 right-3 text-[11px] text-slate-400">{f.purpose.length}/200</span>
              </div>
            </div>
          </section>

          {/* 4. capacity */}
          <section ref={refs[4]} className={`${card} scroll-mt-24`}>
            <SectionTitle n={4} icon={Briefcase}>Monthly Investment Capacity</SectionTitle>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className={lbl}>Amount you can invest monthly (₹)</label>
                <input inputMode="numeric" maxLength={9} value={f.monthly_investment}
                       onChange={(e) => set('monthly_investment', e.target.value.replace(/\D/g, '').slice(0, 9))}
                       placeholder="25000" className={fieldCls} />
              </div>
              <div>
                <label className={lbl}>How will you invest?</label>
                <select className={fieldCls} value={f.mode} onChange={(e) => set('mode', e.target.value)}>
                  {MODES.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>When will you start?</label>
                <div className="relative">
                  <input type="date" value={f.start_date} min="2000-01-01" max="2100-12-31"
                         onChange={(e) => set('start_date', e.target.value)} className={fieldCls} />
                  <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-sm dark:bg-slate-800">
            <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
              <Info className="h-4 w-4" /> Your investment profile helps us provide personalized recommendations suited to your goals and risk appetite.
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => window.history.back()}
                      className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">
                Cancel
              </button>
              <button type="button" onClick={save} disabled={busy}
                      className="flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
                {busy ? 'Saving…' : 'Save & Continue'} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ============ right: summary ============ */}
        <aside className="min-w-0 space-y-4">
          <div className={card + ' !p-0 overflow-hidden'}>
            <div className="border-b border-emerald-100 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 dark:border-slate-700 dark:bg-emerald-950 dark:text-emerald-400">
              Investment Profile Summary
            </div>
            <dl className="space-y-2.5 p-4 text-xs">
              {[
                ['Risk Tolerance', riskLabel, true],
                ['Investment Experience', f.experience],
                ['Monthly Investable Amount', fmtINR(f.monthly_investment)],
                ['Time Horizon', f.time_horizon],
                ['Expected Return', f.expected_return],
              ].map(([k, v, dot]) => (
                <div key={k} className="flex items-center justify-between gap-2">
                  <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
                  <dd className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-100">
                    {dot && <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />}{v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className={card}>
            <div className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Your Risk Profile</div>
            <RiskGauge score={result?.risk_score ?? 50} label={bandLabel} />
            <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
              {result
                ? `ML prediction: ${result.risk_profile} (${result.confidence}% confidence)`
                : 'You are balanced and seek growth with manageable risks.'}
            </p>
          </div>

          <div className={card}>
            <div className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Suggested Asset Allocation (Sample)</div>
            <div className="flex items-center gap-3">
              <div className="h-[130px] w-[130px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={allocData} dataKey="value" innerRadius="60%" outerRadius="100%" stroke="none">
                      {allocData.map((d) => <Cell key={d.name} fill={ALLOC_COLORS[d.name]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="min-w-0 flex-1 space-y-1.5 text-xs">
                {allocData.map((d) => (
                  <li key={d.name} className="flex items-center justify-between text-slate-700 dark:text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: ALLOC_COLORS[d.name] }} />{d.name}
                    </span>
                    <span className="font-semibold">{d.value}%</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">This is a sample allocation. Actual recommendations will be personalized for you.</p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
              <Lightbulb className="h-4 w-4" /> Pro Tip
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {result?.tip || 'Start early, invest regularly, and stay diversified. Time in the market is more important than timing the market.'}
            </p>
          </div>
        </aside>
      </div>

      {/* AI SUMMARY & REAL-WORLD SUGGESTIONS MODAL */}
      {showAiSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Investment Strategy &amp; Real-World Market Allocation</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Personalized for {f.risk_tolerance} Risk Profile • {f.time_horizon} Horizon</p>
                </div>
              </div>
              <button
                onClick={() => setShowAiSummaryModal(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="mt-5 space-y-5">
              {/* Top Highlights Banner */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-950 dark:bg-blue-950/20">
                  <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">Monthly Commitment</span>
                  <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{fmtINR(f.monthly_investment)}</div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Via {f.mode.split(' ')[0]}</span>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 dark:border-emerald-950 dark:bg-emerald-950/20">
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Expected Annual Return</span>
                  <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{f.expected_return}</div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Target Benchmark</span>
                </div>
                <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4 dark:border-purple-950 dark:bg-purple-950/20">
                  <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">Primary Goal</span>
                  <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white truncate">{f.goal}</div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{f.time_horizon}</span>
                </div>
              </div>

              {/* Real-World Asset Allocation Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                  1. Recommended Real-World Asset Breakdown
                </h4>
                <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-700 dark:text-slate-300">
                      <tr>
                        <th className="px-4 py-2.5">Asset Class</th>
                        <th className="px-4 py-2.5">Allocation</th>
                        <th className="px-4 py-2.5">Monthly Share</th>
                        <th className="px-4 py-2.5">Real-World Instruments</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      <tr>
                        <td className="px-4 py-3 font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-blue-600" /> Large &amp; Flexi-Cap Equity
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{alloc.Equity || 60}%</td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{fmtINR(((Number(f.monthly_investment) || 0) * (alloc.Equity || 60)) / 100)}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">UTI Nifty 50 Index Fund, Parag Parikh Flexi Cap</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-600" /> Sovereign &amp; Corporate Debt
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{alloc.Debt || 30}%</td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{fmtINR(((Number(f.monthly_investment) || 0) * (alloc.Debt || 30)) / 100)}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">SBI Short Duration, RBI Floating Rate Bonds</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-amber-600" /> Gold (Inflation Hedge)
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{alloc.Gold || 5}%</td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{fmtINR(((Number(f.monthly_investment) || 0) * (alloc.Gold || 5)) / 100)}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">Nippon India Gold ETF, Sovereign Gold Bonds</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-purple-600" /> Cash &amp; Liquid Buffer
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{alloc.Cash || 5}%</td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{fmtINR(((Number(f.monthly_investment) || 0) * (alloc.Cash || 5)) / 100)}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">High-Yield Savings, ICICI Prudential Liquid Fund</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Real-Time World Market Context */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                  <Globe className="h-4 w-4 text-blue-600" /> Real-Time Macro Environment Analysis
                </div>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-[11px] text-slate-600 dark:text-slate-300">
                  <div className="rounded-xl bg-white p-3 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <span className="font-bold text-slate-800 dark:text-slate-200">RBI Repo Rate (6.50%):</span> High interest rates make short-duration debt attractive right now before future easing cycles commence.
                  </div>
                  <div className="rounded-xl bg-white p-3 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Inflation Protection (~5.4%):</span> A 60% equity + 5% gold weighting outpaces CPI inflation and preserves purchasing power.
                  </div>
                </div>
              </div>

              {/* Multi-Year Wealth Trajectory */}
              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 p-4 dark:border-indigo-950 dark:bg-indigo-950/20">
                <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200 mb-2">
                  Compound Wealth Trajectory ({f.expected_return} CAGR with {fmtINR(f.monthly_investment)}/mo)
                </h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-white p-2.5 shadow-xs dark:bg-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">In 5 Years</span>
                    <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {fmtINR((Number(f.monthly_investment) || 25000) * 81.6)}
                    </div>
                  </div>
                  <div className="rounded-xl bg-white p-2.5 shadow-xs dark:bg-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">In 10 Years</span>
                    <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      {fmtINR((Number(f.monthly_investment) || 25000) * 232.3)}
                    </div>
                  </div>
                  <div className="rounded-xl bg-white p-2.5 shadow-xs dark:bg-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">In 15 Years</span>
                    <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {fmtINR((Number(f.monthly_investment) || 25000) * 504.6)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4 dark:border-slate-800">
              <span className="text-[11px] text-slate-400">Generated by FinBridge ML Engine</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAiSummaryModal(false)}
                  className="rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
                >
                  Done &amp; Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
