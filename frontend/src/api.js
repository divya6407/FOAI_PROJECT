const BASE = 'http://localhost:8000'

function getAuthHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(path, options = {}) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      const errorObj = new Error(err.detail || 'Request failed')
      errorObj.status = res.status
      errorObj.detail = err.detail
      throw errorObj
    }
    return res.json()
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Unable to connect to timetable server. Please ensure FastAPI backend is running.')
    }
    throw err
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const loginUser = (email, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })

export const signupUser = (data) =>
  request('/auth/signup', { method: 'POST', body: JSON.stringify(data) })

export const getMe = () =>
  request('/auth/me')

// ── Preferences ───────────────────────────────────────────────────────────────
export const submitPreferences = (preferences) =>
  request('/preferences/submit', { method: 'POST', body: JSON.stringify({ preferences }) })

export const getMyPreferences = () =>
  request('/preferences/my')

export const resetUserPreference = (userId) =>
  request(`/admin/users/${userId}/reset-preference`, { method: 'POST' })

export const listAdminUsers = () =>
  request('/admin/users')

// ── Timetable ─────────────────────────────────────────────────────────────────
export const generateTimetable = () =>
  request('/timetable/generate', { method: 'POST' })

export const generateAlternativeTimetable = () =>
  request('/admin/timetable/alternative', { method: 'POST' })

export const getMyTimetable = (subjectId) => {
  const params = subjectId ? `?subjectId=${subjectId}` : ''
  return request(`/timetable/my-timetable${params}`)
}

export const getMyTodayTimetable = (subjectId) => {
  const params = subjectId ? `?subjectId=${subjectId}` : ''
  return request(`/timetable/my-today${params}`)
}

export const getTimetableQuality = () =>
  request('/timetable/quality')

export const getTodayTimetable = () =>
  request('/timetable/today')

export const getBatchTimetable = (batchId) =>
  request(`/timetable/batch/${batchId}`)

export const getAllTimetable = () =>
  request('/timetable/all')

// ── Rooms ─────────────────────────────────────────────────────────────────────
export const getSuitableRooms = ({ capacity, type, eboard, block } = {}) => {
  const params = new URLSearchParams()
  if (capacity) params.append('capacity', capacity)
  if (type)     params.append('type',     type)
  if (eboard !== undefined && eboard !== null) params.append('eboard', eboard)
  if (block)    params.append('block',    block)
  return request(`/rooms/suitable?${params}`)
}

export const getFreeRooms = ({ date, time, block } = {}) => {
  const params = new URLSearchParams()
  if (date)  params.append('date',  date)
  if (time)  params.append('time',  time)
  if (block) params.append('block', block)
  return request(`/rooms/free?${params}`)
}

export const getAllRooms = (block) => {
  const params = block ? `?block=${block}` : ''
  return request(`/rooms/all${params}`)
}

export const getRoomDetails = (roomId) =>
  request(`/rooms/${roomId}`)

// ── Events ────────────────────────────────────────────────────────────────────
export const createEventRequest = (data) =>
  request('/events/request', { method: 'POST', body: JSON.stringify(data) })

export const getEventRequests = (status) => {
  const params = status ? `?status=${status}` : ''
  return request(`/events/requests${params}`)
}

export const getEventRequest = (id) =>
  request(`/events/requests/${id}`)

// ── Admin ─────────────────────────────────────────────────────────────────────
export const getAdminStats = (date) => {
  const params = date ? `?date=${date}` : ''
  return request(`/admin/stats${params}`)
}

export const getTeacherWorkload = (threshold = 12.0) =>
  request(`/admin/workload?overload_threshold_hours=${threshold}`)

export const getConflicts = () =>
  request('/admin/conflicts')

export const getMonthTimetable = (month) => {
  const params = month ? `?month=${month}` : ''
  return request(`/admin/timetable/month${params}`)
}

export const approveEventRequest = (id) =>
  request(`/admin/requests/${id}/approve`, { method: 'POST' })

export const rejectEventRequest = (id, reason) =>
  request(`/admin/requests/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })

// ── Chat ─────────────────────────────────────────────────────────────────────
export const sendChat = (question) =>
  request('/chat', { method: 'POST', body: JSON.stringify({ question }) })
