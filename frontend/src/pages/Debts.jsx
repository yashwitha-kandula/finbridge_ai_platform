import { useState, useEffect } from 'react'
import {
  Info, Home, Briefcase, CreditCard, Coins, ShieldCheck,
  CheckCircle2, Lightbulb, Calendar, Building2, Percent,
  ChevronDown, ArrowRight
} from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useNotification } from '../context/NotificationContext'
import { useAuth } from '../auth/AuthContext'
import { authFetch } from '../lib/api'

const LOAN_COLORS = {
  'Home Loan': '#7c3aed', // purple-600
  'Personal Loan': '#ef4444', // red-500
  'Credit Card': '#3b82f6', // blue-500
  'Other Loans': '#f59e0b', // amber-500
}

export default function Debts() {
  const { notify } = useNotification()
  const { token } = useAuth()
  const [toast, setToast] = useState(null)
  const [savedLoans, setSavedLoans] = useState(() => {
    try { return JSON.parse(localStorage.getItem('finbridge_loans') || '[]') } catch { return [] }
  })

  // Form State
  const [form, setForm] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('finbridge_loan_draft'))
      if (saved) return { ...saved, tenureUnit: saved.tenureUnit === 'Months' ? 'Months' : 'Years' }
    } catch {}
    return {
    loanType: '',
    lender: '',
    accountNo: '',
    totalAmount: '',
    disbursedAmount: '',
    disbursedDate: '',
    interestRate: '',
    tenure: '',
    tenureUnit: 'Years',
    emiAmount: '',
    startDate: '',
    endDate: '',
    paymentMode: 'Auto Debit (NACH)',
    emiDay: '5th of every month',
    linkedBank: '',
    outstandingAmount: '',
    nextEmiDate: '',
    remainingTenure: '',
    emiType: 'Fixed EMI',
    purpose: '',
    propertyDetails: '',
    insuranceLinked: 'No',
    notes: ''
    }
  })

  useEffect(() => {
    localStorage.setItem('finbridge_loan_draft', JSON.stringify(form))
  }, [form])

  // Dynamic Summary Calcs
  const totalDebt = savedLoans.reduce((sum, loan) => sum + loan.amount, 0)
  const totalEmi = savedLoans.reduce((sum, loan) => sum + loan.emi, 0)

  // Chart Data
  const chartData = Object.keys(LOAN_COLORS).map(key => {
    const amount = savedLoans.filter(l => l.type === key).reduce((sum, l) => sum + l.amount, 0)
    const count = savedLoans.filter(l => l.type === key).length
    return { name: key, value: amount, count, color: LOAN_COLORS[key] }
  })
  
  // Only show slices that have value, or a grey ring if 0
  const activeChartData = chartData.filter(d => d.value > 0)
  const renderData = activeChartData.length > 0 ? activeChartData : [{ name: 'No Debt', value: 1, color: '#e2e8f0' }]

  // AI Repayment Suggestion Logic (Changes based on highest interest rate)
  const highestRateLoan = savedLoans.reduce((prev, curr) => (curr.rate > (prev?.rate || 0) ? curr : prev), null)
  const aiSuggestion = highestRateLoan && highestRateLoan.rate > 10 
    ? `You have a high-interest ${highestRateLoan.type} at ${highestRateLoan.rate}%. Use the Avalanche Method: prioritize prepaying this loan first to save heavily on interest!`
    : "Try to prepay home loans or make one extra EMI a year to drastically reduce your tenure and become debt-free faster."

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const handleSave = async () => {
    if (!form.outstandingAmount || !form.loanType) {
      notify({
        title: 'Missing Required Fields',
        message: 'Please enter at least the Loan Type and Outstanding Amount.',
        type: 'error'
      })
      return
    }
    
    const newLoan = {
      type: form.loanType,
      amount: parseFloat(form.outstandingAmount) || 0,
      emi: parseFloat(form.emiAmount) || 0,
      rate: parseFloat(form.interestRate) || 0
    }

    setSavedLoans([newLoan, ...savedLoans])
    const updatedLoans = [newLoan, ...savedLoans]
    localStorage.setItem('finbridge_loans', JSON.stringify(updatedLoans))
    try {
      await authFetch(token, '/api/dashboard/loans', {
        method: 'POST',
        body: JSON.stringify({
          loan_type: form.loanType,
          lender_name: form.lender || 'Other',
          principal_amount: parseFloat(form.totalAmount) || 0,
          outstanding_amount: parseFloat(form.outstandingAmount) || 0,
          interest_rate: parseFloat(form.interestRate) || 0,
          tenure_months: Math.round((parseFloat(form.tenure) || 0) * (form.tenureUnit === 'Months' ? 1 : 12)),
          minimum_payment: parseFloat(form.emiAmount) || 0,
          start_date: form.startDate || null,
          end_date: form.endDate || null,
          next_payment_date: form.nextEmiDate || null,
          description: form.notes || ''
        })
      })
      window.dispatchEvent(new Event('finbridge_data_changed'))
    } catch (err) {
      notify({ title: 'Saved Locally', message: err.message, type: 'error' })
    }
    notify({
      title: 'Loan Saved',
      message: `${form.loanType} details saved successfully!`,
      type: 'success'
    })
    
    // Clear form for next entry
    setForm({
      ...form, loanType: '', lender: '', accountNo: '', totalAmount: '', disbursedAmount: '', 
      interestRate: '', emiAmount: '', outstandingAmount: '', notes: ''
    })
  }

  const InputLabel = ({ text, required }) => (
    <label className="mb-1.5 block text-xs font-bold text-slate-700">
      {text} {required && <span className="text-red-500">*</span>}
    </label>
  )

  const inputCls = "w-full rounded-lg border border-slate-200 bg-white py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
  const sectionTitleCls = "text-sm font-bold text-purple-700 mb-4"

  const handleChange = (field, val) => setForm(prev => ({ ...prev, [field]: val }))

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Add Loan / Debt</h1>
        <p className="mt-1 text-sm text-slate-500">Track all your loans and debts in one place to analyze and manage better.</p>
      </div>

      {/* Info Banner */}
      <div className="mb-6 flex items-center gap-2 rounded-lg bg-indigo-50/80 px-4 py-3 text-sm font-medium text-indigo-700 border border-indigo-100">
        <Info size={18} className="text-indigo-600 shrink-0" />
        Add all types of loans including home loans, personal loans, credit cards, and informal loans.
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        
        {/* LEFT COLUMN: FORM */}
        <div className="space-y-6 lg:col-span-8">
          
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            
            {/* Section 1 */}
            <div className="mb-8">
              <h2 className={sectionTitleCls}>1. Loan / Debt Information</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <InputLabel text="Loan Type" required />
                  <div className="relative">
                    <Home size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select value={form.loanType} onChange={e => handleChange('loanType', e.target.value)} className={`${inputCls} appearance-none pl-9 pr-8`}>
                      <option value="">Select loan type</option>
                      <option value="Home Loan">Home Loan</option>
                      <option value="Personal Loan">Personal Loan</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Education Loan">Education Loan</option>
                      <option value="Auto Loan">Auto Loan</option>
                      <option value="Informal Loan">Informal Loan</option>
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
                <div>
                  <InputLabel text="Lender / Institution (Optional)" />
                  <div className="relative">
                    <Building2 size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select value={form.lender} onChange={e => handleChange('lender', e.target.value)} className={`${inputCls} appearance-none pl-9 pr-8`}>
                      <option value="">Select lender</option>
                      <option value="HDFC Bank">HDFC Bank</option>
                      <option value="SBI">SBI</option>
                      <option value="ICICI Bank">ICICI Bank</option>
                      <option value="Axis Bank">Axis Bank</option>
                      <option value="Bajaj Finserv">Bajaj Finserv</option>
                      <option value="Other / Informal">Other / Informal</option>
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
                <div>
                  <InputLabel text="Loan Account / Reference No. (Optional)" />
                  <input type="text" value={form.accountNo} onChange={e => handleChange('accountNo', e.target.value)} className={`${inputCls} pl-3`} placeholder="e.g. HL12345 (Optional)" />
                </div>

                <div>
                  <InputLabel text="Total Loan Amount (₹)" required />
                  <input type="number" value={form.totalAmount} onChange={e => handleChange('totalAmount', e.target.value)} className={`${inputCls} pl-3`} />
                </div>
                <div>
                  <InputLabel text="Disbursed Amount (₹)" />
                  <input type="number" value={form.disbursedAmount} onChange={e => handleChange('disbursedAmount', e.target.value)} className={`${inputCls} pl-3`} />
                </div>
                <div>
                  <InputLabel text="Disbursement Date" />
                  <div className="relative">
                    <Calendar size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="date" value={form.disbursedDate} onChange={e => handleChange('disbursedDate', e.target.value)} className={`${inputCls} pl-9`} />
                  </div>
                </div>

                <div>
                  <InputLabel text="Interest Rate (% per annum)" required />
                  <input type="number" step="0.01" value={form.interestRate} onChange={e => handleChange('interestRate', e.target.value)} className={`${inputCls} pl-3`} />
                </div>
                <div>
                  <InputLabel text="Loan Tenure" required />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      step={form.tenureUnit === 'Months' ? '1' : '0.1'}
                      value={form.tenure}
                      onChange={e => handleChange('tenure', e.target.value)}
                      className={`${inputCls} min-w-0 pl-3`}
                    />
                    <select
                      value={form.tenureUnit}
                      onChange={e => handleChange('tenureUnit', e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      aria-label="Loan tenure unit"
                    >
                      <option value="Months">Months</option>
                      <option value="Years">Years</option>
                    </select>
                  </div>
                </div>
                <div>
                  <InputLabel text="EMI Amount (₹)" required />
                  <input type="number" value={form.emiAmount} onChange={e => handleChange('emiAmount', e.target.value)} className={`${inputCls} pl-3`} />
                </div>

                <div>
                  <InputLabel text="Loan Start Date" required />
                  <div className="relative">
                    <Calendar size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="date" value={form.startDate} onChange={e => handleChange('startDate', e.target.value)} className={`${inputCls} pl-9`} />
                  </div>
                </div>
                <div>
                  <InputLabel text="Loan End Date" />
                  <div className="relative">
                    <Calendar size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="date" value={form.endDate} onChange={e => handleChange('endDate', e.target.value)} className={`${inputCls} pl-9`} />
                  </div>
                </div>
                <div>
                  <InputLabel text="Payment Mode" />
                  <div className="relative">
                    <select value={form.paymentMode} onChange={e => handleChange('paymentMode', e.target.value)} className={`${inputCls} appearance-none pl-3 pr-8`}>
                      <option>Auto Debit (NACH)</option>
                      <option>Manual / UPI</option>
                      <option>Post Dated Cheques</option>
                      <option>Cash</option>
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="mb-8">
              <h2 className={sectionTitleCls}>2. Repayment & Payment Details</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <InputLabel text="EMI Day" />
                  <div className="relative">
                    <select value={form.emiDay} onChange={e => handleChange('emiDay', e.target.value)} className={`${inputCls} appearance-none pl-3 pr-8`}>
                      <option>5th of every month</option>
                      <option>1st of every month</option>
                      <option>10th of every month</option>
                      <option>15th of every month</option>
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
                <div>
                  <InputLabel text="Linked Bank Account (Optional)" />
                  <div className="relative">
                    <Building2 size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={form.linkedBank} onChange={e => handleChange('linkedBank', e.target.value)} className={`${inputCls} pl-9`} placeholder="Optional institution label" />
                  </div>
                </div>
                <div>
                  <InputLabel text="Outstanding Amount (₹)" />
                  <input type="number" value={form.outstandingAmount} onChange={e => handleChange('outstandingAmount', e.target.value)} className={`${inputCls} pl-3`} />
                </div>

                <div>
                  <InputLabel text="Next EMI Due Date" />
                  <div className="relative">
                    <Calendar size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="date" value={form.nextEmiDate} onChange={e => handleChange('nextEmiDate', e.target.value)} className={`${inputCls} pl-9`} />
                  </div>
                </div>
                <div>
                  <InputLabel text="Remaining Tenure (Years / Months)" />
                  <input type="text" value={form.remainingTenure} onChange={e => handleChange('remainingTenure', e.target.value)} className={`${inputCls} pl-3`} placeholder="e.g. 19 Years 11 Months" />
                </div>
                <div>
                  <InputLabel text="EMI Type" />
                  <div className="relative">
                    <select value={form.emiType} onChange={e => handleChange('emiType', e.target.value)} className={`${inputCls} appearance-none pl-3 pr-8`}>
                      <option>Fixed EMI</option>
                      <option>Floating EMI</option>
                      <option>Interest Only</option>
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="mb-8">
              <h2 className={sectionTitleCls}>3. Additional Details</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <InputLabel text="Purpose of Loan" />
                  <div className="relative">
                    <select value={form.purpose} onChange={e => handleChange('purpose', e.target.value)} className={`${inputCls} appearance-none pl-3 pr-8`}>
                      <option>Purchase of Flat</option>
                      <option>Home Renovation</option>
                      <option>Education</option>
                      <option>Medical</option>
                      <option>Wedding</option>
                      <option>Business</option>
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
                <div>
                  <InputLabel text="Property Details (Optional)" />
                  <input type="text" value={form.propertyDetails} onChange={e => handleChange('propertyDetails', e.target.value)} className={`${inputCls} pl-3`} placeholder="e.g. 2 BHK Apartment" />
                </div>
                <div>
                  <InputLabel text="Insurance Linked" />
                  <div className="relative">
                    <select value={form.insuranceLinked} onChange={e => handleChange('insuranceLinked', e.target.value)} className={`${inputCls} appearance-none pl-3 pr-8`}>
                      <option>Yes</option>
                      <option>No</option>
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <InputLabel text="Notes (Optional)" />
                <div className="relative">
                  <textarea rows={2} value={form.notes} onChange={e => handleChange('notes', e.target.value)} className={`${inputCls} pl-3 resize-none`} placeholder="Any extra details..." />
                  <div className="absolute bottom-2 right-3 text-[10px] text-slate-400">{form.notes.length}/200</div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col items-start justify-end gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center">
              <button 
                onClick={() => setForm({ ...form, amount: '', outstandingAmount: '', loanType: '' })}
                className="w-full rounded-lg border border-slate-200 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:w-auto"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="w-full rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-purple-700 sm:w-auto"
              >
                Save Loan Details
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-purple-50/80 px-4 py-3 text-xs font-medium text-purple-800">
            <ShieldCheck size={16} className="text-purple-600 shrink-0" />
            Your loan information is 100% secure and private. It will never be shared.
          </div>
        </div>

        {/* RIGHT COLUMN: WIDGETS */}
        <div className="space-y-6 lg:col-span-4">
          
          {/* Debt Summary */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-bold text-blue-900">Debt Summary</h2>
            <div className="border-b border-slate-100 pb-5">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs font-bold text-slate-500">Total Outstanding Debt</div>
                <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600 flex items-center">
                  ↑ 12% <span className="ml-1 text-slate-400 font-normal">vs last month</span>
                </span>
              </div>
              <div className="text-3xl font-bold text-purple-700">₹{totalDebt.toLocaleString('en-IN')}</div>
            </div>

            <div className="py-4 space-y-3 border-b border-slate-100">
              {chartData.map(item => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-50" style={{ color: item.color }}>
                      {item.name === 'Home Loan' ? <Home size={12} /> : 
                       item.name === 'Personal Loan' ? <Briefcase size={12} /> : 
                       item.name === 'Credit Card' ? <CreditCard size={12} /> : <Coins size={12} />}
                    </div>
                    <span className="text-slate-600 font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">₹{item.value.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 flex items-center justify-between">
              <div className="text-sm font-semibold text-purple-700">Total EMI / Month</div>
              <div className="text-lg font-bold text-purple-700">₹{totalEmi.toLocaleString('en-IN')}</div>
            </div>
          </div>

          {/* Loan Breakdown Chart */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col">
            <h2 className="mb-2 font-bold text-blue-900">Loan Breakdown</h2>
            <div className="flex items-center">
              <div className="h-[120px] w-[120px] shrink-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={renderData}
                      cx="50%" cy="50%"
                      innerRadius={35} outerRadius={55}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {renderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text for 100% case if only 1 active category */}
                {activeChartData.length === 1 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-sm font-bold text-slate-800">100%</span>
                    <span className="text-[8px] font-semibold text-slate-500">{activeChartData[0].name}</span>
                  </div>
                )}
              </div>
              <div className="ml-4 flex-1 space-y-2">
                {chartData.map(item => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[10px] font-semibold text-slate-600">{item.name} ({item.count})</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-900">
                      {item.value > 0 ? `₹${(item.value / 100000).toFixed(1)}L` : '₹0'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Why Track Your Loans */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 font-bold text-emerald-700">
              <CheckCircle2 size={18} /> Why Track Your Loans?
            </div>
            <ul className="space-y-2 text-xs font-medium text-emerald-800">
              <li className="flex items-start gap-2"><CheckCircle2 size={14} className="mt-0.5 shrink-0 opacity-70" /> Understand total debt burden</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={14} className="mt-0.5 shrink-0 opacity-70" /> Plan faster repayment strategies</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={14} className="mt-0.5 shrink-0 opacity-70" /> Get alerts for due payments</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={14} className="mt-0.5 shrink-0 opacity-70" /> Improve credit score with on-time payments</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={14} className="mt-0.5 shrink-0 opacity-70" /> Better financial planning & goal achievement</li>
            </ul>
          </div>

          {/* Tips / AI Suggestion */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2 font-bold text-amber-700">
              <Lightbulb size={20} /> Smart Repayment Tips
            </div>
            <p className="text-xs leading-relaxed text-amber-900 font-medium">
              {aiSuggestion}
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
