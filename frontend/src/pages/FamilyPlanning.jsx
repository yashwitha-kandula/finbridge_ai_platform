import { useState, useEffect, useMemo } from 'react'
import {
  Users, Plus, Edit2, Trash2, Info, GraduationCap,
  Heart, Plane, CalendarHeart, CalendarClock, Shield,
  Lightbulb, CheckCircle2, ChevronRight, X, Calendar
} from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const defaultMembers = [
  { id: 1, name: 'Arjun Kumar (You)', rel: 'Self', dob: '1996-06-15', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun&backgroundColor=b6e3f4' },
  { id: 2, name: 'Priya Sharma', rel: 'Spouse', dob: '1997-09-22', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya&backgroundColor=ffdfbf' },
  { id: 3, name: 'Aarav Kumar', rel: 'Son', dob: '2022-03-10', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav&backgroundColor=c0aede' },
  { id: 4, name: 'Ananya Kumar', rel: 'Daughter', dob: '2024-07-18', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya&backgroundColor=ffdfbf' },
]

const defaultExpenses = [
  { id: 1, type: 'Higher Education', for: 'Aarav Kumar', year: 2040, todayValue: 1020000, priority: 'High', icon: GraduationCap, color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-950/60' },
  { id: 2, type: 'Higher Education', for: 'Ananya Kumar', year: 2042, todayValue: 1090000, priority: 'High', icon: GraduationCap, color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-950/60' },
  { id: 3, type: 'Marriage', for: 'Aarav Kumar', year: 2048, todayValue: 660000, priority: 'Medium', icon: Heart, color: 'text-pink-600', bg: 'bg-pink-100 dark:bg-pink-950/60' },
  { id: 4, type: 'Marriage', for: 'Ananya Kumar', year: 2050, todayValue: 630000, priority: 'Medium', icon: Heart, color: 'text-pink-600', bg: 'bg-pink-100 dark:bg-pink-950/60' },
  { id: 5, type: 'Parents\' Retirement Care', for: 'Parents', year: 2035, todayValue: 640000, priority: 'Medium', icon: CalendarHeart, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-950/60' },
  { id: 6, type: 'Family Vacation Fund', for: 'Family', year: 'Every Year', todayValue: 200000, priority: 'Low', icon: Plane, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-950/60' },
]

const PRIORITY_COLORS = {
  High: '#ef4444',
  Medium: '#f97316',
  Low: '#10b981',
}

export default function FamilyPlanning() {
  const [toast, setToast] = useState(null)
  const [members, setMembers] = useState(() => {
    const saved = localStorage.getItem('finbridge_family_members')
    return saved ? JSON.parse(saved) : defaultMembers
  })
  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('finbridge_family_expenses')
    return saved ? JSON.parse(saved) : defaultExpenses
  })
  const [inflationRate, setInflationRate] = useState(6.00)

  // Modals State
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [memberForm, setMemberForm] = useState({ id: null, name: '', rel: 'Child', dob: '2015-05-10' })

  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [expenseForm, setExpenseForm] = useState({ id: null, type: '', for: 'Family', year: 2030, todayValue: 500000, priority: 'Medium' })

  const [showInflationModal, setShowInflationModal] = useState(false)
  const [tempInflation, setTempInflation] = useState('6.00')

  const currentYear = new Date().getFullYear()

  // Sync localStorage
  useEffect(() => {
    localStorage.setItem('finbridge_family_members', JSON.stringify(members))
  }, [members])

  useEffect(() => {
    localStorage.setItem('finbridge_family_expenses', JSON.stringify(expenses))
  }, [expenses])

  // Calculate age dynamically from DOB
  const calculateAge = (dob) => {
    if (!dob) return 0
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return Math.max(0, age)
  }

  // Calculate Future Cost dynamically based on inflation
  const getFutureCost = (todayValue, targetYear) => {
    if (targetYear === 'Every Year') return todayValue
    const yr = Number(targetYear) || currentYear
    const years = yr - currentYear
    if (years <= 0) return todayValue
    return Math.round(todayValue * Math.pow(1 + (inflationRate / 100), years))
  }

  // Derived Totals
  const totalTodayValue = expenses.reduce((acc, curr) => acc + curr.todayValue, 0)
  const totalFutureCost = expenses.reduce((acc, curr) => acc + getFutureCost(curr.todayValue, curr.year), 0)
  const annualPlanningNeed = 425000

  // Chart Data
  const chartData = useMemo(() => {
    const grouped = expenses.reduce((acc, curr) => {
      acc[curr.priority] = (acc[curr.priority] || 0) + curr.todayValue
      return acc
    }, {})

    return Object.entries(PRIORITY_COLORS).map(([priority, color]) => ({
      name: priority,
      value: grouped[priority] || 0,
      count: expenses.filter(e => e.priority === priority).length,
      color
    })).filter(d => d.value > 0)
  }, [expenses])

  const totalChartValue = chartData.reduce((acc, curr) => acc + curr.value, 0)

  // Toast
  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // Member Handlers
  const handleOpenAddMember = () => {
    setMemberForm({ id: null, name: '', rel: 'Child', dob: '2015-05-10' })
    setShowMemberModal(true)
  }

  const handleOpenEditMember = (m) => {
    setMemberForm({ id: m.id, name: m.name, rel: m.rel, dob: m.dob })
    setShowMemberModal(true)
  }

  const handleSaveMember = (e) => {
    e.preventDefault()
    if (!memberForm.name.trim()) return showToast('Please enter member name')

    if (memberForm.id) {
      setMembers(members.map(m => m.id === memberForm.id ? { ...m, name: memberForm.name.trim(), rel: memberForm.rel, dob: memberForm.dob } : m))
      showToast('Family member details updated!')
    } else {
      const newM = {
        id: Date.now(),
        name: memberForm.name.trim(),
        rel: memberForm.rel,
        dob: memberForm.dob,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(memberForm.name)}&backgroundColor=b6e3f4`
      }
      setMembers([...members, newM])
      showToast('New family member added!')
    }
    setShowMemberModal(false)
  }

  const handleDeleteMember = (id) => {
    setMembers(members.filter(m => m.id !== id))
    showToast('Member removed')
  }

  // Expense Handlers
  const handleOpenAddExpense = () => {
    setExpenseForm({
      id: null,
      type: '',
      for: members[0]?.name || 'Family',
      year: currentYear + 5,
      todayValue: 500000,
      priority: 'Medium'
    })
    setShowExpenseModal(true)
  }

  const handleOpenEditExpense = (e) => {
    setExpenseForm({
      id: e.id,
      type: e.type,
      for: e.for,
      year: e.year,
      todayValue: e.todayValue,
      priority: e.priority
    })
    setShowExpenseModal(true)
  }

  const handleSaveExpense = (e) => {
    e.preventDefault()
    if (!expenseForm.type.trim()) return showToast('Please enter expense type')

    if (expenseForm.id) {
      setExpenses(expenses.map(ex => ex.id === expenseForm.id ? {
        ...ex,
        type: expenseForm.type.trim(),
        for: expenseForm.for,
        year: expenseForm.year,
        todayValue: Number(expenseForm.todayValue) || 0,
        priority: expenseForm.priority
      } : ex))
      showToast('Future expense updated!')
    } else {
      const newEx = {
        id: Date.now(),
        type: expenseForm.type.trim(),
        for: expenseForm.for,
        year: expenseForm.year,
        todayValue: Number(expenseForm.todayValue) || 0,
        priority: expenseForm.priority,
        icon: GraduationCap,
        color: 'text-indigo-600',
        bg: 'bg-indigo-100 dark:bg-indigo-950/60'
      }
      setExpenses([...expenses, newEx])
      showToast('New future expense added!')
    }
    setShowExpenseModal(false)
  }

  const handleDeleteExpense = (id) => {
    setExpenses(expenses.filter(e => e.id !== id))
    showToast('Expense removed')
  }

  const handleSaveInflation = (e) => {
    e.preventDefault()
    const rate = parseFloat(tempInflation)
    if (!isNaN(rate) && rate >= 0) {
      setInflationRate(rate)
      setShowInflationModal(false)
      showToast(`Inflation rate updated to ${rate}%. All future costs recalculated!`)
    }
  }

  const fmt = (num) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(num)

  const getRelBadge = (rel) => {
    switch (rel) {
      case 'Self': return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900'
      case 'Spouse': return 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900'
      case 'Son': case 'Child': return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900'
      case 'Daughter': return 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900'
      default: return 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
    }
  }

  const getPriorityBadge = (pri) => {
    switch (pri) {
      case 'High': return 'bg-red-50 text-red-600 border-red-100 dark:bg-red-950/40 dark:text-red-400'
      case 'Medium': return 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-950/40 dark:text-orange-400'
      case 'Low': return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400'
      default: return 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800 dark:text-slate-400'
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] pb-10 pt-2 relative">

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border border-slate-700/20 bg-slate-900/90 px-5 py-3 text-sm font-medium text-white shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-slate-800/95 transition-all">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Family Planning &amp; Future Milestones</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage family members, dates of birth, ages, and future inflation-adjusted costs.</p>
        </div>
        <button
          onClick={handleOpenAddMember}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={16} /> Add Family Member
        </button>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">

        {/* LEFT COLUMN: MAIN CONTENT */}
        <div className="space-y-6 lg:col-span-8">

          {/* Card 1: Family Members */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
            <div className="flex border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 border-b-2 border-blue-600 px-6 py-4 text-sm font-bold text-blue-700 bg-blue-50/30 dark:bg-blue-950/20 dark:text-blue-400">
                <Users size={18} /> 1. Family Members
              </div>
            </div>

            <div className="p-6 pb-2">
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-600 border-b border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Relationship</th>
                      <th className="px-4 py-3">Date of Birth</th>
                      <th className="px-4 py-3 text-center">Age (Years)</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {members.map(m => (
                      <tr key={m.id} className="transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img src={m.avatar} alt={m.name} className="h-8 w-8 rounded-full border border-slate-200 bg-slate-100 dark:border-slate-700" />
                            <span className="font-semibold text-slate-900 dark:text-white">{m.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-lg border px-2.5 py-0.5 text-[10px] font-bold ${getRelBadge(m.rel)}`}>
                            {m.rel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono text-xs">
                          {m.dob}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-900 dark:text-white">
                          {calculateAge(m.dob)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditMember(m)}
                              className="rounded-lg border border-blue-100 p-1.5 text-blue-600 hover:bg-blue-50 transition dark:border-blue-900/40 dark:hover:bg-blue-950/40"
                              title="Edit Member (Name, Relationship, DOB, Age)"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteMember(m.id)}
                              className="rounded-lg border border-red-100 p-1.5 text-red-500 hover:bg-red-50 transition dark:border-red-900/40 dark:hover:bg-red-950/40"
                              title="Delete Member"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 pt-2">
              <div className="flex items-center gap-2 rounded-xl bg-blue-50/80 px-4 py-3 text-xs font-medium text-blue-800 border border-blue-100 dark:border-blue-950 dark:bg-blue-950/20 dark:text-blue-300">
                <Info size={16} className="text-blue-600 shrink-0" />
                Edit any family member's Name, Relationship, Date of Birth, or Age directly using the edit icon.
              </div>
            </div>
          </div>

          {/* Card 2: Future Expenses */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2 text-sm font-bold text-purple-700 dark:text-purple-400">
                <CalendarClock size={18} /> 2. Future Expenses &amp; Milestones
              </div>
              <button
                onClick={handleOpenAddExpense}
                className="flex items-center gap-1.5 rounded-xl border border-purple-200 px-3.5 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-50 transition dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-950/40"
              >
                <Plus size={14} /> Add Future Expense
              </button>
            </div>

            <div className="p-6 pb-2">
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-600 border-b border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3">Expense Category</th>
                      <th className="px-4 py-3">For</th>
                      <th className="px-4 py-3">Target Year</th>
                      <th className="px-4 py-3 text-right">Future Cost ({inflationRate}%)</th>
                      <th className="px-4 py-3 text-right">Today's Value</th>
                      <th className="px-4 py-3 text-center">Priority</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {expenses.map(e => {
                      const futureCost = getFutureCost(e.todayValue, e.year)
                      const yrs = e.year !== 'Every Year' ? `${e.year} (${Number(e.year) - currentYear} yrs)` : e.year

                      return (
                        <tr key={e.id} className="transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                            {e.type}
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{e.for}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{yrs}</td>
                          <td className="px-4 py-3 text-right font-bold text-purple-600 dark:text-purple-400">₹{fmt(futureCost)}</td>
                          <td className="px-4 py-3 text-right font-medium text-slate-500 dark:text-slate-400">₹{fmt(e.todayValue)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex rounded-lg border px-2.5 py-0.5 text-[10px] font-bold ${getPriorityBadge(e.priority)}`}>
                              {e.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEditExpense(e)}
                                className="rounded-lg border border-blue-100 p-1.5 text-blue-600 hover:bg-blue-50 transition dark:border-blue-900/40 dark:hover:bg-blue-950/40"
                                title="Edit All Columns (Category, Member, Year, Cost, Priority)"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(e.id)}
                                className="rounded-lg border border-red-100 p-1.5 text-red-500 hover:bg-red-50 transition dark:border-red-900/40 dark:hover:bg-red-950/40"
                                title="Delete Expense"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 pt-2">
              <div className="flex items-center gap-2 rounded-xl bg-purple-50/80 px-4 py-3 text-xs font-medium text-purple-800 border border-purple-100 dark:border-purple-950 dark:bg-purple-950/20 dark:text-purple-300">
                <Info size={16} className="text-purple-600 shrink-0" />
                Click the edit button on any expense to modify category, associated family member, target year, today's value, or priority.
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 rounded-2xl bg-orange-50/80 px-4 py-4 text-sm font-semibold text-orange-800 border border-orange-100 shadow-sm dark:border-orange-950 dark:bg-orange-950/20 dark:text-orange-300">
            <Shield size={18} className="text-orange-500 shrink-0" />
            Planning for your family's future today leads to financial security and peace of mind tomorrow.
          </div>

        </div>

        {/* RIGHT COLUMN: WIDGETS */}
        <div className="space-y-6 lg:col-span-4">

          {/* Future Expenses Summary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 flex items-center gap-2 font-bold text-blue-700 dark:text-blue-400">
              <CalendarClock size={18} /> Future Expenses Summary
            </h2>

            <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
              <div>
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Future Cost</div>
                <div className="mt-1 text-xl font-bold text-purple-700 dark:text-purple-400">₹{fmt(totalFutureCost)}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Today's Value</div>
                <div className="mt-1 text-xl font-bold text-blue-600 dark:text-blue-400">₹{fmt(totalTodayValue)}</div>
              </div>
            </div>

            <div className="pt-5">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Annual Planning Need</div>
              <div className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">₹{fmt(annualPlanningNeed)}</div>
            </div>
          </div>

          {/* Expenses by Priority */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 font-bold text-slate-800 dark:text-white">Expenses by Priority</h2>
            <div className="flex items-center justify-between">
              <div className="h-[120px] w-[120px] shrink-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%" cy="50%"
                      innerRadius={35} outerRadius={55}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${fmt(value)}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-sm font-bold text-slate-800 dark:text-white">{expenses.length}</span>
                  <span className="text-[10px] font-semibold text-slate-500">Total</span>
                </div>
              </div>

              <div className="ml-4 flex-1 space-y-3">
                {chartData.map(item => {
                  const percentage = ((item.value / totalChartValue) * 100).toFixed(1)
                  return (
                    <div key={item.name} className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.name} ({item.count})</span>
                      </div>
                      <div className="ml-3.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                        ₹{fmt(item.value)} ({percentage}%)
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Inflation Assumption */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-blue-700 dark:text-blue-400">
              <Info size={16} /> Inflation Assumption
            </h2>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Annual Inflation Rate</div>
                <div className="text-2xl font-bold text-blue-800 dark:text-blue-300">{inflationRate.toFixed(2)}%</div>
              </div>
              <button
                onClick={() => {
                  setTempInflation(inflationRate.toString())
                  setShowInflationModal(true)
                }}
                className="rounded-xl border border-blue-200 px-3.5 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 transition dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/40"
              >
                Change Assumption
              </button>
            </div>
            <p className="mt-4 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              All future costs and corpus requirements are automatically calculated based on the above rate.
            </p>
          </div>

          {/* Pro Tip */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm dark:border-emerald-950 dark:bg-emerald-950/20">
            <div className="mb-2 flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400">
              <Lightbulb size={20} /> Pro Tip
            </div>
            <p className="text-xs leading-relaxed font-medium text-emerald-900 dark:text-emerald-300">
              Start equity SIPs early to build the corpus needed for education and milestones without taking high-interest loans.
            </p>
          </div>

        </div>
      </div>

      {/* MEMBER EDIT / ADD MODAL */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {memberForm.id ? 'Edit Family Member' : 'Add Family Member'}
              </h3>
              <button onClick={() => setShowMemberModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveMember} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Full Name</label>
                <input
                  type="text"
                  required
                  value={memberForm.name}
                  onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                  placeholder="e.g. Aarav Kumar"
                  className="mt-1 block h-10 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Relationship</label>
                <select
                  value={memberForm.rel}
                  onChange={(e) => setMemberForm({ ...memberForm, rel: e.target.value })}
                  className="mt-1 block h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Self">Self</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Son">Son</option>
                  <option value="Daughter">Daughter</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Brother">Brother</option>
                  <option value="Sister">Sister</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Date of Birth</label>
                <input
                  type="date"
                  required
                  min="1900-01-01"
                  max={new Date().toISOString().split('T')[0]}
                  value={memberForm.dob}
                  onChange={(e) => setMemberForm({ ...memberForm, dob: e.target.value })}
                  className="mt-1 block h-10 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="rounded-xl bg-blue-50/80 p-3 text-xs text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                <span className="font-bold">Calculated Age:</span> {calculateAge(memberForm.dob)} years old
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  {memberForm.id ? 'Save Changes' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FUTURE EXPENSE EDIT / ADD MODAL (ALL COLUMNS) */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {expenseForm.id ? 'Edit Future Expense' : 'Add Future Expense'}
              </h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveExpense} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Expense Category / Milestone</label>
                <input
                  type="text"
                  required
                  value={expenseForm.type}
                  onChange={(e) => setExpenseForm({ ...expenseForm, type: e.target.value })}
                  placeholder="e.g. Higher Education, Marriage"
                  className="mt-1 block h-10 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">For Family Member</label>
                <select
                  value={expenseForm.for}
                  onChange={(e) => setExpenseForm({ ...expenseForm, for: e.target.value })}
                  className="mt-1 block h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Family">Whole Family</option>
                  <option value="Parents">Parents</option>
                  {members.map(m => (
                    <option key={m.id} value={m.name}>{m.name} ({m.rel})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Target Year</label>
                  <input
                    type="number"
                    min={currentYear}
                    max={2070}
                    value={expenseForm.year}
                    onChange={(e) => setExpenseForm({ ...expenseForm, year: e.target.value })}
                    className="mt-1 block h-10 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Priority</label>
                  <select
                    value={expenseForm.priority}
                    onChange={(e) => setExpenseForm({ ...expenseForm, priority: e.target.value })}
                    className="mt-1 block h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Today's Estimated Cost (₹)</label>
                <input
                  type="number"
                  min="1000"
                  step="5000"
                  required
                  value={expenseForm.todayValue}
                  onChange={(e) => setExpenseForm({ ...expenseForm, todayValue: e.target.value })}
                  placeholder="e.g. 1000000"
                  className="mt-1 block h-10 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="rounded-xl bg-purple-50/80 p-3 text-xs text-purple-900 dark:bg-purple-950/40 dark:text-purple-300">
                <span className="font-bold">Projected Future Cost:</span> ₹{fmt(getFutureCost(Number(expenseForm.todayValue) || 0, expenseForm.year))} at {inflationRate}% inflation.
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-700"
                >
                  {expenseForm.id ? 'Save Changes' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INFLATION ASSUMPTION MODAL */}
      {showInflationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Annual Inflation Rate</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Used to compute future expense valuations.</p>
            <form onSubmit={handleSaveInflation} className="mt-4 space-y-4">
              <div>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="25"
                  required
                  value={tempInflation}
                  onChange={(e) => setTempInflation(e.target.value)}
                  className="block h-10 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInflationModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  Update Rate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
