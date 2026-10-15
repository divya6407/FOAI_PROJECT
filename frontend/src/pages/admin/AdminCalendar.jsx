import React, { useState, useEffect } from 'react'
import MonthGrid from '../../components/MonthGrid'
import TimetableTable from '../../components/TimetableTable'
import { getMonthTimetable, getAllTimetable, getTodayTimetable } from '../../api'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import AutorenewIcon from '@mui/icons-material/Autorenew'

export default function AdminCalendar() {
  const [viewMode, setViewMode] = useState('month') // 'today' | 'week' | 'month'
  const [monthData, setMonthData] = useState({})
  const [timetable, setTimetable] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCalendarData()
  }, [viewMode])

  const loadCalendarData = async () => {
    setLoading(true)
    try {
      if (viewMode === 'month') {
        const res = await getMonthTimetable()
        setMonthData(res.days || {})
      } else if (viewMode === 'today') {
        const res = await getTodayTimetable()
        setTimetable(res.entries || [])
      } else {
        const res = await getAllTimetable()
        setTimetable(res.entries || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Academic Calendar & Schedule</h1>
          <p className="text-xs text-textMuted dark:text-darkTextMuted">View class density and event scheduling across different time horizons</p>
        </div>

        <div className="bg-surfaceAlt dark:bg-darkSurfaceAlt p-1 rounded-xl border border-border dark:border-darkBorder flex text-xs">
          {['today', 'week', 'month'].map(m => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`px-4 py-1.5 rounded-lg font-semibold capitalize transition-colors ${
                viewMode === m ? 'bg-primary text-white shadow-sm' : 'text-textMuted dark:text-darkTextMuted hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-darkSurface rounded-xl border border-border dark:border-darkBorder p-12 text-center text-textMuted dark:text-darkTextMuted space-y-2">
          <AutorenewIcon className="animate-spin text-primary" style={{ fontSize: 32 }} />
          <p className="text-xs">Loading calendar grid...</p>
        </div>
      ) : viewMode === 'month' ? (
        <div className="bg-white dark:bg-darkSurface rounded-2xl border border-border dark:border-darkBorder p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Monthly Density Map</h3>
            <span className="text-xs text-textMuted dark:text-darkTextMuted font-medium">Class & Event volume per day</span>
          </div>
          <MonthGrid days={monthData} />
        </div>
      ) : (
        <div className="bg-white dark:bg-darkSurface rounded-2xl border border-border dark:border-darkBorder p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">
            {viewMode === 'today' ? "Today's Timetable Grid" : "Master Weekly Timetable Grid"}
          </h3>
          <TimetableTable entries={timetable} />
        </div>
      )}
    </div>
  )
}
