import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertCircle, Info, X, Bell } from 'lucide-react'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const notify = useCallback((options) => {
    const id = Date.now() + Math.random()
    const item = typeof options === 'string'
      ? { id, title: 'Notification', message: options, type: 'success' }
      : { id, title: options.title || 'Notification', message: options.message || '', type: options.type || 'success' }

    setNotifications((prev) => [item, ...prev].slice(0, 4))

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 4500)
  }, [])

  return (
    <NotificationContext.Provider value={{ notify, removeNotification }}>
      {children}

      {/* Floating OS-Style Laptop / Mobile Push Notification Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-[380px] w-[calc(100vw-2.5rem)] pointer-events-none">
        {notifications.map((n) => (
          <div
            key={n.id}
            className="pointer-events-auto flex flex-col rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 transition-all duration-300 animate-in slide-in-from-top-4 fade-in"
          >
            {/* Notification App Header (like iOS / Windows Notification) */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs">
                  <Bell size={11} />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  FinBridge AI
                </span>
                <span className="text-[10px] text-slate-400">• now</span>
              </div>
              <button
                type="button"
                onClick={() => removeNotification(n.id)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X size={13} />
              </button>
            </div>

            {/* Notification Body */}
            <div className="pt-2 flex items-start gap-2.5">
              {n.type === 'error' ? (
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              ) : n.type === 'info' ? (
                <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {n.title}
                </div>
                {n.message && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    {n.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

export const useNotification = () => {
  const ctx = useContext(NotificationContext)
  if (!ctx) {
    // Fallback if accessed outside provider
    return {
      notify: (opts) => console.log('Notification:', opts),
      removeNotification: () => {}
    }
  }
  return ctx
}
