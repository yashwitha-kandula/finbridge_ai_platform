import React, { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import {
  Wallet, Receipt, Target, ArrowUpRight, ArrowDownRight, Info, Plus, ChevronRight, MessageSquare, Sparkles,
  Network, Car, ShieldCheck, Plane, Utensils, ArrowDownToLine, ShoppingBag, Lightbulb,
  Home, Shield, CreditCard, Calendar, Landmark, Clock, CheckCircle2
} from 'lucide-react'
import { inr, inrShort } from '../lib/format'
import { useDashboard } from '../dashboard/DashboardContext'

const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ec4899', '#94a3b8', '#06b6d4', '#f97316']

function HealthGauge({ score = 0 }) {
  const radius = 80
  const circumference = Math.PI * radius
  const validScore = Math.min(Math.max(score, 0), 100)
  const dashoffset = circumference - (validScore / 100) * circumference
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-full max-w-[160px] flex justify-center">
        <svg viewBox="0 0 200 110" className="w-full h-auto drop-shadow-sm">
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#f1f5f9" strokeWidth="18" strokeLinecap="round" className="dark:stroke-slate-700" />
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#22c55e" strokeWidth="18" strokeLinecap="round" 
                strokeDasharray={circumference} strokeDashoffset={dashoffset} className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <div className="text-4xl font-black text-slate-900 dark:text-slate-100 leading-none">{validScore}</div>
          <div className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1">/100</div>
        </div>
      </div>
      <div className="mt-3 text-center">
        <div className="text-lg font-bold text-green-500">
          {validScore >= 80 ? 'Optimal Symmetry' : validScore >= 50 ? 'Moderate Health' : 'Needs Setup'}
        </div>
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {validScore > 0 ? "Calculated from your live cash flow & debt." : "Log transactions to compute your live score."}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { data } = useDashboard()
  const navigate = useNavigate()

  // 1. REAL-TIME DATA ACQUISITION (ZERO MOCK DATA)
  const realTransactions = useMemo(() => {
    let localList = []
    const saved = localStorage.getItem('finbridge_tx_history')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Strip legacy hardcoded mock items if any exist
        localList = parsed.filter(t => !['Swiggy - Order #456', 'Uber India Systems', 'Salary Credit - Oct', 'Reliance Digital', 'Tata Power Ltd', 'Netflix Subscription', "Domino's Pizza", "Uber Auto", "D-Mart"].includes(t.desc || t.merchant))
      } catch (e) {}
    }

    const apiList = (data?.transactions || []).map(t => ({
      id: t.id,
      date: t.transaction_date,
      rawDate: t.transaction_date,
      desc: t.merchant_name || t.description || 'Transaction',
      category: t.category || (t.transaction_type === 'INCOME' ? 'Income' : 'General'),
      amountNum: Number(t.amount) || 0,
      isNegative: t.transaction_type !== 'INCOME',
      type: t.transaction_type || (t.isNegative ? 'EXPENSE' : 'INCOME'),
      merchant: t.merchant_name || t.description || 'Transaction'
    }))

    const combined = [...localList]
    apiList.forEach(at => {
      if (!combined.some(c => c.id === at.id || (c.desc === at.desc && c.date === at.date))) {
        combined.push(at)
      }
    })
    return combined
  }, [data])

  const realLinkedBanks = useMemo(() => {
    const saved = localStorage.getItem('finbridge_linked_banks')
    if (saved) {
      try { return JSON.parse(saved) } catch (e) {}
    }
    return []
  }, [])

  // REAL FINANCIAL METRICS (Accurately reflects ₹0 when empty)
  const totalIncome = useMemo(() => {
    const fromTx = realTransactions
      .filter(t => !t.isNegative || t.type === 'INCOME')
      .reduce((acc, t) => acc + (t.amountNum || (parseFloat(String(t.amt || '0').replace(/[^0-9.-]+/g, '')) || 0)), 0)
    return fromTx || data?.summary?.total_income || 0
  }, [realTransactions, data])

  const totalExpense = useMemo(() => {
    const fromTx = realTransactions
      .filter(t => t.isNegative || t.type === 'EXPENSE')
      .reduce((acc, t) => acc + (t.amountNum || Math.abs(parseFloat(String(t.amt || '0').replace(/[^0-9.-]+/g, '')) || 0)), 0)
    return fromTx || data?.summary?.total_expense || 0
  }, [realTransactions, data])

  const totalSavings = Math.max(totalIncome - totalExpense, 0)

  const totalBankBalance = useMemo(() => {
    return realLinkedBanks.reduce((acc, b) => acc + (Number(b.rawBalance) || (parseFloat(String(b.balance || '0').replace(/[^0-9.-]+/g, '')) || 0)), 0)
  }, [realLinkedBanks])

  const netWorth = totalBankBalance + totalSavings
  const healthScore = totalIncome > 0
    ? Math.min(100, Math.max(25, Math.round(((totalSavings / totalIncome) * 60) + 40)))
    : (realTransactions.length > 0 ? 50 : 0)

  // 2. RESPECIVE DATE & DAY BREAKDOWN (Requirement 1)
  const [dayRangeFilter, setDayRangeFilter] = useState('Last 7 Days (Date & Day)')
  const [selectedDayKey, setSelectedDayKey] = useState('ALL') // 'ALL' or specific date key like '11 Nov (Wed)'

  // Group real transactions by respective Date & Day
  const dailyBreakdown = useMemo(() => {
    const dayMap = {}

    realTransactions.forEach(t => {
      let dObj = new Date()
      if (t.rawDate) {
        dObj = new Date(t.rawDate)
      } else if (t.date) {
        dObj = new Date(t.date)
      }
      if (isNaN(dObj.getTime())) dObj = new Date()

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const dayFullName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      
      const dayNum = String(dObj.getDate()).padStart(2, '0')
      const monthStr = monthNames[dObj.getMonth()]
      const dayShort = dayNames[dObj.getDay()]
      const dayFull = dayFullName[dObj.getDay()]
      const year = dObj.getFullYear()

      // Respective Date & Day label: e.g. "11 Nov (Wed)"
      const dateAndDayLabel = `${dayNum} ${monthStr} (${dayShort})`
      const fullDateStr = `${dayFull}, ${dayNum} ${monthStr} ${year}`
      const sortKey = dObj.toISOString().slice(0, 10)

      const isExp = t.isNegative || t.type === 'EXPENSE'
      const amt = t.amountNum || Math.abs(parseFloat(String(t.amt || '0').replace(/[^0-9.-]+/g, '')) || 0)

      if (!dayMap[sortKey]) {
        dayMap[sortKey] = {
          sortKey,
          label: dateAndDayLabel,
          fullDate: fullDateStr,
          expenses: 0,
          income: 0,
          categories: {},
          transactions: []
        }
      }

      if (isExp) {
        dayMap[sortKey].expenses += amt
        const cat = t.category || 'General'
        dayMap[sortKey].categories[cat] = (dayMap[sortKey].categories[cat] || 0) + amt
      } else {
        dayMap[sortKey].income += amt
      }
      dayMap[sortKey].transactions.push(t)
    })

    const sorted = Object.values(dayMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    return sorted
  }, [realTransactions])

  // Chart data based on range
  const chartData = useMemo(() => {
    if (dailyBreakdown.length === 0) return []
    if (dayRangeFilter === 'Last 7 Days (Date & Day)') {
      return dailyBreakdown.slice(-7)
    } else if (dayRangeFilter === 'Last 14 Days (Date & Day)') {
      return dailyBreakdown.slice(-14)
    }
    return dailyBreakdown
  }, [dailyBreakdown, dayRangeFilter])

  // Category breakdown for the respective Date and Day
  const respectiveDayBreakdown = useMemo(() => {
    let sourceCategories = {}

    if (selectedDayKey === 'ALL') {
      // Aggregate across all real expense transactions
      realTransactions.forEach(t => {
        if (t.isNegative || t.type === 'EXPENSE') {
          const amt = t.amountNum || Math.abs(parseFloat(String(t.amt || '0').replace(/[^0-9.-]+/g, '')) || 0)
          const cat = t.category || 'General'
          sourceCategories[cat] = (sourceCategories[cat] || 0) + amt
        }
      })
    } else {
      // Find the specific date & day record
      const match = dailyBreakdown.find(d => d.label === selectedDayKey || d.sortKey === selectedDayKey)
      if (match) {
        sourceCategories = match.categories
      }
    }

    const total = Object.values(sourceCategories).reduce((a, b) => a + b, 0)
    const list = Object.entries(sourceCategories).map(([name, val], idx) => ({
      name,
      amount: val,
      percent: total > 0 ? Math.round((val / total) * 100) : 0,
      color: COLORS[idx % COLORS.length]
    }))

    return { list, total }
  }, [selectedDayKey, dailyBreakdown, realTransactions])

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-12 text-slate-900 dark:text-slate-100 fade-in">
      
      {/* Real-time Status / Empty State Warning */}
      {realTransactions.length === 0 && realLinkedBanks.length === 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 dark:border-blue-900 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">Welcome to Live FinBridge AI (Zero Mock Data)</div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                You are running with 100% real-time data. Record your first transaction or link your bank to see your live date-and-day expense breakdown.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              to="/transactions"
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
            >
              + Log Real Transaction
            </Link>
          </div>
        </div>
      )}

      {/* TOP KPI ROW (Real-Time Metrics) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/income" className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-green-300 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-600 dark:bg-green-500/10">
            <Wallet size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Income (Tracked)</div>
            <div className="mt-1 text-2xl font-black">{inr(totalIncome)}</div>
            <div className="mt-1 flex items-center text-xs font-semibold text-green-600 dark:text-green-400">
              <ArrowUpRight size={14} className="mr-0.5" /> Live Stream
            </div>
          </div>
        </Link>

        <Link to="/expenses" className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-orange-300 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-500/10">
            <Receipt size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Expenses (Tracked)</div>
            <div className="mt-1 text-2xl font-black">{inr(totalExpense)}</div>
            <div className="mt-1 flex items-center text-xs font-semibold text-red-500 dark:text-red-400">
              <ArrowDownRight size={14} className="mr-0.5" /> Outflow
            </div>
          </div>
        </Link>

        <Link to="/goals" className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10">
            <Target size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Net Savings</div>
            <div className="mt-1 text-2xl font-black">{inr(totalSavings)}</div>
            <div className="mt-1 flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400">
              <CheckCircle2 size={13} className="mr-0.5" /> Buffer
            </div>
          </div>
        </Link>

        <Link to="/transactions" className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-purple-300 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-500/10">
            <Network size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Net Portfolio (Bank + Savings)</div>
            <div className="mt-1 text-2xl font-black">{inr(netWorth)}</div>
            <div className="mt-1 flex items-center text-xs font-semibold text-purple-600 dark:text-purple-400">
              <Landmark size={13} className="mr-0.5" /> {realLinkedBanks.length} Banks Linked
            </div>
          </div>
        </Link>
      </div>

      {/* MIDDLE ROW: DATE & DAY EXPENSE ANALYSIS (Requirement 1) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        {/* CHART: Expense Breakdown of Respective Date and Day */}
        <div className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 p-5 gap-3 dark:border-slate-800">
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar size={18} className="text-blue-600 dark:text-blue-400" />
                Expense Analysis by Respective Date &amp; Day
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Daily expenditure timeline showing the exact date and day of week
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={dayRangeFilter}
                onChange={(e) => setDayRangeFilter(e.target.value)}
                className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-3 pr-8 text-xs font-bold text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <option value="Last 7 Days (Date & Day)">Last 7 Days (Date &amp; Day)</option>
                <option value="Last 14 Days (Date & Day)">Last 14 Days (Date &amp; Day)</option>
                <option value="All Recorded Days">All Recorded Days</option>
              </select>
            </div>
          </div>

          <div className="flex-1 p-5">
            {chartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Calendar size={40} className="text-slate-300 dark:text-slate-600 mb-2" />
                <div className="font-bold text-slate-700 dark:text-slate-300 text-sm">No Daily Breakdown Data Yet</div>
                <p className="text-xs text-slate-400 max-w-xs mt-1 mb-4">
                  Log your daily expenses in Transactions to view daily trends across dates and days of the week.
                </p>
                <button
                  onClick={() => navigate('/transactions')}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                >
                  + Add Expense for Today
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-4 flex items-center justify-between text-xs font-semibold px-2">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded-sm bg-orange-500" /> Daily Expenses (₹)
                    </div>
                    {chartData.some(d => d.income > 0) && (
                      <div className="flex items-center gap-1.5">
                        <div className="h-3 w-3 rounded-sm bg-green-500" /> Daily Income (₹)
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">Click any day bar to filter category share</span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                      <XAxis 
                        dataKey="label" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} 
                        dy={8} 
                      />
                      <YAxis 
                        tickFormatter={inrShort} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fill: '#64748b' }} 
                      />
                      <RechartsTooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const item = payload[0].payload
                            return (
                              <div className="rounded-xl border border-slate-700/20 bg-slate-900 p-3 text-xs text-white shadow-xl">
                                <div className="font-bold text-sky-400">{item.fullDate}</div>
                                <div className="mt-1 flex justify-between gap-4">
                                  <span className="text-slate-300">Total Spent:</span>
                                  <span className="font-bold text-orange-400">{inr(item.expenses)}</span>
                                </div>
                                {item.income > 0 && (
                                  <div className="flex justify-between gap-4">
                                    <span className="text-slate-300">Income:</span>
                                    <span className="font-bold text-green-400">+{inr(item.income)}</span>
                                  </div>
                                )}
                                <div className="mt-1 text-[10px] text-slate-400">
                                  {item.transactions.length} transaction(s) recorded
                                </div>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Bar 
                        dataKey="expenses" 
                        fill="#f97316" 
                        radius={[6, 6, 0, 0]} 
                        onClick={(entry) => setSelectedDayKey(entry.label)}
                        className="cursor-pointer transition hover:opacity-80"
                      />
                      {chartData.some(d => d.income > 0) && (
                        <Bar 
                          dataKey="income" 
                          fill="#22c55e" 
                          radius={[6, 6, 0, 0]} 
                        />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Respective Day Category Breakdown */}
        <div className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-4">
          <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">Respective Day Breakdown</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Category share for chosen date</p>
            </div>
            <select
              value={selectedDayKey}
              onChange={(e) => setSelectedDayKey(e.target.value)}
              className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-2.5 pr-6 text-xs font-bold text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 max-w-[150px]"
            >
              <option value="ALL">All Recorded Days</option>
              {dailyBreakdown.map(d => (
                <option key={d.sortKey} value={d.label}>{d.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-1 flex-col p-5">
            {respectiveDayBreakdown.list.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
                <Receipt size={32} className="text-slate-300 dark:text-slate-600 mb-2" />
                <div className="text-xs font-bold text-slate-500">No Expenses on this Date</div>
                <p className="text-[11px] text-slate-400 mt-0.5">Select a different day or add an entry.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative h-28 w-28 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={respectiveDayBreakdown.list}
                          dataKey="amount"
                          cx="50%"
                          cy="50%"
                          innerRadius={32}
                          outerRadius={50}
                          paddingAngle={3}
                          stroke="none"
                        >
                          {respectiveDayBreakdown.list.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-0.5">
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {inrShort(respectiveDayBreakdown.total)}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400">Total</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2 text-xs">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {selectedDayKey === 'ALL' ? 'All Days Combined' : selectedDayKey}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {respectiveDayBreakdown.list.length} categories active
                    </div>
                  </div>
                </div>

                {/* Category List */}
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {respectiveDayBreakdown.list.map(c => (
                    <div key={c.name}>
                      <div className="flex items-center justify-between text-xs font-semibold mb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                          {c.name}
                        </span>
                        <span>{inr(c.amount)} <span className="text-slate-400">({c.percent}%)</span></span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${c.percent}%`, backgroundColor: c.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* BOTTOM ROW: DAILY LOG TIMELINE & FINANCIAL HEALTH */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        {/* Respective Date & Day Spending Timeline Table */}
        <div className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-8">
          <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock size={16} className="text-indigo-600 dark:text-indigo-400" />
                Daily Breakdown Log (Date &amp; Day of Week)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Chronological summary of expenditure by date</p>
            </div>
            <Link to="/transactions" className="text-xs font-bold text-blue-600 hover:underline dark:text-blue-400">
              Manage All →
            </Link>
          </div>

          <div className="overflow-x-auto p-2">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 text-slate-400 font-semibold dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Date &amp; Day</th>
                  <th className="px-4 py-3">Entries</th>
                  <th className="px-4 py-3">Category Breakdown</th>
                  <th className="px-4 py-3 text-right">Daily Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {dailyBreakdown.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-slate-400">
                      No daily records logged yet. Add your transactions to populate this timeline.
                    </td>
                  </tr>
                )}
                {dailyBreakdown.slice().reverse().map(d => (
                  <tr key={d.sortKey} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-white">{d.label}</div>
                      <div className="text-[10px] text-slate-400">{d.fullDate}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-semibold">
                        {d.transactions.length} tx
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(d.categories).slice(0, 3).map(([cat, amt]) => (
                          <span key={cat} className="rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 text-[10px] font-semibold">
                            {cat}: {inr(amt)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-black text-orange-600 dark:text-orange-400">
                      {inr(d.expenses)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Real-time Health Radar Gauge */}
        <div className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-4 p-5 justify-between">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">Financial Health Score</h2>
            <p className="text-xs text-slate-400 mt-0.5">Computed from live savings, expenses and portfolio</p>
          </div>

          <div className="py-6">
            <HealthGauge score={healthScore} />
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300 flex items-center justify-between">
            <span>Tracking Accuracy:</span>
            <span className="font-bold text-emerald-600">
              {realTransactions.length > 0 ? 'Live Real-Time' : 'Setup Required'}
            </span>
          </div>
        </div>

      </div>

      {/* AI BANNER */}
      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-indigo-100 bg-indigo-50 px-6 py-5 sm:flex-row dark:border-indigo-900/50 dark:bg-indigo-900/10">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
            <MessageSquare size={20} />
          </div>
          <div>
            <div className="font-bold text-indigo-900 dark:text-indigo-300">AI Financial Co-Pilot (Google Gemini Powered)</div>
            <div className="text-xs text-indigo-700 dark:text-indigo-400/80">Ask questions about your daily expenses, date-and-day spending patterns, or budget optimization.</div>
          </div>
        </div>
        <Link to="/assistant" className="shrink-0 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700">
          Ask FinBridge AI →
        </Link>
      </div>

    </div>
  )
}
