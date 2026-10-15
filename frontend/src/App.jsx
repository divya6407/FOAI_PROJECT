import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'

// Student Pages
import StudentHome      from './pages/student/StudentHome'
import PreferenceForm   from './pages/student/PreferenceForm'
import FreeRoomFinder   from './pages/student/FreeRoomFinder'

// Faculty Pages
import FacultyHome      from './pages/faculty/FacultyHome'
import EventRequestForm from './pages/faculty/EventRequestForm'
import RequestStatus    from './pages/faculty/RequestStatus'

// Admin Pages
import AdminOverview    from './pages/admin/AdminOverview'
import AdminRequests    from './pages/admin/AdminRequests'
import AdminCalendar    from './pages/admin/AdminCalendar'

import AutorenewIcon from '@mui/icons-material/Autorenew'

// Protected Route Wrapper
function ProtectedRoute({ requiredRole, children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-screen bg-bgApp dark:bg-darkBgApp flex items-center justify-center text-textMuted dark:text-darkTextMuted gap-2">
        <AutorenewIcon className="animate-spin text-primary" style={{ fontSize: 32 }} />
        <span className="text-xs">Authenticating user session...</span>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== requiredRole) {
    return <Navigate to={`/${user.role}`} replace />
  }

  return children
}

// Redirect root to user's matching role dashboard or login
function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={`/${user.role}`} replace />
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Student Routes */}
            <Route
              element={
                <ProtectedRoute requiredRole="student">
                  <Layout role="student" />
                </ProtectedRoute>
              }
            >
              <Route path="/student"             element={<StudentHome />} />
              <Route path="/student/preferences" element={<PreferenceForm />} />
              <Route path="/student/rooms"       element={<FreeRoomFinder />} />
            </Route>

            {/* Faculty Routes */}
            <Route
              element={
                <ProtectedRoute requiredRole="faculty">
                  <Layout role="faculty" />
                </ProtectedRoute>
              }
            >
              <Route path="/faculty"             element={<FacultyHome />} />
              <Route path="/faculty/event"       element={<EventRequestForm />} />
              <Route path="/faculty/requests"    element={<RequestStatus />} />
            </Route>

            {/* Admin Routes */}
            <Route
              element={
                <ProtectedRoute requiredRole="admin">
                  <Layout role="admin" />
                </ProtectedRoute>
              }
            >
              <Route path="/admin"               element={<AdminOverview />} />
              <Route path="/admin/requests"      element={<AdminRequests />} />
              <Route path="/admin/calendar"      element={<AdminCalendar />} />
            </Route>

            {/* Catch-all fallback */}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
