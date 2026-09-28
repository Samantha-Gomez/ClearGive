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

  const [donorSearch, setDonorSearch] = useState('')
  const [donors, setDonors] = useState([])
  const [selectedDonor, setSelectedDonor] = useState(null)
  const [searchingDonors, setSearchingDonors] = useState(false)

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
        const [driveData, donationData] =
          await Promise.all([
            apiRequest(
              `/partner/drives/${id}`,
            ),
            apiRequest(
              `/partner/drives/${id}/donations`,
            ),
          ])

        setDrive(
          driveData.drive || driveData,
        )

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

  const handleSearchDonors = async (
    event,
  ) => {
    const value = event.target.value

    setDonorSearch(value)
    setSelectedDonor(null)
    setDonors([])

    const searchValue = value.trim()

    if (searchValue.length < 2) {
      return
    }

    setSearchingDonors(true)
    setError('')

    try {
      const data = await apiRequest(
        `/partner/drives/donors/search?q=${encodeURIComponent(
          searchValue,
        )}`,
      )

      setDonors(data.donors || [])
    } catch (err) {
      setError(
        err.message ||
          'Unable to search registered donors.',
      )
    } finally {
      setSearchingDonors(false)
    }
  }

  const handleSelectDonor = (donor) => {
    setSelectedDonor(donor)
    setDonorSearch(donor.fullName)
    setDonors([])
  }

  const handleRecordDonation = async (
    event,
  ) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    if (!selectedDonor) {
      setError(
        'Please search for and select a registered donor.',
      )
      return
    }

    if (!item.trim()) {
      setError('Please enter the donated item.')
      return
    }

    if (
      !quantity ||
      Number(quantity) < 1 ||
      !Number.isInteger(Number(quantity))
    ) {
      setError(
        'Please enter a valid whole-number quantity.',
      )
      return
    }

    setRecording(true)

    try {
      const data = await apiRequest(
        `/partner/drives/${id}/donations`,
        {
          method: 'POST',
          body: {
            donorId: selectedDonor.id,
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

      setDonorSearch('')
      setDonors([])
      setSelectedDonor(null)
      setItem('')
      setQuantity('')

      setSuccess(
        'Donation recorded and received successfully.',
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
          {/* REGISTERED DONOR */}
          <div className="form-group">
            <label htmlFor="donorSearch">
              Registered Donor
              <span className="required-label">
                {' '}
                *
              </span>
            </label>

            <input
              id="donorSearch"
              type="text"
              value={donorSearch}
              onChange={handleSearchDonors}
              placeholder="Search donor by registered name"
              autoComplete="off"
              maxLength={150}
              required
            />

            {searchingDonors && (
              <div className="form-help">
                <LoaderCircle
                  size={15}
                  className="spin"
                />
                Searching registered donors...
              </div>
            )}

            {!searchingDonors &&
              donorSearch.trim().length >= 2 &&
              !selectedDonor &&
              donors.length === 0 && (
                <div className="form-help">
                  No registered donor found.
                </div>
              )}

            {donors.length > 0 && (
              <div className="donor-search-results">
                {donors.map((donor) => (
                  <button
                    key={donor.id}
                    type="button"
                    className="donor-search-result"
                    onClick={() =>
                      handleSelectDonor(
                        donor,
                      )
                    }
                  >
                    <strong>
                      {donor.fullName}
                    </strong>

                    {donor.email && (
                      <span>
                        {donor.email}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {selectedDonor && (
              <div className="selected-donor">
                <CheckCircle size={16} />

                <span>
                  Selected donor:{' '}
                  <strong>
                    {selectedDonor.fullName}
                  </strong>
                </span>
              </div>
            )}
          </div>

          {/* ITEM */}
          <div className="form-group">
            <label htmlFor="item">
              Item
              <span className="required-label">
                {' '}
                *
              </span>
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

          {/* QUANTITY */}
          <div className="form-group">
            <label htmlFor="quantity">
              Quantity
              <span className="required-label">
                {' '}
                *
              </span>
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

      {/* DONATION RECORDS */}
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
                  <th>Registered Donor</th>
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
                    'Registered Donor'

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