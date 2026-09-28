import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  LoaderCircle,
  Package,
  RefreshCw,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../../services/api'

export default function DonorHistoryPage() {
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const loadDonations = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setError('')

    try {
      const data = await apiRequest('/donations/my')
      setDonations(data.donations || [])
    } catch (err) {
      setError(
        err.message ||
          'Unable to load your donation history.',
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDonations()
  }, [])

  const totalItems = useMemo(
    () =>
      donations.reduce(
        (total, donation) =>
          total +
          Number(donation.quantity || 0),
        0,
      ),
    [donations],
  )

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1>Donation History</h1>

          <p>
            View the donations you have recorded
            through ClearGive.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => loadDonations(true)}
          disabled={loading || refreshing}
        >
          <RefreshCw size={17} />

          {refreshing
            ? 'Refreshing...'
            : 'Refresh'}
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Package size={20} />
          </div>

          <div>
            <span>Total Donations: </span>
            <strong>
              {donations.length}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Package size={20} />
          </div>

          <div>
            <span>Total Items: </span>
            <strong>{totalItems}</strong>
          </div>
        </div>
      </div>

      {error && (
        <div
          className="form-message form-message-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="page-state">
          <LoaderCircle
            size={22}
            className="spin"
          />
          Loading donation history...
        </div>
      ) : donations.length === 0 ? (
        <div className="empty-state">
          <Package size={36} />

          <h2>No donations yet</h2>

          <p>
            Your recorded donations will appear
            here once you donate to a drive.
          </p>

          <Link
            to="/donor/drives"
            className="primary-button"
          >
            Browse Donation Drives
          </Link>
        </div>
      ) : (
        <div className="table-card">
          <div className="table-header">
            <div>
              <h2>Your Donations</h2>

              <p>
                {donations.length}{' '}
                recorded donation
                {donations.length === 1
                  ? ''
                  : 's'}
              </p>
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Drive</th>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {donations.map((donation) => {
                  const drive =
                    donation.driveId

                  const donationDate =
                    donation.createdAt
                      ? new Date(
                          donation.createdAt,
                        )
                      : null

                  const formattedDate =
                    donationDate &&
                    !Number.isNaN(
                      donationDate.getTime(),
                    )
                      ? donationDate.toLocaleDateString()
                      : '—'

                  const status =
                    donation.status ||
                    'Recorded'

                  return (
                    <tr
                      key={donation._id}
                    >
                      <td>
                        {drive?._id ? (
                          <Link
                            to={`/donor/drives/${drive._id}`}
                            className="table-link"
                          >
                            {drive.title ||
                              'Donation Drive'}
                          </Link>
                        ) : (
                          'Donation Drive'
                        )}
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
                            status,
                          ).toLowerCase()}`}
                        >
                          {status}
                        </span>
                      </td>

                      <td>
                        <span className="date-cell">
                          <CalendarDays
                            size={15}
                          />
                          {formattedDate}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}