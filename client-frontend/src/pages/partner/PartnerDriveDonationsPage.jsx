import { useCallback, useEffect, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle,
  LoaderCircle,
  Package,
  Plus,
  RefreshCw,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { apiRequest } from '../../services/api'

export default function PartnerDriveDonationsPage() {
  const { id } = useParams()

  const [drive, setDrive] = useState(null)
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [recording, setRecording] = useState(false)

  const [contributorName, setContributorName] = useState('')
  const [item, setItem] = useState('')
  const [quantity, setQuantity] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError('')

      try {
        const [driveData, donationData] = await Promise.all([
          apiRequest(`/partner/drives/${id}`),
          apiRequest(`/partner/drives/${id}/donations`),
        ])

        setDrive(driveData.drive || driveData)

        setDonations(
          donationData.donations ||
            donationData ||
            [],
        )
      } catch (err) {
        setError(
          err.message ||
            'Unable to load donation information.',
        )
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [id],
  )

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRecordDonation = async (event) => {
    event.preventDefault()

    setRecording(true)
    setError('')
    setSuccess('')

    try {
      const data = await apiRequest(
        `/partner/drives/${id}/donations`,
        {
          method: 'POST',
          body: {
            contributorName:
              contributorName.trim(),
            item: item.trim(),
            quantity: Number(quantity),
          },
        },
      )

      const newDonation = data.donation

      if (newDonation) {
        setDonations((current) => [
          newDonation,
          ...current,
        ])
      } else {
        await loadData(true)
      }

      setContributorName('')
      setItem('')
      setQuantity('')

      setSuccess(
        'Physical donation recorded and received successfully.',
      )
    } catch (err) {
      setError(
        err.message ||
          'Unable to record this donation.',
      )
    } finally {
      setRecording(false)
    }
  }

  if (loading) {
    return (
      <div className="page-state">
        <LoaderCircle
          size={22}
          className="spin"
        />
        Loading donations...
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

        <div
          className="page-state page-state-error"
          role="alert"
        >
          {error ||
            'Donation drive not found.'}
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <Link
            to={`/partner/drives/${id}`}
            className="back-link"
          >
            <ArrowLeft size={17} />
            Back to Drive
          </Link>

          <h1>Donations</h1>

          <p>{drive.title}</p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => loadData(true)}
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

      {error && (
        <div
          className="form-message form-message-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          className="form-message form-message-success"
          role="status"
        >
          <CheckCircle size={18} />
          {success}
        </div>
      )}

      <section className="detail-card">
        <div className="detail-card-header">
          <div>
            <span className="detail-label">
              Record Physical Donation
            </span>

            <h2>Add Donation</h2>
          </div>

          <Plus size={26} />
        </div>

        <form
          onSubmit={handleRecordDonation}
          className="form-grid"
        >
          <div className="form-group">
            <label htmlFor="contributorName">
              Contributor Name
              <span className="optional-label">
                {' '}
                (optional)
              </span>
            </label>

            <input
              id="contributorName"
              type="text"
              value={contributorName}
              onChange={(event) =>
                setContributorName(
                  event.target.value,
                )
              }
              placeholder="Enter donor name"
              maxLength={150}
            />
          </div>

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
              minLength={2}
              maxLength={150}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="quantity">
              Quantity
            </label>

            <input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(event) =>
                setQuantity(
                  event.target.value,
                )
              }
              placeholder="Enter quantity"
              min="1"
              step="1"
              required
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={recording}
            >
              {recording ? (
                <>
                  <LoaderCircle
                    size={16}
                    className="spin"
                  />
                  Recording...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Record Donation
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      <section className="detail-card">
        <div className="detail-card-header">
          <div>
            <span className="detail-label">
              Donation Records
            </span>

            <h2>
              {donations.length}{' '}
              {donations.length === 1
                ? 'donation'
                : 'donations'}
            </h2>
          </div>

          <Package size={26} />
        </div>

        {donations.length === 0 ? (
          <div className="empty-state">
            <Package size={32} />

            <h3>No donations yet</h3>

            <p>
              Donations recorded by the
              partner will appear here.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Contributor</th>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Date Received</th>
                </tr>
              </thead>

              <tbody>
                {donations.map((donation) => {
                  const contributor =
                    donation.contributorName ||
                    'Anonymous Donor'

                  const dateValue =
                    donation.receivedAt ||
                    donation.recordedAt ||
                    donation.createdAt

                  const formattedDate =
                    dateValue
                      ? new Date(
                          dateValue,
                        ).toLocaleDateString()
                      : '—'

                  return (
                    <tr
                      key={
                        donation.id ||
                        donation._id
                      }
                    >
                      <td>
                        {contributor}
                      </td>

                      <td>
                        {donation.item}
                      </td>

                      <td>
                        {donation.quantity}
                      </td>

                      <td>
                        <span
                          className={`status-badge status-${String(
                            donation.status ||
                              '',
                          ).toLowerCase()}`}
                        >
                          {donation.status ||
                            'Unknown'}
                        </span>
                      </td>

                      <td>
                        {formattedDate}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}