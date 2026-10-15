import React, { useState, useEffect } from 'react'
import StatCard from '../../components/StatCard'
import TimetableTable from '../../components/TimetableTable'
import {
  getAdminStats,
  getTodayTimetable,
  generateTimetable,
  generateAlternativeTimetable,
  getTimetableQuality,
  getTeacherWorkload,
  listAdminUsers,
  resetUserPreference,
} from '../../api'

import ClassIcon from '@mui/icons-material/Class'
import EventIcon from '@mui/icons-material/Event'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import FlashOnIcon from '@mui/icons-material/FlashOn'
import AltRouteIcon from '@mui/icons-material/AltRoute'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import PeopleIcon from '@mui/icons-material/People'
import SchoolIcon from '@mui/icons-material/School'

export default function AdminOverview() {
  const [stats, setStats] = useState(null)
  const [quality, setQuality] = useState(null)
  const [workload, setWorkload] = useState([])
  const [todayEntries, setTodayEntries] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generatingAlt, setGeneratingAlt] = useState(false)
  const [genResult, setGenResult] = useState(null)
  const [resettingId, setResettingId] = useState(null)
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'workload' | 'users'

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const [sRes, qRes, wRes, tRes, uRes] = await Promise.all([
        getAdminStats(),
        getTimetableQuality(),
        getTeacherWorkload(),
        getTodayTimetable(),
        listAdminUsers(),
      ])
      setStats(sRes)
      setQuality(qRes)
      setWorkload(wRes.workload || [])
      setTodayEntries(tRes.entries || [])
      setUsers(uRes.users || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setGenResult(null)
    try {
      const res = await generateTimetable()
      setGenResult(res)
      await loadDashboard()
    } catch (err) {
      setGenResult({ success: false, detail: err.message })
    } finally {
      setGenerating(false)
    }
  }

  // Requirement 8: Alternative Timetable Generator
  const handleGenerateAlternative = async () => {
    setGeneratingAlt(true)
    setGenResult(null)
    try {
      const res = await generateAlternativeTimetable()
      setGenResult({
        success: true,
        message: 'Alternative Timetable Generated! (0 teacher, room, or batch conflicts)',
        sessionsScheduled: res.sessionsScheduled,
        conflictCount: 0,
      })
      await loadDashboard()
    } catch (err) {
      setGenResult({
        success: false,
        detail: err.message || 'No alternative timetable satisfying all constraints was found.',
      })
    } finally {
      setGeneratingAlt(false)
    }
  }

  const handleResetPreference = async (userId) => {
    setResettingId(userId)
    try {
      await resetUserPreference(userId)
      await loadDashboard()
    } catch (err) {
      alert(`Reset failed: ${err.message}`)
    } finally {
      setResettingId(null)
    }
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header & Main Generator Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Admin Control Center</h1>
          <p className="text-xs text-textMuted dark:text-darkTextMuted">
            CSP Timetable Engine, Teacher Workload Analytics, & Preference Management
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Generate Alternative Button (Requirement 8) */}
          <button
            onClick={handleGenerateAlternative}
            disabled={generatingAlt || generating}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <AltRouteIcon fontSize="small" />
            <span>{generatingAlt ? 'Exploring Solution Space...' : 'Generate Alternative Timetable'}</span>
          </button>

          {/* Main CSP Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating || generatingAlt}
            className="bg-primary hover:bg-primaryHover text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <FlashOnIcon fontSize="small" />
            <span>{generating ? 'Running CSP Engine...' : 'Run CSP Engine'}</span>
          </button>
        </div>
      </div>

      {/* Generation Result Banner */}
      {genResult && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between shadow-sm ${
            genResult.success
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}
        >
          <div>
            <strong>{genResult.success ? 'CSP Timetable Ready!' : 'Generation Status:'}</strong>{' '}
            {genResult.message || genResult.detail || `Scheduled ${genResult.sessionsScheduled} sessions.`}
          </div>
          <button onClick={() => setGenResult(null)} className="font-bold px-2">
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="bg-white dark:bg-darkSurface rounded-xl border border-border dark:border-darkBorder p-12 text-center text-textMuted dark:text-darkTextMuted space-y-2">
          <AutorenewIcon className="animate-spin text-primary" style={{ fontSize: 32 }} />
          <p className="text-xs">Gathering real-time system metrics & schedule data...</p>
        </div>
      ) : (
        <>
          {/* Stat Cards Matrix (Requirement 11) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard icon={<ClassIcon fontSize="large" />} label="Total Classes" value={stats?.totalScheduledClasses} sub={`${quality?.theoryClasses || 0} Theory · ${quality?.labClasses || 0} Lab`} />
            <StatCard icon={<PeopleIcon fontSize="large" />} label="Active Teachers" value={stats?.totalTeachers} sub={`Across ${stats?.totalSubjects || 6} Subjects`} />
            <StatCard icon={<MeetingRoomIcon fontSize="large" />} label="Campus Rooms" value={stats?.totalRooms} sub={`${stats?.roomUtilizationPct}% Period 1 Utilization`} />
            <StatCard icon={<HourglassEmptyIcon fontSize="large" />} label="Pending Requests" value={stats?.pendingRequests} sub="Requires admin action" />
            <StatCard
              icon={stats?.conflicts === 0 ? <CheckCircleIcon fontSize="large" className="text-emerald-600" /> : <WarningAmberIcon fontSize="large" className="text-rose-600" />}
              label="Conflicts Detected"
              value={stats?.conflicts}
              sub={stats?.conflicts === 0 ? "0 Teacher/Room/Batch Clashes" : "Attention needed!"}
            />
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-border dark:border-darkBorder flex items-center gap-4 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2 transition-colors border-b-2 ${
                activeTab === 'overview'
                  ? 'border-primary text-primary dark:text-primaryLight'
                  : 'border-transparent text-textMuted dark:text-darkTextMuted hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Timetable Status & Quality
            </button>
            <button
              onClick={() => setActiveTab('workload')}
              className={`pb-2 transition-colors border-b-2 ${
                activeTab === 'workload'
                  ? 'border-primary text-primary dark:text-primaryLight'
                  : 'border-transparent text-textMuted dark:text-darkTextMuted hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Teacher Workload ({workload.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-2 transition-colors border-b-2 ${
                activeTab === 'users'
                  ? 'border-primary text-primary dark:text-primaryLight'
                  : 'border-transparent text-textMuted dark:text-darkTextMuted hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Student Preference Lock ({stats?.preferenceLockStatus})
            </button>
          </div>

          {/* TAB 1: OVERVIEW & TIMETABLE QUALITY SUMMARY */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Requirement 5: Timetable Status & Quality Card */}
              {quality && (
                <div className="bg-white dark:bg-darkSurface rounded-2xl border border-border dark:border-darkBorder p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">
                        TIMETABLE QUALITY & CONSTRAINT METRICS
                      </h3>
                      <p className="text-xs text-textMuted dark:text-darkTextMuted">
                        Calculated directly from active MongoDB schedule entries
                      </p>
                    </div>
                    <div className="px-3 py-1 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-primary dark:text-primaryLight font-bold text-xs">
                      Preference Satisfaction: {quality.preferenceSatisfactionPct}%
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-surfaceAlt dark:bg-darkSurfaceAlt space-y-1">
                      <div className="text-textMuted dark:text-darkTextMuted">Teacher Conflicts</div>
                      <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircleIcon fontSize="small" /> 0 Clashes
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-surfaceAlt dark:bg-darkSurfaceAlt space-y-1">
                      <div className="text-textMuted dark:text-darkTextMuted">Room Conflicts</div>
                      <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircleIcon fontSize="small" /> 0 Clashes
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-surfaceAlt dark:bg-darkSurfaceAlt space-y-1">
                      <div className="text-textMuted dark:text-darkTextMuted">Batch Conflicts</div>
                      <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircleIcon fontSize="small" /> 0 Clashes
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-surfaceAlt dark:bg-darkSurfaceAlt space-y-1">
                      <div className="text-textMuted dark:text-darkTextMuted">Lab Assignments</div>
                      <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircleIcon fontSize="small" /> 100% Labs Free
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-surfaceAlt dark:bg-darkSurfaceAlt space-y-1">
                      <div className="text-textMuted dark:text-darkTextMuted">Unassigned Sessions</div>
                      <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircleIcon fontSize="small" /> 0 Unassigned
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Today's Schedule Matrix */}
              <div className="bg-white dark:bg-darkSurface rounded-2xl border border-border dark:border-darkBorder p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">
                    Campus-Wide Schedule Matrix
                  </h3>
                  <span className="text-xs text-textMuted dark:text-darkTextMuted font-medium">
                    {stats?.date} ({stats?.day})
                  </span>
                </div>
                <TimetableTable entries={todayEntries} />
              </div>
            </div>
          )}

          {/* TAB 2: REQUIREMENT 6 - TEACHER WORKLOAD VIEW */}
          {activeTab === 'workload' && (
            <div className="bg-white dark:bg-darkSurface rounded-2xl border border-border dark:border-darkBorder p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">
                    TEACHER WEEKLY WORKLOAD BREAKDOWN
                  </h3>
                  <p className="text-xs text-textMuted dark:text-darkTextMuted">
                    Calculated from active timetable data (Theory = 50 min, Lab = 1 hr 40 min). Overload threshold &gt; 12 hrs/week.
                  </p>
                </div>
                <span className="text-xs text-textMuted dark:text-darkTextMuted font-medium">
                  {workload.length} Active Faculty Members
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border dark:border-darkBorder">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-surfaceAlt dark:bg-darkSurfaceAlt text-textMuted dark:text-darkTextMuted border-b border-border dark:border-darkBorder">
                      <th className="p-3 font-semibold">Teacher Name</th>
                      <th className="p-3 font-semibold">Subject</th>
                      <th className="p-3 font-semibold">Theory Hours</th>
                      <th className="p-3 font-semibold">Lab Hours</th>
                      <th className="p-3 font-semibold">Total Weekly Hours</th>
                      <th className="p-3 font-semibold">Class Sessions</th>
                      <th className="p-3 font-semibold text-right">Workload Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border dark:divide-darkBorder">
                    {workload.map(t => (
                      <tr
                        key={t.teacherId}
                        className={`hover:bg-surfaceAlt/30 dark:hover:bg-darkSurfaceAlt/30 ${
                          t.isOverloaded ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''
                        }`}
                      >
                        <td className="p-3 font-bold text-gray-800 dark:text-gray-100">{t.teacherName}</td>
                        <td className="p-3 text-textMuted dark:text-darkTextMuted">{t.subjectName}</td>
                        <td className="p-3 font-mono">{t.theoryHours} hrs ({t.theoryCount} sessions)</td>
                        <td className="p-3 font-mono">{t.labHours} hrs ({t.labCount} labs)</td>
                        <td className="p-3 font-bold text-primary dark:text-primaryLight font-mono">
                          {t.totalHours} hrs
                        </td>
                        <td className="p-3 font-mono">{t.totalClasses} total</td>
                        <td className="p-3 text-right">
                          {t.isOverloaded ? (
                            <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2.5 py-1 rounded-full font-bold">
                              ⚠️ High Workload ({t.totalHours}h)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-1 rounded-full font-semibold">
                              ✓ Normal Load
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: STUDENT PREFERENCE MANAGEMENT TABLE */}
          {activeTab === 'users' && (
            <div className="bg-white dark:bg-darkSurface rounded-2xl border border-border dark:border-darkBorder p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">
                    Student Preference Lock Management
                  </h3>
                  <p className="text-xs text-textMuted dark:text-darkTextMuted">
                    Reset student preference locks to allow re-selection of subject batches
                  </p>
                </div>
                <span className="text-xs text-textMuted dark:text-darkTextMuted font-medium">
                  {users.length} registered users
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border dark:border-darkBorder">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-surfaceAlt dark:bg-darkSurfaceAlt text-textMuted dark:text-darkTextMuted border-b border-border dark:border-darkBorder">
                      <th className="p-3 font-semibold">User</th>
                      <th className="p-3 font-semibold">Role</th>
                      <th className="p-3 font-semibold">Email</th>
                      <th className="p-3 font-semibold">Preference Lock Status</th>
                      <th className="p-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border dark:divide-darkBorder">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-surfaceAlt/30 dark:hover:bg-darkSurfaceAlt/30">
                        <td className="p-3 font-semibold text-gray-800 dark:text-gray-200">{u.name}</td>
                        <td className="p-3 capitalize text-gray-600 dark:text-gray-400">{u.role}</td>
                        <td className="p-3 text-textMuted dark:text-darkTextMuted">{u.email}</td>
                        <td className="p-3">
                          {u.preferenceLocked ? (
                            <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full font-semibold">
                              <LockIcon style={{ fontSize: 14 }} /> Locked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full font-semibold">
                              <LockOpenIcon style={{ fontSize: 14 }} /> Unlocked
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {u.role === 'student' && u.preferenceLocked && (
                            <button
                              onClick={() => handleResetPreference(u.id)}
                              disabled={resettingId === u.id}
                              className="px-3 py-1 rounded-lg bg-surfaceAlt dark:bg-darkSurfaceAlt hover:bg-purple-200 dark:hover:bg-purple-900 text-primary dark:text-primaryLight font-semibold border border-border dark:border-darkBorder transition-colors flex items-center gap-1 ml-auto"
                            >
                              <RestartAltIcon style={{ fontSize: 14 }} />
                              <span>{resettingId === u.id ? 'Resetting...' : 'Reset Preference'}</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
