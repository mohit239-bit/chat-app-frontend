import { Navigate, Route, Routes } from 'react-router-dom'
import App from '../App'
import Chat from '../components/Chat'
import Login from '../components/auth/Login'
import Register from '../components/auth/Register'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import PublicOnlyRoute from '../components/auth/PublicOnlyRoute'

export const AppRoutes = () => {
  return (
    <Routes>
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
        <Route path="/" element={<ProtectedRoute><App /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
