import React, { useState, useEffect } from 'react'
import TimetableTable from '../../components/TimetableTable'
import StatCard from '../../components/StatCard'
import EmptyState from '../../components/EmptyState'
import { getMyTimetable, getEventRequests } from '../../api'
import ClassIcon from '@mui/icons-material/Class'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import DomainIcon from '@mui/icons-material/Domain'
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek'
import AutorenewIcon from '@mui/icons-material/Autorenew'

export default function FacultyHome() {
  const [timetable, setTimetable] = useState([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFacultyData()
  }, [])

  const loadFacultyData = async () => {
    setLoading(true)
    try {
      const [ttRes, reqRes] = await Promise.all([
        getMyTimetable(),
        getEventRequests('PENDING')
      ])
      setTimetable(ttRes.entries || [])
      setPendingCount(reqRes.count || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Faculty Dashboard</h1>
        <p className="text-xs text-textMuted dark:text-darkTextMuted">Personalized teaching schedule and event request summary</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<ClassIcon fontSize="large" />} label="Assigned Class Sessions" value={timetable.length} sub="Your weekly teaching load" />
        <StatCard icon={<HourglassEmptyIcon fontSize="large" />} label="Pending Event Requests" value={pendingCount} sub="Awaiting admin approval" />
        <StatCard icon={<DomainIcon fontSize="large" />} label="Available Campus Blocks" value="4 Blocks" sub="A, B, Techlounge, Ideafactory" />
      </div>

      {loading ? (
        <div className="bg-white dark:bg-darkSurface rounded-xl border border-border dark:border-darkBorder p-12 text-center text-textMuted dark:text-darkTextMuted space-y-2">
          <AutorenewIcon className="animate-spin text-primary" style={{ fontSize: 32 }} />
          <p className="text-xs">Loading faculty schedule...</p>
        </div>
      ) : timetable.length === 0 ? (
        <EmptyState
          icon={<CalendarViewWeekIcon style={{ fontSize: 40 }} />}
          title="No teaching sessions assigned"
          description="Your personalized teaching schedule is currently empty."
        />
      ) : (
        <div className="bg-white dark:bg-darkSurface rounded-2xl border border-border dark:border-darkBorder p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">My Teaching Timetable Matrix</h3>
          <TimetableTable entries={timetable} />
        </div>
      )}
    </div>
  )
}
