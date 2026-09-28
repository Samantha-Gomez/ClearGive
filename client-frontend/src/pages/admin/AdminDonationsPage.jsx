import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  LoaderCircle,
  Package,
  RefreshCw,
  Search,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../../services/api'

const statuses = [
  'All Statuses',
  'Recorded',
  'Received',
  'Distributed',
]

export default function AdminDonationsPage() {
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All Statuses')

  const loadDonations = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    }

    setError('')

    try {
      const data = await apiRequest('/donations/admin')
      setDonations(data.donations || data || [])
    } catch (err) {
      setError(err.message || 'Unable to load donation records.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadDonations()
  }, [loadDonations])

  const filteredDonations = useMemo(() => {
    const searchValue = search.trim().toLowerCase()

    return donations.filter((donation) => {
      const donorName =
        donation.donorId?.fullName ||
        donation.donorId?.name ||
        ''

      const donorEmail = donation.donorId?.email || ''
      const driveTitle = donation.driveId?.title || ''
      const item = donation.item || ''

      const matchesSearch =
        !searchValue ||
        donorName.toLowerCase().includes(searchValue) ||
        donorEmail.toLowerCase().includes(searchValue) ||
        driveTitle.toLowerCase().includes(searchValue) ||
        item.toLowerCase().includes(searchValue)

      const matchesStatus =
        status === 'All Statuses' ||
        donation.status === status

      return matchesSearch && matchesStatus
    })
  }, [donations, search, status])

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Admin management</p>
          <h1>Donations</h1>
          <p>
            Monitor donation records across all ClearGive drives.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => loadDonations(true)}
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
            className={refreshing ? 'spin' : ''}
          />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <section className="filter-card">
        <div className="filter-search">
          <Search size={18} />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search donor, drive, or item..."
            aria-label="Search donation records"
          />
        </div>

        <div className="filter-row">
          <div className="form-group">
            <label htmlFor="donation-status">Status</label>

            <select
              id="donation-status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {error && (
        <div className="form-message form-message-error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="page-state">
          <LoaderCircle size={22} className="spin" />
          Loading donation records...
        </div>
      ) : filteredDonations.length === 0 ? (
        <div className="empty-state">
          <Package size={36} />
          <h2>No donations found</h2>
          <p>
            There are no donation records matching the current
            search and filter.
          </p>
        </div>
      ) : (
        <section className="detail-card">
          <div className="section-heading">
            <div>
              <h2>Donation Records</h2>
              <p>
                {filteredDonations.length} record
                {filteredDonations.length === 1 ? '' : 's'} shown
              </p>
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Donor</th>
                  <th>Drive</th>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Drive</th>
                </tr>
              </thead>

              <tbody>
                {filteredDonations.map((donation) => (
                  <tr key={donation._id}>
                    <td>
                      <div>
                        <strong>
                          {donation.donorId?.fullName ||
                            donation.donorId?.name ||
                            'Donor'}
                        </strong>

                        {donation.donorId?.email && (
                          <small>
                            {donation.donorId.email}
                          </small>
                        )}
                      </div>
                    </td>

                    <td>
                      {donation.driveId?.title || 'Unknown drive'}
                    </td>

                    <td>{donation.item || '—'}</td>

                    <td>{donation.quantity ?? '—'}</td>

                    <td>
                      <span
                        className={`status-badge status-${String(
                          donation.status || 'unknown',
                        ).toLowerCase()}`}
                      >
                        {donation.status || 'Unknown'}
                      </span>
                    </td>

                    <td>
                      {donation.createdAt
                        ? new Date(
                            donation.createdAt,
                          ).toLocaleDateString()
                        : '—'}
                    </td>

                    <td>
                      {donation.driveId?._id ? (
                        <Link
                          to={`/admin/drives/${donation.driveId._id}`}
                          className="text-link"
                        >
                          View Drive
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}