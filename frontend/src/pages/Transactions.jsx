import { useState, useEffect } from 'react'
import {
  ArrowDownCircle, ArrowUpCircle, Calendar, CreditCard, Building2,
  Store, CloudUpload, ShieldCheck, Utensils, Bus, ShoppingBag, Receipt,
  Film, HeartPulse, GraduationCap, MoreHorizontal, X, Plus, Lightbulb,
  Link, ChevronDown, CheckSquare, Square, Search, CheckCircle2, ArrowLeft, MoreVertical,
  Edit3
} from 'lucide-react'
import Modal, { FormField, fieldCls } from '../components/Modal'

/* --- Initial Mock Data --- */
const initialRecentTx = [
  { id: 101, name: "Domino's Pizza", desc: "Lunch with teammates", amt: "- ₹850", date: "17 May 2024", icon: Utensils, color: 'text-orange-500', bg: 'bg-orange-100' },
  { id: 102, name: "Uber Auto", desc: "Office to home", amt: "- ₹180", date: "17 May 2024", icon: Bus, color: 'text-blue-500', bg: 'bg-blue-100' },
  { id: 103, name: "D-Mart", desc: "Groceries", amt: "- ₹1,250", date: "16 May 2024", icon: ShoppingBag, color: 'text-orange-500', bg: 'bg-orange-100' },
]

const initialHistoryTx = [
  { id: 1, date: '14 Oct 2024', desc: 'Swiggy - Order #456', category: 'Food & Dining', icon: Utensils, catStyle: 'bg-orange-100 text-orange-700', status: 'Completed', amt: '-₹1,249.00', isNegative: true },
  { id: 2, date: '14 Oct 2024', desc: 'Uber India Systems', category: 'Transport', icon: Bus, catStyle: 'bg-blue-100 text-blue-700', status: 'Completed', amt: '-₹450.00', isNegative: true },
  { id: 3, date: '13 Oct 2024', desc: 'Salary Credit - Oct', category: 'Income', icon: ArrowDownCircle, catStyle: 'bg-emerald-100 text-emerald-700', status: 'Completed', amt: '+₹85,000.00', isNegative: false },
  { id: 4, date: '13 Oct 2024', desc: 'Reliance Digital', category: 'Electronics', icon: ShoppingBag, catStyle: 'bg-blue-100 text-blue-700', status: 'Completed', amt: '-₹32,999.00', isNegative: true },
  { id: 5, date: '12 Oct 2024', desc: 'Tata Power Ltd', category: 'Utilities', icon: Receipt, catStyle: 'bg-yellow-100 text-yellow-700', status: 'Completed', amt: '-₹4,870.00', isNegative: true },
  { id: 6, date: '11 Oct 2024', desc: 'Netflix Subscription', category: 'Entertainment', icon: Film, catStyle: 'bg-purple-100 text-purple-700', status: 'Completed', amt: '-₹499.00', isNegative: true },
]

const banks = [
  { name: 'HDFC Bank', balance: '₹4,52,780.00', logo: 'H', color: 'text-blue-700', bg: 'bg-blue-100' },
  { name: 'ICICI Bank', balance: '₹1,25,930.50', logo: 'I', color: 'text-orange-700', bg: 'bg-orange-100' },
  { name: 'Axis Bank', balance: '₹67,412.00', logo: 'A', color: 'text-purple-700', bg: 'bg-purple-100' },
]

export default function Transactions() {
  // Navigation States
  const [isBankLinked, setIsBankLinked] = useState(false)
  const [showManualForm, setShowManualForm] = useState(false)

  // Data States (making the UI actually interactive)
  const [recentTx, setRecentTx] = useState(initialRecentTx)
  const [historyTx, setHistoryTx] = useState(initialHistoryTx)
  
  // History Filter States
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('All Categories')

  // Form States (Controlled Inputs)
  const [txType, setTxType] = useState('Expense')
  const [recurring, setRecurring] = useState(false)
  const [form, setForm] = useState({
    amount: '', date: new Date().toISOString().split('T')[0], category: '',
    subcategory: '', method: '', account: '', merchant: '', txId: '', notes: ''
  })
  const [toast, setToast] = useState(null)
  
  // Modal States
  const [showBankModal, setShowBankModal] = useState(false)
  const [bankStep, setBankStep] = useState(1)
  const [bankBusy, setBankBusy] = useState(false)

  // Toast Auto-hide
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const handleBankSuccess = () => {
    setShowBankModal(false)
    setIsBankLinked(true)
    setShowManualForm(false)
  }

  const handleSaveTransaction = () => {
    if (!form.amount || !form.category || !form.merchant) {
      alert("Please fill in Amount, Category, and Merchant!")
      return
    }

    const newTx = {
      id: Date.now(),
      date: new Date(form.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      desc: form.merchant,
      category: form.category,
      icon: txType === 'Expense' ? Utensils : ArrowDownCircle,
      catStyle: txType === 'Expense' ? 'bg-slate-100 text-slate-700' : 'bg-emerald-100 text-emerald-700',
      status: 'Completed',
      amt: `${txType === 'Expense' ? '-' : '+'}₹${parseFloat(form.amount).toLocaleString()}`,
      isNegative: txType === 'Expense'
    }

    // Add to history and recent
    setHistoryTx([newTx, ...historyTx])
    setRecentTx([{
      id: newTx.id, name: form.merchant, desc: form.notes || form.category, 
      amt: newTx.amt, date: newTx.date, icon: newTx.icon, color: 'text-slate-600', bg: 'bg-slate-100'
    }, ...recentTx.slice(0, 4)])

    // Clear form & show toast
    setForm({ ...form, amount: '', merchant: '', notes: '', txId: '', subcategory: '' })
    setToast("Transaction successfully saved!")
  }

  const handleEditCategory = (id, currentCat) => {
    const newCat = window.prompt("Enter new category:", currentCat)
    if (newCat && newCat.trim() !== "") {
      setHistoryTx(historyTx.map(tx => tx.id === id ? { ...tx, category: newCat } : tx))
      setToast("Category updated!")
    }
  }

  // Filter Logic
  const filteredHistory = historyTx.filter(tx => {
    const matchesSearch = tx.desc.toLowerCase().includes(searchTerm.toLowerCase()) || tx.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCat = filterCategory === 'All Categories' || tx.category.toLowerCase().includes(filterCategory.toLowerCase())
    return matchesSearch && matchesCat
  })

  const InputLabel = ({ text, required }) => (
    <label className="mb-1.5 block text-xs font-bold text-slate-700">
      {text} {required && <span className="text-red-500">*</span>}
    </label>
  )
  const inputCls = "w-full rounded-lg border border-slate-200 bg-white py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"

  return (
    <div className="mx-auto max-w-[1400px] pb-10 pt-2 relative">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-xl animate-bounce">
          <CheckCircle2 size={18} /> {toast}
        </div>
      )}

      {/* ========================================================
          VIEW: SYNCED HISTORY
          ======================================================== */}
      {isBankLinked && !showManualForm && (
        <div className="fade-in">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-slate-900">Transaction History</h1>
            <div className="flex items-center gap-3">
              <button onClick={() => setToast('AI Assistant connecting...')} className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-100">
                ✨ Ask AI
              </button>
              <button 
                onClick={() => setShowManualForm(true)}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
              >
                <Plus size={16} /> Add Manual Transaction
              </button>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {banks.map(bank => (
              <div key={bank.name} className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${bank.bg} ${bank.color}`}>
                      {bank.logo}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{bank.name}</div>
                      <div className="text-xs text-slate-500">Balance:</div>
                      <div className="font-bold text-slate-900">{bank.balance}</div>
                    </div>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600" onClick={() => alert(`Actions for ${bank.name} clicked!`)}>
                    <MoreVertical size={16} />
                  </button>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                    <CheckCircle2 size={14} /> Synced just now
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="mb-6 grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-12">
            <div className="sm:col-span-5">
              <div className="text-xs font-bold text-slate-700 mb-1.5">Search</div>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search merchant or category..." className={`${inputCls} pl-9`} />
              </div>
            </div>
            <div className="sm:col-span-4">
              <div className="text-xs font-bold text-slate-700 mb-1.5">Date Range</div>
              <div className="relative">
                <select className={`${inputCls} appearance-none pl-3 pr-8`}>
                  <option>1 Oct 2022 - 1 Oct 2024</option>
                  <option>This Month</option>
                  <option>Last 6 Months</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="sm:col-span-3">
              <div className="text-xs font-bold text-slate-700 mb-1.5">Category</div>
              <div className="relative">
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={`${inputCls} appearance-none pl-3 pr-8`}>
                  <option>All Categories</option>
                  <option>Food</option>
                  <option>Transport</option>
                  <option>Income</option>
                  <option>Electronics</option>
                  <option>Utilities</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Merchant/Description</th>
                    <th className="px-6 py-4">Category (Click to edit)</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.length === 0 && (
                     <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No transactions found matching your filters.</td></tr>
                  )}
                  {filteredHistory.map(tx => (
                    <tr key={tx.id} className="transition hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-medium text-slate-700">{tx.date}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{tx.desc}</td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => handleEditCategory(tx.id, tx.category)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold transition hover:opacity-80 ${tx.catStyle}`}
                        >
                          <tx.icon size={12} /> {tx.category} <Edit3 size={10} className="ml-1 opacity-50" />
                        </button>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{tx.status}</td>
                      <td className={`px-6 py-4 text-right font-bold ${tx.isNegative ? 'text-red-600' : 'text-emerald-600'}`}>
                        {tx.amt}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


      {/* ========================================================
          VIEW: MANUAL ADD
          ======================================================== */}
      {(!isBankLinked || showManualForm) && (
        <div className="fade-in">
          
          <div className="mb-6 flex items-center justify-between">
            <div>
              {isBankLinked && showManualForm && (
                <button onClick={() => setShowManualForm(false)} className="mb-2 flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800">
                  <ArrowLeft size={14} /> Back to History
                </button>
              )}
              <h1 className="text-2xl font-bold text-slate-900">Add New Transaction</h1>
              <p className="mt-1 text-sm text-slate-500">Record your daily income or expense manually</p>
            </div>
          </div>

          {!isBankLinked && (
            <div className="mb-6 flex flex-col items-center justify-between gap-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 sm:flex-row sm:px-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-indigo-900">Connect to your Bank (Auto-sync)</h3>
                  <p className="text-sm text-indigo-700">Skip manual entry! Link your bank account securely via OTP.</p>
                </div>
              </div>
              <button 
                onClick={() => { setShowBankModal(true); setBankStep(1); }} 
                className="flex shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
              >
                <Link size={16} /> Link Bank Account
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-8">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                
                <div className="mb-6 flex gap-4">
                  <button 
                    onClick={() => setTxType('Expense')}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-3 text-sm font-bold transition ${txType === 'Expense' ? 'border-red-200 bg-red-50 text-red-600' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                  >
                    <ArrowDownCircle size={18} /> Expense
                  </button>
                  <button 
                    onClick={() => setTxType('Income')}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-3 text-sm font-bold transition ${txType === 'Income' ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                  >
                    <ArrowUpCircle size={18} /> Income
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  {/* Datalists for allowing free-text custom inputs alongside suggestions */}
                  <datalist id="category-list">
                    <option value="Food & Dining" />
                    <option value="Transport" />
                    <option value="Shopping" />
                    <option value="Utilities" />
                    <option value="Income" />
                  </datalist>
                  <datalist id="method-list">
                    <option value="UPI" />
                    <option value="Credit Card" />
                    <option value="Debit Card" />
                    <option value="Cash" />
                    <option value="Net Banking" />
                  </datalist>
                  <datalist id="account-list">
                    <option value="HDFC Bank - 4587" />
                    <option value="ICICI Bank - 9021" />
                    <option value="Cash Wallet" />
                  </datalist>

                  <div>
                    <InputLabel text="Amount (₹)" required />
                    <div className="relative">
                      <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="0" className={`${inputCls} pl-3 pr-10`} />
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-medium text-slate-400">₹</div>
                    </div>
                  </div>
                  <div>
                    <InputLabel text="Transaction Type" required />
                    <div className="relative">
                      <ArrowDownCircle size={16} className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${txType === 'Expense' ? 'text-red-500' : 'text-emerald-500'}`} />
                      <select value={txType} onChange={e => setTxType(e.target.value)} className={`${inputCls} appearance-none pl-9 pr-8`}>
                        <option>Expense</option>
                        <option>Income</option>
                      </select>
                      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                  <div>
                    <InputLabel text="Date" required />
                    <div className="relative">
                      <Calendar size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className={`${inputCls} pl-9`} />
                    </div>
                  </div>

                  <div>
                    <InputLabel text="Category" required />
                    <div className="relative">
                      <Utensils size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-orange-500" />
                      <input list="category-list" value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="e.g. Food" className={`${inputCls} pl-9`} />
                    </div>
                  </div>
                  <div>
                    <InputLabel text="Subcategory" />
                    <input type="text" value={form.subcategory} onChange={e => setForm({...form, subcategory: e.target.value})} placeholder="e.g. Lunch" className={`${inputCls} pl-3`} />
                  </div>
                  <div>
                    <InputLabel text="Payment Method" required />
                    <div className="relative">
                      <CreditCard size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input list="method-list" value={form.method} onChange={e => setForm({...form, method: e.target.value})} placeholder="e.g. UPI" className={`${inputCls} pl-9`} />
                    </div>
                  </div>

                  <div>
                    <InputLabel text="Account / Wallet" />
                    <div className="relative">
                      <Building2 size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input list="account-list" value={form.account} onChange={e => setForm({...form, account: e.target.value})} placeholder="e.g. HDFC Bank" className={`${inputCls} pl-9`} />
                    </div>
                  </div>
                  <div>
                    <InputLabel text="Paid To / Merchant" required />
                    <div className="relative">
                      <Store size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" value={form.merchant} onChange={e => setForm({...form, merchant: e.target.value})} placeholder="e.g. Domino's Pizza" className={`${inputCls} pl-9`} />
                    </div>
                  </div>
                  <div>
                    <InputLabel text="Transaction ID (Optional)" />
                    <input type="text" value={form.txId} onChange={e => setForm({...form, txId: e.target.value})} placeholder="e.g. UPI/123456" className={`${inputCls} pl-3`} />
                  </div>
                </div>

                <div className="mt-6">
                  <InputLabel text="Description / Notes" />
                  <textarea rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Add some details..." className={`${inputCls} pl-3 resize-none`} />
                </div>

                <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center">
                  <div className="flex cursor-pointer items-start gap-2" onClick={() => setRecurring(!recurring)}>
                    <div className="mt-0.5 text-indigo-600">
                      {recurring ? <CheckSquare size={18} /> : <Square size={18} />}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800">Make this a recurring expense</div>
                      <div className="text-xs text-slate-500">Useful for regular bills like utilities, subscriptions etc.</div>
                    </div>
                  </div>
                  <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
                    <button 
                      onClick={() => setForm({ amount: '', date: '', category: '', subcategory: '', method: '', account: '', merchant: '', txId: '', notes: '' })}
                      className="rounded-lg border border-slate-200 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      Clear Form
                    </button>
                    <button 
                      onClick={handleSaveTransaction}
                      className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                    >
                      Save Transaction
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 lg:col-span-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-bold text-blue-900">Recent Transactions</h2>
                  <button onClick={() => alert("View All transactions history clicked!")} className="text-xs font-semibold text-blue-600 hover:underline">View All</button>
                </div>
                <div className="space-y-4">
                  {recentTx.length === 0 && <p className="text-sm text-slate-500">No recent transactions yet.</p>}
                  {recentTx.map((tx, i) => (
                    <div key={tx.id || i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tx.bg} ${tx.color}`}>
                          <tx.icon size={18} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{tx.name}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[120px]">{tx.desc}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-bold ${tx.amt.includes('-') ? 'text-red-500' : 'text-emerald-500'}`}>{tx.amt}</div>
                        <div className="text-[10px] text-slate-400">{tx.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: BANK SYNC
          ======================================================== */}
      {showBankModal && (
        <Modal title="Secure Bank Connection" onClose={() => setShowBankModal(false)}>
          {bankStep === 1 && (
            <div>
              <div className="mb-4 text-sm text-slate-600">Enter the mobile number linked to your Indian bank accounts. We use RBI-approved Account Aggregators for secure sync.</div>
              <FormField label="Mobile Number">
                <div className="flex">
                  <span className="flex items-center justify-center rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 px-3 font-medium text-slate-500">+91</span>
                  <input type="tel" placeholder="9876543210" className={`${fieldCls} rounded-l-none`} />
                </div>
              </FormField>
              <button 
                disabled={bankBusy}
                onClick={() => { setBankBusy(true); setTimeout(() => { setBankBusy(false); setBankStep(2) }, 1000) }} 
                className="mt-2 w-full rounded-lg bg-indigo-600 py-2.5 font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {bankBusy ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </div>
          )}
          {bankStep === 2 && (
            <div>
              <div className="mb-4 text-sm text-slate-600">Enter the 6-digit OTP sent to your mobile number.</div>
              <FormField label="One Time Password">
                <input type="text" placeholder="• • • • • •" className={`${fieldCls} text-center tracking-widest text-lg font-bold`} />
              </FormField>
              <button 
                disabled={bankBusy}
                onClick={() => { setBankBusy(true); setTimeout(() => { setBankBusy(false); setBankStep(3) }, 1000) }} 
                className="mt-2 w-full rounded-lg bg-indigo-600 py-2.5 font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {bankBusy ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>
          )}
          {bankStep === 3 && (
            <div>
              <div className="mb-4 text-sm text-slate-600">Select the bank accounts you want to link.</div>
              <div className="mb-4 space-y-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded text-indigo-600" />
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">H</div>
                  <div>
                    <div className="font-bold text-slate-800">HDFC Bank</div>
                    <div className="text-xs text-slate-500">Account ending in 4587</div>
                  </div>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded text-indigo-600" />
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-700">I</div>
                  <div>
                    <div className="font-bold text-slate-800">ICICI Bank</div>
                    <div className="text-xs text-slate-500">Account ending in 9021</div>
                  </div>
                </label>
              </div>
              <button 
                disabled={bankBusy}
                onClick={() => { setBankBusy(true); setTimeout(() => { setBankBusy(false); setBankStep(4) }, 1500) }} 
                className="w-full rounded-lg bg-indigo-600 py-2.5 font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {bankBusy ? 'Syncing...' : 'Securely Link Accounts'}
              </button>
            </div>
          )}
          {bankStep === 4 && (
            <div className="py-4 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckSquare size={32} />
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-900">Successfully Linked!</h3>
              <p className="mb-6 text-sm text-slate-500">Your bank accounts have been connected. FinScope AI has synced your recent transactions.</p>
              <button onClick={handleBankSuccess} className="w-full rounded-lg bg-indigo-600 py-2.5 font-bold text-white transition hover:bg-indigo-700">
                Continue to History
              </button>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
