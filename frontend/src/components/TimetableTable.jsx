import React, { useState } from 'react'
import InfoIcon from '@mui/icons-material/Info'
import CloseIcon from '@mui/icons-material/Close'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import SchoolIcon from '@mui/icons-material/School'
import PersonIcon from '@mui/icons-material/Person'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const TIMETABLE_PERIODS = [
  { period: 1, label: 'P1', time: '08:00 - 08:50' },
  { period: 2, label: 'P2', time: '09:00 - 09:50' },
  { period: 3, label: 'P3', time: '10:00 - 10:50' },
  { period: 4, label: 'P4', time: '11:00 - 11:50' },
  { period: 5, label: 'P5', time: '13:00 - 13:50' },
  { period: 6, label: 'P6', time: '14:00 - 14:50' },
]

export default function TimetableTable({ entries = [], filterBatch, filterTeacher, filterRoom, filterSubject }) {
  const [selectedExplanation, setSelectedExplanation] = useState(null)

  // Filter entries based on active filters
  const filteredEntries = entries.filter(e => {
    if (filterBatch && e.batchId !== filterBatch) return false
    if (filterTeacher && e.teacherId !== filterTeacher) return false
    if (filterRoom && e.roomId !== filterRoom) return false
    if (filterSubject && e.subjectId !== filterSubject) return false
    return true
  })

  // Lookup grid: "Mon-1" -> [entry]
  const grid = {}
  for (const e of filteredEntries) {
    const key = `${e.day}-${e.period}`
    if (!grid[key]) grid[key] = []
    grid[key].push(e)
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-border dark:border-darkBorder shadow-sm bg-white dark:bg-darkSurface">
        <table className="w-full text-xs border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-surfaceAlt dark:bg-darkSurfaceAlt border-b border-border dark:border-darkBorder text-textMuted dark:text-darkTextMuted">
              <th className="px-3 py-3 text-left font-semibold w-32 border-r border-border dark:border-darkBorder">
                Time Slot
              </th>
              {DAYS.map(d => (
                <th key={d} className="px-3 py-3 text-center font-bold text-gray-800 dark:text-gray-200 border-r border-border dark:border-darkBorder">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border dark:divide-darkBorder">
            {TIMETABLE_PERIODS.map(({ period, label, time }) => (
              <tr key={period} className="hover:bg-surfaceAlt/30 dark:hover:bg-darkSurfaceAlt/30 transition-colors">
                <td className="px-3 py-3 font-semibold text-gray-700 dark:text-gray-300 border-r border-border dark:border-darkBorder bg-surfaceAlt/40 dark:bg-darkSurfaceAlt/40">
                  <div className="font-bold text-primary dark:text-primaryLight">{label}</div>
                  <div className="text-[10px] text-textMuted dark:text-darkTextMuted flex items-center gap-1 mt-0.5">
                    <AccessTimeIcon style={{ fontSize: 12 }} />
                    <span>{time}</span>
                  </div>
                </td>
                {DAYS.map(d => {
                  const cell = grid[`${d}-${period}`] || []
                  return (
                    <td key={d} className="px-2 py-2 border-r border-border dark:border-darkBorder align-top min-w-[140px]">
                      {cell.length === 0 ? (
                        <div className="h-full flex items-center justify-center py-4 text-[11px] text-gray-300 dark:text-gray-600 font-mono">
                          —
                        </div>
                      ) : (
                        cell.map((e, idx) => (
                          <CellCard key={idx} entry={e} onExplain={() => setSelectedExplanation(e)} />
                        ))
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Explainability Modal (Requirement 7) */}
      {selectedExplanation && (
        <ExplanationModal entry={selectedExplanation} onClose={() => setSelectedExplanation(null)} />
      )}
    </div>
  )
}

function CellCard({ entry, onExplain }) {
  const isLab = entry.sessionType === 'lab'
  const isEvent = entry.isEvent

  // Time display
  const startTime = entry.startTime || '08:00'
  const endTime = entry.endTime || (isLab ? '09:50' : '08:50')
  const duration = entry.durationMinutes ? `${entry.durationMinutes} min` : (isLab ? '1 hr 40 min' : '50 min')

  const cardStyle = isEvent
    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
    : isLab
      ? 'bg-purple-100/70 dark:bg-purple-950/60 border-purple-300 dark:border-purple-700 text-purple-950 dark:text-purple-100'
      : 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200'

  const badgeStyle = isEvent
    ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100'
    : isLab
      ? 'bg-purple-600 text-white font-bold'
      : 'bg-primary/20 text-primary dark:text-primaryLight font-semibold'

  return (
    <div className={`group relative rounded-xl border p-2.5 mb-1.5 shadow-sm hover:shadow-md transition-all ${cardStyle}`}>
      <div className="flex items-start justify-between gap-1 mb-1">
        <span className="font-bold text-xs leading-snug line-clamp-1">
          {entry.subjectName || entry.subjectId || entry.eventId || 'Event'}
        </span>
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${badgeStyle}`}>
          {isEvent ? 'Event' : isLab ? 'Lab (1h 40m)' : 'Theory (50m)'}
        </span>
      </div>

      {entry.teacherName && (
        <div className="text-[11px] opacity-90 flex items-center gap-1 font-medium truncate">
          <PersonIcon style={{ fontSize: 13 }} />
          <span>{entry.teacherName}</span>
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] opacity-80 mt-1 pt-1 border-t border-black/5 dark:border-white/10">
        <span className="font-semibold flex items-center gap-0.5">
          <MeetingRoomIcon style={{ fontSize: 12 }} />
          {entry.roomId} {entry.batchName ? `· ${entry.batchName}` : ''}
        </span>
        <span className="font-mono text-[9.5px]">
          {startTime} - {endTime}
        </span>
      </div>

      {/* "Why this slot?" Explainability Button (Requirement 7) */}
      <button
        onClick={onExplain}
        title="Why was this class scheduled here?"
        className="mt-1.5 w-full flex items-center justify-center gap-1 px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 hover:bg-primary hover:text-white dark:hover:bg-primary text-[10px] font-medium transition-colors"
      >
        <InfoIcon style={{ fontSize: 11 }} />
        <span>Why this slot?</span>
      </button>
    </div>
  )
}

function ExplanationModal({ entry, onClose }) {
  const isLab = entry.sessionType === 'lab'
  const explanationText = entry.constraintExplanation ||
    `Scheduled on ${entry.day} Period ${entry.period} because teacher (${entry.teacherName || entry.teacherId}), batch (${entry.batchName || entry.batchId}), and room (${entry.roomId}) were all free with capacity >= student count.`

  const points = explanationText.split(' | ')

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-darkSurface rounded-2xl border border-border dark:border-darkBorder max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between border-b border-border dark:border-darkBorder pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary dark:text-primaryLight">
              CSP Scheduling Explainability
            </span>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
              Why was this class scheduled here?
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surfaceAlt dark:hover:bg-darkSurfaceAlt text-textMuted dark:text-darkTextMuted"
          >
            <CloseIcon fontSize="small" />
          </button>
        </div>

        {/* Entry Overview */}
        <div className="p-3 rounded-xl bg-surfaceAlt dark:bg-darkSurfaceAlt space-y-1 text-xs">
          <div className="font-bold text-gray-800 dark:text-gray-100">{entry.subjectName || entry.subjectId}</div>
          <div className="text-textMuted dark:text-darkTextMuted flex flex-wrap gap-x-4 gap-y-1">
            <span>Teacher: <strong>{entry.teacherName || entry.teacherId}</strong></span>
            <span>Room: <strong>{entry.roomId}</strong></span>
            <span>Batch: <strong>{entry.batchName || entry.batchId}</strong></span>
            <span>Duration: <strong>{entry.durationMinutes || (isLab ? 100 : 50)} min ({isLab ? 'Lab' : 'Theory'})</strong></span>
            <span>Time: <strong>{entry.day} {entry.startTime}–{entry.endTime}</strong></span>
          </div>
        </div>

        {/* Constraint Satisfaction Bullet List */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-gray-700 dark:text-gray-300">
            Verified Constraint Checks:
          </div>
          <ul className="space-y-2 text-xs">
            {points.map((pt, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <CheckCircleOutlinedIcon fontSize="small" className="text-emerald-500 shrink-0 mt-0.5" />
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primaryHover text-white font-semibold text-xs transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
