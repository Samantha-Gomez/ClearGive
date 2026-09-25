import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import AppLayout from '../layouts/AppLayout'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import AdminDashboard from '../pages/dashboards/AdminDashboard'
import AdminVerificationPage from '../pages/admin/AdminVerificationPage'
import DonorDashboard from '../pages/dashboards/DonorDashboard'
import PartnerDashboard from '../pages/dashboards/PartnerDashboard'
import PartnerVerificationPage from '../pages/partner/PartnerVerificationPage'
import DonorHistoryPage from '../pages/donor/DonorHistoryPage'
import SettingsPage from '../pages/settings/SettingsPage'
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
          <Route path="/donor/history" element={<DonorHistoryPage />} />
          <Route path="/donor/settings" element={<SettingsPage role="donor" />} />
        </Route>
        <Route element={<ProtectedRoute allowedRole="partner" />}>
          <Route path="/partner" element={<PartnerDashboard />} />
          <Route path="/partner/drives" element={<FeaturePlaceholder title="My drives" description="Manage your organization's donation drives here." />} />
          <Route path="/partner/verification" element={<PartnerVerificationPage />} />
          <Route path="/partner/settings" element={<SettingsPage role="partner" />} />
        </Route>
        <Route element={<ProtectedRoute allowedRole="admin" />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/verifications" element={<AdminVerificationPage />} />
          <Route path="/admin/drives" element={<FeaturePlaceholder title="Donation drives" description="Monitor ClearGive donation drives here." />} />
          <Route path="/admin/settings" element={<SettingsPage role="admin" />} />
        </Route>
      </Route>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  )
}