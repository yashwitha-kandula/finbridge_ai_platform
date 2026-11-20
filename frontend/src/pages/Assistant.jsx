import { useState, useEffect } from 'react'
import {
  Sparkles, Send, Mic, Paperclip, ChevronRight, CheckCircle2, TrendingUp, AlertCircle, History, Plus,
  FileText, Calculator, PiggyBank, Receipt, DollarSign, Lightbulb, ArrowUpRight
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { useAuth } from '../auth/AuthContext'
import { authFetch } from '../lib/api'

const QUICK_PROMPTS = [
  'How can I save more?',
  'Analyze my spending',
  'Should I prepay my loan?',
  'Best investment for me',
  'Plan my retirement'
]

const COLORS = ['#6366f1', '#3b82f6', '#f59e0b', '#10b981', '#06b6d4', '#ef4444']

const createWelcomeMessage = (name = 'there') => ({
  id: 'welcome',
  sender: 'ai',
  text: `Hello ${name}! I'm your FinBridge AI Financial Advisor. Ask me anything about your income, monthly expenses, loan payoffs, or investments.`,
  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  hasAnalysis: false
})

export default function Assistant() {
  const { token, user } = useAuth()
  const userName = user?.full_name ? user.full_name.split(' ')[0] : 'there'
  
  const [messages, setMessages] = useState(() => [createWelcomeMessage()])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [dashboardData, setDashboardData] = useState(null)
  const [chatHistory, setChatHistory] = useState([])
  const [activeChatId, setActiveChatId] = useState(null)
  const [historyError, setHistoryError] = useState('')

  useEffect(() => {
    let active = true
    setChatHistory([])
    setActiveChatId(null)
    setMessages([createWelcomeMessage(user?.full_name?.split(' ')[0] || 'there')])
    setHistoryError('')
    if (!token) return () => { active = false }

    authFetch(token, '/api/ai/history')
      .then(data => {
        if (active) setChatHistory(data.chats || [])
      })
      .catch(err => {
        if (active) setHistoryError(`Could not load chat history: ${err.message}`)
      })

    return () => { active = false }
  }, [token, user])

  useEffect(() => {
    // Fetch live user financial data
    if (token) {
      authFetch(token, '/api/dashboard?breakdown=this_month')
        .then(data => {
          setDashboardData(data)
        })
        .catch(err => console.error('Failed to load dashboard for assistant', err))
    }
  }, [token, user])

  // Derive real expense categories from user database, strictly fallback to empty if none
  const expenseCategories = dashboardData?.breakdown?.items?.length > 0
    ? dashboardData.breakdown.items.map((c, i) => ({
        name: c.name,
        value: Number(c.amount) || 0,
        color: COLORS[i % COLORS.length]
      }))
    : []

  const totalIncome = Number(dashboardData?.cards?.income?.value) || 0
  const totalExpense = Number(dashboardData?.breakdown?.total ?? dashboardData?.cards?.expenses?.value) || 0
  const savingsRate = totalIncome > 0
    ? Math.round(((totalIncome - totalExpense) / totalIncome) * 1000) / 10
    : 0
  const potentialSavings = Math.round(totalExpense * 0.12) || 0

  const handleSend = async (textToSend) => {
    const query = textToSend || input
    if (!query.trim() || loading) return

    const newMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setMessages(prev => [...prev, newMsg])
    setInput('')
    setLoading(true)

    const saveConversation = async (assistantMessage) => {
      const conversationMessages = [
        ...messages.filter(message => message.id !== 'welcome'),
        newMsg,
        assistantMessage
      ].slice(-100)
      setMessages(conversationMessages)

      try {
        const savedChat = await authFetch(token, '/api/ai/history', {
          method: 'POST',
          body: JSON.stringify({
            chat_id: activeChatId,
            title: conversationMessages.find(message => message.sender === 'user')?.text.slice(0, 120) || 'Financial chat',
            messages: conversationMessages
          })
        })
        setActiveChatId(savedChat.id)
        setChatHistory(prev => [
          savedChat,
          ...prev.filter(chat => chat.id !== savedChat.id)
        ].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 3))
        setHistoryError('')
      } catch (err) {
        setHistoryError(`Chat received, but history could not be saved: ${err.message}`)
      }
    }

    try {
      const res = await authFetch(token, '/api/ai/ask', {
        method: 'POST',
        body: JSON.stringify({
          question: query,
          context: {
            user_name: user?.full_name || 'User',
            total_income: totalIncome,
            total_expense: totalExpense,
            savings_rate: savingsRate,
            categories: expenseCategories,
            goals: dashboardData?.goals || [],
            recent_transactions: dashboardData?.recent || [],
            upcoming_bills: dashboardData?.bills || [],
            monthly_trend: dashboardData?.trend || [],
            has_data: Boolean(dashboardData?.has_data)
          }
        })
      })

      await saveConversation({
        id: Date.now() + 1,
        sender: 'ai',
        text: res.answer || res.message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hasAnalysis: query.toLowerCase().includes('expense') || query.toLowerCase().includes('reduc') || query.toLowerCase().includes('spend')
      })
    } catch (err) {
      await saveConversation({
        id: Date.now() + 1,
        sender: 'ai',
        text: `I couldn't get a response from the AI service. ${err?.message || 'Please try again.'}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hasAnalysis: false
      })
    } finally {
      setLoading(false)
    }
  }

  const startNewChat = () => {
    if (loading) return
    setActiveChatId(null)
    setMessages([createWelcomeMessage(userName)])
    setHistoryError('')
  }

  const openChat = (chat) => {
    if (loading) return
    setActiveChatId(chat.id)
    setMessages(chat.messages)
    setHistoryError('')
  }

  return (
    <div className="mx-auto max-w-[1550px] space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">FinBridge AI Assistant</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Your personal financial advisor powered by AI</p>
            </div>
          </div>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              className="rounded-full border border-blue-200 bg-blue-50/60 px-3.5 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300"
            >
              {prompt}
            </button>
          ))}
          {loading && (
            <div className="flex items-start gap-3" aria-live="polite">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="rounded-2xl bg-slate-50 px-5 py-3.5 text-sm text-slate-500 dark:bg-slate-800/60 dark:text-slate-300">
                Thinking...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        {/* Left Column: Chat & Embedded Analysis */}
        <div className="flex flex-col space-y-6">
          <div className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <section aria-label="Recent chat history" className="border-b border-slate-100 pb-5 dark:border-slate-800">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
                  <History className="h-4 w-4 text-blue-600" />
                  Recent chats <span className="text-xs font-medium text-slate-400">(last 3)</span>
                </h2>
                <button
                  type="button"
                  onClick={startNewChat}
                  disabled={loading}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Plus className="h-3.5 w-3.5" /> New chat
                </button>
              </div>
              {historyError && <p role="alert" className="mb-2 text-xs text-rose-600">{historyError}</p>}
              {chatHistory.length ? (
                <div className="grid gap-2 sm:grid-cols-3">
                  {chatHistory.map(chat => (
                    <button
                      key={chat.id}
                      type="button"
                      onClick={() => openChat(chat)}
                      disabled={loading}
                      aria-pressed={activeChatId === chat.id}
                      className={`min-w-0 rounded-xl border p-3 text-left transition disabled:opacity-50 ${
                        activeChatId === chat.id
                          ? 'border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40'
                          : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">{chat.title}</p>
                      <p className="mt-1 text-[10px] text-slate-400">{new Date(chat.updated_at).toLocaleString()}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Your last three conversations will appear here.</p>
              )}
            </section>
            {/* Chat Thread */}
            <div className="space-y-4">
              {messages.map((m) => (
                <div key={m.id} className="space-y-4">
                  {m.sender === 'user' ? (
                    <div className="flex items-start justify-end gap-3">
                      <div className="max-w-xl rounded-2xl bg-indigo-50/80 px-4 py-3 text-sm font-medium text-slate-800 shadow-sm dark:bg-indigo-950/50 dark:text-indigo-200">
                        {m.text}
                        <div className="mt-1 text-right text-[10px] text-slate-400 dark:text-slate-500">{m.time}</div>
                      </div>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                        {user?.full_name ? user.full_name.trim().charAt(0).toUpperCase() : 'U'}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div className="w-full max-w-4xl space-y-4">
                        <div className="rounded-2xl bg-slate-50 px-5 py-3.5 text-sm text-slate-800 dark:bg-slate-800/60 dark:text-slate-200">
                          {m.text}
                          <div className="mt-1 text-[10px] text-slate-400">{m.time}</div>
                        </div>

                        {/* Interactive Rich Cards inside AI Response */}
                        {m.hasAnalysis && (
                          <div className="space-y-5">
                            {/* Card 1: Expense Analysis + Top Recommendations */}
                            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700/80 dark:bg-slate-800/90">
                              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {/* Expense Donut */}
                                <div>
                                  <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
                                    <span className="flex h-5 w-5 items-center justify-center rounded bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-400">
                                      ⏰
                                    </span>
                                    Your Expense Analysis
                                  </div>
                                  {expenseCategories.length > 0 ? (
                                    <div className="flex items-center gap-4">
                                      <div className="relative h-44 w-44 shrink-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                          <PieChart>
                                            <Pie
                                              data={expenseCategories}
                                              innerRadius={50}
                                              outerRadius={70}
                                              paddingAngle={3}
                                              dataKey="value"
                                            >
                                              {expenseCategories.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                              ))}
                                            </Pie>
                                          </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                                          <span className="text-[10px] font-medium text-slate-400 uppercase">Total</span>
                                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                                            ₹{(totalExpense / 1000).toFixed(0)}k
                                          </span>
                                          <span className="text-[9px] text-slate-400">(Monthly)</span>
                                        </div>
                                      </div>

                                      {/* Breakdown Legend */}
                                      <div className="space-y-1.5 text-xs flex-1">
                                        {expenseCategories.map((c) => (
                                          <div key={c.name} className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                                            <div className="flex items-center gap-1.5 truncate">
                                              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                                              <span className="truncate">{c.name}</span>
                                            </div>
                                            <span className="font-semibold ml-2">₹{c.value.toLocaleString('en-IN')}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-slate-500 py-6">No categorized expenses recorded yet for this period.</p>
                                  )}
                                </div>

                                {/* Top Recommendations */}
                                <div className="border-t pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0 dark:border-slate-700">
                                  <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
                                    <Sparkles className="h-4 w-4 text-purple-600" />
                                    Top Recommendations
                                  </div>
                                  <div className="space-y-2.5">
                                    {[
                                      { action: 'Reduce food delivery to 2 times/week', save: `Save ~ ₹${Math.round(potentialSavings * 0.45).toLocaleString('en-IN')}/month` },
                                      { action: 'Switch to yearly insurance plan', save: `Save ~ ₹${Math.round(potentialSavings * 0.15).toLocaleString('en-IN')}/month` },
                                      { action: 'Use public transport 2 more days', save: `Save ~ ₹${Math.round(potentialSavings * 0.2).toLocaleString('en-IN')}/month` },
                                      { action: 'Track small spends (< ₹200)', save: `Save ~ ₹${Math.round(potentialSavings * 0.2).toLocaleString('en-IN')}/month` }
                                    ].map((rec, i) => (
                                      <div key={i} className="flex items-start gap-2.5 rounded-lg bg-slate-50/80 p-2.5 dark:bg-slate-700/50">
                                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                                        <div className="text-xs">
                                          <p className="font-semibold text-slate-800 dark:text-slate-200">{rec.action}</p>
                                          <p className="font-medium text-emerald-600 dark:text-emerald-400">{rec.save}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Card 2: Metrics Strip */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 dark:border-emerald-950 dark:bg-emerald-950/20">
                                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                                  <PiggyBank className="h-4 w-4" /> Potential Monthly Savings
                                </div>
                                <div className="mt-2 flex items-baseline gap-2">
                                  <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">₹{potentialSavings.toLocaleString('en-IN')}</span>
                                  <span className="text-xs text-emerald-600 font-medium">(Approx.)</span>
                                </div>
                                <p className="mt-1 text-[11px] text-emerald-700/80 dark:text-emerald-400/70">This can help you reach your goals faster!</p>
                              </div>

                              <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 dark:border-amber-950 dark:bg-amber-950/20">
                                <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
                                  <TrendingUp className="h-4 w-4" /> Savings Rate
                                </div>
                                <div className="mt-2 flex items-baseline gap-2">
                                  <span className="text-2xl font-bold text-amber-700 dark:text-amber-400">{savingsRate}%</span>
                                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                                    {savingsRate >= 20 ? 'Good' : 'Moderate'}
                                  </span>
                                </div>
                                <p className="mt-1 text-[11px] text-amber-700/80 dark:text-amber-400/70">
                                  {savingsRate >= 20 ? 'You are saving well. Keep it up!' : 'Target saving at least 20% of your income.'}
                                </p>
                              </div>

                              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-950 dark:bg-blue-950/20">
                                <div className="flex items-center gap-2 text-xs font-semibold text-blue-800 dark:text-blue-300">
                                  <CheckCircle2 className="h-4 w-4" /> Emergency Fund Status
                                </div>
                                <div className="mt-2 flex items-baseline gap-2">
                                  <span className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                                    {totalExpense > 0 ? (totalIncome * 2.5 / totalExpense).toFixed(1) : '6.0'} Months
                                  </span>
                                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">Good</span>
                                </div>
                                <p className="mt-1 text-[11px] text-blue-700/80 dark:text-blue-400/70">You are financially secure!</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Input Bar */}
            <div className="pt-2">
              <div className="relative flex items-center rounded-2xl border border-slate-300 bg-white px-4 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-800">
                <Paperclip className="h-5 w-5 text-slate-400 hover:text-slate-600 cursor-pointer" />
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask anything about your finances..."
                  className="flex-1 bg-transparent px-3 text-sm text-slate-900 placeholder-slate-400 outline-none dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={loading || !input.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-center text-[11px] text-slate-400">
                AI responses are for informational purposes only. Always verify before making financial decisions.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: AI Insights, Quick Actions, Recent Questions */}
        <div className="space-y-6">
          {/* AI Insights Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
                <Sparkles className="h-4 w-4 text-purple-600" />
                AI Insights <span className="text-xs font-normal text-slate-400">(Today)</span>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { title: `Monthly Expense: ₹${totalExpense.toLocaleString('en-IN')}`, desc: `${savingsRate}% current savings rate`, icon: CheckCircle2, color: 'text-emerald-500' },
                { title: 'Emergency buffer active', desc: 'Covering 6+ months of expenses', icon: CheckCircle2, color: 'text-emerald-500' },
                { title: 'Loan EMI is on track', desc: 'No pending overdue payments', icon: CheckCircle2, color: 'text-emerald-500' },
                { title: 'Potential savings identified', desc: `Save up to ₹${potentialSavings.toLocaleString('en-IN')}/mo`, icon: CheckCircle2, color: 'text-blue-500' }
              ].map((insight, idx) => (
                <div key={idx} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex items-start gap-2.5">
                    <insight.icon className={`h-4 w-4 shrink-0 mt-0.5 ${insight.color}`} />
                    <div className="text-xs">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{insight.title}</p>
                      <p className="text-slate-500 dark:text-slate-400">{insight.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
              <span className="text-amber-500 font-bold">⚡</span>
              Quick Actions
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Expense Forecast', icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
                { label: 'Budget Planner', icon: Calculator, color: 'text-emerald-600 bg-emerald-50' },
                { label: 'Savings Calculator', icon: PiggyBank, color: 'text-amber-600 bg-amber-50' },
                { label: 'Loan Prepayment', icon: Receipt, color: 'text-rose-600 bg-rose-50' }
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleSend(`Help me calculate ${action.label}`)}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-100 p-2.5 text-left transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${action.color} dark:bg-slate-800`}>
                    <action.icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Questions */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
              <span className="text-purple-600">🕒</span>
              Sample Prompts
            </div>
            <div className="space-y-2.5">
              {[
                { q: 'How can I reduce my expenses?', time: 'Savings optimization' },
                { q: 'Should I prepay my loan?', time: 'Debt acceleration' },
                { q: 'Best way to invest for long term?', time: 'Wealth creation' },
                { q: 'What is the 50/30/20 budget rule?', time: 'Financial planning' }
              ].map((rq, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSend(rq.q)}
                  className="group flex cursor-pointer items-start justify-between rounded-lg p-2 text-xs transition hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500">🤖</span>
                    <div>
                      <p className="font-semibold text-slate-700 group-hover:text-blue-600 dark:text-slate-300 dark:group-hover:text-blue-400">
                        {rq.q}
                      </p>
                      <p className="text-[10px] text-slate-400">{rq.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
