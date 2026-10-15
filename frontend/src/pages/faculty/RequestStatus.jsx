import React, { useState, useEffect } from 'react'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import { getEventRequests } from '../../api'
import AssessmentIcon from '@mui/icons-material/Assessment'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import AutorenewIcon from '@mui/icons-material/Autorenew'

export default function RequestStatus() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    loadRequests()
  }, [filter])

  const loadRequests = async () => {
    setLoading(true)
    try {
      const res = await getEventRequests(filter === 'ALL' ? null : filter)
      setRequests(res.requests || [])
    } catch (err) {
      console.error(err)
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">My Event Requests</h1>
          <p className="text-xs text-textMuted dark:text-darkTextMuted">Track approval status and reserved room allocations</p>
        </div>

        <div className="flex gap-1 bg-surfaceAlt dark:bg-darkSurfaceAlt p-1 rounded-xl border border-border dark:border-darkBorder text-xs">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(st => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filter === st ? 'bg-primary text-white shadow-sm' : 'text-textMuted dark:text-darkTextMuted hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-darkSurface rounded-xl border border-border dark:border-darkBorder p-12 text-center text-textMuted dark:text-darkTextMuted space-y-2">
          <AutorenewIcon className="animate-spin text-primary" style={{ fontSize: 32 }} />
          <p className="text-xs">Loading request history...</p>
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={<AssessmentIcon style={{ fontSize: 40 }} />}
          title="No requests found"
          description="No event requests match the selected filter."
        />
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.id} className="bg-white dark:bg-darkSurface rounded-2xl border border-border dark:border-darkBorder p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">{req.title}</h3>
                  <p className="text-xs text-textMuted dark:text-darkTextMuted mt-0.5">{req.description}</p>
                </div>
                <StatusBadge status={req.status} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-surfaceAlt/60 dark:bg-darkSurfaceAlt/60 p-3 rounded-xl border border-border/50 dark:border-darkBorder/50">
                <div><span className="text-textMuted dark:text-darkTextMuted">Organizer:</span> <span className="font-semibold text-gray-700 dark:text-gray-200">{req.requestedBy}</span></div>
                <div><span className="text-textMuted dark:text-darkTextMuted">Date:</span> <span className="font-semibold text-gray-700 dark:text-gray-200">{req.date}</span></div>
                <div><span className="text-textMuted dark:text-darkTextMuted">Time Slot:</span> <span className="font-semibold text-gray-700 dark:text-gray-200">P{req.startPeriod} - P{req.endPeriod}</span></div>
                <div><span className="text-textMuted dark:text-darkTextMuted">Attendees:</span> <span className="font-semibold text-gray-700 dark:text-gray-200">{req.expectedParticipants}</span></div>
              </div>

              {req.assignedRoomId && (
                <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 text-xs p-3 rounded-xl flex items-center gap-2">
                  <MeetingRoomIcon fontSize="small" className="text-primary dark:text-primaryLight" />
                  <span>Selected Room: <strong className="text-primary dark:text-primaryLight font-bold">{req.assignedRoomId}</strong></span>
                </div>
              )}

              {req.status === 'APPROVED' && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs p-3 rounded-xl flex items-center gap-2">
                  <CheckCircleIcon fontSize="small" />
                  <span>Approved & Reserved Room <strong className="text-emerald-950 dark:text-emerald-100">{req.assignedRoomId}</strong></span>
                </div>
              )}

              {req.status === 'REJECTED' && req.rejectionReason && (
                <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs p-3 rounded-xl flex items-center gap-2">
                  <CancelIcon fontSize="small" />
                  <span>Rejection Reason: <span className="font-medium">{req.rejectionReason}</span></span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
