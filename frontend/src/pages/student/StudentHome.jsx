import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import TimetableTable from '../../components/TimetableTable'
import EmptyState from '../../components/EmptyState'
import { getMyTimetable, getMyTodayTimetable } from '../../api'
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek'
import TodayIcon from '@mui/icons-material/Today'
import FilterListIcon from '@mui/icons-material/FilterList'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import LockIcon from '@mui/icons-material/Lock'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'

const SUBJECTS = [
  { id: '',             name: 'All Subjects' },
  { id: 'sub_lowcode', name: 'Low Code' },
  { id: 'sub_toc',     name: 'Theory of Computation' },
  { id: 'sub_mc',      name: 'Mobile Computing' },
  { id: 'sub_wp',      name: 'Web Programming' },
  { id: 'sub_cn',      name: 'Computer Networks' },
  { id: 'sub_foai',    name: 'Foundation of AI' },
]

export default function StudentHome() {
  const [subjectId, setSubjectId] = useState('')
  const [timetable, setTimetable] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('weekly') // 'today' | 'weekly'
  const [unlockedState, setUnlockedState] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    fetchTimetable()
  }, [subjectId, viewMode])

  const fetchTimetable = async () => {
    setLoading(true)
    setUnlockedState(false)
    setErrorMessage('')
    try {
      if (viewMode === 'today') {
        const res = await getMyTodayTimetable(subjectId || undefined)
        setTimetable(res.entries || [])
      } else {
        const res = await getMyTimetable(subjectId || undefined)
        setTimetable(res.entries || [])
      }
    } catch (err) {
      if (err.message && err.message.includes('PREFERENCES_NOT_LOCKED')) {
        setUnlockedState(true)
      } else {
        setErrorMessage(err.message || 'Failed to load timetable')
      }
      setTimetable([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">My Weekly Timetable</h1>
          <p className="text-xs text-textMuted dark:text-darkTextMuted">Personalized schedule derived from your locked subject preferences</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Subject Filter */}
          <div className="flex items-center gap-2 bg-white dark:bg-darkSurface px-3 py-1.5 rounded-xl border border-border dark:border-darkBorder shadow-sm">
            <FilterListIcon fontSize="small" className="text-textMuted dark:text-darkTextMuted" />
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="text-xs font-semibold text-gray-800 dark:text-gray-200 bg-transparent focus:outline-none"
            >
              {SUBJECTS.map(s => (
                <option key={s.id} value={s.id} className="dark:bg-darkSurface">{s.name}</option>
              ))}
            </select>
          </div>

          {/* Toggle View Mode */}
          <div className="bg-surfaceAlt dark:bg-darkSurfaceAlt p-1 rounded-xl border border-border dark:border-darkBorder flex text-xs">
            <button
              onClick={() => setViewMode('weekly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                viewMode === 'weekly'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-textMuted dark:text-darkTextMuted hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <CalendarViewWeekIcon fontSize="small" />
              <span>Weekly</span>
            </button>
            <button
              onClick={() => setViewMode('today')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                viewMode === 'today'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-textMuted dark:text-darkTextMuted hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <TodayIcon fontSize="small" />
              <span>Today Only</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-darkSurface rounded-xl border border-border dark:border-darkBorder p-12 text-center text-textMuted dark:text-darkTextMuted space-y-2">
          <AutorenewIcon className="animate-spin text-primary" style={{ fontSize: 32 }} />
          <p className="text-xs">Loading personalized schedule...</p>
        </div>
      ) : unlockedState ? (
        /* Requirement 2: Preference Lock System State */
        <div className="bg-white dark:bg-darkSurface rounded-2xl border border-amber-200 dark:border-amber-900/50 p-10 text-center shadow-sm space-y-4 max-w-lg mx-auto my-8">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <LockIcon style={{ fontSize: 32 }} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
              Preferences Not Locked
            </h3>
            <p className="text-xs text-textMuted dark:text-darkTextMuted">
              Lock your timetable preferences to view your timetable.
            </p>
          </div>
          <Link
            to="/student/preferences"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primaryHover text-white text-xs font-semibold shadow-md transition-all hover:scale-105"
          >
            <span>Review & Lock Preferences</span>
            <ArrowForwardIcon fontSize="small" />
          </Link>
        </div>
      ) : errorMessage ? (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-6 rounded-xl text-center text-red-700 dark:text-red-300 text-xs">
          {errorMessage}
        </div>
      ) : timetable.length === 0 ? (
        <EmptyState
          icon={<CalendarViewWeekIcon style={{ fontSize: 40 }} />}
          title="No classes scheduled"
          description="There are no sessions matching your selected subject filter or schedule."
        />
      ) : (
        <div className="bg-white dark:bg-darkSurface rounded-xl border border-border dark:border-darkBorder p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between text-xs text-textMuted dark:text-darkTextMuted">
            <span>Showing {timetable.length} personalized sessions</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Theory (50m)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span> Lab (1h 40m)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Event</span>
            </div>
          </div>
          <TimetableTable entries={timetable} filterSubject={subjectId} />
        </div>
      )}
    </div>
  )
}
