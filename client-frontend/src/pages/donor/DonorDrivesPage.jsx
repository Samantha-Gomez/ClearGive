import { useCallback, useEffect, useState } from 'react'
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

export default function DonorDrivesPage() {
  const [drives, setDrives] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [category, setCategory] =
    useState('All Categories')
  const [location, setLocation] = useState('')

  const loadDrives = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError('')

      try {
        const params = new URLSearchParams()

        const searchValue = search.trim()
        const locationValue = location.trim()

        if (searchValue) {
          params.set('q', searchValue)
        }

        if (
          category &&
          category !== 'All Categories'
        ) {
          params.set('category', category)
        }

        if (locationValue) {
          params.set('location', locationValue)
        }

        const query = params.toString()

        const data = await apiRequest(
          query ? `/drives?${query}` : '/drives',
        )

        setDrives(data.drives || [])
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
    [search, category, location],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadDrives()
    }, 250)

    return () => {
      window.clearTimeout(timer)
    }
  }, [loadDrives])

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1>Donation Drives</h1>

          <p>
            Find active community assistance drives
            that need donor support.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => loadDrives(true)}
          disabled={loading || refreshing}
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
            placeholder="Search donation drives..."
            aria-label="Search donation drives"
          />
        </div>

        <div className="filter-row">
          <div className="form-group">
            <label htmlFor="category">
              Category
            </label>

            <select
              id="category"
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
            <label htmlFor="location">
              Location
            </label>

            <input
              id="location"
              type="text"
              value={location}
              onChange={(event) =>
                setLocation(event.target.value)
              }
              placeholder="Search by location"
            />
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
      ) : drives.length === 0 ? (
        <div className="empty-state">
          <Package size={36} />

          <h2>No donation drives found</h2>

          <p>
            Try changing your search or filters, or
            check again later for active drives.
          </p>
        </div>
      ) : (
        <div className="drive-grid">
          {drives.map((drive) => {
            // The backend serializes the MongoDB ID
            // as "id". Keep _id as a fallback.
            const driveId =
              drive.id || drive._id

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

            return (
              <article
                className="drive-card"
                key={driveId}
              >
                <div className="drive-card-header">
                  <span className="category-badge">
                    {drive.category}
                  </span>

                  <span className="status-badge status-active">
                    active
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

                {driveId ? (
                  <Link
                    to={`/donor/drives/${driveId}`}
                    className="primary-button"
                  >
                    View Drive
                  </Link>
                ) : (
                  <span className="secondary-button">
                    Drive ID unavailable
                  </span>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}