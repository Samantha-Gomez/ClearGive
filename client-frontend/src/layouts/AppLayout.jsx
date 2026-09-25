import { HeartHandshake, LayoutDashboard, LogOut, ShieldCheck, Store, Truck } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { roleLabels } from '../routes/routeUtils'

const navigation = {
  donor: [
    { label: 'Dashboard', to: '/donor', icon: LayoutDashboard },
    { label: 'Donation Drives', to: '/donor/drives', icon: HeartHandshake },
  ],
  partner: [
    { label: 'Dashboard', to: '/partner', icon: LayoutDashboard },
    { label: 'My Drives', to: '/partner/drives', icon: Store },
    { label: 'Verification', to: '/partner/verification', icon: ShieldCheck },
  ],
  admin: [
    { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
    { label: 'Partner Verification', to: '/admin/verification', icon: ShieldCheck },
    { label: 'Donation Drives', to: '/admin/drives', icon: Truck },
  ],
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const links = navigation[user.role] || []

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink className="brand" to={`/${user.role}`}>
          <span className="brand-mark"><HeartHandshake size={21} /></span>
          <span>ClearGive</span>
        </NavLink>
        <div className="profile-summary">
          <strong>{user.fullName}</strong>
          <span>{roleLabels[user.role]}</span>
        </div>
        <nav className="main-nav" aria-label="Main navigation">
          {links.map(({ label, to, icon: Icon }) => (
            <NavLink key={to} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} to={to} end={to === `/${user.role}`}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <button className="nav-link logout-button" type="button" onClick={logout}>
          <LogOut size={18} />
          Logout
        </button>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}