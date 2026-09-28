import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  LoaderCircle,
  MapPin,
  Package,
  RefreshCw,
  Search,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../../services/api'

const categories = [
  'All Categories',
  'School Supplies',
  'Food',
  'Hygiene',
  'Clothing',
  'Water',
  'Household Needs',
]

const statuses = [
  'All Statuses',
  'active',
  'paused',
  'completed',
  'cancelled',
]

export default function AdminDrivesPage() {
  const [drives, setDrives] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] =
    useState('All Categories')
  const [status, setStatus] =
    useState('All Statuses')

  const loadDrives = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError('')

      try {
        const data = await apiRequest(
          '/admin/drives',
        )

        setDrives(
          data.drives ||
            data ||
            [],
        )
      } catch (err) {
        setError(
          err.message ||
            'Unable to load donation drives.',
        )
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [],
  )

  useEffect(() => {
    loadDrives()
  }, [loadDrives])

  const filteredDrives = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase()

    return drives.filter((drive) => {
      const matchesSearch =
        !searchValue ||
        drive.title
          ?.toLowerCase()
          .includes(searchValue) ||
        drive.description
          ?.toLowerCase()
          .includes(searchValue) ||
        drive.location
          ?.toLowerCase()
          .includes(searchValue)

      const matchesCategory =
        category === 'All Categories' ||
        drive.category === category

      const matchesStatus =
        status === 'All Statuses' ||
        drive.status === status

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      )
    })
  }, [
    drives,
    search,
    category,
    status,
  ])

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            Admin management
          </p>

          <h1>Donation Drives</h1>

          <p>
            Monitor donation drives created
            by approved partner organizations.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => loadDrives(true)}
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

      <section className="filter-card">
        <div className="filter-search">
          <Search size={18} />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search drives..."
            aria-label="Search donation drives"
          />
        </div>

        <div className="filter-row">
          <div className="form-group">
            <label htmlFor="admin-category">
              Category
            </label>

            <select
              id="admin-category"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
            >
              {categories.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="admin-status">
              Status
            </label>

            <select
              id="admin-status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
            >
              {statuses.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

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

          Loading donation drives...
        </div>
      ) : filteredDrives.length === 0 ? (
        <div className="empty-state">
          <Package size={36} />

          <h2>
            No donation drives found
          </h2>

          <p>
            There are no drives matching
            the current search and filters.
          </p>
        </div>
      ) : (
        <div className="drive-grid">
          {filteredDrives.map((drive) => {
            const targetQuantity =
              Number(
                drive.targetQuantity || 0,
              )

            const collectedQuantity =
              Number(
                drive.stats
                  ?.totalReceived ?? 0,
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

            return (
              <article
                className="drive-card"
                key={drive._id}
              >
                <div className="drive-card-header">
                  <span className="category-badge">
                    {drive.category}
                  </span>

                  <span
                    className={`status-badge status-${String(
                      drive.status ||
                        'unknown',
                    ).toLowerCase()}`}
                  >
                    {drive.status ||
                      'Unknown'}
                  </span>
                </div>

                <h2>{drive.title}</h2>

                <p className="drive-description">
                  {drive.description}
                </p>

                <div className="drive-location">
                  <MapPin size={16} />

                  <span>
                    {drive.location}
                  </span>
                </div>

                <div className="drive-progress">
                  <div className="drive-progress-label">
                    <span>
                      Donation progress
                    </span>

                    <strong>
                      {collectedQuantity} /{' '}
                      {targetQuantity}
                    </strong>
                  </div>

                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${progress}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="drive-card-footer">
                  <span className="drive-target">
                    <Package size={15} />

                    Target:{' '}
                    {targetQuantity} items
                  </span>

                  <Link
                    to={`/admin/drives/${drive._id}`}
                    className="primary-button"
                  >
                    View Drive
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}