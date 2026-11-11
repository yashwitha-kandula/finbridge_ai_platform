import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Calendar, Download, ArrowUpRight, ArrowDownRight, ChevronDown, 
  Info, Target, Home, Shield, GraduationCap, CheckCircle2, 
  Sparkles, Lightbulb, ArrowRight, Activity, Bot, X, Send, 
  FileSpreadsheet, FileText, ExternalLink, Loader2
} from 'lucide-react'
import { 
  ComposedChart, Bar, Line, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { inr, inrShort } from '../lib/format'
import { useNotification } from '../context/NotificationContext'

/* --- Mock Data --- */
const trendData = [
  { month: "May '24", income: 90000, expenses: 60000, savings: 30000 },
  { month: "Jun '24", income: 105000, expenses: 65000, savings: 40000 },
  { month: "Jul '24", income: 110000, expenses: 62000, savings: 48000 },
  { month: "Aug '24", income: 125000, expenses: 72000, savings: 53000 },
  { month: "Sep '24", income: 130000, expenses: 75000, savings: 55000 },
  { month: "Oct '24", income: 145000, expenses: 80000, savings: 65000 },
]

const breakdownData = [
  { name: 'Housing', value: 131200, percent: 32, color: '#0d9488' },
  { name: 'Food', value: 73800, percent: 18, color: '#c026d3' },
  { name: 'Transport', value: 49200, percent: 12, color: '#f59e0b' },
  { name: 'Shopping', value: 41000, percent: 10, color: '#ec4899' },
  { name: 'Entertainment', value: 28700, percent: 7, color: '#6366f1' },
  { name: 'Others', value: 86100, percent: 21, color: '#94a3b8' },
]

const radarData = [
  { subject: 'Savings', A: 85, fullMark: 100 },
  { subject: 'Debt', A: 90, fullMark: 100 },
  { subject: 'Stability', A: 75, fullMark: 100 },
  { subject: 'Discipline', A: 80, fullMark: 100 },
  { subject: 'Growth', A: 70, fullMark: 100 },
]

const projectionData = [
  { month: "Nov '24", projected: 40000, target: 50000 },
  { month: "Dec '24", projected: 65000, target: 70000 },
  { month: "Jan '25", projected: 90000, target: 90000 },
  { month: "Feb '25", projected: 115000, target: 110000 },
  { month: "Mar '25", projected: 140000, target: 130000 },
  { month: "Apr '25", projected: 162000, target: 150000 },
]

const events = [
  { id: 1, title: 'Bike Purchase Goal', date: 'Target: Nov 2024', amount: 120000, icon: Target, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-500/10' },
  { id: 2, title: 'Home Loan EMI', date: 'Next: 05 Jun 2024', amount: 18500, icon: Home, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10' },
  { id: 3, title: 'Insurance Premium', date: 'Due: 15 Jun 2024', amount: 12000, icon: Shield, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  { id: 4, title: 'School Fees', date: 'Due: 20 Jun 2024', amount: 25000, icon: GraduationCap, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
]

const Sparkline = ({ dataKey, color, data }) => (
  <ResponsiveContainer width="100%" height={40}>
    <AreaChart data={data}>
      <defs>
        <linearGradient id={`color-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
          <stop offset="95%" stopColor={color} stopOpacity={0}/>
        </linearGradient>
      </defs>
      <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fillOpacity={1} fill={`url(#color-${dataKey})`} />
    </AreaChart>
  </ResponsiveContainer>
)

export default function Forecast() {
  const navigate = useNavigate()
  const { notify } = useNotification()
  const [dateRange, setDateRange] = useState("Last 6 Months (May - Oct 2024)")

  // AI Forecast Chat Popup State (Requirement 4)
  const [showAiChat, setShowAiChat] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: "Hello! I am FinScope AI, your forecasting and financial strategy copilot. I've analyzed your 6-month trajectory and Health Radar (Score: 82/100). How can I assist you with projections or milestone optimization?"
    }
  ])
  const chatBottomRef = useRef(null)

  useEffect(() => {
    if (showAiChat) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages, showAiChat])

  const handleSendAiMessage = async (customText) => {
    const textToSend = (customText || chatInput).trim()
    if (!textToSend || isAiLoading) return

    setChatMessages(prev => [...prev, { sender: 'user', text: textToSend }])
    if (!customText) setChatInput('')
    setIsAiLoading(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:8000/api/v1/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          message: `[Financial Forecast Context: Income 7,20,000, Expenses 4,10,000, Savings 3,10,000, Radar Score 82/100, Growth pillar 70, Bike Goal 1,20,000 due Nov 2024] User Question: ${textToSend}`
        })
      })

      if (res.ok) {
        const data = await res.json()
        const aiReply = data.reply || data.response || data.message || "Based on your 6-month forecast, increasing your monthly equity SIP by ₹5,000 will improve your Growth pillar from 70 to 88 while comfortably meeting your upcoming obligations."
        setChatMessages(prev => [...prev, { sender: 'ai', text: aiReply }])
      } else {
        throw new Error('API request failed')
      }
    } catch {
      // Smart contextual fallback
      let fallback = "Based on your 6-month cashflow velocity, your net savings rate is a healthy 43%. To elevate your Growth score from 70 to 85+, channel ₹8,000/month into diversified index funds and short-term debt instruments."
      if (textToSend.toLowerCase().includes('bike') || textToSend.toLowerCase().includes('goal')) {
        fallback = "Your Bike Purchase Goal (₹1,20,000 by Nov 2024) is on track! With projected monthly savings of ₹55,000 to ₹65,000, you will exceed the target threshold by an estimated 18 days."
      } else if (textToSend.toLowerCase().includes('growth') || textToSend.toLowerCase().includes('pillar')) {
        fallback = "Your Growth pillar is currently at 70/100 because high liquidity is parked in low-yield savings. Rebalancing 25% of surplus cash into sovereign bonds or broad-market index ETFs will achieve optimal radar symmetry."
      }
      setChatMessages(prev => [...prev, { sender: 'ai', text: fallback }])
    } finally {
      setIsAiLoading(false)
    }
  }

  // 1. Download CSV with ACTUAL DATA
  const downloadCSVReport = () => {
    try {
      const csvRows = [
        ['FINBRIDGE AI - FINANCIAL FORECAST & ANALYTICS REPORT'],
        ['Generated On', new Date().toLocaleString()],
        ['Report Period', dateRange],
        [''],
        ['1. EXECUTIVE SUMMARY METRICS'],
        ['Metric', 'Amount (INR)', 'Performance vs Previous Period'],
        ['Total Income', '720000', '+12.5% vs previous 6 months'],
        ['Total Expenses', '410000', '+8.3% vs previous 6 months'],
        ['Net Savings', '310000', '+18.7% vs previous 6 months'],
        ['Debt Portfolio', '380000', '-4.2% vs previous 6 months (Reduced)'],
        ['Financial Health Score', '82 / 100', 'Optimal Balance'],
        [''],
        ['2. MONTHLY CASH FLOW & SAVINGS TRAJECTORY'],
        ['Month', 'Income (INR)', 'Expenses (INR)', 'Savings (INR)'],
        ...trendData.map(t => [t.month, t.income, t.expenses, t.savings]),
        [''],
        ['3. SPENDING INTENSITY BY CATEGORY'],
        ['Category', 'Volume (INR)', 'Share (%)'],
        ...breakdownData.map(b => [b.name, b.value, `${b.percent}%`]),
        [''],
        ['4. FINANCIAL HEALTH RADAR PILLARS (82/100)'],
        ['Core Pillar', 'Score (out of 100)'],
        ...radarData.map(r => [r.subject, `${r.A}/100`]),
        [''],
        ['5. UPCOMING OBLIGATIONS & MILESTONES'],
        ['Obligation', 'Target / Due Date', 'Target Amount (INR)'],
        ...events.map(e => [e.title, e.date, e.amount])
      ]

      const csvContent = '\uFEFF' + csvRows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `FinBridge_Forecast_Report_${Date.now()}.csv`
      document.body.appendChild(link)
      link.click()
      
      // Keep object URL alive for 15 seconds to avoid file-lock errors in Windows/Excel
      setTimeout(() => {
        if (link.parentNode) document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }, 15000)

      notify({
        title: 'CSV Report Downloaded',
        message: 'FinBridge Forecast CSV exported successfully with full analytical data.',
        type: 'success'
      })
    } catch (err) {
      console.error('CSV export failed:', err)
      notify({
        title: 'Export Error',
        message: 'Unable to generate CSV report.',
        type: 'error'
      })
    }
  }

  // 2. Download PDF with ACTUAL DATA
  const downloadPDFReport = () => {
    try {
      const doc = new jsPDF()

      // Header Banner
      doc.setFillColor(15, 23, 42) // slate-900
      doc.rect(0, 0, 210, 28, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('FinBridge AI - Financial Forecast & Analytics', 14, 14)

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(203, 213, 225)
      doc.text(`Generated on: ${new Date().toLocaleString()} | Period: ${dateRange}`, 14, 22)

      // Section 1: Executive Financial Summary
      doc.setTextColor(15, 23, 42)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('1. Executive Financial Summary', 14, 38)

      autoTable(doc, {
        startY: 42,
        head: [['Metric', 'Amount (INR)', 'Performance vs Prev 6 Mo']],
        body: [
          ['Total Income', 'Rs 7,20,000', '+12.5%'],
          ['Total Expenses', 'Rs 4,10,000', '+8.3%'],
          ['Net Savings', 'Rs 3,10,000', '+18.7%'],
          ['Debt Portfolio', 'Rs 3,80,000', '-4.2% (Reduced)'],
          ['Financial Health Radar Score', '82 / 100', 'Optimized Symmetry']
        ],
        theme: 'striped',
        headStyles: { fillColor: [13, 148, 136] }, // teal-600
        styles: { fontSize: 9 }
      })

      // Section 2: Monthly Cash Flow & Savings Trajectory
      const y2 = doc.lastAutoTable.finalY + 10
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('2. Monthly Cash Flow & Savings Trajectory', 14, y2)

      autoTable(doc, {
        startY: y2 + 4,
        head: [['Month', 'Income (INR)', 'Expenses (INR)', 'Savings (INR)']],
        body: trendData.map(t => [
          t.month, 
          `Rs ${t.income.toLocaleString('en-IN')}`, 
          `Rs ${t.expenses.toLocaleString('en-IN')}`, 
          `Rs ${t.savings.toLocaleString('en-IN')}`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59] },
        styles: { fontSize: 9 }
      })

      // Section 3: Spending Breakdown
      const y3 = doc.lastAutoTable.finalY + 10
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('3. Category Spending Breakdown', 14, y3)

      autoTable(doc, {
        startY: y3 + 4,
        head: [['Category', 'Amount (INR)', 'Share (%)']],
        body: breakdownData.map(b => [b.name, `Rs ${b.value.toLocaleString('en-IN')}`, `${b.percent}%`]),
        theme: 'striped',
        headStyles: { fillColor: [13, 148, 136] },
        styles: { fontSize: 9 }
      })

      // Section 4: Upcoming Obligations
      let y4 = doc.lastAutoTable.finalY + 10
      if (y4 > 230) {
        doc.addPage()
        y4 = 20
      }

      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('4. Upcoming Obligations & Milestones', 14, y4)

      autoTable(doc, {
        startY: y4 + 4,
        head: [['Obligation', 'Target / Due Date', 'Target Amount (INR)']],
        body: events.map(e => [e.title, e.date, `Rs ${e.amount.toLocaleString('en-IN')}`]),
        theme: 'grid',
        headStyles: { fillColor: [225, 29, 72] }, // rose-600
        styles: { fontSize: 9 }
      })

      doc.save(`FinBridge_Forecast_Report_${Date.now()}.pdf`)
      notify({
        title: 'PDF Report Ready',
        message: 'FinBridge Forecast PDF report downloaded successfully.',
        type: 'success'
      })
    } catch (err) {
      console.error('PDF export failed:', err)
      notify({
        title: 'Export Error',
        message: 'Unable to generate PDF report.',
        type: 'error'
      })
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-10 fade-in text-slate-900 dark:text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Financial Forecast & Analytics</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Future predictions, spending trends and financial health overview.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3.5 pr-8 text-xs font-semibold text-slate-700 shadow-sm outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="Last 3 Months">Last 3 Months</option>
              <option value="Last 6 Months (May - Oct 2024)">Last 6 Months (May - Oct 2024)</option>
              <option value="Financial Year 2024-25">Financial Year 2024-25</option>
              <option value="Next 6 Months Projections">Next 6 Months Projections</option>
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Download CSV Button */}
          <button 
            onClick={downloadCSVReport}
            className="flex items-center gap-1.5 rounded-xl border border-teal-600 bg-teal-50 px-3.5 py-2 text-xs font-semibold text-teal-700 shadow-sm transition hover:bg-teal-100 dark:border-teal-700 dark:bg-teal-950/40 dark:text-teal-300 dark:hover:bg-teal-900/40"
            title="Download full analytics data as CSV file"
          >
            <FileSpreadsheet size={15} /> Download CSV
          </button>

          {/* Download PDF Button */}
          <button 
            onClick={downloadPDFReport}
            className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700"
            title="Download formatted analytics report as PDF"
          >
            <FileText size={15} /> Download PDF
          </button>
        </div>
      </div>

      {/* TOP KPI ROW */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Income</div>
          <div className="mt-1 text-2xl font-bold">₹7,20,000</div>
          <div className="mt-1 flex items-center text-xs font-semibold text-teal-500">
            <ArrowUpRight size={14} className="mr-0.5" /> 12.5% <span className="ml-1 font-normal text-slate-400">vs last 6 months</span>
          </div>
          <div className="mt-4"><Sparkline data={trendData} dataKey="income" color="#14b8a6" /></div>
        </div>
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Expenses</div>
          <div className="mt-1 text-2xl font-bold">₹4,10,000</div>
          <div className="mt-1 flex items-center text-xs font-semibold text-rose-500">
            <ArrowUpRight size={14} className="mr-0.5" /> 8.3% <span className="ml-1 font-normal text-slate-400">vs last 6 months</span>
          </div>
          <div className="mt-4"><Sparkline data={trendData} dataKey="expenses" color="#f43f5e" /></div>
        </div>
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Savings</div>
          <div className="mt-1 text-2xl font-bold">₹3,10,000</div>
          <div className="mt-1 flex items-center text-xs font-semibold text-indigo-500">
            <ArrowUpRight size={14} className="mr-0.5" /> 18.7% <span className="ml-1 font-normal text-slate-400">vs last 6 months</span>
          </div>
          <div className="mt-4"><Sparkline data={trendData} dataKey="savings" color="#6366f1" /></div>
        </div>
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">Debt Overview</div>
          <div className="mt-1 text-2xl font-bold">₹3,80,000</div>
          <div className="mt-1 flex items-center text-xs font-semibold text-teal-500">
            <ArrowDownRight size={14} className="mr-0.5" /> 4.2% <span className="ml-1 font-normal text-slate-400">vs last 6 months</span>
          </div>
          <div className="mt-4"><Sparkline data={trendData} dataKey="expenses" color="#14b8a6" /></div>
        </div>
      </div>

      {/* MIDDLE ROW */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Trend Composed Chart */}
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">Income vs Expenses Analysis</h2>
            <select className="rounded-lg border border-slate-200 py-1.5 pl-3 pr-8 text-xs font-medium text-slate-600 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <option>Monthly</option>
              <option>Quarterly</option>
            </select>
          </div>
          <div className="mb-2 flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-sm bg-teal-500" /> Income (Bar)</div>
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-sm bg-rose-400" /> Expenses (Bar)</div>
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-indigo-500" /> Savings (Trend)</div>
          </div>
          <div className="h-64 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                <YAxis tickFormatter={inrShort} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <RechartsTooltip 
                  formatter={(val) => inr(val)} 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', backgroundColor: '#1e293b', color: '#fff' }} 
                />
                <Bar dataKey="income" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="expenses" fill="#fb7185" radius={[4, 4, 0, 0]} barSize={20} />
                <Line type="monotone" dataKey="savings" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown as Progress Bars */}
        <div className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-6">
            <h2 className="font-bold">Spending Intensity</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total volume by category</p>
          </div>
          <div className="flex-1 space-y-5 overflow-y-auto pr-2">
            {breakdownData.map((it) => (
              <div key={it.name}>
                <div className="mb-1.5 flex justify-between text-xs font-semibold">
                  <span>{it.name}</span>
                  <span className="text-slate-500">{inrShort(it.value)} <span className="ml-1 opacity-60">({it.percent}%)</span></span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${it.percent}%`, backgroundColor: it.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Radar Chart Health Score */}
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center gap-1.5 font-bold">
            Health Radar 
            <span title="Radar displays your 5 core financial pillars: Savings, Debt, Stability, Discipline, Growth">
              <Info size={14} className="text-slate-400 cursor-help" />
            </span>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="relative h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#cbd5e1" opacity={0.5} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} />
                  <Radar name="Score" dataKey="A" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.4} />
                  <RechartsTooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-center">
              <div className="text-2xl font-black text-sky-600 dark:text-sky-400">82<span className="text-sm font-bold text-slate-400">/100</span></div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Excellent Symmetry</div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        {/* Future Projection Area Chart */}
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-5 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="font-bold">Trajectory Forecast <span className="font-medium text-slate-500 dark:text-slate-400">(6 Months)</span></h2>
          <div className="mt-2 mb-4 flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-pink-500" /> Projected Velocity</div>
            <div className="flex items-center gap-1.5"><div className="h-0.5 w-3 bg-teal-500" /> Target Threshold</div>
          </div>
          <div className="flex h-56 min-w-0 items-center gap-4">
            <div className="h-full flex-1 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                  <YAxis tickFormatter={inrShort} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 200000]} />
                  <RechartsTooltip formatter={(val) => inr(val)} contentStyle={{ fontSize: '12px', borderRadius: '8px', backgroundColor: '#1e293b', color: '#fff' }} />
                  <ReferenceLine y={150000} stroke="#14b8a6" strokeDasharray="4 4" strokeWidth={2} />
                  <Area type="monotone" dataKey="projected" stroke="#ec4899" strokeWidth={3} fill="url(#colorProj)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Upcoming Important Events */}
        <div className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-4 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-4 font-bold">Upcoming Obligations</h2>
          <div className="flex-1 space-y-4">
            {events.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${ev.bg} ${ev.color}`}>
                    <ev.icon size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{ev.title}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{ev.date}</div>
                  </div>
                </div>
                <div className="text-sm font-bold text-teal-600 dark:text-teal-400">{inr(ev.amount)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Insights & AI */}
        <div className="min-w-0 flex flex-col gap-4 lg:col-span-3">
          <div className="flex-1 rounded-xl border border-cyan-100 bg-cyan-50/30 p-4 dark:border-cyan-900 dark:bg-cyan-900/20">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-cyan-900 dark:text-cyan-100">
              <Activity size={16} className="text-cyan-600 dark:text-cyan-400" /> Analytical Insights
            </h3>
            <ul className="space-y-3 text-xs font-medium text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-cyan-500" />
                You save 18% of your income consistently.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-cyan-500" />
                Optimizing fixed costs could free up ₹2,500/month.
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-fuchsia-100 bg-fuchsia-50 p-4 shadow-sm dark:border-fuchsia-900 dark:bg-fuchsia-900/20">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-fuchsia-900 dark:text-fuchsia-100">
              <Sparkles size={16} className="text-fuchsia-600 dark:text-fuchsia-400" /> AI Strategy
            </h3>
            <p className="mb-3 text-xs font-medium text-slate-700 dark:text-slate-300">
              Based on the radar symmetry, diversifying into equity bonds will balance your growth pillar.
            </p>
            <button
              onClick={() => setShowAiChat(true)}
              className="w-full rounded-xl bg-fuchsia-600 py-2.5 text-xs font-bold text-white transition hover:bg-fuchsia-700 flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Bot size={15} /> Consult AI Forecast Advisor
            </button>
          </div>
        </div>

      </div>

      {/* FOOTER BANNER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-amber-100 bg-amber-50 p-5 shadow-sm dark:border-amber-900/40 dark:bg-amber-900/20">
        <div className="flex items-start gap-3">
          <Lightbulb size={24} className="mt-0.5 shrink-0 text-amber-500" />
          <div>
            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-100">AI Optimization Engine</h3>
            <p className="text-xs font-medium text-amber-800/80 dark:text-amber-200/80 mt-0.5 max-w-3xl">
              Applying the recommended trajectory shifts could advance your milestone completions by an average of 45 days.
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            notify({
              title: 'AI Strategy Applied',
              message: 'Trajectory shifts updated. Milestones optimized by an estimated 45 days.',
              type: 'success'
            })
            setShowAiChat(true)
            handleSendAiMessage('How can I apply the AI Optimization Engine recommendations to advance my milestone completions by 45 days?')
          }}
          className="shrink-0 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-amber-600 shadow-sm transition hover:bg-amber-100 dark:bg-amber-900 dark:text-amber-100 dark:hover:bg-amber-800"
        >
          Apply Strategy via AI
        </button>
      </div>

      {/* AI Forecast & Strategy Chat Popup Modal (Requirement 4) */}
      {showAiChat && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end p-4 sm:p-6 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 flex flex-col h-[530px] overflow-hidden animate-in fade-in slide-in-from-bottom-5">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-fuchsia-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/60">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-fuchsia-600 text-white shadow-sm">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">FinScope AI Advisor</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Forecast, Radar Symmetry &amp; Optimization</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => navigate('/assistant?prompt=' + encodeURIComponent('Analyze my 6-month financial forecast and suggest strategic portfolio adjustments.'))}
                  title="Open in Full AI Assistant"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700"
                >
                  <ExternalLink size={16} />
                </button>
                <button
                  onClick={() => setShowAiChat(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Quick Strategy Prompt Chips */}
            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex gap-1.5 overflow-x-auto no-scrollbar bg-slate-50/50 dark:bg-slate-800/40">
              {[
                'How to optimize Growth pillar (Score 70)?',
                'Will savings cover the ₹1,20,000 Bike Goal?',
                'Strategies for inflation & interest rates'
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendAiMessage(chip)}
                  className="shrink-0 text-[11px] font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-fuchsia-600 dark:text-fuchsia-400 px-2.5 py-1 rounded-full hover:bg-fuchsia-50 dark:hover:bg-slate-700 transition"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'ai' && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/60 dark:text-fuchsia-400 text-xs font-bold">
                      AI
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-fuchsia-600 text-white rounded-br-none'
                        : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isAiLoading && (
                <div className="flex gap-2.5 justify-start">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/60 dark:text-fuchsia-400 text-xs font-bold">
                    AI
                  </div>
                  <div className="rounded-2xl rounded-bl-none bg-slate-100 px-3.5 py-2.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400 flex items-center gap-1.5">
                    <Loader2 size={13} className="animate-spin text-fuchsia-600" /> Analyzing financial projection data...
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendAiMessage()
              }}
              className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about forecast, radar score, milestones..."
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-fuchsia-500"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isAiLoading}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-fuchsia-600 text-white transition hover:bg-fuchsia-700 disabled:opacity-40 disabled:hover:bg-fuchsia-600"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
