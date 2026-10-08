import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  Wallet, Receipt, Target, ArrowUpRight, ArrowDownRight, Info, Plus, ChevronRight, MessageSquare, Sparkles,
  Network, Car, ShieldCheck, Plane, Utensils, Car as CarIcon, ArrowDownToLine, ShoppingBag, Lightbulb,
  Home, Shield, CreditCard
} from 'lucide-react'
import { inr, inrShort } from '../lib/format'

/* ============================================================
   MOCK DATA (Matching Target Image Exactly)
   ============================================================ */
const trendData = [
  { label: "Dec '23", income: 90000, expenses: 50000 },
  { label: "Jan '24", income: 105000, expenses: 55000 },
  { label: "Feb '24", income: 110000, expenses: 60000 },
  { label: "Mar '24", income: 110000, expenses: 62000 },
  { label: "Apr '24", income: 115000, expenses: 64000 },
  { label: "May '24", income: 120000, expenses: 65000 },
]

const breakdownData = [
  { name: 'Housing', amount: 20000, percent: 30.8, color: '#3b82f6' }, // Blue
  { name: 'Food & Dining', amount: 12000, percent: 18.5, color: '#22c55e' }, // Green
  { name: 'Transport', amount: 8000, percent: 12.3, color: '#eab308' }, // Yellow
  { name: 'Utilities', amount: 6000, percent: 9.2, color: '#a855f7' }, // Purple
  { name: 'Shopping', amount: 7000, percent: 10.8, color: '#ec4899' }, // Pink
  { name: 'Others', amount: 12000, percent: 18.4, color: '#94a3b8' }, // Grey
]

const goalsData = [
  { id: 1, name: 'Buy a Car', current: 240000, target: 600000, percent: 40, date: 'Dec 2025', icon: Car, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', bar: 'bg-blue-500' },
  { id: 2, name: 'Emergency Fund', current: 80000, target: 150000, percent: 53, date: 'Oct 2024', icon: ShieldCheck, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10', bar: 'bg-green-500' },
  { id: 3, name: 'Europe Trip', current: 120000, target: 250000, percent: 48, date: 'May 2025', icon: Plane, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10', bar: 'bg-purple-500' },
]

const transactionsData = [
  { id: 1, merchant: 'Zomato', category: 'Food & Dining', amount: 650, date: '28 May 2024', type: 'EXPENSE', icon: Utensils, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
  { id: 2, merchant: 'Uber', category: 'Transport', amount: 320, date: '28 May 2024', type: 'EXPENSE', icon: CarIcon, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' },
  { id: 3, merchant: 'Salary Credit', category: 'Income', amount: 120000, date: '27 May 2024', type: 'INCOME', icon: ArrowDownToLine, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-500/10' },
  { id: 4, merchant: 'Amazon', category: 'Shopping', amount: 1240, date: '26 May 2024', type: 'EXPENSE', icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
  { id: 5, merchant: 'Electricity Bill', category: 'Utilities', amount: 1850, date: '25 May 2024', type: 'EXPENSE', icon: Lightbulb, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
]

const billsData = [
  { id: 1, name: 'Home Loan EMI', due: '05 Jun 2024', amount: 25000, icon: Home, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
  { id: 2, name: 'Car Insurance', due: '12 Jun 2024', amount: 6500, icon: Shield, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
  { id: 3, name: 'Credit Card Bill', due: '18 Jun 2024', amount: 7850, icon: CreditCard, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
]

/* ============================================================
   CUSTOM SVG GAUGE (100% Clip-Free & Pixel Perfect)
   ============================================================ */
function PerfectGauge({ score }) {
  const radius = 80
  const circumference = Math.PI * radius
  const dashoffset = circumference - (score / 100) * circumference
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-full max-w-[160px] flex justify-center">
        <svg viewBox="0 0 200 110" className="w-full h-auto drop-shadow-sm">
          {/* Background Track */}
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#f1f5f9" strokeWidth="18" strokeLinecap="round" className="dark:stroke-slate-700" />
          {/* Foreground Score */}
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#22c55e" strokeWidth="18" strokeLinecap="round" 
                strokeDasharray={circumference} strokeDashoffset={dashoffset} className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <div className="text-4xl font-black text-slate-900 dark:text-slate-100 leading-none">{score}</div>
          <div className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1">/100</div>
        </div>
      </div>
      <div className="mt-3 text-center">
        <div className="text-lg font-bold text-green-500">Great 🤩</div>
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">You're on the right track!</div>
      </div>
    </div>
  )
}

/* ============================================================
   MAIN DASHBOARD COMPONENT
   ============================================================ */
export default function Dashboard() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-10 text-slate-900 dark:text-slate-100 fade-in">
      
      {/* TOP KPI ROW */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-500/10">
            <Wallet size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Monthly Income</div>
            <div className="mt-1 text-2xl font-bold">₹1,20,000</div>
            <div className="mt-1 flex items-center text-xs font-semibold text-green-600 dark:text-green-400">
              <ArrowUpRight size={14} className="mr-0.5" /> 8.5% <span className="ml-1 font-normal text-slate-400 dark:text-slate-500">vs last month</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-500/10">
            <Receipt size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Monthly Expenses</div>
            <div className="mt-1 text-2xl font-bold">₹65,000</div>
            <div className="mt-1 flex items-center text-xs font-semibold text-red-500 dark:text-red-400">
              <ArrowUpRight size={14} className="mr-0.5" /> 5.2% <span className="ml-1 font-normal text-slate-400 dark:text-slate-500">vs last month</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10">
            <Target size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Savings</div>
            <div className="mt-1 text-2xl font-bold">₹20,000</div>
            <div className="mt-1 flex items-center text-xs font-semibold text-green-600 dark:text-green-400">
              <ArrowUpRight size={14} className="mr-0.5" /> 12.4% <span className="ml-1 font-normal text-slate-400 dark:text-slate-500">vs last month</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10">
            <Network size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Net Worth</div>
            <div className="mt-1 text-2xl font-bold">₹8,45,000</div>
            <div className="mt-1 flex items-center text-xs font-semibold text-green-600 dark:text-green-400">
              <ArrowUpRight size={14} className="mr-0.5" /> 9.1% <span className="ml-1 font-normal text-slate-400 dark:text-slate-500">vs last month</span>
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE ROW */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Income vs Expenses Trend */}
        <div className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:col-span-5">
          <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-700">
            <h2 className="font-bold">Income vs Expenses Trend</h2>
            <select className="rounded-lg border border-slate-200 py-1 pl-2 pr-6 text-xs font-medium text-slate-600 outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300">
              <option>This 6 Months</option>
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
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700" />
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
        <div className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:col-span-4">
          <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-700">
            <h2 className="font-bold">Expense Breakdown</h2>
            <select className="rounded-lg border border-slate-200 py-1 pl-2 pr-6 text-xs font-medium text-slate-600 outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300">
              <option>This Month</option>
            </select>
          </div>
          <div className="flex flex-1 flex-col p-5">
            <div className="flex flex-1 items-center justify-center gap-4">
              {/* Donut Chart */}
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
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">₹65K</div>
                  <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Total</div>
                </div>
              </div>
              
              {/* Legends (Removed overflowing numbers as requested) */}
              <div className="flex-1 space-y-3 pl-2">
                {breakdownData.map((item) => (
                  <div key={item.name} className="flex items-center text-xs">
                    <div className="h-2.5 w-2.5 shrink-0 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                    <div className="font-medium text-slate-700 dark:text-slate-300 truncate">{item.name}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* View Full Report Link */}
            <div className="mt-4 pt-4 text-left border-t border-slate-50 dark:border-slate-700/50">
              <Link to="/expenses" className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
                View Full Report <ChevronRight size={14} className="ml-1" />
              </Link>
            </div>
          </div>
        </div>

        {/* Financial Health Score */}
        <div className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:col-span-3">
          <div className="flex items-center border-b border-slate-100 p-5 font-bold dark:border-slate-700">
            Financial Health Score <Info size={14} className="ml-1.5 text-slate-400" />
          </div>
          <div className="flex flex-1 flex-col justify-center p-5 relative">
            <PerfectGauge score={82} />
            <div className="mt-6 flex items-start justify-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
              <ArrowUpRight size={16} className="text-green-500 shrink-0" />
              <span>Score improved by 6 points from last month.</span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Goals Progress */}
        <div className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:col-span-4">
          <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-700">
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
                    <div className={`h-full rounded-full ${g.bar}`} style={{ width: `${g.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/50 py-2.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50 dark:border-indigo-900 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/40">
              <Plus size={14} /> Add New Goal
            </button>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:col-span-4">
          <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-700">
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
          <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-700">
              <h2 className="font-bold">Upcoming Bills</h2>
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
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">Due on {b.due}</div>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{inr(b.amount)}</div>
                  </div>
                ))}
              </div>
              <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/50 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50 dark:border-indigo-900 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/40">
                <Plus size={14} /> Add New Reminder
              </button>
            </div>
          </div>

          <div className="flex-1 rounded-xl border border-indigo-100 bg-[#f8fafc] p-5 dark:border-indigo-900/50 dark:bg-indigo-950/20">
            <div className="flex items-center gap-2 text-sm font-bold text-indigo-900 dark:text-indigo-300">
              <Sparkles size={16} className="text-indigo-600 dark:text-indigo-400" /> AI Insight
            </div>
            <p className="mt-3 text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300">
              Your dining expenses are 18% higher than last month. 
              <br/><br/>
              You can save around ₹2,500 if you reduce dining out by 2 times a week.
            </p>
            <Link to="/assistant" className="mt-4 flex w-full items-center justify-center gap-1 rounded-lg border border-indigo-200 bg-white py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-900">
              View Suggestions <ChevronRight size={14} />
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
            <div className="text-sm text-indigo-700 dark:text-indigo-400/80">Ask FinScope AI anything about budgeting, saving, investing or planning.</div>
          </div>
        </div>
        <Link to="/assistant" className="shrink-0 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700">
          💬 Ask AI Assistant
        </Link>
      </div>
    </div>
  )
}
