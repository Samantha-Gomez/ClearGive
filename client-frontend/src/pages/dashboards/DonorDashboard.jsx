import { Clock3, ExternalLink, History, LogOut, Package, Settings, ShoppingBag, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import DashboardStat from '../../components/dashboard/DashboardStat'
import UnavailablePanel from '../../components/dashboard/UnavailablePanel'
import { useAuth } from '../../context/useAuth'

export default function DonorDashboard() {
  const { logout } = useAuth()

  return (
    <section className="dashboard-page activity-dashboard">
      <div className="page-heading"><p className="eyebrow">Donor dashboard</p><h1>Support that stays visible.</h1><p className="muted">Track your contributions and find the next community need to support.</p></div>
      <section className="dashboard-section">
        <div className="section-heading"><div><p className="eyebrow">Overview</p><h2>Donation overview</h2></div></div>
        <div className="stats-grid">
          <DashboardStat label="Total donations" value="Unavailable" icon={ShoppingBag} unavailable />
          <DashboardStat label="Total items donated" value="Unavailable" icon={Package} unavailable />
          <DashboardStat label="Donations received" value="Unavailable" icon={Truck} unavailable />
          <DashboardStat label="Donations distributed" value="Unavailable" icon={Clock3} unavailable />
        </div>
        <UnavailablePanel>The backend does not currently expose donor-specific donation aggregates, so these statistics are not calculated.</UnavailablePanel>
      </section>
      <section className="dashboard-section">
        <div className="section-heading"><div><p className="eyebrow">History</p><h2>Recent donations</h2></div><Link className="text-link" to="/donor/history">View history <ExternalLink size={15} /></Link></div>
        <UnavailablePanel>Donation history requires a backend endpoint that returns donations belonging to the authenticated donor.</UnavailablePanel>
      </section>
      <section className="dashboard-section">
        <div className="section-heading"><div><p className="eyebrow">Next step</p><h2>Quick actions</h2></div></div>
        <div className="quick-actions">
          <Link className="action-card" to="/donor/drives"><ShoppingBag size={19} /><span>Browse donation drives</span></Link>
          <Link className="action-card" to="/donor/history"><History size={19} /><span>View donation history</span></Link>
          <Link className="action-card" to="/donor/settings"><Settings size={19} /><span>Settings</span></Link>
          <button className="action-card" type="button" onClick={logout}><LogOut size={19} /><span>Logout</span></button>
        </div>
      </section>
    </section>
  )
}import DashboardPage from './DashboardPage'

export default function DonorDashboard() {
  return <DashboardPage role="donor" />
}