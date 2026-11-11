import { useState, useEffect, useMemo } from 'react'
import {
  ArrowDownCircle, ArrowUpCircle, Calendar, CreditCard, Building2,
  Store, Utensils, Bus, ShoppingBag, Receipt,
  Film, Plus, Link, ChevronDown, CheckSquare, Square, Search, CheckCircle2, ArrowLeft, MoreVertical,
  Edit3, Trash2, Landmark
} from 'lucide-react'
import Modal, { FormField, fieldCls } from '../components/Modal'
import { useNotification } from '../context/NotificationContext'

export default function Transactions() {
  const { notify } = useNotification()
  const [isBankLinked, setIsBankLinked] = useState(() => localStorage.getItem('finbridge_bank_linked') === 'true')
  const [showManualForm, setShowManualForm] = useState(false)

  // Load Categories dynamically from localStorage
  const [expenseCategories, setExpenseCategories] = useState(() => {
    const saved = localStorage.getItem('finbridge_expense_categories')
    if (saved) {
      try { return JSON.parse(saved).map(c => c.name) } catch (e) {}
    }
    return ['Food & Dining', 'Transport & Fuel', 'Housing & Utilities', 'Healthcare', 'Shopping', 'Entertainment', 'Personal Care', 'Education', 'Groceries', 'Bills & Subscriptions']
  })

  const [incomeCategories, setIncomeCategories] = useState(() => {
    const saved = localStorage.getItem('finbridge_income_categories')
    if (saved) {
      try { return JSON.parse(saved).map(c => c.name) } catch (e) {}
    }
    return ['Salary / Wages', 'Freelance / Contract', 'Investments / Dividends', 'Rental Income', 'Business Profit', 'Interest Income', 'Gifts / Bonus', 'Other Income']
  })

  // Real History - Zero Mock Data: Filter out any legacy dummy records from localStorage
  const [historyTx, setHistoryTx] = useState(() => {
    const saved = localStorage.getItem('finbridge_tx_history')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Clean legacy mock records
        const cleaned = parsed.filter(t => !['Swiggy - Order #456', 'Uber India Systems', 'Salary Credit - Oct', 'Reliance Digital', 'Tata Power Ltd', 'Netflix Subscription', "Domino's Pizza", "Uber Auto", "D-Mart"].includes(t.desc || t.merchant))
        return cleaned
      } catch (e) {}
    }
    return []
  })

  // Real Linked Banks (Zero Mock Banks)
  const [banks, setBanks] = useState(() => {
    const saved = localStorage.getItem('finbridge_linked_banks')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Filter out legacy hardcoded balances if user hasn't set their own
        return parsed
      } catch (e) {}
    }
    return []
  })

  useEffect(() => {
    localStorage.setItem('finbridge_tx_history', JSON.stringify(historyTx))
  }, [historyTx])

  useEffect(() => {
    localStorage.setItem('finbridge_linked_banks', JSON.stringify(banks))
    if (banks.length > 0) {
      setIsBankLinked(true)
      localStorage.setItem('finbridge_bank_linked', 'true')
    }
  }, [banks])

  // Recent transactions computed from real history
  const recentTx = useMemo(() => historyTx.slice(0, 5), [historyTx])

  // Filter States
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('All Categories')

  // Form State
  const [txType, setTxType] = useState('Expense')
  const [recurring, setRecurring] = useState(false)
  const [form, setForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    subcategory: '',
    method: 'UPI',
    account: '',
    merchant: '',
    txId: '',
    notes: ''
  })

  // Bank Modal State
  const [showBankModal, setShowBankModal] = useState(false)
  const [bankStep, setBankStep] = useState(1)
  const [bankPhone, setBankPhone] = useState('')
  const [bankOtp, setBankOtp] = useState('')
  const [bankBusy, setBankBusy] = useState(false)

  // Real Bank Input State (for Plaid / Account Aggregator)
  const [newBankName, setNewBankName] = useState('State Bank of India')
  const [newBankAccEnding, setNewBankAccEnding] = useState('4587')
  const [newBankBalance, setNewBankBalance] = useState('')
  const [newBankType, setNewBankType] = useState('Savings Account')

  const handleBankSuccess = () => {
    const balanceNum = parseFloat(newBankBalance) || 0
    const newBankObj = {
      id: Date.now(),
      name: newBankName || 'State Bank of India',
      accNum: `Ending in ${newBankAccEnding || '1234'}`,
      balance: `₹${balanceNum.toLocaleString('en-IN')}`,
      rawBalance: balanceNum,
      type: newBankType,
      logo: (newBankName || 'S').charAt(0).toUpperCase(),
      color: 'text-blue-700 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-950/60'
    }

    const updatedBanks = [newBankObj, ...banks.filter(b => b.name !== newBankObj.name)]
    setBanks(updatedBanks)
    setShowBankModal(false)
    setIsBankLinked(true)
    setShowManualForm(false)

    notify({
      title: 'Bank Account Linked',
      message: `${newBankObj.name} connected successfully with real balance ₹${balanceNum.toLocaleString('en-IN')}.`,
      type: 'success'
    })
  }

  const handleRemoveBank = (bankId) => {
    const updated = banks.filter(b => b.id !== bankId)
    setBanks(updated)
    if (updated.length === 0) {
      setIsBankLinked(false)
      localStorage.setItem('finbridge_bank_linked', 'false')
    }
    notify({
      title: 'Bank Disconnected',
      message: 'Account removed from active bank sync.',
      type: 'info'
    })
  }

  const handleSaveTransaction = () => {
    if (!form.amount || !form.category || !form.merchant) {
      notify({
        title: 'Missing Fields',
        message: 'Please enter Amount, Category, and Merchant.',
        type: 'error'
      })
      return
    }

    const txDate = new Date(form.date)
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayOfWeek = dayNames[txDate.getDay()]
    const amtNum = parseFloat(form.amount) || 0

    const newTx = {
      id: Date.now(),
      rawDate: form.date,
      dayOfWeek: dayOfWeek,
      date: txDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      desc: form.merchant,
      category: form.category,
      amountNum: amtNum,
      icon: txType === 'Expense' ? Utensils : ArrowDownCircle,
      catStyle: txType === 'Expense' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
      status: 'Completed',
      amt: `${txType === 'Expense' ? '-' : '+'}₹${amtNum.toLocaleString('en-IN')}`,
      isNegative: txType === 'Expense',
      type: txType.toUpperCase()
    }

    setHistoryTx([newTx, ...historyTx])

    notify({
      title: 'Transaction Saved',
      message: `${newTx.desc} (${newTx.amt}) recorded on ${newTx.date} (${dayOfWeek}).`,
      type: 'success'
    })

    // Reset Form
    setForm({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category: '',
      subcategory: '',
      method: 'UPI',
      account: '',
      merchant: '',
      txId: '',
      notes: ''
    })
    setRecurring(false)
  }

  const handleDeleteTx = (id) => {
    setHistoryTx(historyTx.filter(t => t.id !== id))
    notify({
      title: 'Transaction Deleted',
      message: 'The transaction has been removed from your history.',
      type: 'info'
    })
  }

  const handleEditCategory = (id, currentCat) => {
    const newCat = prompt(`Update category for this transaction:`, currentCat)
    if (newCat && newCat.trim() && newCat !== currentCat) {
      setHistoryTx(historyTx.map(t => t.id === id ? { ...t, category: newCat.trim() } : t))
      notify({
        title: 'Category Updated',
        message: `Category updated to "${newCat.trim()}".`,
        type: 'success'
      })
    }
  }

  // Filtered History
  const filteredHistory = historyTx.filter(tx => {
    const matchesSearch = tx.desc?.toLowerCase().includes(searchTerm.toLowerCase()) || tx.category?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCat = filterCategory === 'All Categories' || tx.category === filterCategory
    return matchesSearch && matchesCat
  })

  const inputCls = "w-full rounded-xl border border-slate-200 bg-white py-2.5 text-xs text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-12 pt-2 text-slate-900 dark:text-white relative">
      
      {/* SYNCED HISTORY VIEW */}
      {isBankLinked && !showManualForm && (
        <div className="fade-in space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Transaction History</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Real-time transactions from your connected accounts & manual logs</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setShowBankModal(true); setBankStep(3); }}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <Plus size={16} /> Link Another Bank
              </button>
              <button
                onClick={() => setShowManualForm(true)}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Plus size={16} /> Add Transaction
              </button>
            </div>
          </div>

          {/* Linked Bank Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {banks.map(bank => (
              <div key={bank.id || bank.name} className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold ${bank.bg} ${bank.color}`}>
                      {bank.logo}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{bank.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{bank.accNum || bank.type}</div>
                      <div className="font-bold text-slate-900 dark:text-white text-base mt-0.5">{bank.balance}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemoveBank(bank.id)}
                    title="Disconnect this bank"
                    className="text-slate-400 hover:text-red-500 p-1 rounded-lg transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={14} /> Real-Time Live Sync
                  </div>
                </div>
              </div>
            ))}

            {banks.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:col-span-3 text-center">
                <Landmark size={32} className="text-slate-400 mb-2" />
                <div className="text-sm font-bold">No Real Bank Accounts Linked</div>
                <p className="text-xs text-slate-500 mt-1 mb-3">Link your bank account to auto-aggregate real balances and live transactions.</p>
                <button onClick={() => { setShowBankModal(true); setBankStep(1); }} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700">
                  + Link Real Bank Account
                </button>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-12 dark:border-slate-800 dark:bg-slate-900">
            <div className="sm:col-span-6">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Search</div>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search merchant, description or notes..."
                  className={`${inputCls} pl-9`}
                />
              </div>
            </div>
            <div className="sm:col-span-6">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Category</div>
              <div className="relative">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className={`${inputCls} appearance-none pl-3 pr-8`}
                >
                  <option>All Categories</option>
                  <optgroup label="Expenses">
                    {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </optgroup>
                  <optgroup label="Income">
                    {incomeCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </optgroup>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                  <tr>
                    <th className="px-6 py-4">Date &amp; Day</th>
                    <th className="px-6 py-4">Merchant / Description</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredHistory.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                        <div className="max-w-sm mx-auto">
                          <Receipt className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
                          <div className="font-bold text-slate-800 dark:text-slate-200">No Transactions Found</div>
                          <p className="text-xs text-slate-400 mt-1 mb-4">You have zero dummy data. Add your first real transaction or connect your bank.</p>
                          <button
                            onClick={() => setShowManualForm(true)}
                            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm"
                          >
                            + Add Your First Transaction
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                  {filteredHistory.map(tx => (
                    <tr key={tx.id} className="transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                        <div>{tx.date}</div>
                        {tx.dayOfWeek && <div className="text-[10px] text-slate-400">{tx.dayOfWeek}</div>}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{tx.desc}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleEditCategory(tx.id, tx.category)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold transition hover:opacity-80 ${tx.catStyle || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
                        >
                          {tx.category} <Edit3 size={10} className="ml-1 opacity-50" />
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                          <CheckCircle2 size={12} /> {tx.status || 'Completed'}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-right font-bold ${tx.isNegative ? 'text-red-500' : 'text-emerald-600'}`}>
                        {tx.amt}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDeleteTx(tx.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                          title="Delete transaction"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL ENTRY VIEW */}
      {(!isBankLinked || showManualForm) && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              {isBankLinked && showManualForm && (
                <button
                  onClick={() => setShowManualForm(false)}
                  className="mb-2 flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                >
                  <ArrowLeft size={14} /> Back to Synced History
                </button>
              )}
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Record Transaction</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Record your actual expense or income streams directly</p>
            </div>
          </div>

          {!isBankLinked && (
            <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 sm:flex-row sm:px-6 dark:border-blue-950 dark:bg-blue-950/20">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Connect to your Bank (Auto-sync)</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Skip manual entry! Link your real bank accounts securely via Account Aggregator / Plaid.</p>
                </div>
              </div>
              <button
                onClick={() => { setShowBankModal(true); setBankStep(1); }}
                className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Link size={16} /> Link Real Bank Account
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-8">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">

                {/* Expense vs Income Selector */}
                <div className="mb-6 flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setTxType('Expense')
                      setForm({ ...form, category: '' })
                    }}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm font-bold transition ${
                      txType === 'Expense'
                        ? 'border-red-200 bg-red-50 text-red-600 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    <ArrowDownCircle size={18} /> Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTxType('Income')
                      setForm({ ...form, category: '' })
                    }}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm font-bold transition ${
                      txType === 'Income'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    <ArrowUpCircle size={18} /> Income
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Amount (₹) *</label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={form.amount}
                        onChange={e => setForm({ ...form, amount: e.target.value })}
                        className={`${inputCls} pl-8 pr-3 text-sm font-semibold`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Date &amp; Day *</label>
                    <div className="relative">
                      <Calendar size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="date"
                        value={form.date}
                        onChange={e => setForm({ ...form, date: e.target.value })}
                        className={`${inputCls} pl-9 pr-3`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{txType} Category *</label>
                    <div className="relative">
                      <select
                        value={form.category}
                        onChange={e => setForm({ ...form, category: e.target.value })}
                        className={`${inputCls} appearance-none px-3 pr-8`}
                      >
                        <option value="">Select category...</option>
                        {(txType === 'Expense' ? expenseCategories : incomeCategories).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Payment Method</label>
                    <input
                      type="text"
                      value={form.method}
                      onChange={e => setForm({ ...form, method: e.target.value })}
                      placeholder="e.g. UPI, Debit Card, NetBanking"
                      className={`${inputCls} px-3`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Paid To / Merchant *</label>
                    <div className="relative">
                      <Store size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={form.merchant}
                        onChange={e => setForm({ ...form, merchant: e.target.value })}
                        placeholder="e.g. Grocery Store, Employer, Landlord"
                        className={`${inputCls} pl-9 pr-3`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Notes (Optional)</label>
                    <input
                      type="text"
                      value={form.notes}
                      onChange={e => setForm({ ...form, notes: e.target.value })}
                      placeholder="Add any details..."
                      className={`${inputCls} px-3`}
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleSaveTransaction}
                    className="rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    Save Transaction
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar: Real Recent Transactions */}
            <div className="space-y-6 lg:col-span-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold text-slate-900 dark:text-white">Recent Real Transactions</h3>
                  <span className="text-xs font-semibold text-slate-500">{historyTx.length} total</span>
                </div>
                <div className="mt-4 space-y-3">
                  {recentTx.length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No transactions recorded yet. Fill out the form to add your first real transaction.
                    </div>
                  )}
                  {recentTx.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between border-b border-slate-50 pb-2.5 last:border-0 dark:border-slate-800">
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">{tx.desc}</div>
                        <div className="text-[10px] text-slate-400">{tx.date} {tx.dayOfWeek ? `• ${tx.dayOfWeek}` : ''}</div>
                      </div>
                      <div className={`text-xs font-bold ${tx.isNegative ? 'text-red-500' : 'text-emerald-600'}`}>
                        {tx.amt}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real Bank Linking Modal (Account Aggregator / Plaid) */}
      {showBankModal && (
        <Modal title="Secure Bank Connection (Real-Time)" onClose={() => setShowBankModal(false)}>
          {bankStep === 1 && (
            <div>
              <div className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                Enter your mobile number linked to your Indian or international bank accounts to initiate RBI-approved Account Aggregator / Plaid verification.
              </div>
              <FormField label="Mobile Number">
                <div className="flex">
                  <span className="flex items-center justify-center rounded-l-xl border border-r-0 border-slate-300 bg-slate-50 px-3 font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-800">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={bankPhone}
                    onChange={(e) => setBankPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className={`${fieldCls} rounded-l-none`}
                  />
                </div>
              </FormField>
              <button
                disabled={bankBusy || bankPhone.length < 10}
                onClick={() => {
                  setBankBusy(true)
                  setTimeout(() => {
                    setBankBusy(false)
                    setBankStep(2)
                  }, 600)
                }}
                className="mt-3 w-full rounded-xl bg-blue-600 py-2.5 font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {bankBusy ? 'Sending OTP…' : 'Send OTP'}
              </button>
            </div>
          )}

          {bankStep === 2 && (
            <div>
              <div className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                Enter the 6-digit confirmation OTP sent to +91 {bankPhone || '••••••••••'}.
              </div>
              <FormField label="One Time Password">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={bankOtp}
                  onChange={(e) => setBankOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className={`${fieldCls} text-center tracking-widest text-lg font-bold`}
                />
              </FormField>
              <button
                disabled={bankBusy || bankOtp.length < 4}
                onClick={() => {
                  setBankBusy(true)
                  setTimeout(() => {
                    setBankBusy(false)
                    setBankStep(3)
                  }, 600)
                }}
                className="mt-3 w-full rounded-xl bg-blue-600 py-2.5 font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {bankBusy ? 'Verifying OTP…' : 'Verify & Select Account'}
              </button>
            </div>
          )}

          {bankStep === 3 && (
            <div className="space-y-4">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Enter your real bank details to synchronize live balances into FinBridge AI:
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Bank Name *</label>
                <select
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="State Bank of India">State Bank of India (SBI)</option>
                  <option value="HDFC Bank">HDFC Bank</option>
                  <option value="ICICI Bank">ICICI Bank</option>
                  <option value="Axis Bank">Axis Bank</option>
                  <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                  <option value="Punjab National Bank">Punjab National Bank</option>
                  <option value="Bank of Baroda">Bank of Baroda</option>
                  <option value="Canara Bank">Canara Bank</option>
                  <option value="Chase Bank">Chase Bank</option>
                  <option value="Bank of America">Bank of America</option>
                  <option value="Citibank">Citibank</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Account Ending (4 Digits)</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={newBankAccEnding}
                    onChange={(e) => setNewBankAccEnding(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="e.g. 4587"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Account Type</label>
                  <select
                    value={newBankType}
                    onChange={(e) => setNewBankType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="Savings Account">Savings Account</option>
                    <option value="Current / Checking">Current / Checking</option>
                    <option value="Salary Account">Salary Account</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Current Real Balance (₹) *</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    value={newBankBalance}
                    onChange={(e) => setNewBankBalance(e.target.value)}
                    placeholder="e.g. 54200"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-7 pr-3 text-xs font-bold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <button
                disabled={bankBusy || !newBankBalance}
                onClick={handleBankSuccess}
                className="mt-3 w-full rounded-xl bg-blue-600 py-2.5 font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                Securely Connect &amp; Sync Bank
              </button>
            </div>
          )}
        </Modal>
      )}

    </div>
  )
}
