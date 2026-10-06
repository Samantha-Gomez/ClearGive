import { useCallback, useEffect, useState } from 'react'
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  LoaderCircle,
  MapPin,
  Package,
  RefreshCw,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { apiRequest } from '../../services/api'

const formatDriveDate = (value) => {
  if (!value) return 'Not specified'

  const datePart = String(value).slice(0, 10)
  const [year, month, day] = datePart.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  return Number.isNaN(date.getTime())
    ? 'Not specified'
    : date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
}

export default function DonorDriveDetailsPage() {
  const { id } = useParams()

  const [drive, setDrive] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const loadDrive = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError('')

      try {
        const data = await apiRequest(
          `/drives/${id}`,
        )

        setDrive(data.drive || data)
      } catch (err) {
        setError(
          err.message ||
            'Unable to load this donation drive.',
        )
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [id],
  )

  useEffect(() => {
    loadDrive()
  }, [loadDrive])

  if (loading) {
    return (
      <div className="page-state">
        <LoaderCircle
          size={22}
          className="spin"
        />

        Loading donation drive...
      </div>
    )
  }

  if (error || !drive) {
    return (
      <div className="page-shell">
        <Link
          to="/donor/drives"
          className="back-link"
        >
          <ArrowLeft size={17} />
          Back to Donation Drives
        </Link>

        <div
          className="form-message form-message-error"
          role="alert"
        >
          {error ||
            'Donation drive not found.'}
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => loadDrive()}
        >
          <RefreshCw size={17} />
          Try Again
        </button>
      </div>
    )
  }

  const targetQuantity = Number(
    drive.targetQuantity || 0,
  )

  const collectedQuantity = Number(
    drive.stats?.totalReceived ?? 0,
  )

  const progress =
    targetQuantity > 0
      ? Math.min(
          (collectedQuantity /
            targetQuantity) *
            100,
          100,
        )
      : 0

  const isActive =
    drive.status === 'active'

  const organizationName =
    drive.partner?.organizationName ||
    drive.partner?.fullName ||
    'Community Partner'
  const requestedItems = Array.isArray(drive.requestedItems)
    ? drive.requestedItems.filter(
        (item) => item && typeof item.name === 'string',
      )
    : []

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <Link
            to="/donor/drives"
            className="back-link"
          >
            <ArrowLeft size={17} />
            Back to Donation Drives
          </Link>

          <h1>{drive.title}</h1>

          <p>
            Donation drive details and
            assistance information.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => loadDrive(true)}
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
            className={
              refreshing ? 'spin' : ''
            }
          />

          {refreshing
            ? 'Refreshing...'
            : 'Refresh'}
        </button>
      </div>

      <div className="details-grid">
        <section className="details-card">
          <div className="drive-card-header">
            <span className="category-badge">
              {drive.category}
            </span>

            <span
              className={`status-badge ${
                isActive
                  ? 'status-active'
                  : `status-${String(
                      drive.status ||
                        'unknown',
                    ).toLowerCase()}`
              }`}
            >
              {drive.status}
            </span>
          </div>

          <h2>About this drive</h2>

          <p className="details-description">
            {drive.description}
          </p>

          <div className="details-list">
            <div className="details-item">
              <Building2 size={18} />

              <div>
                <span>
                  Community partner
                </span>

                <strong>
                  {organizationName}
                </strong>
              </div>
            </div>

            <div className="details-item">
              <MapPin size={18} />

              <div>
                <span>Donation location</span>

                <strong>
                  {drive.location}
                </strong>
              </div>
            </div>

            <div className="details-item">
              <CalendarDays size={18} />
              <div>
                <span>Drive / event date</span>
                <strong>{formatDriveDate(drive.eventDate)}</strong>
              </div>
            </div>

            <div className="details-item">
              <Package size={18} />
              <div>
                <span>Requested items</span>
                {requestedItems.length > 0 ? (
                  <ul>
                    {requestedItems.map((item, index) => (
                      <li key={`${item.name}-${index}`}>
                        {item.name} - {item.quantity} needed
                      </li>
                    ))}
                  </ul>
                ) : (
                  <strong>Not specified</strong>
                )}
              </div>
            </div>

            <div className="details-item">
              <Package size={18} />

              <div>
                <span>
                  Target quantity
                </span>

                <strong>
                  {targetQuantity}
                </strong>
              </div>
            </div>

            {drive.assistanceReference && (
              <div className="details-item">
                <Package size={18} />

                <div>
                  <span>
                    Assistance reference
                  </span>

                  <strong>
                    {drive.assistanceReference}
                  </strong>
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className="details-card">
          <h2>Donation Progress</h2>

          <div className="large-progress-value">
            {collectedQuantity}

            <span>
              {' '}
              / {targetQuantity}
            </span>
          </div>

          <p>
            items received toward the
            target
          </p>

          <div className="drive-progress">
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>

          <div className="details-stat-row">
            <span>Progress</span>

            <strong>
              {Math.round(progress)}%
            </strong>
          </div>

          {isActive ? (
            <div className="donor-instruction-panel">
              <Package size={22} />

              <div>
                <strong>
                  How to donate
                </strong>

                <p>
                  Bring the requested items
                  directly to the donation
                  location above. The community
                  partner will record your
                  donation when it is received.
                </p>
              </div>
            </div>
          ) : (
            <div className="form-message">
              This donation drive is currently{' '}
              {drive.status}.
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
