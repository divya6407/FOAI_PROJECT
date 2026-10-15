import React, { useState, useEffect } from 'react'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import { getEventRequests, approveEventRequest, rejectEventRequest } from '../../api'
import AssessmentIcon from '@mui/icons-material/Assessment'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import AutorenewIcon from '@mui/icons-material/Autorenew'

export default function AdminRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState(null)
  const [rejectModalId, setRejectModalId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    setLoading(true)
    try {
      const res = await getEventRequests('PENDING')
      setRequests(res.requests || [])
    } catch (err) {
      console.error(err)
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    setActionId(id)
    try {
      await approveEventRequest(id)
      await loadRequests()
    } catch (err) {
      alert(`Approval failed: ${err.message}`)
    } finally {
      setActionId(null)
    }
  }

  const handleReject = async (e) => {
    e.preventDefault()
    if (!rejectModalId || !rejectReason.trim()) return
    setActionId(rejectModalId)
    try {
      await rejectEventRequest(rejectModalId, rejectReason.trim())
      setRejectModalId(null)
      setRejectReason('')
      await loadRequests()
    } catch (err) {
      alert(`Rejection failed: ${err.message}`)
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl font-sans">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Pending Event Requests</h1>
        <p className="text-xs text-textMuted dark:text-darkTextMuted">Review submitted event requests and reserve teacher-selected rooms</p>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-darkSurface rounded-xl border border-border dark:border-darkBorder p-12 text-center text-textMuted dark:text-darkTextMuted space-y-2">
          <AutorenewIcon className="animate-spin text-primary" style={{ fontSize: 32 }} />
          <p className="text-xs">Loading pending requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={<AssessmentIcon style={{ fontSize: 40 }} />}
          title="All caught up!"
          description="There are no pending event requests requiring approval."
        />
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.id} className="bg-white dark:bg-darkSurface rounded-2xl border border-border dark:border-darkBorder p-5 shadow-sm space-y-4">
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
                <div><span className="text-textMuted dark:text-darkTextMuted">Building Block:</span> <span className="font-semibold text-gray-700 dark:text-gray-200">{req.block || 'Any'}</span></div>
                <div><span className="text-textMuted dark:text-darkTextMuted">Room Type:</span> <span className="font-semibold text-gray-700 dark:text-gray-200">{req.requiresLab ? 'Lab' : 'Classroom'}</span></div>
                <div><span className="text-textMuted dark:text-darkTextMuted">Smart E-Board:</span> <span className="font-semibold text-gray-700 dark:text-gray-200">{req.requiresEboard ? 'Required' : 'Optional'}</span></div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 text-xs p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MeetingRoomIcon fontSize="small" className="text-primary dark:text-primaryLight" />
                  <span>Teacher Requested Room: <strong className="text-primary dark:text-primaryLight font-bold">{req.assignedRoomId || 'None Specified'}</strong></span>
                </div>
                <span className="text-[10px] text-textMuted dark:text-darkTextMuted">Selected directly by instructor</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setRejectModalId(req.id)}
                  disabled={actionId === req.id}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 transition-colors flex items-center gap-1"
                >
                  <CancelIcon fontSize="small" />
                  <span>Reject Request</span>
                </button>
                <button
                  onClick={() => handleApprove(req.id)}
                  disabled={actionId === req.id || !req.assignedRoomId}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primaryHover shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <CheckCircleIcon fontSize="small" />
                  <span>{actionId === req.id ? 'Reserving...' : 'Approve & Reserve Room'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModalId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleReject} className="bg-white dark:bg-darkSurface rounded-2xl p-6 max-w-md w-full shadow-2xl border border-border dark:border-darkBorder space-y-4">
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">Reject Event Request</h3>
            <p className="text-xs text-textMuted dark:text-darkTextMuted">Please provide a reason for declining this request.</p>
            <textarea
              required
              rows="3"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Room is already booked for regular classes during period 2."
              className="w-full p-3 text-xs rounded-xl border border-border dark:border-darkBorder bg-transparent focus:outline-none focus:border-primary text-gray-800 dark:text-gray-100"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectModalId(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-darkSurfaceAlt"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700"
              >
                Confirm Rejection
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
