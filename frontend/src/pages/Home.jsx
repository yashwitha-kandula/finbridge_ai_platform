import { useAuth } from '../auth/AuthContext'

export default function Home() {
  const { user, logout } = useAuth()
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow border border-slate-200 p-10 max-w-lg w-full text-center">
        <h1 className="text-2xl font-bold text-navy">You are signed in</h1>
        <p className="mt-3 text-slate-600">
          {user ? `${user.full_name} (${user.email})` : 'Loading profile...'}
        </p>
        {user && (
          <p className="mt-1 text-sm text-slate-500">
            {user.profession} · {user.income_type}
          </p>
        )}
        <p className="mt-6 text-sm text-slate-500">
          Dashboard will be built next, once you share its image.
        </p>
        <button
          onClick={logout}
          className="mt-6 px-6 py-2.5 rounded-lg bg-navy text-white font-semibold hover:bg-navy-light"
        >
          Log out
        </button>
      </div>
    </div>
  )
}
