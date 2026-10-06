import { useEffect, useState } from 'react'
import {
  Activity,
  BarChart3,
  FileSpreadsheet,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  Moon,
  Package,
  Settings,
  ShieldCheck,
  Store,
  Sun,
  Truck,
} from 'lucide-react'
import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import NotificationBell from '../components/notifications/NotificationBell'
import { roleLabels } from '../routes/routeUtils'

const navigation = {
  donor: [
    {
      label: 'Dashboard',
      to: '/donor',
      icon: LayoutDashboard,
    },
    {
      label: 'Donation Drives',
      to: '/donor/drives',
      icon: HeartHandshake,
    },
    {
      label: 'Settings',
      to: '/donor/settings',
      icon: Settings,
    },
  ],

  partner: [
    {
      label: 'Dashboard',
      to: '/partner',
      icon: LayoutDashboard,
    },
    {
      label: 'My Drives',
      to: '/partner/drives',
      icon: Store,
    },
    {
      label: 'Reports',
      to: '/partner/reports',
      icon: FileSpreadsheet,
    },
    {
      label: 'Verification',
      to: '/partner/verification',
      icon: ShieldCheck,
    },
    {
      label: 'Settings',
      to: '/partner/settings',
      icon: Settings,
    },
  ],

  admin: [
    {
      label: 'Dashboard',
      to: '/admin',
      icon: LayoutDashboard,
    },
    {
      label: 'Partner Verification',
      to: '/admin/verifications',
      icon: ShieldCheck,
    },
    {
      label: 'Donation Drives',
      to: '/admin/drives',
      icon: Truck,
    },
    {
      label: 'Donations',
      to: '/admin/donations',
      icon: HeartHandshake,
    },
    {
      label: 'Distributions',
      to: '/admin/distributions',
      icon: Package,
    },
    {
      label: 'Activity Logs',
      to: '/admin/activity',
      icon: Activity,
    },
    {
      label: 'Analytics',
      to: '/admin/analytics',
      icon: BarChart3,
    },
    {
      label: 'Settings',
      to: '/admin/settings',
      icon: Settings,
    },
  ],
}

export default function AppLayout() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('cleargive_theme') || 'light'
  })

  useEffect(() => {
    document.documentElement.classList.toggle(
      'dark',
      theme === 'dark',
    )

    localStorage.setItem(
      'cleargive_theme',
      theme,
    )
  }, [theme])

  const toggleTheme = () => {
    setTheme((currentTheme) =>
      currentTheme === 'dark'
        ? 'light'
        : 'dark',
    )
  }

  if (loading) {
    return <div className="page-state">Restoring your session...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const links = navigation[user.role] || []

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink
          className="brand"
          to={`/${user.role}`}
        >
          <span className="brand-mark">
            <HeartHandshake size={21} />
          </span>

          <span>ClearGive</span>
        </NavLink>

        <div className="profile-summary">
          <strong>{user.fullName}</strong>
          <span>{roleLabels[user.role]}</span>
        </div>

        <nav
          className="main-nav"
          aria-label="Main navigation"
        >
          {links.map(
            ({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                className={({ isActive }) =>
                  isActive
                    ? 'nav-link active'
                    : 'nav-link'
                }
                to={to}
                end={to === `/${user.role}`}
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ),
          )}
        </nav>

        <button
          className="nav-link logout-button"
          type="button"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      <main className="main-content">
        <div className="app-topbar">
          <div className="app-topbar-actions">
            <button
              type="button"
              className="theme-toggle-button"
              onClick={toggleTheme}
              aria-label={
                theme === 'dark'
                  ? 'Switch to light mode'
                  : 'Switch to dark mode'
              }
              title={
                theme === 'dark'
                  ? 'Switch to light mode'
                  : 'Switch to dark mode'
              }
            >
              {theme === 'dark' ? (
                <Sun size={20} />
              ) : (
                <Moon size={20} />
              )}
            </button>

            <NotificationBell />
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  )
}