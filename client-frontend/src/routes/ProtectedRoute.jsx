import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export function ProtectedRoute({ allowedRole }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="page-state">Restoring your session...</div>
  if (!user) return <Navigate to="/login" replace />
  if (allowedRole && user.role !== allowedRole) return <Navigate to={`/${user.role}`} replace />

  return <Outlet />
}