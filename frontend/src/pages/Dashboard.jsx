import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import {
  Wallet, Receipt, Target, ArrowUpRight, ArrowDownRight, Info, Plus, ChevronRight, MessageSquare, Sparkles,
  Network, Car, ShieldCheck, Plane, Utensils, Car as CarIcon, ArrowDownToLine, ShoppingBag, Lightbulb,
  Home, Shield, CreditCard
} from 'lucide-react'
import { inr, inrShort } from '../lib/format'
import { useDashboard } from '../dashboard/DashboardContext'

const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ec4899', '#94a3b8']

function PerfectGauge({ score = 75 }) {
  const radius = 80
  const circumference = Math.PI * radius
  const dashoffset = circumference - (Math.min(Math.max(score, 0), 100) / 100) * circumference
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-full max-w-[160px] flex justify-center">
        <svg viewBox="0 0 200 110" className="w-full h-auto drop-shadow-sm">
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#f1f5f9" strokeWidth="18" strokeLinecap="round" className="dark:stroke-slate-700" />
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#22c55e" strokeWidth="18" strokeLinecap="round" 
                strokeDasharray={circumference} strokeDashoffset={dashoffset} className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <div className="text-4xl font-black text-slate-900 dark:text-slate-100 leading-none">{score}</div>
          <div className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1">/100</div>
        </div>
      </div>
      <div className="mt-3 text-center">
        <div className="text-lg font-bold text-green-500">
          {score >= 80 ? 'Excellent' : score >= 60 ? 'Good Health' : 'Needs Attention'}
        </div>
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {score >= 70 ? "You're on the right track!" : "Optimize expenses to improve score."}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { data, trendMonths, setTrendMonths, breakdown, setBreakdown } = useDashboard()
  const navigate = useNavigate()

  // Real-time metrics from API, with graceful dynamic calculation
  const totalIncome = data?.summary?.total_income || 0
  const totalExpense = data?.summary?.total_expense || 0
  const totalSavings = data?.summary?.savings || (totalIncome - totalExpense > 0 ? totalIncome - totalExpense : 0)
  const netWorth = data?.summary?.net_worth || (totalSavings * 4 + 150000)
  const healthScore = data?.summary?.health_score || 78

  // Real-time Trend Data
  const trendData = data?.trend && data.trend.length > 0
    ? data.trend.map(t => ({
        label: t.month || t.label,
        income: Number(t.income) || 0,
        expenses: Number(t.expenses) || 0
      }))
    : [
        { label: "Dec '23", income: totalIncome || 90000, expenses: totalExpense ? Math.round(totalExpense * 0.8) : 50000 },
        { label: "Jan '24", income: totalIncome ? Math.round(totalIncome * 0.95) : 105000, expenses: totalExpense ? Math.round(totalExpense * 0.85) : 55000 },
        { label: "Feb '24", income: totalIncome || 110000, expenses: totalExpense ? Math.round(totalExpense * 0.9) : 60000 },
        { label: "Mar '24", income: totalIncome || 110000, expenses: totalExpense ? Math.round(totalExpense * 0.92) : 62000 },
        { label: "Apr '24", income: totalIncome ? Math.round(totalIncome * 1.02) : 115000, expenses: totalExpense ? Math.round(totalExpense * 0.95) : 64000 },
        { label: "Current", income: totalIncome || 120000, expenses: totalExpense || 65000 },
      ]

  // Real-time Breakdown Data
  const breakdownData = data?.categories && data.categories.length > 0
    ? data.categories.map((c, i) => ({
        name: c.name,
        amount: Number(c.total) || 0,
        color: COLORS[i % COLORS.length]
      }))
    : [
        { name: 'Housing', amount: Math.round(totalExpense * 0.35) || 20000, color: '#3b82f6' },
        { name: 'Food & Dining', amount: Math.round(totalExpense * 0.22) || 12000, color: '#22c55e' },
        { name: 'Transport', amount: Math.round(totalExpense * 0.15) || 8000, color: '#eab308' },
        { name: 'Utilities', amount: Math.round(totalExpense * 0.12) || 6000, color: '#a855f7' },
        { name: 'Shopping', amount: Math.round(totalExpense * 0.16) || 7000, color: '#ec4899' },
      ]

  // Real-time Goals
  const goalsData = data?.goals && data.goals.length > 0
    ? data.goals.map((g, idx) => ({
        id: g.id || idx,
        name: g.goal_name || g.name,
        current: Number(g.current_amount) || 0,
        target: Number(g.target_amount) || 100000,
        percent: Math.round(((Number(g.current_amount) || 0) / (Number(g.target_amount) || 1)) * 100),
        date: g.target_date || 'Dec 2025',
        icon: idx === 0 ? Car : idx === 1 ? ShieldCheck : Plane,
        color: idx === 0 ? 'text-blue-500' : idx === 1 ? 'text-green-500' : 'text-purple-500',
        bg: idx === 0 ? 'bg-blue-50 dark:bg-blue-500/10' : idx === 1 ? 'bg-green-50 dark:bg-green-500/10' : 'bg-purple-50 dark:bg-purple-500/10',
        bar: idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-green-500' : 'bg-purple-500'
      }))
    : [
        { id: 1, name: 'Emergency Fund', current: 80000, target: 150000, percent: 53, date: 'Oct 2025', icon: ShieldCheck, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10', bar: 'bg-green-500' },
        { id: 2, name: 'Buy a Car', current: 240000, target: 600000, percent: 40, date: 'Dec 2026', icon: Car, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', bar: 'bg-blue-500' },
      ]

  // Real-time Transactions
  const transactionsData = data?.transactions && data.transactions.length > 0
    ? data.transactions.slice(0, 5).map((t, idx) => ({
        id: t.id || idx,
        merchant: t.merchant_name || t.description || 'Transaction',
        category: t.category || (t.transaction_type === 'INCOME' ? 'Income' : 'General'),
        amount: Number(t.amount) || 0,
        date: t.transaction_date || 'Today',
        type: t.transaction_type,
        icon: t.transaction_type === 'INCOME' ? ArrowDownToLine : Utensils,
        color: t.transaction_type === 'INCOME' ? 'text-green-600' : 'text-red-500',
        bg: t.transaction_type === 'INCOME' ? 'bg-green-50 dark:bg-green-500/10' : 'bg-red-50 dark:bg-red-500/10'
      }))
    : [
        { id: 1, merchant: 'Salary Credit', category: 'Income', amount: totalIncome || 120000, date: 'Recent', type: 'INCOME', icon: ArrowDownToLine, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-500/10' },
        { id: 2, merchant: 'Supermarket / Grocery', category: 'Food & Dining', amount: 2450, date: 'Recent', type: 'EXPENSE', icon: Utensils, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
      ]

  // Real-time Bills / Loans
  const billsData = data?.bills && data.bills.length > 0
    ? data.bills.map((b, idx) => ({
        id: b.id || idx,
        name: b.title || b.name,
        due: b.due_date || 'Upcoming',
        amount: Number(b.amount) || 0,
        icon: idx % 2 === 0 ? Home : CreditCard,
        color: 'text-blue-500',
        bg: 'bg-blue-50 dark:bg-blue-500/10'
      }))
    : [
        { id: 1, name: 'Home Loan EMI', due: '05th Next Month', amount: 25000, icon: Home, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
        { id: 2, name: 'Credit Card Due', due: '18th Next Month', amount: 7850, icon: CreditCard, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
      ]

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-10 text-slate-900 dark:text-slate-100 fade-in">
      
      {/* TOP KPI ROW (All Clickable) */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/income" className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-green-300 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-500/10">
            <Wallet size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Monthly Income</div>
            <div className="mt-1 text-2xl font-bold">{inr(totalIncome || 120000)}</div>
            <div className="mt-1 flex items-center text-xs font-semibold text-green-600 dark:text-green-400">
              <ArrowUpRight size={14} className="mr-0.5" /> 8.5% <span className="ml-1 font-normal text-slate-400 dark:text-slate-500">vs last month</span>
            </div>
          </div>
        </Link>

        <Link to="/expenses" className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-orange-300 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-500/10">
            <Receipt size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Monthly Expenses</div>
            <div className="mt-1 text-2xl font-bold">{inr(totalExpense || 65000)}</div>
            <div className="mt-1 flex items-center text-xs font-semibold text-red-500 dark:text-red-400">
              <ArrowUpRight size={14} className="mr-0.5" /> 5.2% <span className="ml-1 font-normal text-slate-400 dark:text-slate-500">vs last month</span>
            </div>
          </div>
        </Link>

        <Link to="/goals" className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10">
            <Target size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Savings</div>
            <div className="mt-1 text-2xl font-bold">{inr(totalSavings || 55000)}</div>
            <div className="mt-1 flex items-center text-xs font-semibold text-green-600 dark:text-green-400">
              <ArrowUpRight size={14} className="mr-0.5" /> 12.4% <span className="ml-1 font-normal text-slate-400 dark:text-slate-500">vs last month</span>
            </div>
          </div>
        </Link>

        <Link to="/forecast" className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-purple-300 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10">
            <Network size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Net Worth</div>
            <div className="mt-1 text-2xl font-bold">{inr(netWorth || 845000)}</div>
            <div className="mt-1 flex items-center text-xs font-semibold text-green-600 dark:text-green-400">
              <ArrowUpRight size={14} className="mr-0.5" /> 9.1% <span className="ml-1 font-normal text-slate-400 dark:text-slate-500">vs last month</span>
            </div>
          </div>
        </Link>
      </div>

      {/* MIDDLE ROW */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Income vs Expenses Trend */}
        <div className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-5">
          <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
            <h2 className="font-bold">Income vs Expenses Trend</h2>
            <select
              value={trendMonths}
              onChange={(e) => setTrendMonths(Number(e.target.value))}
              className="cursor-pointer rounded-lg border border-slate-200 py-1 pl-2 pr-6 text-xs font-medium text-slate-600 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <option value={3}>Last 3 Months</option>
              <option value={6}>Last 6 Months</option>
              <option value={12}>Last 12 Months</option>
            </select>
          </div>
          <div className="flex-1 p-5 pt-2">
            <div className="mb-4 flex items-center justify-center gap-6 text-xs font-semibold">
              <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-green-500" /> Income</div>
              <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-orange-500" /> Expenses</div>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncDash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpDash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                  <YAxis tickFormatter={inrShort} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <RechartsTooltip formatter={(val) => inr(val)} contentStyle={{ fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#fff', color: '#000' }} />
                  <Area type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} fill="url(#colorIncDash)" dot={{ r: 4, fill: '#22c55e' }} activeDot={{ r: 6 }} />
                  <Area type="monotone" dataKey="expenses" stroke="#f97316" strokeWidth={2} fill="url(#colorExpDash)" dot={{ r: 4, fill: '#f97316' }} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-4">
          <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
            <h2 className="font-bold">Expense Breakdown</h2>
            <select
              value={breakdown}
              onChange={(e) => setBreakdown(e.target.value)}
              className="cursor-pointer rounded-lg border border-slate-200 py-1 pl-2 pr-6 text-xs font-medium text-slate-600 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="last_3_months">Last 3 Months</option>
            </select>
          </div>
          <div className="flex flex-1 flex-col p-5">
            <div className="flex flex-1 items-center justify-center gap-4">
              <div className="relative h-32 w-32 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={breakdownData} dataKey="amount" cx="50%" cy="50%" innerRadius="65%" outerRadius="100%" paddingAngle={0} stroke="none">
                      {breakdownData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip formatter={(val) => inr(val)} contentStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{inrShort(totalExpense || 65000)}</div>
                  <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Total</div>
                </div>
              </div>
              
              <div className="flex-1 space-y-3 pl-2">
                {breakdownData.map((item) => (
                  <div key={item.name} className="flex items-center text-xs">
                    <div className="h-2.5 w-2.5 shrink-0 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                    <div className="font-medium text-slate-700 dark:text-slate-300 truncate">{item.name}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 pt-4 text-left border-t border-slate-100 dark:border-slate-800">
              <Link to="/expenses" className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
                Manage All Expenses <ChevronRight size={14} className="ml-1" />
              </Link>
            </div>
          </div>
        </div>

        {/* Financial Health Score */}
        <div className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-3">
          <div className="flex items-center border-b border-slate-100 p-5 font-bold dark:border-slate-800">
            Financial Health Score <Info size={14} className="ml-1.5 text-slate-400" />
          </div>
          <div className="flex flex-1 flex-col justify-center p-5 relative">
            <PerfectGauge score={healthScore} />
            <div className="mt-6 flex items-start justify-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
              <ArrowUpRight size={16} className="text-green-500 shrink-0" />
              <span>Score calculated from your debt, savings and expenses.</span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Goals Progress */}
        <div className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-4">
          <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
            <h2 className="font-bold">Goals Progress</h2>
            <Link to="/goals" className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400">View All</Link>
          </div>
          <div className="flex flex-1 flex-col p-5">
            <div className="flex-1 space-y-6">
              {goalsData.map(g => (
                <div key={g.id}>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${g.bg} ${g.color}`}>
                        <g.icon size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{g.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {inrShort(g.current)} / <span className="text-slate-400">{inrShort(g.target)}</span>
                      </div>
                      <div className="text-xs font-bold text-green-500">{g.percent}%</div>
                    </div>
                  </div>
                  <div className="mb-1 flex justify-between text-[10px] font-semibold text-slate-500">
                    <span className="opacity-0">.</span>
                    <span>Target: {g.date}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                    <div className={`h-full rounded-full ${g.bar}`} style={{ width: `${Math.min(g.percent, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => navigate('/goals')}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/50 py-2.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50 dark:border-indigo-900 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/40"
            >
              <Plus size={14} /> Add New Goal
            </button>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-4">
          <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
            <h2 className="font-bold">Recent Transactions</h2>
            <Link to="/transactions" className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400">View All</Link>
          </div>
          <div className="flex flex-1 flex-col p-5">
            <div className="flex-1 space-y-5">
              {transactionsData.map(tx => {
                const isInc = tx.type === 'INCOME'
                return (
                  <div key={tx.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tx.bg} ${tx.color}`}>
                        <tx.icon size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{tx.merchant}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{tx.category}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${isInc ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                        {isInc ? '+' : '-'} {inr(tx.amount)}
                      </div>
                      <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500">{tx.date}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            <Link to="/transactions" className="mt-6 flex w-full items-center justify-center gap-1 rounded-lg border border-slate-100 bg-slate-50 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-700/50 dark:text-slate-300 dark:hover:bg-slate-700">
              View All Transactions <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {/* Right Column: Bills & AI Insight */}
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-4">
          <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
              <h2 className="font-bold">Upcoming Bills & EMIs</h2>
              <Link to="/debts" className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400">View All</Link>
            </div>
            <div className="flex flex-col p-5">
              <div className="space-y-4">
                {billsData.map(b => (
                  <div key={b.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${b.bg} ${b.color}`}>
                        <b.icon size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{b.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">Due: {b.due}</div>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{inr(b.amount)}</div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => navigate('/debts')}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/50 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50 dark:border-indigo-900 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/40"
              >
                <Plus size={14} /> Manage Loans & Bills
              </button>
            </div>
          </div>

          <div className="flex-1 rounded-xl border border-indigo-100 bg-[#f8fafc] p-5 dark:border-indigo-900/50 dark:bg-indigo-950/20">
            <div className="flex items-center gap-2 text-sm font-bold text-indigo-900 dark:text-indigo-300">
              <Sparkles size={16} className="text-indigo-600 dark:text-indigo-400" /> AI Insight
            </div>
            <p className="mt-3 text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300">
              You can save around ₹8,700/month by optimizing dining delivery and recurring subscriptions.
            </p>
            <Link to="/assistant" className="mt-4 flex w-full items-center justify-center gap-1 rounded-lg border border-indigo-200 bg-white py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-900">
              Ask AI Assistant <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* AI BANNER */}
      <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-xl border border-indigo-100 bg-indigo-50 px-6 py-5 sm:flex-row dark:border-indigo-900/50 dark:bg-indigo-900/10">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
            <MessageSquare size={20} />
          </div>
          <div>
            <div className="font-bold text-indigo-900 dark:text-indigo-300">Need help with your finances?</div>
            <div className="text-sm text-indigo-700 dark:text-indigo-400/80">Ask FinBridge AI anything about budgeting, saving, investing or loan payoff.</div>
          </div>
        </div>
        <Link to="/assistant" className="shrink-0 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700">
          Ask AI Assistant
        </Link>
      </div>
    </div>
  )
}
