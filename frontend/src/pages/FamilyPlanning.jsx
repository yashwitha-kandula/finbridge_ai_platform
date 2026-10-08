import { useState, useEffect, useMemo } from 'react'
import {
  Users, Plus, Edit2, Trash2, Info, GraduationCap,
  Heart, Plane, CalendarHeart, CalendarClock, Shield,
  Lightbulb, Calculator, CheckCircle2, ChevronRight
} from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

/* --- Initial Mock Data --- */
const initialMembers = [
  { id: 1, name: 'Arjun Kumar (You)', rel: 'Self', dob: '1996-06-15', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun&backgroundColor=b6e3f4' },
  { id: 2, name: 'Priya Sharma', rel: 'Spouse', dob: '1997-09-22', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya&backgroundColor=ffdfbf' },
  { id: 3, name: 'Aarav Kumar', rel: 'Son', dob: '2022-03-10', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav&backgroundColor=c0aede' },
  { id: 4, name: 'Ananya Kumar', rel: 'Daughter', dob: '2024-07-18', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya&backgroundColor=ffdfbf' },
]

const initialExpenses = [
  { id: 1, type: 'Higher Education', for: 'Aarav Kumar', year: 2040, todayValue: 1020000, priority: 'High', icon: GraduationCap, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  { id: 2, type: 'Higher Education', for: 'Ananya Kumar', year: 2042, todayValue: 1090000, priority: 'High', icon: GraduationCap, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  { id: 3, type: 'Marriage', for: 'Aarav Kumar', year: 2048, todayValue: 660000, priority: 'Medium', icon: Heart, color: 'text-pink-600', bg: 'bg-pink-100' },
  { id: 4, type: 'Marriage', for: 'Ananya Kumar', year: 2050, todayValue: 630000, priority: 'Medium', icon: Heart, color: 'text-pink-600', bg: 'bg-pink-100' },
  { id: 5, type: 'Parents\' Retirement Care', for: 'Parents', year: 2035, todayValue: 640000, priority: 'Medium', icon: CalendarHeart, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  { id: 6, type: 'Family Vacation Fund', for: 'Family', year: 'Every Year', todayValue: 200000, priority: 'Low', icon: Plane, color: 'text-orange-600', bg: 'bg-orange-100' },
]

const PRIORITY_COLORS = {
  High: '#ef4444',   // red-500
  Medium: '#f97316', // orange-500
  Low: '#10b981',    // emerald-500
}

export default function FamilyPlanning() {
  const [toast, setToast] = useState(null)
  const [members, setMembers] = useState(initialMembers)
  const [expenses, setExpenses] = useState(initialExpenses)
  const [inflationRate, setInflationRate] = useState(6.00) // Default 6%

  const currentYear = new Date().getFullYear()

  // Calculate age dynamically
  const calculateAge = (dob) => {
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  // Calculate Future Cost dynamically based on inflation
  const getFutureCost = (todayValue, targetYear) => {
    if (targetYear === 'Every Year') return todayValue // Doesn't compound if it's an annual recurring
    const years = targetYear - currentYear
    if (years <= 0) return todayValue
    return Math.round(todayValue * Math.pow(1 + (inflationRate / 100), years))
  }

  // Derived Totals
  const totalTodayValue = expenses.reduce((acc, curr) => acc + curr.todayValue, 0)
  const totalFutureCost = expenses.reduce((acc, curr) => acc + getFutureCost(curr.todayValue, curr.year), 0)
  const annualPlanningNeed = 425000 // Mock static value from design, could be calculated based on FV and months

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

  // Actions
  const handleChangeInflation = () => {
    const newRate = window.prompt("Enter new annual inflation rate (%):", inflationRate)
    const parsed = parseFloat(newRate)
    if (!isNaN(parsed) && parsed >= 0) {
      setInflationRate(parsed)
      setToast(`Inflation assumption updated to ${parsed}%. Future costs recalculated!`)
    }
  }

  const handleDeleteMember = (id) => {
    if (window.confirm("Remove this family member?")) {
      setMembers(members.filter(m => m.id !== id))
    }
  }

  const handleEditMember = (id) => {
    const member = members.find(m => m.id === id)
    const newName = window.prompt("Edit Member Name:", member.name)
    if (newName) setMembers(members.map(m => m.id === id ? { ...m, name: newName } : m))
  }

  const handleAddMember = () => {
    const name = window.prompt("Enter new family member name:")
    if (name) {
      setMembers([...members, { id: Date.now(), name, rel: 'Other', dob: '2000-01-01', avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}&backgroundColor=b6e3f4` }])
      setToast('New family member added!')
    }
  }

  const handleDeleteExpense = (id) => {
    if (window.confirm("Remove this future expense?")) {
      setExpenses(expenses.filter(e => e.id !== id))
    }
  }

  const handleEditExpense = (id) => {
    const exp = expenses.find(e => e.id === id)
    const val = window.prompt("Edit Today's Value (₹):", exp.todayValue)
    if (val && !isNaN(val)) setExpenses(expenses.map(e => e.id === id ? { ...e, todayValue: Number(val) } : e))
  }

  const handleAddExpense = () => {
    const type = window.prompt("Enter expense type (e.g. Higher Education):")
    if (type) {
      setExpenses([...expenses, { id: Date.now(), type, for: 'Family', year: 2030, todayValue: 500000, priority: 'Medium', icon: Heart, color: 'text-indigo-600', bg: 'bg-indigo-100' }])
      setToast('New future expense added!')
    }
  }

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  // Helpers for formatting
  const fmt = (num) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(num)
  const getRelBadge = (rel) => {
    switch (rel) {
      case 'Self': return 'bg-blue-50 text-blue-600 border-blue-200'
      case 'Spouse': return 'bg-red-50 text-red-600 border-red-200'
      case 'Son': return 'bg-emerald-50 text-emerald-600 border-emerald-200'
      case 'Daughter': return 'bg-purple-50 text-purple-600 border-purple-200'
      default: return 'bg-slate-50 text-slate-600 border-slate-200'
    }
  }
  const getPriorityBadge = (pri) => {
    switch (pri) {
      case 'High': return 'bg-red-50 text-red-600 border-red-100'
      case 'Medium': return 'bg-orange-50 text-orange-600 border-orange-100'
      case 'Low': return 'bg-emerald-50 text-emerald-600 border-emerald-100'
      default: return 'bg-slate-50 text-slate-600 border-slate-100'
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] pb-10 pt-2 relative">
      
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-xl animate-bounce">
          <CheckCircle2 size={18} /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Family Members & Future Expenses</h1>
          <p className="mt-1 text-sm text-slate-500">Plan for your family's important future needs and milestones.</p>
        </div>
        <button 
          onClick={handleAddMember}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={16} /> Add Family Member
        </button>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        
        {/* LEFT COLUMN: MAIN CONTENT */}
        <div className="space-y-6 lg:col-span-8">
          
          {/* Card 1: Family Members */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-100">
              <div className="flex items-center gap-2 border-b-2 border-blue-600 px-6 py-4 text-sm font-bold text-blue-700 bg-blue-50/30">
                <Users size={18} /> 1. Family Members
              </div>
              <div className="flex items-center gap-2 px-6 py-4 text-sm font-semibold text-slate-400">
                <CalendarClock size={18} /> 2. Future Expenses
              </div>
            </div>

            <div className="p-6 pb-2">
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Relationship</th>
                      <th className="px-4 py-3">Date of Birth</th>
                      <th className="px-4 py-3 text-center">Age</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {members.map(m => (
                      <tr key={m.id} className="transition hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img src={m.avatar} alt={m.name} className="h-8 w-8 rounded-full border border-slate-200 bg-slate-100" />
                            <span className="font-semibold text-slate-900">{m.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-bold ${getRelBadge(m.rel)}`}>
                            {m.rel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {new Date(m.dob).toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-slate-900">
                          {calculateAge(m.dob)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleEditMember(m.id)} className="rounded border border-blue-100 p-1.5 text-blue-600 hover:bg-blue-50 transition">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDeleteMember(m.id)} className="rounded border border-red-100 p-1.5 text-red-500 hover:bg-red-50 transition">
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
              <div className="flex items-center gap-2 rounded-lg bg-blue-50/80 px-4 py-3 text-xs font-medium text-blue-800 border border-blue-100">
                <Info size={16} className="text-blue-600 shrink-0" />
                Add all family members to plan their future financial needs better.
              </div>
            </div>
          </div>

          {/* Card 2: Future Expenses */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2 text-sm font-bold text-purple-700">
                <Users size={18} /> 2. Future Expenses
              </div>
              <button 
                onClick={handleAddExpense}
                className="flex items-center gap-1.5 rounded-lg border border-purple-200 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-50 transition"
              >
                <Plus size={14} /> Add Future Expense
              </button>
            </div>

            <div className="p-6 pb-2">
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Expense Type</th>
                      <th className="px-4 py-3">For</th>
                      <th className="px-4 py-3">Target Year</th>
                      <th className="px-4 py-3 text-right">Estimated Cost (₹)</th>
                      <th className="px-4 py-3 text-right">Today's Value (₹)</th>
                      <th className="px-4 py-3 text-center">Priority</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expenses.map(e => {
                      const futureCost = getFutureCost(e.todayValue, e.year)
                      const yrs = e.year !== 'Every Year' ? `${e.year} (${e.year - currentYear} yrs)` : e.year
                      
                      return (
                        <tr key={e.id} className="transition hover:bg-slate-50/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${e.bg} ${e.color}`}>
                                <e.icon size={14} />
                              </div>
                              <span className="font-semibold text-slate-900">{e.type}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{e.for}</td>
                          <td className="px-4 py-3 text-slate-600">{yrs}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900">{fmt(futureCost)}</td>
                          <td className="px-4 py-3 text-right font-medium text-slate-500">{fmt(e.todayValue)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-bold ${getPriorityBadge(e.priority)}`}>
                              {e.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => handleEditExpense(e.id)} className="rounded border border-blue-100 p-1.5 text-blue-600 hover:bg-blue-50 transition">
                                <Edit2 size={14} />
                              </button>
                              <button onClick={() => handleDeleteExpense(e.id)} className="rounded border border-red-100 p-1.5 text-red-500 hover:bg-red-50 transition">
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
              <div className="flex items-center gap-2 rounded-lg bg-purple-50/80 px-4 py-3 text-xs font-medium text-purple-800 border border-purple-100">
                <Info size={16} className="text-purple-600 shrink-0" />
                Future costs are adjusted for inflation. You can modify assumptions in settings.
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 rounded-xl bg-orange-50/80 px-4 py-4 text-sm font-semibold text-orange-800 border border-orange-100 shadow-sm">
            <Shield size={18} className="text-orange-500 shrink-0" />
            Planning for your family's future today leads to financial security and peace of mind tomorrow.
          </div>

        </div>

        {/* RIGHT COLUMN: WIDGETS */}
        <div className="space-y-6 lg:col-span-4">
          
          {/* Future Expenses Summary */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 font-bold text-blue-700">
              <CalendarClock size={18} /> Future Expenses Summary
            </h2>
            
            <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="text-xs font-bold text-slate-500">Total Future Cost</div>
                <div className="mt-1 text-xl font-bold text-purple-700">₹{fmt(totalFutureCost)}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500">Today's Value</div>
                <div className="mt-1 text-xl font-bold text-blue-600">₹{fmt(totalTodayValue)}</div>
              </div>
            </div>

            <div className="pt-5">
              <div className="text-xs font-bold text-slate-500">Annual Planning Need</div>
              <div className="mt-1 text-2xl font-bold text-emerald-600">₹{fmt(annualPlanningNeed)}</div>
            </div>
          </div>

          {/* Expenses by Priority */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-bold text-slate-800">Expenses by Priority</h2>
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
                  <span className="text-sm font-bold text-slate-800">{expenses.length}</span>
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
                        <span className="text-xs font-bold text-slate-700">{item.name} ({item.count})</span>
                      </div>
                      <div className="ml-3.5 text-[10px] font-medium text-slate-500">
                        ₹{fmt(item.value)} ({percentage}%)
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Inflation Assumption */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-blue-700">
              <Info size={16} /> Inflation Assumption
            </h2>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="text-xs font-semibold text-slate-500">Annual Inflation Rate</div>
                <div className="text-2xl font-bold text-blue-800">{inflationRate.toFixed(2)}%</div>
              </div>
              <button 
                onClick={handleChangeInflation}
                className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 transition"
              >
                Change Assumption
              </button>
            </div>
            <p className="mt-4 text-[10px] text-slate-500 leading-relaxed">
              All future costs are calculated based on the above inflation rate.
            </p>
          </div>

          {/* Pro Tip */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2 font-bold text-emerald-700">
              <Lightbulb size={20} /> Pro Tip
            </div>
            <p className="text-xs leading-relaxed font-medium text-emerald-900">
              Start early and invest regularly to meet these future goals without financial stress.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
