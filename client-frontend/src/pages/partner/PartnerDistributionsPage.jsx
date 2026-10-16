import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, ArrowRight } from 'lucide-react'
import { apiRequest } from '../../services/api'

export default function PartnerDistributionsPage() {
  const [drives, setDrives] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    apiRequest('/partner/drives')
      .then((data) => setDrives(data.drives || []))
      .catch((err) => setError(err.message || 'Unable to load drives.'))
  }, [])

  return (
    <section className="page-shell">
      <div className="page-header">
        <div><p className="eyebrow">Partner workspace</p><h1>Distributions</h1><p>Choose a drive to record or review its distributions.</p></div>
      </div>
      {error && <div className="form-error">{error}</div>}
      <div className="drive-grid compact-drive-grid">
        {drives.map((drive) => (
          <Link className="drive-card distribution-link-card" key={drive.id || drive._id} to={`/partner/drives/${drive.id || drive._id}/distributions`}>
            <div className="drive-card-header"><span className="category-badge">{drive.category}</span><Package size={20} /></div>
            <h2>{drive.title}</h2><span className={`status-badge status-${String(drive.status || 'unknown').toLowerCase()}`}>{drive.status}</span>
            <span className="distribution-card-action">Manage distributions <ArrowRight size={16} /></span>
          </Link>
        ))}
      </div>
      {!drives.length && !error && <div className="empty-state"><h3>No drives available</h3><p>Create a drive before recording distributions.</p></div>}
    </section>
  )
}
