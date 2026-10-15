import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createEventRequest, getSuitableRooms } from '../../api'
import { useAuth } from '../../context/AuthContext'
import EventNoteIcon from '@mui/icons-material/EventNote'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import AutorenewIcon from '@mui/icons-material/Autorenew'

export default function EventRequestForm() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const getInitialDate = () => {
    const d = new Date()
    d.setDate(d.getDate() + 3)
    while (d.getDay() === 0 || d.getDay() === 6) {
      d.setDate(d.getDate() + 1)
    }
    return d.toISOString().split('T')[0]
  }

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requestedBy: user?.name || 'Faculty Member',
    date: getInitialDate(),
    startPeriod: 1,
    endPeriod: 2,
    expectedParticipants: 45,
    block: 'A',
    requiresLab: false,
    requiresEboard: true,
    assignedRoomId: '',
  })

  const [suitableRooms, setSuitableRooms] = useState([])
  const [loadingRooms, setLoadingRooms] = useState(false)
  const [weekendError, setWeekendError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (formData.date) {
      const selected = new Date(formData.date)
      const day = selected.getDay()
      if (day === 0 || day === 6) {
        setWeekendError('Events cannot be requested for weekends.')
      } else {
        setWeekendError(null)
      }
    }
  }, [formData.date])

  useEffect(() => {
    fetchRooms()
  }, [formData.expectedParticipants, formData.requiresLab, formData.requiresEboard, formData.block])

  const fetchRooms = async () => {
    setLoadingRooms(true)
    try {
      const res = await getSuitableRooms({
        capacity: parseInt(formData.expectedParticipants) || 1,
        type: formData.requiresLab ? 'lab' : 'classroom',
        eboard: formData.requiresEboard ? true : null,
        block: formData.block || null,
      })
      const rooms = res.rooms || []
      setSuitableRooms(rooms)

      if (rooms.length > 0 && (!formData.assignedRoomId || !rooms.some(r => r.id === formData.assignedRoomId))) {
        setFormData(prev => ({ ...prev, assignedRoomId: rooms[0].id }))
      }
    } catch (err) {
      console.error(err)
      setSuitableRooms([])
    } finally {
      setLoadingRooms(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (weekendError) return
    if (!formData.assignedRoomId) {
      setError('Please select a specific room for your event.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await createEventRequest({
        ...formData,
        startPeriod: parseInt(formData.startPeriod),
        endPeriod: parseInt(formData.endPeriod),
        expectedParticipants: parseInt(formData.expectedParticipants),
      })
      navigate('/faculty/requests')
    } catch (err) {
      setError(err.message || 'Failed to submit event request.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Submit Event / Workshop Request</h1>
        <p className="text-xs text-textMuted dark:text-darkTextMuted">Request room allocation for special academic workshops and seminars</p>
      </div>

      {weekendError && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs p-4 rounded-2xl flex items-center gap-2 font-medium shadow-sm">
          <WarningAmberIcon fontSize="small" />
          <span>{weekendError}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-darkSurface rounded-2xl border border-border dark:border-darkBorder p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-xs font-semibold text-textMuted dark:text-darkTextMuted mb-1">Event Title *</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. AI & Society Workshop"
            className="w-full px-3 py-2 text-xs rounded-xl border border-border dark:border-darkBorder bg-transparent focus:outline-none focus:border-primary text-gray-800 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-textMuted dark:text-darkTextMuted mb-1">Description</label>
          <textarea
            rows="2"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief overview of event goals..."
            className="w-full px-3 py-2 text-xs rounded-xl border border-border dark:border-darkBorder bg-transparent focus:outline-none focus:border-primary text-gray-800 dark:text-gray-100"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-textMuted dark:text-darkTextMuted mb-1">Requested By</label>
            <input
              type="text"
              required
              value={formData.requestedBy}
              onChange={e => setFormData({ ...formData, requestedBy: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border dark:border-darkBorder bg-transparent focus:outline-none focus:border-primary text-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-textMuted dark:text-darkTextMuted mb-1">Event Date (Mon-Fri only) *</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              className={`w-full px-3 py-2 text-xs rounded-xl border bg-transparent focus:outline-none text-gray-800 dark:text-gray-100 ${
                weekendError ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20' : 'border-border dark:border-darkBorder focus:border-primary'
              }`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-textMuted dark:text-darkTextMuted mb-1">Start Period</label>
            <select
              value={formData.startPeriod}
              onChange={e => setFormData({ ...formData, startPeriod: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border dark:border-darkBorder bg-transparent focus:outline-none focus:border-primary text-gray-800 dark:text-gray-100"
            >
              {[1,2,3,4,5,6].map(p => <option key={p} value={p} className="dark:bg-darkSurface">Period {p}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-textMuted dark:text-darkTextMuted mb-1">End Period</label>
            <select
              value={formData.endPeriod}
              onChange={e => setFormData({ ...formData, endPeriod: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border dark:border-darkBorder bg-transparent focus:outline-none focus:border-primary text-gray-800 dark:text-gray-100"
            >
              {[1,2,3,4,5,6].map(p => <option key={p} value={p} className="dark:bg-darkSurface">Period {p}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-textMuted dark:text-darkTextMuted mb-1">Expected Attendees</label>
            <input
              type="number"
              min="5"
              max="300"
              value={formData.expectedParticipants}
              onChange={e => setFormData({ ...formData, expectedParticipants: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border dark:border-darkBorder bg-transparent focus:outline-none focus:border-primary text-gray-800 dark:text-gray-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border/50 dark:border-darkBorder/50">
          <div>
            <label className="block text-xs font-semibold text-textMuted dark:text-darkTextMuted mb-1">Preferred Block</label>
            <select
              value={formData.block}
              onChange={e => setFormData({ ...formData, block: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border dark:border-darkBorder bg-transparent focus:outline-none focus:border-primary text-gray-800 dark:text-gray-100"
            >
              <option value="A" className="dark:bg-darkSurface">Block A</option>
              <option value="B" className="dark:bg-darkSurface">Block B</option>
              <option value="Techlounge" className="dark:bg-darkSurface">Techlounge</option>
              <option value="Ideafactory" className="dark:bg-darkSurface">Ideafactory</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-4">
            <input
              type="checkbox"
              id="reqLab"
              checked={formData.requiresLab}
              onChange={e => setFormData({ ...formData, requiresLab: e.target.checked })}
              className="accent-primary"
            />
            <label htmlFor="reqLab" className="text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">Requires Lab Room</label>
          </div>

          <div className="flex items-center gap-2 pt-4">
            <input
              type="checkbox"
              id="reqEboard"
              checked={formData.requiresEboard}
              onChange={e => setFormData({ ...formData, requiresEboard: e.target.checked })}
              className="accent-primary"
            />
            <label htmlFor="reqEboard" className="text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">Requires Smart E-Board</label>
          </div>
        </div>

        {/* Specific Room Picker */}
        <div className="space-y-3 pt-3 border-t border-border dark:border-darkBorder">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-gray-800 dark:text-gray-100">Select Specific Room *</label>
            <span className="text-[11px] text-textMuted dark:text-darkTextMuted">Filtered & ranked by capacity fit</span>
          </div>

          {loadingRooms ? (
            <div className="p-4 text-center text-xs text-textMuted dark:text-darkTextMuted flex items-center justify-center gap-2">
              <AutorenewIcon className="animate-spin text-primary" fontSize="small" />
              <span>Fetching matching suitable rooms...</span>
            </div>
          ) : suitableRooms.length === 0 ? (
            <div className="p-4 text-center text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900">
              No matching rooms found for the requested capacity & parameters. Try relaxing constraints.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1">
              {suitableRooms.map(room => (
                <label
                  key={room.id}
                  className={`p-3 rounded-xl border text-xs cursor-pointer flex flex-col justify-between transition-all ${
                    formData.assignedRoomId === room.id
                      ? 'border-primary bg-primary/10 dark:bg-primary/20 shadow-sm text-primary dark:text-primaryLight font-bold'
                      : 'border-border dark:border-darkBorder bg-white dark:bg-darkSurfaceAlt text-gray-700 dark:text-gray-200 hover:border-primaryLight'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">{room.id}</span>
                    <input
                      type="radio"
                      name="selectedRoom"
                      value={room.id}
                      checked={formData.assignedRoomId === room.id}
                      onChange={() => setFormData({ ...formData, assignedRoomId: room.id })}
                      className="accent-primary"
                    />
                  </div>
                  <div className="text-[10px] text-textMuted dark:text-darkTextMuted mt-1">
                    {room.block} Block · Cap: {room.capacity}
                  </div>
                  {room.hasEboard && (
                    <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">E-Board Available</div>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={submitting || !!weekendError || !formData.assignedRoomId}
            className="bg-primary hover:bg-primaryHover text-white px-6 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <EventNoteIcon fontSize="small" />
            <span>{submitting ? 'Submitting...' : 'Submit Event Request'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
