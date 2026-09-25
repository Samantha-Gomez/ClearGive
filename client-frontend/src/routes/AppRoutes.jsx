import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import AppLayout from '../layouts/AppLayout'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import AdminDashboard from '../pages/dashboards/AdminDashboard'
import DonorDashboard from '../pages/dashboards/DonorDashboard'
import PartnerDashboard from '../pages/dashboards/PartnerDashboard'
import PlaceholderPage from '../pages/PlaceholderPage'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicOnlyRoute } from './PublicOnlyRoute'
import { getDashboardPath } from './routeUtils'

function HomeRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <div className="page-state">Loading ClearGive...</div>
  return <Navigate to={getDashboardPath(user?.role)} replace />
}

function FeaturePlaceholder({ title, description }) {
  return <PlaceholderPage title={title} description={description} />
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<AppLayout />}>
        <Route element={<ProtectedRoute allowedRole="donor" />}>
          <Route path="/donor" element={<DonorDashboard />} />
          <Route path="/donor/drives" element={<FeaturePlaceholder title="Donation drives" description="Browse drives that are ready for donor support." />} />
        </Route>
        <Route element={<ProtectedRoute allowedRole="partner" />}>
          <Route path="/partner" element={<PartnerDashboard />} />
          <Route path="/partner/drives" element={<FeaturePlaceholder title="My drives" description="Manage your organization's donation drives here." />} />
          <Route path="/partner/verification" element={<FeaturePlaceholder title="Partner verification" description="Your organization verification workspace will appear here." />} />
        </Route>
        <Route element={<ProtectedRoute allowedRole="admin" />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/verification" element={<FeaturePlaceholder title="Partner verification" description="Review partner organizations from this workspace." />} />
          <Route path="/admin/drives" element={<FeaturePlaceholder title="Donation drives" description="Monitor ClearGive donation drives here." />} />
        </Route>
      </Route>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  )
}