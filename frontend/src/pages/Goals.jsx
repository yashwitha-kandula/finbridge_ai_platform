import { useState, useEffect } from 'react'
import {
  Target, Car, Flag, Info, ShieldCheck, ChevronRight,
  CheckCircle2, AlertCircle, Home, PiggyBank, Lightbulb,
  TrendingUp, Settings, ArrowUpSquare, ChevronDown, Percent
} from 'lucide-react'
import Modal, { FormField, fieldCls } from '../components/Modal'

// Simple Toggle Component
const Toggle = ({ enabled, onChange }) => (
  <div 
    onClick={() => onChange(!enabled)}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
  </div>
)

export default function Goals() {
  const [toast, setToast] = useState(null)
  
  const [form, setForm] = useState({
    name: 'Buy a Car',
    category: 'Vehicle Purchase',
    priority: 'High',
    targetAmount: '1200000',
    currentSavings: '150000',
    targetDate: '2026-05-01',
    description: 'Planning to buy a mid-range car for daily commute.',
    monthlySave: '25000',
    expectedReturn: '6',
    includeInvestment: true,
    reviewProgress: 'Monthly',
    reminder: '1st of every month',
    autoAdjust: true
  })

  // Dynamic Math for Preview
  const targetAmt = parseFloat(form.targetAmount) || 0
  const currSave = parseFloat(form.currentSavings) || 0
  const plannedSave = parseFloat(form.monthlySave) || 0
  const expectedReturn = parseFloat(form.expectedReturn) || 0

  const remainingAmt = Math.max(0, targetAmt - currSave)

  // Calculate Months to Goal
  const today = new Date()
  const targetDate = new Date(form.targetDate || today)
  let months = (targetDate.getFullYear() - today.getFullYear()) * 12 + (targetDate.getMonth() - today.getMonth())
  if (months <= 0) months = 1 // Prevent divide by zero

  // Monthly Savings Needed Calculation (Simple FV/PMT estimation)
  let monthlyNeeded = remainingAmt / months
  if (form.includeInvestment && expectedReturn > 0) {
    const monthlyRate = (expectedReturn / 100) / 12
    monthlyNeeded = (remainingAmt * monthlyRate) / (Math.pow(1 + monthlyRate, months) - 1)
  }
  
  // Guard against Infinity/NaN
  if (!isFinite(monthlyNeeded)) monthlyNeeded = remainingAmt
  
  const isFeasible = plannedSave >= monthlyNeeded

  const getFutureDate = (years) => {
    const d = new Date()
    d.setFullYear(d.getFullYear() + years)
    return d.toISOString().split('T')[0]
  }

  const applySuggestedGoal = (type) => {
    if (type === 'emergency') {
      setForm({ ...form, name: 'Emergency Fund', category: 'Emergency Fund', priority: 'High', targetAmount: '600000', currentSavings: '50000', targetDate: getFutureDate(2), description: 'Saving 6 months of living expenses.', monthlySave: '20000', expectedReturn: '6', includeInvestment: true })
    } else if (type === 'home') {
      setForm({ ...form, name: 'Home Down Payment', category: 'Home Down Payment', priority: 'Medium', targetAmount: '2500000', currentSavings: '200000', targetDate: getFutureDate(5), description: 'Saving for a 20% down payment.', monthlySave: '30000', expectedReturn: '10', includeInvestment: true })
    } else if (type === 'retirement') {
      setForm({ ...form, name: 'Retirement Corpus', category: 'Retirement', priority: 'High', targetAmount: '50000000', currentSavings: '500000', targetDate: getFutureDate(20), description: 'Long-term investment for secure retirement.', monthlySave: '40000', expectedReturn: '12', includeInvestment: true })
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setToast('Goal template applied! You can customize the details.')
  }

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const handleSave = () => {
    if (!form.name || !form.targetAmount) {
      alert("Please enter Goal Name and Target Amount.")
      return
    }
    setToast(`Goal "${form.name}" saved successfully!`)
  }

  const InputLabel = ({ text, required }) => (
    <label className="mb-1.5 block text-xs font-bold text-slate-700">
      {text} {required && <span className="text-red-500">*</span>}
    </label>
  )

  const inputCls = "w-full rounded-lg border border-slate-200 bg-white py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
  
  const handleChange = (field, val) => setForm(prev => ({ ...prev, [field]: val }))

  return (
    <div className="mx-auto max-w-[1400px] pb-10 pt-2 relative">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-xl animate-bounce">
          <CheckCircle2 size={18} /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Add Financial Goal</h1>
        <p className="mt-1 text-sm text-slate-500">Set your financial goals and let AI help you achieve them.</p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        
        {/* LEFT COLUMN: FORM */}
        <div className="space-y-6 lg:col-span-8">
          
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            
            {/* Section 1: Goal Details */}
            <div className="mb-8">
              <div className="mb-4 flex items-center gap-2 text-sm font-bold text-blue-600">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-100">
                  <ArrowUpSquare size={14} />
                </div>
                1. Goal Details
              </div>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <InputLabel text="Goal Name" required />
                  <input type="text" value={form.name} onChange={e => handleChange('name', e.target.value)} className={`${inputCls} pl-3`} placeholder="e.g. Buy a Car" />
                </div>
                <div>
                  <InputLabel text="Goal Category" required />
                  <div className="relative">
                    <Car size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input list="goal-categories" value={form.category} onChange={e => handleChange('category', e.target.value)} className={`${inputCls} pl-9`} placeholder="e.g. Vehicle Purchase" />
                    <datalist id="goal-categories">
                      <option value="Vehicle Purchase" />
                      <option value="Home Down Payment" />
                      <option value="Emergency Fund" />
                      <option value="Retirement" />
                      <option value="Vacation" />
                    </datalist>
                    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
                <div>
                  <InputLabel text="Priority" required />
                  <div className="relative">
                    <Flag size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-red-500" />
                    <select value={form.priority} onChange={e => handleChange('priority', e.target.value)} className={`${inputCls} appearance-none pl-9 pr-8`}>
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div>
                  <InputLabel text="Target Amount (₹)" required />
                  <input type="number" value={form.targetAmount} onChange={e => handleChange('targetAmount', e.target.value)} className={`${inputCls} pl-3`} />
                </div>
                <div>
                  <InputLabel text="Current Savings (₹)" />
                  <input type="number" value={form.currentSavings} onChange={e => handleChange('currentSavings', e.target.value)} className={`${inputCls} pl-3`} />
                </div>
                <div>
                  <InputLabel text="Target Date" required />
                  <input type="date" value={form.targetDate} onChange={e => handleChange('targetDate', e.target.value)} className={`${inputCls} px-3`} />
                </div>
              </div>
              <div className="mt-6">
                <InputLabel text="Goal Description (Optional)" />
                <div className="relative">
                  <textarea rows={2} value={form.description} onChange={e => handleChange('description', e.target.value)} className={`${inputCls} pl-3 resize-none`} placeholder="Add some details about your goal..." />
                  <div className="absolute bottom-2 right-3 text-[10px] text-slate-400">{form.description.length}/200</div>
                </div>
              </div>
            </div>

            <hr className="my-6 border-slate-100" />

            {/* Section 2: Savings Plan */}
            <div className="mb-8">
              <div className="mb-4 flex items-center gap-2 text-sm font-bold text-emerald-600">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-100">
                  <TrendingUp size={14} />
                </div>
                2. Savings Plan
              </div>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <InputLabel text="How much can you save monthly?" required />
                  <input type="number" value={form.monthlySave} onChange={e => handleChange('monthlySave', e.target.value)} className={`${inputCls} pl-3`} />
                </div>
                <div>
                  <InputLabel text="Expected Annual Return on Savings/Investments (%)" />
                  <div className="relative">
                    <input type="number" step="0.1" value={form.expectedReturn} onChange={e => handleChange('expectedReturn', e.target.value)} className={`${inputCls} pl-3 pr-8`} />
                    <Percent size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
                <div>
                  <InputLabel text="Include Investment for Goal?" />
                  <div className="flex h-[42px] items-center gap-3">
                    <Toggle enabled={form.includeInvestment} onChange={(val) => handleChange('includeInvestment', val)} />
                    <Info size={16} className="text-slate-400" />
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2.5 text-xs font-medium text-blue-700">
                <Info size={16} className="shrink-0" />
                AI will calculate how much you need to save and whether your goal is achievable.
              </div>
            </div>

            <hr className="my-6 border-slate-100" />

            {/* Section 3: Goal Preferences */}
            <div className="mb-8">
              <div className="mb-4 flex items-center gap-2 text-sm font-bold text-purple-600">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-purple-100">
                  <Settings size={14} />
                </div>
                3. Goal Preferences
              </div>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <InputLabel text="Review Goal Progress" />
                  <div className="relative">
                    <select value={form.reviewProgress} onChange={e => handleChange('reviewProgress', e.target.value)} className={`${inputCls} appearance-none pl-3 pr-8`}>
                      <option>Monthly</option>
                      <option>Quarterly</option>
                      <option>Annually</option>
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
                <div>
                  <InputLabel text="Goal Reminder" />
                  <div className="relative">
                    <select value={form.reminder} onChange={e => handleChange('reminder', e.target.value)} className={`${inputCls} appearance-none pl-3 pr-8`}>
                      <option>1st of every month</option>
                      <option>15th of every month</option>
                      <option>Last day of month</option>
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
                <div>
                  <InputLabel text="Auto Adjust Plan?" />
                  <div className="flex h-[42px] items-center gap-3">
                    <Toggle enabled={form.autoAdjust} onChange={(val) => handleChange('autoAdjust', val)} />
                    <Info size={16} className="text-slate-400" />
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">AI will adjust plan if required</p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col items-start justify-between gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center">
              <button 
                onClick={() => setForm({ ...form, name: '', targetAmount: '', currentSavings: '' })}
                className="w-full rounded-lg border border-slate-200 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:w-auto"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="w-full rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 sm:w-auto"
              >
                Save Goal
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-indigo-50/80 px-4 py-3 text-xs font-medium text-indigo-800">
            <ShieldCheck size={16} className="text-indigo-600 shrink-0" />
            Your goal information is secure and private. It is used only to generate personalized insights.
          </div>
        </div>

        {/* RIGHT COLUMN: WIDGETS */}
        <div className="space-y-6 lg:col-span-4">
          
          {/* Goal Summary Preview */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 font-bold text-emerald-700">
              <Target size={18} /> Goal Summary (Preview)
            </div>
            
            <div className="space-y-4 border-b border-slate-100 pb-5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Target Amount</span>
                <span className="font-bold text-blue-700">₹{targetAmt.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Current Savings</span>
                <span className="font-bold text-emerald-600">₹{currSave.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Remaining Amount</span>
                <span className="font-bold text-red-500">₹{remainingAmt.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="space-y-4 py-5 border-b border-slate-100 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Monthly Savings Needed</span>
                <span className="font-bold text-blue-700">₹{Math.ceil(monthlyNeeded).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Your Planned Monthly Savings</span>
                <span className="font-bold text-emerald-600">₹{plannedSave.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="pt-5">
              <div className="mb-2 text-xs font-bold text-slate-700">Goal Feasibility</div>
              {isFeasible ? (
                <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-emerald-800">On Track</div>
                    <div className="text-[10px] text-emerald-700 mt-0.5">You are saving enough to reach your goal on time!</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-amber-800">Needs Attention</div>
                    <div className="text-[10px] text-amber-700 mt-0.5">Increase your monthly savings to reach this goal on time.</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Suggested Goals */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 font-bold text-blue-800">
              <span className="text-xl">☆</span> Suggested Goals for You
            </div>
            <div className="space-y-3">
              <div onClick={() => applySuggestedGoal('emergency')} className="group flex cursor-pointer items-center justify-between rounded-lg border border-transparent p-2 transition hover:bg-slate-50 hover:border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Emergency Fund</div>
                    <div className="text-[10px] text-slate-500">3-6 months of expenses</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-600" />
              </div>
              
              <div onClick={() => applySuggestedGoal('home')} className="group flex cursor-pointer items-center justify-between rounded-lg border border-transparent p-2 transition hover:bg-slate-50 hover:border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                    <Home size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Home Down Payment</div>
                    <div className="text-[10px] text-slate-500">Own your dream home</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-600" />
              </div>

              <div onClick={() => applySuggestedGoal('retirement')} className="group flex cursor-pointer items-center justify-between rounded-lg border border-transparent p-2 transition hover:bg-slate-50 hover:border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                    <PiggyBank size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Retirement Corpus</div>
                    <div className="text-[10px] text-slate-500">Secure your future</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-600" />
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 font-bold text-amber-700">
              <Lightbulb size={18} /> Tips
            </div>
            <ul className="space-y-2 text-xs font-medium text-amber-900 ml-4 list-disc marker:text-amber-400">
              <li>Break large goals into smaller milestones.</li>
              <li>Automate your savings for better consistency.</li>
              <li>Review and adjust your plan regularly.</li>
              <li>Investing can help you reach goals faster.</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  )
}
