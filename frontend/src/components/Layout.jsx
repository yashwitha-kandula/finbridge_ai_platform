import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { DashboardProvider } from '../dashboard/DashboardContext'

export default function Layout() {
  const [open, setOpen] = useState(() => window.matchMedia('(min-width: 1024px)').matches)

  return (
    <DashboardProvider>
      <div className="flex min-h-screen bg-[#F6F7FB] dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 transition-colors">
        <Sidebar open={open} onClose={() => setOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header onMenu={() => setOpen((v) => !v)} />
          <main className="flex-1 p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </DashboardProvider>
  )
}
