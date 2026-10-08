import {
  Plus,
  MapPin,
  Package,
  RefreshCw,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../../services/api'

export default function PartnerDrivesPage() {
  const [drives, setDrives] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDrives = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await apiRequest(
        '/partner/drives',
      )

      setDrives(
        data.drives ||
          data ||
          [],
      )
    } catch (err) {
      setError(
        err.message ||
          'Unable to load your donation drives.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDrives()
  }, [loadDrives])

  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <p className="eyebrow">Partner</p>

        <h1>Donation drives</h1>

        <p className="muted">
          Create and manage donation drives
          for your community.
        </p>
      </div>

      <div className="section-heading">
        <div>
          <p className="eyebrow">Your drives</p>

          <h2>Donation drives</h2>
        </div>

        <Link
          className="primary-button"
          to="/partner/drives/new"
        >
          <Plus size={18} />
          Create donation drive
        </Link>
      </div>

      {loading && (
        <div className="empty-panel">
          Loading your donation drives...
        </div>
      )}

      {!loading && error && (
        <div className="empty-panel">
          <p>{error}</p>

          <button
            className="secondary-button"
            type="button"
            onClick={loadDrives}
          >
            <RefreshCw size={17} />
            Try again
          </button>
        </div>
      )}

      {!loading &&
        !error &&
        drives.length === 0 && (
          <div className="empty-panel">
            <Package size={30} />

            <h3>No donation drives yet</h3>

            <p className="muted">
              Create your first donation drive
              to start receiving community
              donations.
            </p>

            
          </div>
        )}

      {!loading &&
        !error &&
        drives.length > 0 && (
          <div className="card-grid">
            {drives.map((drive) => {
              const driveId =
                drive.id ||
                drive._id

              return (
                <article
                  className="dashboard-card"
                  key={driveId}
                >
                  <div className="card-topline">
                    <span
                      className={`status-badge status-${drive.status}`}
                    >
                      {drive.status}
                    </span>

                    <span className="muted">
                      {drive.category}
                    </span>
                  </div>

                  <h3>{drive.title}</h3>

                  <p className="muted">
                    {drive.description}
                  </p>

                  <div className="drive-meta">
                    <span>
                      <Package size={16} />
                      Target:{' '}
                      {drive.targetQuantity}
                    </span>

                    <span>
                      <MapPin size={16} />
                      {drive.location}
                    </span>
                  </div>

                  {driveId ? (
                    <Link
                      className="text-link"
                      to={`/partner/drives/${driveId}`}
                    >
                      View drive
                    </Link>
                  ) : (
                    <span className="muted">
                      Drive ID unavailable
                    </span>
                  )}
                </article>
              )
            })}
          </div>
        )}
    </section>
  )
}