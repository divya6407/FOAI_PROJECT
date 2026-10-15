import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import DashboardIcon from '@mui/icons-material/Dashboard'
import SettingsIcon from '@mui/icons-material/Settings'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import EventNoteIcon from '@mui/icons-material/EventNote'
import AssessmentIcon from '@mui/icons-material/Assessment'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import LogoutIcon from '@mui/icons-material/Logout'
import PersonIcon from '@mui/icons-material/Person'
import SchoolIcon from '@mui/icons-material/School'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'

const NAV = {
  student: [
    { to: '/student',             label: 'Dashboard',   icon: <DashboardIcon fontSize="small" /> },
    { to: '/student/preferences', label: 'Preferences', icon: <SettingsIcon fontSize="small" /> },
    { to: '/student/rooms',       label: 'Free Rooms',  icon: <MeetingRoomIcon fontSize="small" /> },
  ],
  faculty: [
    { to: '/faculty',          label: 'Dashboard',     icon: <DashboardIcon fontSize="small" /> },
    { to: '/faculty/event',    label: 'Request Event', icon: <EventNoteIcon fontSize="small" /> },
    { to: '/faculty/requests', label: 'My Requests',   icon: <AssessmentIcon fontSize="small" /> },
  ],
  admin: [
    { to: '/admin',           label: 'Overview', icon: <DashboardIcon fontSize="small" /> },
    { to: '/admin/requests',  label: 'Requests', icon: <AssessmentIcon fontSize="small" /> },
    { to: '/admin/calendar',  label: 'Calendar', icon: <CalendarMonthIcon fontSize="small" /> },
  ],
}

const ROLE_LABELS = {
  student: 'Student Portal',
  faculty: 'Faculty Portal',
  admin:   'Admin Portal',
}

export default function Sidebar({ role }) {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const links = NAV[role] || []

  return (
    <aside className="w-60 bg-secondary dark:bg-[#130E26] text-white flex flex-col shrink-0 border-r border-white/10 dark:border-darkBorder">
      {/* Brand Header */}
      <div className="px-5 py-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primaryLight/20 text-primaryLight">
            <SchoolIcon />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/50">AI Scheduler</div>
            <div className="text-base font-semibold">{ROLE_LABELS[role]}</div>
          </div>
        </div>
      </div>

      {/* User Info Card */}
      {user && (
        <div className="px-4 py-3 mx-3 my-3 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-primaryLight/20 text-primaryLight">
            <PersonIcon fontSize="small" />
          </div>
          <div className="overflow-hidden flex-1">
            <div className="text-xs font-semibold truncate text-white">{user.name}</div>
            <div className="text-[10px] text-primaryLight capitalize">{user.role}</div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-primaryLight/20 text-primaryLight shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            {icon}
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Actions: Theme Toggle & Logout */}
      <div className="p-3 border-t border-white/10 space-y-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white/80 transition-colors"
        >
          {isDark ? <LightModeIcon fontSize="small" className="text-amber-400" /> : <DarkModeIcon fontSize="small" className="text-purple-300" />}
          <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white hover:bg-red-500/20 transition-colors"
        >
          <LogoutIcon fontSize="small" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
