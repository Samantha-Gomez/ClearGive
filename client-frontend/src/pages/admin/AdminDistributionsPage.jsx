import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ClipboardList,
  LoaderCircle,
  RefreshCw,
  Search,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../../services/api'

export default function AdminDistributionsPage() {
  const [distributions, setDistributions] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const loadDistributions = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    }

    setError('')

    try {
      const data = await apiRequest('/distributions/admin')
      setDistributions(data.distributions || data || [])
    } catch (err) {
      setError(
        err.message || 'Unable to load distribution records.',
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadDistributions()
  }, [loadDistributions])

  const filteredDistributions = useMemo(() => {
    const searchValue = search.trim().toLowerCase()

    return distributions.filter((distribution) => {
      const driveTitle = distribution.driveId?.title || ''
      const item = distribution.donationId?.item || ''
      const recorderName =
        distribution.recordedBy?.fullName ||
        distribution.recordedBy?.name ||
        ''
      const recorderEmail =
        distribution.recordedBy?.email || ''
      const notes = distribution.notes || ''

      return (
        !searchValue ||
        driveTitle.toLowerCase().includes(searchValue) ||
        item.toLowerCase().includes(searchValue) ||
        recorderName.toLowerCase().includes(searchValue) ||
        recorderEmail.toLowerCase().includes(searchValue) ||
        notes.toLowerCase().includes(searchValue)
      )
    })
  }, [distributions, search])

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Admin management</p>
          <h1>Distributions</h1>
          <p>
            Monitor donation distribution records across all
            ClearGive drives.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => loadDistributions(true)}
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
            placeholder="Search drive, item, or recorded by..."
            aria-label="Search distribution records"
          />
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
          Loading distribution records...
        </div>
      ) : filteredDistributions.length === 0 ? (
        <div className="empty-state">
          <ClipboardList size={36} />
          <h2>No distributions found</h2>
          <p>
            There are no distribution records matching the
            current search.
          </p>
        </div>
      ) : (
        <section className="detail-card">
          <div className="section-heading">
            <div>
              <h2>Distribution Records</h2>
              <p>
                {filteredDistributions.length} record
                {filteredDistributions.length === 1 ? '' : 's'} shown
              </p>
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Drive</th>
                  <th>Item</th>
                  <th>Quantity Distributed</th>
                  <th>Beneficiaries</th>
                  <th>Recorded By</th>
                  <th>Notes</th>
                  <th>Date</th>
                  <th>View</th>
                </tr>
              </thead>

              <tbody>
                {filteredDistributions.map((distribution) => (
                  <tr key={distribution._id}>
                    <td>
                      {distribution.driveId?.title ||
                        'Unknown drive'}
                    </td>

                    <td>
                      {distribution.donationId?.item ||
                        'Unknown item'}
                    </td>

                    <td>
                      {distribution.quantityDistributed ?? '—'}
                    </td>

                    <td>
                      {distribution.beneficiariesAssisted ?? '—'}
                    </td>

                    <td>
                      <div>
                        <strong>
                          {distribution.recordedBy?.fullName ||
                            distribution.recordedBy?.name ||
                            'Partner'}
                        </strong>

                        {distribution.recordedBy?.email && (
                          <small>
                            {distribution.recordedBy.email}
                          </small>
                        )}
                      </div>
                    </td>

                    <td>
                      {distribution.notes || '—'}
                    </td>

                    <td>
                      {distribution.createdAt
                        ? new Date(
                            distribution.createdAt,
                          ).toLocaleDateString()
                        : '—'}
                    </td>

                    <td>
                      {distribution.driveId?._id ? (
                        <Link
                          to={`/admin/drives/${distribution.driveId._id}`}
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