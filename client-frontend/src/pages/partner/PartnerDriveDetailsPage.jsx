import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  LoaderCircle,
  MapPin,
  Package,
  Pencil,
  Pause,
  Play,
  RefreshCw,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiRequest } from '../../services/api'

export default function PartnerDriveDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [drive, setDrive] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [updatingStatus, setUpdatingStatus] =
    useState(false)

  const loadDrive = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setError('')

    try {
      const data = await apiRequest(
        `/partner/drives/${id}`,
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
  }

  useEffect(() => {
    loadDrive()
  }, [id])

  const handleStatusChange = async () => {
    if (!drive || updatingStatus) return

    const nextStatus =
      drive.status === 'active'
        ? 'paused'
        : 'active'

    setUpdatingStatus(true)
    setError('')

    try {
      const data = await apiRequest(
        `/partner/drives/${id}/status`,
        {
          method: 'PATCH',
          body: {
            status: nextStatus,
          },
        },
      )

      setDrive(data.drive || data)
    } catch (err) {
      setError(
        err.message ||
          'Unable to update the drive status.',
      )
    } finally {
      setUpdatingStatus(false)
    }
  }

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

  if (error && !drive) {
    return (
      <div className="page-shell">
        <Link
          to="/partner/drives"
          className="back-link"
        >
          <ArrowLeft size={17} />
          Back to My Drives
        </Link>

        <div
          className="page-state page-state-error"
          role="alert"
        >
          {error}
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

  if (!drive) {
    return (
      <div className="page-shell">
        <Link
          to="/partner/drives"
          className="back-link"
        >
          <ArrowLeft size={17} />
          Back to My Drives
        </Link>

        <div className="page-state">
          Donation drive not found.
        </div>
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

  const isPaused =
    drive.status === 'paused'

  const canChangeStatus =
    isActive || isPaused

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <Link
            to="/partner/drives"
            className="back-link"
          >
            <ArrowLeft size={17} />
            Back to My Drives
          </Link>

          <div className="page-title-row">
            <div>
              <h1>{drive.title}</h1>

              <p>
                Manage this donation drive
                and monitor its progress.
              </p>
            </div>

            <span
              className={`status-badge status-${drive.status}`}
            >
              {drive.status}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => loadDrive(true)}
          disabled={refreshing}
        >
          <RefreshCw size={17} />

          {refreshing
            ? 'Refreshing...'
            : 'Refresh'}
        </button>
      </div>

      {error && (
        <div
          className="form-message form-message-error"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="detail-grid">
        <section className="detail-card detail-card-main">
          <div className="detail-card-header">
            <div>
              <span className="detail-label">
                Drive Information
              </span>

              <h2>{drive.title}</h2>
            </div>

            <Package size={26} />
          </div>

          <p className="detail-description">
            {drive.description}
          </p>

          <div className="detail-meta-grid">
            <div className="detail-meta-item">
              <span className="detail-label">
                Category
              </span>

              <strong>
                {drive.category}
              </strong>
            </div>

            <div className="detail-meta-item">
              <span className="detail-label">
                Target Quantity
              </span>

              <strong>
                {targetQuantity}
              </strong>
            </div>

            <div className="detail-meta-item">
              <span className="detail-label">
                Location
              </span>

              <strong className="detail-location">
                <MapPin size={16} />
                {drive.location}
              </strong>
            </div>

            {drive.assistanceReference && (
              <div className="detail-meta-item">
                <span className="detail-label">
                  Assistance Reference
                </span>

                <strong>
                  {drive.assistanceReference}
                </strong>
              </div>
            )}
          </div>
        </section>

        <section className="detail-card">
          <span className="detail-label">
            Donation Progress
          </span>

          <div className="progress-summary">
            <strong>
              {collectedQuantity}
            </strong>

            <span>
              / {targetQuantity} items
            </span>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <p className="progress-text">
            {Math.round(progress)}% of the
            target has been collected.
          </p>
        </section>

        <section className="detail-card">
          <span className="detail-label">
            Drive Controls
          </span>

          <div className="detail-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                navigate(
                  `/partner/drives/${id}/edit`,
                )
              }
              disabled={
                drive.status === 'completed' ||
                drive.status === 'cancelled'
              }
            >
              <Pencil size={17} />
              Edit Drive
            </button>

            {canChangeStatus && (
              <button
                type="button"
                className="secondary-button"
                onClick={handleStatusChange}
                disabled={updatingStatus}
              >
                {updatingStatus ? (
                  <>
                    <LoaderCircle
                      size={17}
                      className="spin"
                    />
                    Updating...
                  </>
                ) : isActive ? (
                  <>
                    <Pause size={17} />
                    Pause Drive
                  </>
                ) : (
                  <>
                    <Play size={17} />
                    Reactivate Drive
                  </>
                )}
              </button>
            )}
          </div>

          <p className="field-hint">
            Pausing a drive temporarily
            prevents it from receiving new
            donor activity while keeping its
            existing records.
          </p>
        </section>

        <section className="detail-card">
          <span className="detail-label">
            Donation Management
          </span>

          <h2>Donations</h2>

          <p className="detail-description">
            View and manage donations recorded
            for this drive.
          </p>

          <div className="detail-actions">
            <Link
              to={`/partner/drives/${id}/donations`}
              className="primary-button"
            >
              View Donations
            </Link>

            <Link
              to={`/partner/drives/${id}/distributions`}
              className="secondary-button"
            >
              Manage Distributions
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}