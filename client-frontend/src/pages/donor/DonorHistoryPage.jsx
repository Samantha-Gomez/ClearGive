import { History } from 'lucide-react'
import UnavailablePanel from '../../components/dashboard/UnavailablePanel'

export default function DonorHistoryPage() {
  return (
    <section className="dashboard-page">
      <div className="page-heading"><p className="eyebrow">Donor workspace</p><h1>Donation history</h1><p className="muted">Review your contributions and their progress.</p></div>
      <UnavailablePanel><strong>Donation history is not available yet.</strong> The backend does not currently provide a donor-specific donations list endpoint.</UnavailablePanel>
      <div className="empty-state"><History size={26} /><strong>No donation history to display</strong><span>Once a donor history endpoint is available, item, quantity, drive, date, and status will appear here.</span></div>
    </section>
  )
}