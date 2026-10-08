import { useState } from 'react'
import {
  ArrowDownCircle, ArrowUpCircle, Check, Search, Plus, 
  Info, GripVertical, ChevronDown, Edit2, Trash2, 
  Lightbulb, Star
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

/* --- Initial Data --- */
const initialExpenses = [
  { id: 1, name: 'Food & Dining', type: 'Essential', active: true },
  { id: 2, name: 'Transport & Fuel', type: 'Essential', active: true },
  { id: 3, name: 'Housing & Utilities', type: 'Essential', active: true },
  { id: 4, name: 'Healthcare', type: 'Essential', active: true },
  { id: 5, name: 'Shopping', type: 'Non-Essential', active: true },
  { id: 6, name: 'Entertainment', type: 'Non-Essential', active: true },
  { id: 7, name: 'Personal Care', type: 'Non-Essential', active: true },
  { id: 8, name: 'Education', type: 'Essential', active: false }
]

const initialIncomes = [
  { id: 101, name: 'Salary / Wages', type: 'Primary', active: true },
  { id: 102, name: 'Freelance / Contract', type: 'Secondary', active: true },
  { id: 103, name: 'Investments / Dividends', type: 'Secondary', active: true },
  { id: 104, name: 'Rental Income', type: 'Secondary', active: true },
  { id: 105, name: 'Other Income', type: 'Other', active: true }
]

// Toggle Component
const Toggle = ({ enabled, onChange }) => (
  <div 
    onClick={() => onChange(!enabled)}
    className={`relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full transition-colors ${enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
  >
    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-4.5' : 'translate-x-1'}`} style={{ transform: enabled ? 'translateX(18px)' : 'translateX(4px)' }} />
  </div>
)

export default function Expenses() {
  const [expenses, setExpenses] = useState(initialExpenses)
  const [incomes, setIncomes] = useState(initialIncomes)
  
  // Search & Filter State
  const [expSearch, setExpSearch] = useState('')
  const [expFilter, setExpFilter] = useState('All Categories')
  const [incSearch, setIncSearch] = useState('')
  const [incFilter, setIncFilter] = useState('All Categories')

  // Expense Handlers
  const toggleExpense = (id, val) => setExpenses(expenses.map(e => e.id === id ? { ...e, active: val } : e))
  const deleteExpense = (id) => {
    if (window.confirm("Delete this expense category?")) setExpenses(expenses.filter(e => e.id !== id))
  }
  const editExpense = (id) => {
    const exp = expenses.find(e => e.id === id)
    const newName = window.prompt("Edit category name:", exp.name)
    if (newName) setExpenses(expenses.map(e => e.id === id ? { ...e, name: newName } : e))
  }
  const addExpense = () => {
    const newName = window.prompt("Enter new Expense Category name:")
    if (newName) {
      const type = window.prompt("Is this Essential or Non-Essential?", "Essential")
      setExpenses([...expenses, { id: Date.now(), name: newName, type: type || 'Non-Essential', active: true }])
    }
  }

  // Income Handlers
  const toggleIncome = (id, val) => setIncomes(incomes.map(i => i.id === id ? { ...i, active: val } : i))
  const deleteIncome = (id) => {
    if (window.confirm("Delete this income category?")) setIncomes(incomes.filter(i => i.id !== id))
  }
  const editIncome = (id) => {
    const inc = incomes.find(i => i.id === id)
    const newName = window.prompt("Edit category name:", inc.name)
    if (newName) setIncomes(incomes.map(i => i.id === id ? { ...i, name: newName } : i))
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
    { name: 'Essential', value: essentialCount > 0 ? essentialCount : 1, color: '#ef4444' }, // default 1 if empty to show donut
    { name: 'Non-Essential', value: nonEssentialCount, color: '#3b82f6' }
  ].filter(d => d.value > 0)

  // Reusable Table
  const Table = ({ data, onToggle, onEdit, onDelete, isExpense }) => (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs font-bold text-slate-600">
          <tr>
            <th className="w-10 px-4 py-3"></th>
            <th className="px-4 py-3">Category Name</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.length === 0 && (
             <tr><td colSpan="5" className="px-4 py-6 text-center text-slate-500">No categories found.</td></tr>
          )}
          {data.map(item => (
            <tr key={item.id} className={`transition hover:bg-slate-50/50 ${!item.active ? 'opacity-60' : ''}`}>
              <td className="px-4 py-3 text-slate-300 hover:text-slate-500 cursor-move">
                <GripVertical size={16} />
              </td>
              <td className="px-4 py-3 font-semibold text-slate-900">{item.name}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  item.type === 'Essential' || item.type === 'Primary' ? 'bg-red-50 text-red-600' :
                  item.type === 'Non-Essential' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'
                }`}>
                  {item.type}
                </span>
              </td>
              <td className="px-4 py-3">
                <Toggle enabled={item.active} onChange={(val) => onToggle(item.id, val)} />
              </td>
              <td className="px-5 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button onClick={() => onEdit(item.id)} className="rounded-md p-1.5 text-blue-500 transition hover:bg-blue-50">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => onDelete(item.id)} className="rounded-md p-1.5 text-red-500 transition hover:bg-red-50">
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
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Categories</h1>
          <p className="mt-1 text-sm text-slate-500">Categories help you organize your income and expenses for better analysis.</p>
        </div>
        <button onClick={addExpense} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700">
          <Plus size={16} /> Add New Category
        </button>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8 xl:col-span-9">
          
          {/* Expense Categories Card */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                  <ArrowDownCircle size={24} />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">Expense Categories</h2>
                  <p className="text-xs text-slate-500">Manage where your money goes</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" value={expSearch} onChange={e => setExpSearch(e.target.value)} placeholder="Search category..." className="w-48 rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
                <div className="relative">
                  <select value={expFilter} onChange={e => setExpFilter(e.target.value)} className="appearance-none rounded-lg border border-slate-200 py-2 pl-3 pr-8 text-xs text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                    <option>All Categories</option>
                    <option>Essential</option>
                    <option>Non-Essential</option>
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
            
            <Table data={filteredExpenses} onToggle={toggleExpense} onEdit={editExpense} onDelete={deleteExpense} isExpense={true} />
            
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-4">
              <div className="text-xs font-semibold text-red-600">Total Expense Categories: {filteredExpenses.length}</div>
            </div>
          </div>

          {/* Income Categories Card */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <ArrowUpCircle size={24} />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">Income Categories</h2>
                  <p className="text-xs text-slate-500">Organize and track your income sources</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" value={incSearch} onChange={e => setIncSearch(e.target.value)} placeholder="Search category..." className="w-48 rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
                <div className="relative">
                  <select value={incFilter} onChange={e => setIncFilter(e.target.value)} className="appearance-none rounded-lg border border-slate-200 py-2 pl-3 pr-8 text-xs text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                    <option>All Categories</option>
                    <option>Primary</option>
                    <option>Secondary</option>
                    <option>Other</option>
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
            
            <Table data={filteredIncomes} onToggle={toggleIncome} onEdit={editIncome} onDelete={deleteIncome} isExpense={false} />
            
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-4">
              <div className="text-xs font-semibold text-emerald-600">Total Income Categories: {filteredIncomes.length}</div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50/50 p-4 text-sm text-blue-800">
            <Info size={18} className="mt-0.5 shrink-0 text-blue-500" />
            <p>You can reorder categories using drag & drop. Changes are saved automatically.</p>
          </div>
        </div>

        {/* RIGHT COLUMN: WIDGETS */}
        <div className="space-y-6 lg:col-span-4 xl:col-span-3">
          
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-blue-600">
              <Lightbulb size={20} />
              <h2 className="font-bold text-slate-900">Why Categories Matter?</h2>
            </div>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0 text-blue-500" /> Track your spending habits</li>
              <li className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0 text-blue-500" /> Analyze where your money goes</li>
              <li className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0 text-blue-500" /> Plan budgets and savings better</li>
            </ul>
            <div className="mt-5 rounded-lg border border-emerald-100 bg-emerald-50/50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold text-emerald-800">
                <Star size={16} /> Quick Tips
              </div>
              <p className="text-xs leading-relaxed text-emerald-900">Mark essential categories for better budget planning.</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-6 font-bold text-slate-900">Categories Summary</h2>
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
                  <span className="text-xl font-bold text-slate-900">{expenses.length}</span>
                  <span className="text-[10px] font-semibold text-slate-500">Total</span>
                </div>
              </div>
              <div className="flex-1 space-y-3 text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500" /> Essential ({essentialCount})
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" /> Non-Essential ({nonEssentialCount})
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4 border-t border-slate-100 pt-5">
              <div className="flex flex-1 flex-col items-center justify-center rounded-lg bg-slate-50 py-3">
                <div className="flex items-center gap-1 text-lg font-bold text-slate-900">
                  <ArrowUpCircle size={16} className="text-emerald-500" /> {incomes.length}
                </div>
                <div className="text-[10px] font-medium text-slate-500">Income Categories</div>
              </div>
              <div className="flex flex-1 flex-col items-center justify-center rounded-lg bg-slate-50 py-3">
                <div className="flex items-center gap-1 text-lg font-bold text-slate-900">
                  <ArrowDownCircle size={16} className="text-red-500" /> {expenses.length}
                </div>
                <div className="text-[10px] font-medium text-slate-500">Expense Categories</div>
              </div>
            </div>
          </div>

          <div onClick={addExpense} className="group flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-slate-200 bg-white p-5 transition hover:border-blue-400 hover:bg-blue-50/30">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition group-hover:bg-blue-100 group-hover:scale-105">
              <Plus size={24} />
            </div>
            <div>
              <h3 className="font-bold text-blue-700">Add Custom Category</h3>
              <p className="mt-0.5 text-xs text-slate-500">Create a new category to match your lifestyle and needs.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
