import { Route, Routes } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import AppLayout from '../layouts/AppLayout'
import DashboardPage from '../pages/dashboards/DashboardPage'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import AdminAnalyticsPage from '../pages/admin/AdminAnalyticsPage'
import AdminDashboard from '../pages/dashboards/AdminDashboard'
import AdminActivityPage from '../pages/admin/AdminActivityPage'
import AdminDrivesPage from '../pages/admin/AdminDrivesPage'
import AdminDriveDetailsPage from '../pages/admin/AdminDriveDetailsPage'
import AdminDonationsPage from '../pages/admin/AdminDonationsPage'
import AdminDistributionsPage from '../pages/admin/AdminDistributionsPage'
import AdminVerificationPage from '../pages/admin/AdminVerificationPage'
import DonorDashboard from '../pages/dashboards/DonorDashboard'
import PartnerDashboard from '../pages/dashboards/PartnerDashboard'
import PartnerDrivesPage from '../pages/partner/PartnerDrivesPage'
import PartnerCreateDrivePage from '../pages/partner/PartnerCreateDrivePage'
import PartnerDriveDetailsPage from '../pages/partner/PartnerDriveDetailsPage'
import PartnerEditDrivePage from '../pages/partner/PartnerEditDrivePage'
import PartnerDriveDonationsPage from '../pages/partner/PartnerDriveDonationsPage'
import PartnerDriveDistributionsPage from '../pages/partner/PartnerDriveDistributionsPage'
import PartnerVerificationPage from '../pages/partner/PartnerVerificationPage'
import DonorHistoryPage from '../pages/donor/DonorHistoryPage'
import DonorDrivesPage from '../pages/donor/DonorDrivesPage'
import DonorDriveDetailsPage from '../pages/donor/DonorDriveDetailsPage'
import SettingsPage from '../pages/settings/SettingsPage'
import NotFoundPage from '../pages/NotFoundPage'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicOnlyRoute } from './PublicOnlyRoute'

function HomeRedirect() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="page-state">
        Loading ClearGive...
      </div>
    )
  }

  return user ? (
    <div className="page-state">
      Redirecting...
    </div>
  ) : null
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<AppLayout />}>
        <Route element={<ProtectedRoute allowedRole="donor" />}>
          <Route
            path="/donor"
            element={<DonorDashboard />}
          />

          <Route
            path="/donor/drives"
            element={<DonorDrivesPage />}
          />

          <Route
            path="/donor/drives/:id"
            element={<DonorDriveDetailsPage />}
          />

          <Route
            path="/donor/history"
            element={<DonorHistoryPage />}
          />

          <Route
            path="/donor/settings"
            element={<SettingsPage role="donor" />}
          />
        </Route>

        <Route element={<ProtectedRoute allowedRole="partner" />}>
          <Route
            path="/partner"
            element={<PartnerDashboard />}
          />

          <Route
            path="/partner/drives"
            element={<PartnerDrivesPage />}
          />

          <Route
            path="/partner/drives/new"
            element={<PartnerCreateDrivePage />}
          />

          <Route
            path="/partner/drives/:id"
            element={<PartnerDriveDetailsPage />}
          />

          <Route
            path="/partner/drives/:id/edit"
            element={<PartnerEditDrivePage />}
          />

          <Route
            path="/partner/drives/:id/donations"
            element={<PartnerDriveDonationsPage />}
          />

          <Route
            path="/partner/drives/:id/distributions"
            element={<PartnerDriveDistributionsPage />}
          />

          <Route
            path="/partner/verification"
            element={<PartnerVerificationPage />}
          />

          <Route
            path="/partner/settings"
            element={<SettingsPage role="partner" />}
          />
        </Route>

        <Route element={<ProtectedRoute allowedRole="admin" />}>
          <Route
            path="/admin"
            element={<AdminDashboard />}
          />

          <Route
            path="/admin/activity"
            element={<AdminActivityPage />}
          />

          <Route
            path="/admin/verifications"
            element={<AdminVerificationPage />}
          />

          <Route
            path="/admin/drives"
            element={<AdminDrivesPage />}
          />

          <Route
            path="/admin/drives/:id"
            element={<AdminDriveDetailsPage />}
          />

          <Route
            path="/admin/donations"
            element={<AdminDonationsPage />}
          />

          <Route
            path="/admin/distributions"
            element={<AdminDistributionsPage />}
          />

          <Route
            path="/admin/analytics"
            element={<AdminAnalyticsPage />}
          />

          <Route
            path="/admin/settings"
            element={<SettingsPage role="admin" />}
          />
        </Route>
      </Route>

      <Route
        path="*"
        element={<NotFoundPage />}
      />
    </Routes>
  )
}