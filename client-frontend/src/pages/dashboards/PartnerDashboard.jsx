import { useEffect, useState } from 'react'
import { Activity, CheckCircle2, Clock3, ExternalLink, FilePlus2, History, LogOut, Package, Settings, ShieldCheck, Store, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import DashboardStat from '../../components/dashboard/DashboardStat'
import UnavailablePanel from '../../components/dashboard/UnavailablePanel'
import { useAuth } from '../../context/useAuth'
import { ApiError, apiRequest } from '../../services/api'

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : 'Date unavailable'
}

function buildActivity(drives, donations, distributions) {
  const driveTitles = new Map(drives.map((drive) => [String(drive.id), drive.title]))
  const donationItems = new Map(donations.map((donation) => [String(donation.id), donation.item]))
  const activity = [
    ...drives.map((drive) => ({ date: drive.createdAt, title: 'Donation drive created', detail: drive.title })),
    ...donations.filter((donation) => donation.receivedAt).map((donation) => ({ date: donation.receivedAt, title: 'Donation received', detail: `${donation.item} · ${driveTitles.get(String(donation.driveId)) || 'Donation drive'}` })),
    ...distributions.map((distribution) => ({ date: distribution.createdAt, title: 'Distribution recorded', detail: `${distribution.quantityDistributed} items · ${donationItems.get(String(distribution.donationId)) || 'Donation'}` })),
  ]
  return activity.filter((item) => item.date).sort((left, right) => new Date(right.date) - new Date(left.date)).slice(0, 8)
}

export default function PartnerDashboard() {
  const { logout } = useAuth()
  const [dashboard, setDashboard] = useState({ verification: null, drives: [], donations: [], distributions: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      const [verificationResult, drivesResult] = await Promise.allSettled([
        apiRequest('/partner-verification/me'),
        apiRequest('/partner/drives'),
      ])
      if (!active) return

      const verification = verificationResult.status === 'fulfilled' ? verificationResult.value.verification : null
      const drives = drivesResult.status === 'fulfilled' ? drivesResult.value.drives : []
      const failedDrives = drivesResult.status === 'rejected' ? drivesResult.reason : null
      if (failedDrives && !(failedDrives instanceof ApiError && failedDrives.status === 403)) setError(failedDrives.message)

      const detailResults = await Promise.all(drives.map(async (drive) => {
        const [donationsResult, distributionsResult] = await Promise.allSettled([
          apiRequest(`/partner/drives/${drive.id}/donations`),
          apiRequest(`/partner/drives/${drive.id}/distributions`),
        ])
        return {
          donations: donationsResult.status === 'fulfilled' ? donationsResult.value.donations : [],
          distributions: distributionsResult.status === 'fulfilled' ? distributionsResult.value.distributions : [],
        }
      }))
      if (!active) return
      setDashboard({ verification, drives, donations: detailResults.flatMap((detail) => detail.donations), distributions: detailResults.flatMap((detail) => detail.distributions) })
      setLoading(false)
    }

    loadDashboard().catch((requestError) => {
      if (active) {
        setError(requestError.message)
        setLoading(false)
      }
    })
    return () => { active = false }
  }, [])

  const { verification, drives, donations, distributions } = dashboard
  const receivedDonations = donations.filter((donation) => donation.status === 'Received' || donation.status === 'Distributed').length
  const itemsDistributed = distributions.reduce((total, distribution) => total + distribution.quantityDistributed, 0)
  const beneficiariesAssisted = distributions.reduce((total, distribution) => total + distribution.beneficiariesAssisted, 0)
  const activity = buildActivity(drives, donations, distributions)

  return (
    <section className="dashboard-page activity-dashboard">
      <div className="page-heading"><p className="eyebrow">Partner dashboard</p><h1>Make support move forward.</h1><p className="muted">See your organization&apos;s active work, incoming support, and reach.</p></div>
      {error && <div className="form-error" role="alert">{error}</div>}
      <section className="dashboard-section">
        <div className="section-heading"><div><p className="eyebrow">Partner activity</p><h2>Activity overview</h2></div></div>
        <div className="stats-grid partner-stats">
          <DashboardStat label="Verification status" value={loading ? 'Loading...' : verification?.status || 'Not submitted'} icon={ShieldCheck} />
          <DashboardStat label="Active drives" value={loading ? 'Loading...' : drives.filter((drive) => drive.status === 'active').length} icon={Store} />
          <DashboardStat label="Completed drives" value={loading ? 'Loading...' : drives.filter((drive) => drive.status === 'completed').length} icon={CheckCircle2} />
          <DashboardStat label="Donations received" value={loading ? 'Loading...' : receivedDonations} icon={Package} />
          <DashboardStat label="Items distributed" value={loading ? 'Loading...' : itemsDistributed} icon={Activity} />
          <DashboardStat label="Beneficiaries assisted" value={loading ? 'Loading...' : beneficiariesAssisted} icon={Users} />
        </div>
        {!loading && !error && <p className="data-note">Counts are calculated from your partner drives and their available donation/distribution records.</p>}
      </section>
      <section className="dashboard-section">
        <div className="section-heading"><div><p className="eyebrow">History</p><h2>Recent activity</h2></div><Link className="text-link" to="/partner/drives">View drives <ExternalLink size={15} /></Link></div>
        {loading && <div className="empty-state"><Clock3 size={25} /><strong>Loading recent activity...</strong></div>}
        {!loading && activity.length === 0 && <UnavailablePanel>No donation, distribution, or drive activity is available yet.</UnavailablePanel>}
        {!loading && activity.length > 0 && <div className="activity-list">{activity.map((item, index) => <div className="activity-row" key={`${item.title}-${item.date}-${index}`}><span className="activity-dot"><History size={15} /></span><div><strong>{item.title}</strong><span>{item.detail}</span></div><time>{formatDate(item.date)}</time></div>)}</div>}
        <UnavailablePanel>Drive status changes are not separately exposed by the backend activity API, so they are not included as a fabricated history event.</UnavailablePanel>
      </section>
      <section className="dashboard-section">
        <div className="section-heading"><div><p className="eyebrow">Next step</p><h2>Quick actions</h2></div></div>
        <div className="quick-actions">
          <Link className="action-card" to="/partner/drives"><FilePlus2 size={19} /><span>Create donation drive</span></Link>
          <Link className="action-card" to="/partner/verification"><ShieldCheck size={19} /><span>Manage verification</span></Link>
          <Link className="action-card" to="/partner/drives"><Store size={19} /><span>View drives</span></Link>
          <Link className="action-card" to="/partner/settings"><Settings size={19} /><span>Settings</span></Link>
          <button className="action-card" type="button" onClick={logout}><LogOut size={19} /><span>Logout</span></button>
        </div>
      </section>
    </section>
  )
}