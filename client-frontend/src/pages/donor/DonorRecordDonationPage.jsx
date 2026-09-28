import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  LoaderCircle,
  MapPin,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { apiRequest } from '../../services/api'

export default function DonorRecordDonationPage() {
  const { id } = useParams()

  const [drive, setDrive] = useState(null)
  const [item, setItem] = useState('')
  const [quantity, setQuantity] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let cancelled = false

    const fetchDrive = async () => {
      setLoading(true)
      setError('')

      try {
        const data = await apiRequest(`/drives/${id}`)
        const loadedDrive = data.drive || data

        if (!cancelled) {
          setDrive(loadedDrive)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message ||
              'Unable to load this donation drive.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchDrive()

    return () => {
      cancelled = true
    }
  }, [id])

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    const trimmedItem = item.trim()
    const numericQuantity = Number(quantity)

    if (!trimmedItem) {
      setError(
        'Please enter the item you want to donate.',
      )
      return
    }

    if (
      !Number.isInteger(numericQuantity) ||
      numericQuantity <= 0
    ) {
      setError(
        'Quantity must be a positive whole number.',
      )
      return
    }

    // Use the actual MongoDB drive ID returned by the server.
    const driveId = drive?._id

    if (!driveId) {
      setError(
        'Unable to identify this donation drive. Please go back and try again.',
      )
      return
    }

    setSubmitting(true)

    try {
      await apiRequest(
        `/drives/${driveId}/donations`,
        {
          method: 'POST',
          body: {
            item: trimmedItem,
            quantity: numericQuantity,
          },
        },
      )

      setSuccess(
        'Your donation has been recorded successfully.',
      )
      setItem('')
      setQuantity('')
    } catch (err) {
      setError(
        err.message ||
          'Unable to record your donation.',
      )
    } finally {
      setSubmitting(false)
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
          {error}
        </div>
      </div>
    )
  }

  if (!drive) {
    return null
  }

  if (drive.status !== 'active') {
    return (
      <div className="page-shell">
        <Link
          to={`/donor/drives/${drive._id}`}
          className="back-link"
        >
          <ArrowLeft size={17} />
          Back to Drive
        </Link>

        <div className="empty-state">
          <h2>Donation drive unavailable</h2>

          <p>
            This drive is currently{' '}
            {drive.status} and is not accepting
            new donations.
          </p>
        </div>
      </div>
    )
  }

  const organizationName =
    drive.partner?.organizationName ||
    drive.partner?.fullName ||
    'Community Partner'

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <Link
            to={`/donor/drives/${drive._id}`}
            className="back-link"
          >
            <ArrowLeft size={17} />
            Back to Drive
          </Link>

          <h1>Record a Donation</h1>

          <p>
            Record the items you are providing
            for this community drive.
          </p>
        </div>
      </div>

      <div className="donation-form-layout">
        <section className="details-card">
          <span className="category-badge">
            {drive.category}
          </span>

          <h2>{drive.title}</h2>

          <p className="details-description">
            {drive.description}
          </p>

          <div className="details-list">
            <div className="details-item">
              <Building2 size={18} />

              <div>
                <span>Community partner: </span>

                <strong>
                  {organizationName}
                </strong>
              </div>
            </div>

            <div className="details-item">
              <MapPin size={18} />

              <div>
                <span>Location: </span>

                <strong>
                  {drive.location}
                </strong>
              </div>
            </div>
          </div>
        </section>

        <section className="details-card">
          <h2>Donation Information: </h2>

          {success && (
            <div
              className="form-message form-message-success"
              role="status"
            >
              <CheckCircle2 size={18} />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div
              className="form-message form-message-error"
              role="alert"
            >
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="form-stack"
          >
            <div className="form-group">
              <label htmlFor="item">
                Item
              </label>

              <input
                id="item"
                type="text"
                value={item}
                onChange={(event) =>
                  setItem(event.target.value)
                }
                placeholder="Example: notebooks"
                maxLength={150}
                required
                disabled={submitting}
              />

              <small>
                Enter the type of item you are
                donating.
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="quantity">
                Quantity:  
              </label>

              <input
                id="quantity"
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(event) =>
                  setQuantity(event.target.value)
                }
                placeholder="Example: 10"
                required
                disabled={submitting}
              />
            </div>

            <button
              type="submit"
              className="primary-button"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <LoaderCircle
                    size={17}
                    className="spin"
                  />
                  Recording...
                </>
              ) : (
                'Record Donation'
              )}
            </button>
          </form>

          {success && (
            <Link
              to={`/donor/drives/${drive._id}`}
              className="secondary-button"
            >
              Return to Drive
            </Link>
          )}
        </section>
      </div>
    </div>
  )
}