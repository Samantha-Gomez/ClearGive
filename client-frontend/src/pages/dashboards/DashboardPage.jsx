import { HeartHandshake, Mail, UserRound } from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { roleLabels } from '../../routes/routeUtils'

export default function DashboardPage({ role }) {
  const { user } = useAuth()

  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <p className="eyebrow">{roleLabels[role]} dashboard</p>
        <h1>Welcome to ClearGive.</h1>
        <p className="muted">Your community support workspace is ready.</p>
      </div>
      <div className="dashboard-card">
        <div className="dashboard-icon"><HeartHandshake size={24} /></div>
        <div>
          <h2>{roleLabels[role]} workspace</h2>
          <p className="muted">Feature workflows will appear here as they are added.</p>
          <div className="user-details">
            <span><UserRound size={15} /> {user.fullName}</span>
            <span><Mail size={15} /> {user.email}</span>
          </div>
        </div>
      </div>
    </section>
  )
}