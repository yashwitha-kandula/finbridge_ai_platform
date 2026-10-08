import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Income from './pages/Income'
import Expenses from './pages/Expenses'
import Transactions from './pages/Transactions'
import Debts from './pages/Debts'
import Goals from './pages/Goals'
import FamilyPlanning from './pages/FamilyPlanning'
import Forecast from './pages/Forecast'

import { ThemeProvider } from './theme/ThemeProvider'

function Gate({ children }) {
  const { token, loading } = useAuth()
  if (loading) return null
  return token ? children : <Navigate to="/login" replace />
}

function Placeholder({ title }) {
  return <div className="flex h-[50vh] items-center justify-center text-slate-400 dark:text-slate-500">{title} page is under construction.</div>
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
          <Route path="/" element={<Gate><Layout /></Gate>}>
            <Route index element={<Dashboard />} />
            <Route path="income" element={<Income />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="debts" element={<Debts />} />
            <Route path="goals" element={<Goals />} />
            <Route path="family" element={<FamilyPlanning />} />
            <Route path="investments" element={<Placeholder title="Investments" />} />
            <Route path="forecast" element={<Forecast />} />
            <Route path="assistant" element={<Placeholder title="AI Assistant" />} />
            <Route path="reports" element={<Placeholder title="Reports" />} />
            <Route path="documents" element={<Placeholder title="Documents" />} />
            <Route path="settings" element={<Placeholder title="Settings" />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </ThemeProvider>
  )
}
