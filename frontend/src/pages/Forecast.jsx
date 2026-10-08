import React, { useState } from 'react'
import { 
  Calendar, Download, ArrowUpRight, ArrowDownRight, ChevronDown, 
  Info, Target, Home, Shield, GraduationCap, CheckCircle2, 
  Sparkles, Lightbulb, ArrowRight, Activity
} from 'lucide-react'
import { 
  ComposedChart, Bar, Line, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { inr, inrShort } from '../lib/format'

/* --- Mock Data --- */
const trendData = [
  { month: "May '24", income: 90000, expenses: 60000, savings: 30000 },
  { month: "Jun '24", income: 105000, expenses: 65000, savings: 40000 },
  { month: "Jul '24", income: 110000, expenses: 62000, savings: 48000 },
  { month: "Aug '24", income: 125000, expenses: 72000, savings: 53000 },
  { month: "Sep '24", income: 130000, expenses: 75000, savings: 55000 },
  { month: "Oct '24", income: 145000, expenses: 80000, savings: 65000 },
]

const breakdownData = [
  { name: 'Housing', value: 131200, percent: 32, color: '#0d9488' }, // Teal
  { name: 'Food', value: 73800, percent: 18, color: '#c026d3' }, // Fuchsia
  { name: 'Transport', value: 49200, percent: 12, color: '#f59e0b' }, // Amber
  { name: 'Shopping', value: 41000, percent: 10, color: '#ec4899' }, // Pink
  { name: 'Entertainment', value: 28700, percent: 7, color: '#6366f1' }, // Indigo
  { name: 'Others', value: 86100, percent: 21, color: '#94a3b8' }, // Slate
]

const radarData = [
  { subject: 'Savings', A: 85, fullMark: 100 },
  { subject: 'Debt', A: 90, fullMark: 100 },
  { subject: 'Stability', A: 75, fullMark: 100 },
  { subject: 'Discipline', A: 80, fullMark: 100 },
  { subject: 'Growth', A: 70, fullMark: 100 },
]

const projectionData = [
  { month: "Nov '24", projected: 40000, target: 50000 },
  { month: "Dec '24", projected: 65000, target: 70000 },
  { month: "Jan '25", projected: 90000, target: 90000 },
  { month: "Feb '25", projected: 115000, target: 110000 },
  { month: "Mar '25", projected: 140000, target: 130000 },
  { month: "Apr '25", projected: 162000, target: 150000 },
]

const events = [
  { id: 1, title: 'Bike Purchase Goal', date: 'Target: Nov 2024', amount: 120000, icon: Target, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-500/10' },
  { id: 2, title: 'Home Loan EMI', date: 'Next: 05 Jun 2024', amount: 18500, icon: Home, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10' },
  { id: 3, title: 'Insurance Premium', date: 'Due: 15 Jun 2024', amount: 12000, icon: Shield, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  { id: 4, title: 'School Fees', date: 'Due: 20 Jun 2024', amount: 25000, icon: GraduationCap, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
]

const Sparkline = ({ dataKey, color, data }) => (
  <ResponsiveContainer width="100%" height={40}>
    <AreaChart data={data}>
      <defs>
        <linearGradient id={`color-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
          <stop offset="95%" stopColor={color} stopOpacity={0}/>
        </linearGradient>
      </defs>
      <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fillOpacity={1} fill={`url(#color-${dataKey})`} />
    </AreaChart>
  </ResponsiveContainer>
)

export default function Forecast() {
  const [dateRange, setDateRange] = useState("May 2024 - Oct 2024")

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-10 fade-in text-slate-900 dark:text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Financial Forecast & Analytics</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Future predictions, spending trends and financial health overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              const newDate = window.prompt("Enter Date Range:", dateRange)
              if (newDate) setDateRange(newDate)
            }}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {dateRange} <Calendar size={16} className="text-slate-400" />
          </button>
          <button 
            onClick={() => alert("Report download started!")}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            <Download size={16} /> Download Report
          </button>
        </div>
      </div>

      {/* TOP KPI ROW */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Income</div>
          <div className="mt-1 text-2xl font-bold">₹7,20,000</div>
          <div className="mt-1 flex items-center text-xs font-semibold text-teal-500">
            <ArrowUpRight size={14} className="mr-0.5" /> 12.5% <span className="ml-1 font-normal text-slate-400">vs last 6 months</span>
          </div>
          <div className="mt-4"><Sparkline data={trendData} dataKey="income" color="#14b8a6" /></div>
        </div>
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Expenses</div>
          <div className="mt-1 text-2xl font-bold">₹4,10,000</div>
          <div className="mt-1 flex items-center text-xs font-semibold text-rose-500">
            <ArrowUpRight size={14} className="mr-0.5" /> 8.3% <span className="ml-1 font-normal text-slate-400">vs last 6 months</span>
          </div>
          <div className="mt-4"><Sparkline data={trendData} dataKey="expenses" color="#f43f5e" /></div>
        </div>
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Savings</div>
          <div className="mt-1 text-2xl font-bold">₹3,10,000</div>
          <div className="mt-1 flex items-center text-xs font-semibold text-indigo-500">
            <ArrowUpRight size={14} className="mr-0.5" /> 18.7% <span className="ml-1 font-normal text-slate-400">vs last 6 months</span>
          </div>
          <div className="mt-4"><Sparkline data={trendData} dataKey="savings" color="#6366f1" /></div>
        </div>
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">Debt Overview</div>
          <div className="mt-1 text-2xl font-bold">₹3,80,000</div>
          <div className="mt-1 flex items-center text-xs font-semibold text-teal-500">
            <ArrowDownRight size={14} className="mr-0.5" /> 4.2% <span className="ml-1 font-normal text-slate-400">vs last 6 months</span>
          </div>
          <div className="mt-4"><Sparkline data={trendData} dataKey="expenses" color="#14b8a6" /></div>
        </div>
      </div>

      {/* MIDDLE ROW (Modified visually from Dashboard) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Trend Composed Chart */}
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">Income vs Expenses Analysis</h2>
            <select className="rounded-lg border border-slate-200 py-1.5 pl-3 pr-8 text-xs font-medium text-slate-600 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <option>Monthly</option>
              <option>Quarterly</option>
            </select>
          </div>
          <div className="mb-2 flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-sm bg-teal-500" /> Income (Bar)</div>
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-sm bg-rose-400" /> Expenses (Bar)</div>
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-indigo-500" /> Savings (Trend)</div>
          </div>
          <div className="h-64 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                <YAxis tickFormatter={inrShort} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <RechartsTooltip 
                  formatter={(val) => inr(val)} 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', backgroundColor: '#1e293b', color: '#fff' }} 
                />
                <Bar dataKey="income" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="expenses" fill="#fb7185" radius={[4, 4, 0, 0]} barSize={20} />
                <Line type="monotone" dataKey="savings" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown as Progress Bars */}
        <div className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-6">
            <h2 className="font-bold">Spending Intensity</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total volume by category</p>
          </div>
          <div className="flex-1 space-y-5 overflow-y-auto pr-2">
            {breakdownData.map((it) => (
              <div key={it.name}>
                <div className="mb-1.5 flex justify-between text-xs font-semibold">
                  <span>{it.name}</span>
                  <span className="text-slate-500">{inrShort(it.value)} <span className="ml-1 opacity-60">({it.percent}%)</span></span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${it.percent}%`, backgroundColor: it.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Radar Chart Health Score */}
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center gap-1.5 font-bold">
            Health Radar <Info size={14} className="text-slate-400 cursor-pointer" onClick={() => alert("Radar displays your 5 core financial pillars.")} />
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="relative h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#cbd5e1" opacity={0.5} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} />
                  <Radar name="Score" dataKey="A" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.4} />
                  <RechartsTooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-center">
              <div className="text-2xl font-black text-sky-600 dark:text-sky-400">82<span className="text-sm font-bold text-slate-400">/100</span></div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Excellent Symmetry</div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        {/* Future Projection Area Chart */}
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-5 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="font-bold">Trajectory Forecast <span className="font-medium text-slate-500 dark:text-slate-400">(6 Months)</span></h2>
          <div className="mt-2 mb-4 flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-pink-500" /> Projected Velocity</div>
            <div className="flex items-center gap-1.5"><div className="h-0.5 w-3 bg-teal-500" /> Target Threshold</div>
          </div>
          <div className="flex h-56 min-w-0 items-center gap-4">
            <div className="h-full flex-1 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                  <YAxis tickFormatter={inrShort} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 200000]} />
                  <RechartsTooltip formatter={(val) => inr(val)} contentStyle={{ fontSize: '12px', borderRadius: '8px', backgroundColor: '#1e293b', color: '#fff' }} />
                  <ReferenceLine y={150000} stroke="#14b8a6" strokeDasharray="4 4" strokeWidth={2} />
                  <Area type="monotone" dataKey="projected" stroke="#ec4899" strokeWidth={3} fill="url(#colorProj)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Upcoming Important Events */}
        <div className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-4 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-4 font-bold">Upcoming Obligations</h2>
          <div className="flex-1 space-y-4">
            {events.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${ev.bg} ${ev.color}`}>
                    <ev.icon size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{ev.title}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{ev.date}</div>
                  </div>
                </div>
                <div className="text-sm font-bold text-teal-600 dark:text-teal-400">{inr(ev.amount)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Insights & AI */}
        <div className="min-w-0 flex flex-col gap-4 lg:col-span-3">
          <div className="flex-1 rounded-xl border border-cyan-100 bg-cyan-50/30 p-4 dark:border-cyan-900 dark:bg-cyan-900/20">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-cyan-900 dark:text-cyan-100">
              <Activity size={16} className="text-cyan-600 dark:text-cyan-400" /> Analytical Insights
            </h3>
            <ul className="space-y-3 text-xs font-medium text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-cyan-500" />
                You save 18% of your income consistently.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-cyan-500" />
                Optimizing fixed costs could free up ₹2,500/month.
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-fuchsia-100 bg-fuchsia-50 p-4 shadow-sm dark:border-fuchsia-900 dark:bg-fuchsia-900/20">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-fuchsia-900 dark:text-fuchsia-100">
              <Sparkles size={16} className="text-fuchsia-600 dark:text-fuchsia-400" /> AI Strategy
            </h3>
            <p className="mb-3 text-xs font-medium text-slate-700 dark:text-slate-300">
              Based on the radar symmetry, diversifying into equity bonds will balance your growth pillar.
            </p>
            <button onClick={() => alert("FinScope AI Chat opening...")} className="w-full rounded-lg bg-fuchsia-600 py-2 text-xs font-bold text-white transition hover:bg-fuchsia-700">
              Consult AI <ArrowRight size={12} className="inline" />
            </button>
          </div>
        </div>

      </div>

      {/* FOOTER BANNER */}
      <div className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50 p-4 shadow-sm dark:border-amber-900/40 dark:bg-amber-900/20">
        <div className="flex items-start gap-3">
          <Lightbulb size={24} className="mt-0.5 shrink-0 text-amber-500" />
          <div>
            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-100">AI Optimization Engine</h3>
            <p className="text-xs font-medium text-amber-800/80 dark:text-amber-200/80 mt-0.5 max-w-3xl">
              Applying the recommended trajectory shifts could advance your milestone completions by an average of 45 days.
            </p>
          </div>
        </div>
        <button onClick={() => alert("Optimization engine started!")} className="shrink-0 rounded-lg bg-white px-5 py-2 text-xs font-bold text-amber-600 shadow-sm transition hover:bg-amber-100 dark:bg-amber-900 dark:text-amber-100 dark:hover:bg-amber-800">
          Apply Strategy
        </button>
      </div>

    </div>
  )
}
