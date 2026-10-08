import { useState } from 'react'
import {
  Briefcase, ChevronUp, ChevronDown, DollarSign, Activity, Lock,
  Lightbulb, CheckCircle2, Star, Building2, Calendar, CreditCard, Info
} from 'lucide-react'
import { inr } from '../lib/format'

/* --- UI Components --- */
function Toggle({ active, onChange }) {
  return (
    <div
      onClick={() => onChange(!active)}
      className={`flex h-5 w-9 cursor-pointer items-center rounded-full p-0.5 transition-colors ${active ? 'bg-green-500' : 'bg-slate-300'}`}
    >
      <div className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${active ? 'translate-x-4' : 'translate-x-0'}`} />
    </div>
  )
}

function SectionCard({ icon: Icon, title, iconColorCls, children }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between bg-white px-5 py-4 transition hover:bg-slate-50"
      >
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconColorCls}`}>
            <Icon size={18} />
          </div>
          <h2 className="font-bold text-slate-800">{title}</h2>
        </div>
        {open ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
      </button>
      {open && <div className="border-t border-slate-100 p-5">{children}</div>}
    </div>
  )
}

function InputField({ label, icon: Icon, type = "text", value, onChange, placeholder, prefix }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</label>
      <div className="relative">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Icon size={16} />
          </div>
        )}
        {prefix && !Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-medium text-slate-500">
            {prefix}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`block w-full rounded-lg border border-slate-200 bg-white py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${Icon ? 'pl-9' : prefix ? 'pl-8' : 'pl-3'}`}
        />
      </div>
    </div>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</label>
      <select
        value={value}
        onChange={onChange}
        className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}

/* --- Main Page --- */
export default function Income() {
  // Pre-fill with the mock values to exactly match the design
  const [primary, setPrimary] = useState({
    employer: 'TechSolutions Pvt. Ltd.',
    monthly: '120000',
    ctc: '1800000',
    date: '5th of every month',
    freq: 'Monthly',
    mode: 'Bank Transfer',
    bank: 'HDFC Bank',
    account: '4587',
    pan: 'ABCDE1234F'
  })

  const [addl, setAddl] = useState({
    freelance: true,
    freelanceAmt: '20000',
    freelanceFreq: 'Variable',
    freelanceDate: '2024-06-28',
    bonus: false,
    bonusAmt: '120000',
    bonusMonth: 'March',
    other: true,
    otherType: 'House Rent',
    otherAmt: '15000'
  })

  const [stability, setStability] = useState({
    job: 'High (Permanent)',
    growth: '8.0',
    predict: 'Very Predictable',
    notes: 'Expect promotion next year.'
  })

  // Calculations for summary
  const pSal = Number(primary.monthly) || 0
  const fSal = addl.freelance ? (Number(addl.freelanceAmt) || 0) : 0
  const oSal = addl.other ? (Number(addl.otherAmt) || 0) : 0
  const total = pSal + fSal + oSal

  return (
    <div className="mx-auto max-w-6xl pb-10 pt-2">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Income Setup</h1>
        <p className="mt-1 text-sm text-slate-500">Add and manage all your income sources</p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        {/* LEFT COLUMN: FORMS */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Section 1: Primary Salary */}
          <SectionCard icon={Briefcase} title="1. Primary Salary (Fixed Income)" iconColorCls="bg-blue-100 text-blue-600">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <InputField label="Employer / Company Name" icon={Building2} value={primary.employer} onChange={(e) => setPrimary({ ...primary, employer: e.target.value })} />
              <InputField label="Monthly In-Hand Salary (₹)" prefix="↑" type="number" value={primary.monthly} onChange={(e) => setPrimary({ ...primary, monthly: e.target.value })} />
              <InputField label="Annual CTC (₹)" prefix="↑" type="number" value={primary.ctc} onChange={(e) => setPrimary({ ...primary, ctc: e.target.value })} />
              
              <SelectField label="Salary Credit Date" value={primary.date} onChange={(e) => setPrimary({ ...primary, date: e.target.value })} options={['1st of every month', '5th of every month', 'Last working day']} />
              <SelectField label="Salary Frequency" value={primary.freq} onChange={(e) => setPrimary({ ...primary, freq: e.target.value })} options={['Monthly', 'Bi-weekly', 'Weekly']} />
              <SelectField label="Payment Mode" value={primary.mode} onChange={(e) => setPrimary({ ...primary, mode: e.target.value })} options={['Bank Transfer', 'Cheque', 'Cash']} />
              
              <InputField label="Bank Name" icon={Building2} value={primary.bank} onChange={(e) => setPrimary({ ...primary, bank: e.target.value })} />
              <InputField label="Account Number (Last 4 Digits)" prefix="••••" value={primary.account} onChange={(e) => setPrimary({ ...primary, account: e.target.value })} />
              <InputField label="PAN (Optional)" value={primary.pan} onChange={(e) => setPrimary({ ...primary, pan: e.target.value })} />
            </div>
            
            <div className="mt-5 flex items-start gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">
              <Info size={18} className="mt-0.5 shrink-0" />
              <p>Your salary will be accounted on the selected credit date every month.</p>
            </div>
          </SectionCard>

          {/* Section 2: Additional Income */}
          <SectionCard icon={DollarSign} title="2. Additional Income (Optional)" iconColorCls="bg-green-100 text-green-600">
            <div className="space-y-6">
              {/* Freelancing */}
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <Toggle active={addl.freelance} onChange={(v) => setAddl({ ...addl, freelance: v })} />
                  <span className="font-bold text-slate-800">Freelancing / Side Income</span>
                </div>
                {addl.freelance && (
                  <div className="grid grid-cols-1 gap-5 pl-12 sm:grid-cols-3">
                    <InputField label="Average Monthly Income (₹)" type="number" value={addl.freelanceAmt} onChange={(e) => setAddl({ ...addl, freelanceAmt: e.target.value })} />
                    <SelectField label="Income Frequency" value={addl.freelanceFreq} onChange={(e) => setAddl({ ...addl, freelanceFreq: e.target.value })} options={['Variable', 'Fixed Monthly', 'One-time']} />
                    <InputField label="Last Received (Date)" type="date" value={addl.freelanceDate} onChange={(e) => setAddl({ ...addl, freelanceDate: e.target.value })} />
                  </div>
                )}
              </div>
              <hr className="border-slate-100" />
              
              {/* Bonuses */}
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <Toggle active={addl.bonus} onChange={(v) => setAddl({ ...addl, bonus: v })} />
                  <span className="font-bold text-slate-800">Bonuses / Incentives</span>
                </div>
                {addl.bonus && (
                  <div className="grid grid-cols-1 gap-5 pl-12 sm:grid-cols-2">
                    <InputField label="Average Annual Bonus (₹)" type="number" value={addl.bonusAmt} onChange={(e) => setAddl({ ...addl, bonusAmt: e.target.value })} />
                    <SelectField label="Expected Month" value={addl.bonusMonth} onChange={(e) => setAddl({ ...addl, bonusMonth: e.target.value })} options={['March', 'April', 'December']} />
                  </div>
                )}
              </div>
              <hr className="border-slate-100" />

              {/* Other */}
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <Toggle active={addl.other} onChange={(v) => setAddl({ ...addl, other: v })} />
                  <span className="font-bold text-slate-800">Other Income (e.g., Rent, Interest)</span>
                </div>
                {addl.other && (
                  <div className="grid grid-cols-1 gap-5 pl-12 sm:grid-cols-2">
                    <SelectField label="Income Type" value={addl.otherType} onChange={(e) => setAddl({ ...addl, otherType: e.target.value })} options={['House Rent', 'Dividends', 'Interest']} />
                    <InputField label="Monthly Amount (₹)" type="number" value={addl.otherAmt} onChange={(e) => setAddl({ ...addl, otherAmt: e.target.value })} />
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Section 3: Stability & Growth */}
          <SectionCard icon={Activity} title="3. Income Stability & Growth (For Better Planning)" iconColorCls="bg-purple-100 text-purple-600">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
              <SelectField label="Job Stability" value={stability.job} onChange={(e) => setStability({ ...stability, job: e.target.value })} options={['High (Permanent)', 'Medium (Contract)', 'Low (Freelance)']} />
              <InputField label="Expected Annual Salary Growth (%)" type="number" value={stability.growth} onChange={(e) => setStability({ ...stability, growth: e.target.value })} />
              <SelectField label="How predictable is your income?" value={stability.predict} onChange={(e) => setStability({ ...stability, predict: e.target.value })} options={['Very Predictable', 'Somewhat Predictable', 'Unpredictable']} />
              <InputField label="Notes (Optional)" value={stability.notes} onChange={(e) => setStability({ ...stability, notes: e.target.value })} placeholder="Expect promotion next year." />
            </div>
          </SectionCard>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <button onClick={() => alert("Form cleared")} className="rounded-lg border border-slate-200 bg-white px-6 py-2.5 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
              Cancel
            </button>
            <button onClick={() => alert("Income Details Saved Successfully!")} className="rounded-lg bg-indigo-600 px-6 py-2.5 font-semibold text-white shadow-sm transition hover:bg-indigo-700">
              Save Income Details
            </button>
          </div>

          <div className="flex items-center gap-2 pt-2 text-xs text-slate-500">
            <Lock size={14} className="text-indigo-500" /> Your income information is 100% secure and private. It will never be shared.
          </div>

        </div>

        {/* RIGHT COLUMN: SUMMARY & HELP */}
        <div className="space-y-6">
          
          {/* Summary Card */}
          <div className="rounded-xl border border-blue-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4">
              <h2 className="font-bold text-indigo-900">Income Summary</h2>
            </div>
            <div className="p-5">
              <div className="text-sm font-semibold text-indigo-600">Total Monthly Income</div>
              <div className="mt-1 flex items-end justify-between">
                <div className="text-4xl font-bold text-indigo-600">{inr(total)}</div>
                <div className="flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                  <span className="text-lg leading-none">+</span> Stable
                </div>
              </div>

              <div className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Primary Salary</span>
                  <span className="font-bold text-slate-900">{inr(pSal)}</span>
                </div>
                {addl.freelance && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Freelancing / Side Income</span>
                    <span className="font-bold text-slate-900">{inr(fSal)}</span>
                  </div>
                )}
                {addl.other && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">{addl.otherType} (Other Income)</span>
                    <span className="font-bold text-slate-900">{inr(oSal)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Lightbulb size={20} />
              </div>
              <h2 className="font-bold text-slate-900">Purpose of this Step</h2>
            </div>

            <ul className="space-y-4 text-sm text-slate-700">
              <li className="flex items-start gap-3">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-green-500" />
                <span>Helps us understand your income structure and stability.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-green-500" />
                <span>Improves accuracy of forecasts and goal planning.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-green-500" />
                <span>Enables personalized AI financial insights.</span>
              </li>
            </ul>

            <div className="mt-6 rounded-lg bg-green-50/70 p-4">
              <div className="mb-1.5 flex items-center gap-2 font-bold text-green-800">
                <Star size={16} /> Tip
              </div>
              <p className="text-xs leading-relaxed text-green-900">
                Add all sources of regular and irregular income for better financial planning.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
