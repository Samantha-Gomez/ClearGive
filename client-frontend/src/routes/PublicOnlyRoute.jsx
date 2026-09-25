import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { getDashboardPath } from './routeUtils'

export function PublicOnlyRoute() {
  const { user, loading } = useAuth()

  if (loading) return <div className="page-state">Loading ClearGive...</div>
  if (user) return <Navigate to={getDashboardPath(user.role)} replace />

  return <Outlet />
}