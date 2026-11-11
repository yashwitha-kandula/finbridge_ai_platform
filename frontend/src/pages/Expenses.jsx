import { useState, useEffect } from 'react'
import {
  ArrowDownCircle, ArrowUpCircle, Check, Search, Plus,
  Info, GripVertical, ChevronDown, Edit2, Trash2,
  Lightbulb, Star, CheckCircle2, X
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { useNotification } from '../context/NotificationContext'

const defaultExpenses = [
  { id: 1, name: 'Food & Dining', type: 'Essential', active: true },
  { id: 2, name: 'Transport & Fuel', type: 'Essential', active: true },
  { id: 3, name: 'Housing & Utilities', type: 'Essential', active: true },
  { id: 4, name: 'Healthcare', type: 'Essential', active: true },
  { id: 5, name: 'Shopping', type: 'Non-Essential', active: true },
  { id: 6, name: 'Entertainment', type: 'Non-Essential', active: true },
  { id: 7, name: 'Personal Care', type: 'Non-Essential', active: true },
  { id: 8, name: 'Education', type: 'Essential', active: true }
]

const defaultIncomes = [
  { id: 101, name: 'Salary / Wages', type: 'Primary', active: true },
  { id: 102, name: 'Freelance / Contract', type: 'Secondary', active: true },
  { id: 103, name: 'Investments / Dividends', type: 'Secondary', active: true },
  { id: 104, name: 'Rental Income', type: 'Secondary', active: true },
  { id: 105, name: 'Other Income', type: 'Other', active: true }
]

const Toggle = ({ enabled, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!enabled)}
    className={`relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full transition-colors ${enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
  >
    <span
      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-4.5' : 'translate-x-1'}`}
      style={{ transform: enabled ? 'translateX(18px)' : 'translateX(4px)' }}
    />
  </button>
)

export default function Expenses() {
  const { notify } = useNotification()
  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('finbridge_expense_categories')
    return saved ? JSON.parse(saved) : defaultExpenses
  })

  const [incomes, setIncomes] = useState(() => {
    const saved = localStorage.getItem('finbridge_income_categories')
    return saved ? JSON.parse(saved) : defaultIncomes
  })

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem('finbridge_expense_categories', JSON.stringify(expenses))
  }, [expenses])

  useEffect(() => {
    localStorage.setItem('finbridge_income_categories', JSON.stringify(incomes))
  }, [incomes])

  // Search & Filter State
  const [expSearch, setExpSearch] = useState('')
  const [expFilter, setExpFilter] = useState('All Categories')
  const [incSearch, setIncSearch] = useState('')
  const [incFilter, setIncFilter] = useState('All Categories')

  // Inline New Category States (No Popups!)
  const [newExpName, setNewExpName] = useState('')
  const [newExpType, setNewExpType] = useState('Essential')
  const [showAddExpRow, setShowAddExpRow] = useState(false)

  const [newIncName, setNewIncName] = useState('')
  const [newIncType, setNewIncType] = useState('Primary')
  const [showAddIncRow, setShowAddIncRow] = useState(false)

  // Inline Editing State
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')

  const showToast = (msg) => {
    notify({
      title: 'Categories Updated',
      message: msg,
      type: 'success'
    })
  }

  // Expense Handlers
  const toggleExpense = (id, val) => setExpenses(expenses.map(e => e.id === id ? { ...e, active: val } : e))
  const deleteExpense = (id) => {
    setExpenses(expenses.filter(e => e.id !== id))
    showToast('Expense category removed')
  }

  const handleAddExpense = (e) => {
    e.preventDefault()
    if (!newExpName.trim()) return
    const created = {
      id: Date.now(),
      name: newExpName.trim(),
      type: newExpType,
      active: true
    }
    setExpenses([created, ...expenses])
    setNewExpName('')
    setShowAddExpRow(false)
    showToast(`Added "${created.name}" category!`)
  }

  // Income Handlers
  const toggleIncome = (id, val) => setIncomes(incomes.map(i => i.id === id ? { ...i, active: val } : i))
  const deleteIncome = (id) => {
    setIncomes(incomes.filter(i => i.id !== id))
    showToast('Income category removed')
  }

  const handleAddIncome = (e) => {
    e.preventDefault()
    if (!newIncName.trim()) return
    const created = {
      id: Date.now(),
      name: newIncName.trim(),
      type: newIncType,
      active: true
    }
    setIncomes([created, ...incomes])
    setNewIncName('')
    setShowAddIncRow(false)
    showToast(`Added "${created.name}" category!`)
  }

  // Inline Edit Save
  const saveInlineEdit = (id, isExpense) => {
    if (!editingName.trim()) {
      setEditingId(null)
      return
    }
    if (isExpense) {
      setExpenses(expenses.map(e => e.id === id ? { ...e, name: editingName.trim() } : e))
    } else {
      setIncomes(incomes.map(i => i.id === id ? { ...i, name: editingName.trim() } : i))
    }
    setEditingId(null)
    setEditingName('')
    showToast('Category renamed')
  }

  // Filtered Data
  const filteredExpenses = expenses.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(expSearch.toLowerCase())
    const matchType = expFilter === 'All Categories' || e.type === expFilter
    return matchSearch && matchType
  })

  const filteredIncomes = incomes.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(incSearch.toLowerCase())
    const matchType = incFilter === 'All Categories' || i.type === incFilter
    return matchSearch && matchType
  })

  // Chart Data
  const essentialCount = expenses.filter(e => e.type === 'Essential').length
  const nonEssentialCount = expenses.filter(e => e.type === 'Non-Essential').length
  const chartData = [
    { name: 'Essential', value: essentialCount > 0 ? essentialCount : 1, color: '#ef4444' },
    { name: 'Non-Essential', value: nonEssentialCount, color: '#3b82f6' }
  ].filter(d => d.value > 0)

  // Reusable Category Table
  const CategoryTable = ({ data, onToggle, onDelete, isExpense }) => (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <tr>
            <th className="w-10 px-4 py-3"></th>
            <th className="px-4 py-3">Category Name</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {data.length === 0 && (
            <tr><td colSpan="5" className="px-4 py-6 text-center text-slate-500">No categories found.</td></tr>
          )}
          {data.map(item => (
            <tr key={item.id} className={`transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40 ${!item.active ? 'opacity-60' : ''}`}>
              <td className="px-4 py-3 text-slate-300 dark:text-slate-600">
                <GripVertical size={16} />
              </td>
              <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                {editingId === item.id ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveInlineEdit(item.id, isExpense)}
                      className="h-8 rounded-lg border border-blue-500 px-2 text-xs text-slate-900 outline-none dark:bg-slate-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => saveInlineEdit(item.id, isExpense)}
                      className="rounded bg-blue-600 p-1 text-white hover:bg-blue-700"
                    >
                      <Check size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded bg-slate-200 p-1 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  item.name
                )}
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  item.type === 'Essential' || item.type === 'Primary' ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400' :
                  item.type === 'Non-Essential' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' :
                  'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {item.type}
                </span>
              </td>
              <td className="px-4 py-3">
                <Toggle enabled={item.active} onChange={(val) => onToggle(item.id, val)} />
              </td>
              <td className="px-5 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(item.id)
                      setEditingName(item.name)
                    }}
                    className="rounded-md p-1.5 text-blue-500 transition hover:bg-blue-50 dark:hover:bg-slate-800"
                    title="Edit Name"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    className="rounded-md p-1.5 text-red-500 transition hover:bg-red-50 dark:hover:bg-slate-800"
                    title="Delete Category"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="mx-auto max-w-[1400px] pb-10 pt-2 relative">

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Manage Categories</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Categories help you organize income and expenses without complex popups.</p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8 xl:col-span-9">

          {/* Expense Categories Card */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                  <ArrowDownCircle size={24} />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white">Expense Categories</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Track and categorize expenditures</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={expSearch}
                    onChange={e => setExpSearch(e.target.value)}
                    placeholder="Search category..."
                    className="w-44 rounded-xl border border-slate-200 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="relative">
                  <select
                    value={expFilter}
                    onChange={e => setExpFilter(e.target.value)}
                    className="appearance-none rounded-xl border border-slate-200 py-1.5 pl-3 pr-8 text-xs text-slate-600 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option>All Categories</option>
                    <option>Essential</option>
                    <option>Non-Essential</option>
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddExpRow(!showAddExpRow)}
                  className="flex items-center gap-1 rounded-xl bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>

            {/* Direct Inline Add Row (NO POPUPS) */}
            {showAddExpRow && (
              <form onSubmit={handleAddExpense} className="flex flex-wrap items-center gap-3 border-b border-red-100 bg-red-50/40 p-3.5 dark:border-red-950 dark:bg-red-950/20">
                <span className="text-xs font-bold text-red-700 dark:text-red-400">New Category:</span>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="e.g. Pet Care, Subscriptions"
                  value={newExpName}
                  onChange={(e) => setNewExpName(e.target.value)}
                  className="h-9 min-w-[180px] flex-1 rounded-xl border border-red-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <select
                  value={newExpType}
                  onChange={(e) => setNewExpType(e.target.value)}
                  className="h-9 rounded-xl border border-red-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Essential">Essential</option>
                  <option value="Non-Essential">Non-Essential</option>
                </select>
                <button
                  type="submit"
                  className="h-9 rounded-xl bg-red-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-red-700"
                >
                  Save Category
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddExpRow(false)}
                  className="h-9 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
              </form>
            )}

            <CategoryTable data={filteredExpenses} onToggle={toggleExpense} onDelete={deleteExpense} isExpense={true} />

            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="text-xs font-semibold text-red-600 dark:text-red-400">Total Expense Categories: {filteredExpenses.length}</div>
            </div>
          </div>

          {/* Income Categories Card */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <ArrowUpCircle size={24} />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white">Income Categories</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Organize and track income streams</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={incSearch}
                    onChange={e => setIncSearch(e.target.value)}
                    placeholder="Search category..."
                    className="w-44 rounded-xl border border-slate-200 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="relative">
                  <select
                    value={incFilter}
                    onChange={e => setIncFilter(e.target.value)}
                    className="appearance-none rounded-xl border border-slate-200 py-1.5 pl-3 pr-8 text-xs text-slate-600 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option>All Categories</option>
                    <option>Primary</option>
                    <option>Secondary</option>
                    <option>Other</option>
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddIncRow(!showAddIncRow)}
                  className="flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>

            {/* Direct Inline Add Row (NO POPUPS) */}
            {showAddIncRow && (
              <form onSubmit={handleAddIncome} className="flex flex-wrap items-center gap-3 border-b border-emerald-100 bg-emerald-50/40 p-3.5 dark:border-emerald-950 dark:bg-emerald-950/20">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">New Category:</span>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="e.g. Consulting, Royalties"
                  value={newIncName}
                  onChange={(e) => setNewIncName(e.target.value)}
                  className="h-9 min-w-[180px] flex-1 rounded-xl border border-emerald-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <select
                  value={newIncType}
                  onChange={(e) => setNewIncType(e.target.value)}
                  className="h-9 rounded-xl border border-emerald-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Primary">Primary</option>
                  <option value="Secondary">Secondary</option>
                  <option value="Other">Other</option>
                </select>
                <button
                  type="submit"
                  className="h-9 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                >
                  Save Category
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddIncRow(false)}
                  className="h-9 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
              </form>
            )}

            <CategoryTable data={filteredIncomes} onToggle={toggleIncome} onDelete={deleteIncome} isExpense={false} />

            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Total Income Categories: {filteredIncomes.length}</div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-sm text-blue-800 dark:border-blue-950 dark:bg-blue-950/20 dark:text-blue-300">
            <Info size={18} className="mt-0.5 shrink-0 text-blue-500" />
            <p>New categories are directly saved without popups and are instantly available when logging transactions.</p>
          </div>
        </div>

        {/* RIGHT COLUMN: WIDGETS */}
        <div className="space-y-6 lg:col-span-4 xl:col-span-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Lightbulb size={20} />
              <h2 className="font-bold text-slate-900 dark:text-white">Why Categories Matter?</h2>
            </div>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0 text-blue-500" /> Track your spending habits</li>
              <li className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0 text-blue-500" /> Analyze where your money goes</li>
              <li className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0 text-blue-500" /> Plan budgets and savings better</li>
            </ul>
            <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-950 dark:bg-emerald-950/20">
              <div className="mb-1 flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-400">
                <Star size={16} /> Quick Tips
              </div>
              <p className="text-xs leading-relaxed text-emerald-900 dark:text-emerald-300">Mark essential categories for better 50/30/20 budget planning.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-6 font-bold text-slate-900 dark:text-white">Categories Summary</h2>
            <div className="flex items-center gap-4">
              <div className="relative h-28 w-28 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={2} stroke="none">
                      {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-1">
                  <span className="text-xl font-bold text-slate-900 dark:text-white">{expenses.length}</span>
                  <span className="text-[10px] font-semibold text-slate-500">Total</span>
                </div>
              </div>
              <div className="flex-1 space-y-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500" /> Essential ({essentialCount})
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" /> Non-Essential ({nonEssentialCount})
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4 border-t border-slate-100 pt-5 dark:border-slate-800">
              <div className="flex flex-1 flex-col items-center justify-center rounded-xl bg-slate-50 py-3 dark:bg-slate-800">
                <div className="flex items-center gap-1 text-lg font-bold text-slate-900 dark:text-white">
                  <ArrowUpCircle size={16} className="text-emerald-500" /> {incomes.length}
                </div>
                <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Income Categories</div>
              </div>
              <div className="flex flex-1 flex-col items-center justify-center rounded-xl bg-slate-50 py-3 dark:bg-slate-800">
                <div className="flex items-center gap-1 text-lg font-bold text-slate-900 dark:text-white">
                  <ArrowDownCircle size={16} className="text-red-500" /> {expenses.length}
                </div>
                <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Expense Categories</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
