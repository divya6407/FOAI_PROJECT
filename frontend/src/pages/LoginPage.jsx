import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { loginUser } from '../api'
import SchoolIcon from '@mui/icons-material/School'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await loginUser(email, password)
      login(res.access_token, res.user)

      if (res.user.role === 'admin') {
        navigate('/admin')
      } else if (res.user.role === 'faculty') {
        navigate('/faculty')
      } else {
        navigate('/student')
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = (demoEmail, demoPw) => {
    setEmail(demoEmail)
    setPassword(demoPw)
  }

  return (
    <div className="min-h-screen bg-bgApp dark:bg-darkBgApp flex items-center justify-center p-4 font-sans transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-darkSurface rounded-2xl border border-border dark:border-darkBorder shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-surfaceAlt dark:bg-darkSurfaceAlt text-primary dark:text-primaryLight mb-1">
            <SchoolIcon fontSize="large" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">AI Scheduler Portal</h1>
          <p className="text-xs text-textMuted dark:text-darkTextMuted">Sign in to access your role-based timetable portal</p>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-textMuted dark:text-darkTextMuted mb-1">Email Address</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-textMuted dark:text-darkTextMuted">
                <EmailOutlinedIcon fontSize="small" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@college.edu"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border dark:border-darkBorder bg-transparent focus:outline-none focus:border-primary text-gray-800 dark:text-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-textMuted dark:text-darkTextMuted mb-1">Password</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-textMuted dark:text-darkTextMuted">
                <LockOutlinedIcon fontSize="small" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border dark:border-darkBorder bg-transparent focus:outline-none focus:border-primary text-gray-800 dark:text-gray-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primaryHover text-white py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Login Quick Fill Buttons */}
        <div className="border-t border-border dark:border-darkBorder pt-4 space-y-2">
          <p className="text-[11px] font-semibold text-textMuted dark:text-darkTextMuted text-center">Demo Quick Login Accounts:</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('student@college.edu', 'student123')}
              className="px-2 py-1.5 rounded-lg border border-border dark:border-darkBorder bg-surfaceAlt dark:bg-darkSurfaceAlt hover:bg-purple-100 dark:hover:bg-purple-900 text-[10px] font-semibold text-primary dark:text-primaryLight transition-colors"
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('priya.nair@college.edu', 'faculty123')}
              className="px-2 py-1.5 rounded-lg border border-border dark:border-darkBorder bg-surfaceAlt dark:bg-darkSurfaceAlt hover:bg-purple-100 dark:hover:bg-purple-900 text-[10px] font-semibold text-primary dark:text-primaryLight transition-colors"
            >
              Faculty
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@college.edu', 'admin123')}
              className="px-2 py-1.5 rounded-lg border border-border dark:border-darkBorder bg-surfaceAlt dark:bg-darkSurfaceAlt hover:bg-purple-100 dark:hover:bg-purple-900 text-[10px] font-semibold text-primary dark:text-primaryLight transition-colors"
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
