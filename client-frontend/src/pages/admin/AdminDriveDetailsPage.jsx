import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  LoaderCircle,
  MapPin,
  Package,
  RefreshCw,
  Users,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { apiRequest } from '../../services/api'

export default function AdminDriveDetailsPage() {
  const { id } = useParams()

  const [drive, setDrive] = useState(null)
  const [donations, setDonations] = useState([])
  const [distributions, setDistributions] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const fetchDriveData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError('')

      try {
        const [
          driveData,
          donationData,
          distributionData,
        ] = await Promise.all([
          apiRequest(`/admin/drives/${id}`),
          apiRequest('/donations/admin'),
          apiRequest('/distributions/admin'),
        ])

        const currentDrive =
          driveData.drive || driveData

        const allDonations =
          donationData.donations ||
          donationData ||
          []

        const allDistributions =
          distributionData.distributions ||
          distributionData ||
          []

        setDrive(currentDrive)

        setDonations(
          allDonations.filter(
            (donation) =>
              donation.driveId?._id === id ||
              donation.driveId === id,
          ),
        )

        setDistributions(
          allDistributions.filter(
            (distribution) =>
              distribution.driveId?._id === id ||
              distribution.driveId === id,
          ),
        )
      } catch (err) {
        setError(
          err.message ||
            'Unable to load drive details.',
        )
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [id],
  )

  useEffect(() => {
    fetchDriveData()
  }, [fetchDriveData])

  const totals = useMemo(() => {
    const donated = donations.reduce(
      (sum, donation) =>
        sum +
        Number(
          donation.quantity || 0,
        ),
      0,
    )

    const received = donations
      .filter(
        (donation) =>
          donation.status === 'Received' ||
          donation.status === 'Distributed',
      )
      .reduce(
        (sum, donation) =>
          sum +
          Number(
            donation.quantity || 0,
          ),
        0,
      )

    const distributed =
      distributions.reduce(
        (sum, distribution) =>
          sum +
          Number(
            distribution.quantityDistributed ||
              0,
          ),
        0,
      )

    const beneficiaries =
      distributions.reduce(
        (sum, distribution) =>
          sum +
          Number(
            distribution.beneficiariesAssisted ||
              0,
          ),
        0,
      )

    return {
      donated,
      received,
      distributed,
      beneficiaries,
    }
  }, [donations, distributions])

  if (loading) {
    return (
      <div className="page-state">
        <LoaderCircle
          size={22}
          className="spin"
        />

        Loading drive details...
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-shell">
        <Link
          to="/admin/drives"
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

        <button
          type="button"
          className="secondary-button"
          onClick={() => fetchDriveData(true)}
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
            : 'Try Again'}
        </button>
      </div>
    )
  }

  if (!drive) {
    return (
      <div className="page-shell">
        <Link
          to="/admin/drives"
          className="back-link"
        >
          <ArrowLeft size={17} />
          Back to Donation Drives
        </Link>

        <div className="empty-state">
          <Package size={36} />

          <h2>Drive not found</h2>

          <p>
            The requested donation drive
            could not be found.
          </p>
        </div>
      </div>
    )
  }

  const targetQuantity =
    Number(drive.targetQuantity || 0)

  const progress =
    targetQuantity > 0
      ? Math.min(
          (totals.received /
            targetQuantity) *
            100,
          100,
        )
      : 0

  const partnerName =
    drive.partnerId?.organizationName ||
    drive.partnerId?.fullName ||
    drive.partnerId?.name ||
    'Partner organization'

  return (
    <div className="page-shell">
      <Link
        to="/admin/drives"
        className="back-link"
      >
        <ArrowLeft size={17} />
        Back to Donation Drives
      </Link>

      <div className="page-header">
        <div>
          <p className="eyebrow">
            Admin monitoring
          </p>

          <h1>{drive.title}</h1>

          <p>{drive.description}</p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            fetchDriveData(true)
          }
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

      <section className="detail-card">
        <div className="detail-card-header">
          <div>
            <span className="category-badge">
              {drive.category}
            </span>

            <h2>
              Drive Information
            </h2>
          </div>

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

        <div className="detail-grid">
          <div>
            <span className="detail-label">
              Partner
            </span>

            <strong>
              {partnerName}
            </strong>
          </div>

          <div>
            <span className="detail-label">
              Location
            </span>

            <strong className="detail-inline">
              <MapPin size={16} />
              {drive.location}
            </strong>
          </div>

          <div>
            <span className="detail-label">
              Target Quantity
            </span>

            <strong>
              {targetQuantity} items
            </strong>
          </div>

          <div>
            <span className="detail-label">
              Assistance Reference
            </span>

            <strong>
              {drive.assistanceReference ||
                'Not provided'}
            </strong>
          </div>
        </div>

        <div className="drive-progress">
          <div className="drive-progress-label">
            <span>
              Received donation progress
            </span>

            <strong>
              {totals.received} /{' '}
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
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <Package size={21} />

          <span>
            Total Donations
          </span>

          <strong>
            {donations.length}
          </strong>
        </div>

        <div className="stat-card">
          <Package size={21} />

          <span>
            Items Received
          </span>

          <strong>
            {totals.received}
          </strong>
        </div>

        <div className="stat-card">
          <Package size={21} />

          <span>
            Items Distributed
          </span>

          <strong>
            {totals.distributed}
          </strong>
        </div>

        <div className="stat-card">
          <Users size={21} />

          <span>
            Beneficiaries Assisted
          </span>

          <strong>
            {totals.beneficiaries}
          </strong>
        </div>
      </section>

      <section className="detail-card">
        <div className="section-heading">
          <div>
            <h2>Donations</h2>

            <p>
              Donation records associated
              with this drive.
            </p>
          </div>
        </div>

        {donations.length === 0 ? (
          <div className="empty-state compact">
            <Package size={28} />

            <p>
              No donations recorded yet.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Donor</th>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {donations.map(
                  (donation) => (
                    <tr
                      key={
                        donation._id
                      }
                    >
                      <td>
                        {donation.donorId
                          ?.fullName ||
                          donation.donorId
                            ?.name ||
                          'Donor'}
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
                              'unknown',
                          ).toLowerCase()}`}
                        >
                          {donation.status ||
                            'Unknown'}
                        </span>
                      </td>

                      <td>
                        {donation.createdAt
                          ? new Date(
                              donation.createdAt,
                            ).toLocaleDateString()
                          : '—'}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="detail-card">
        <div className="section-heading">
          <div>
            <h2>Distributions</h2>

            <p>
              Records of items distributed
              to beneficiaries.
            </p>
          </div>
        </div>

        {distributions.length === 0 ? (
          <div className="empty-state compact">
            <Users size={28} />

            <p>
              No distributions recorded
              yet.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Donation</th>
                  <th>
                    Quantity Distributed
                  </th>
                  <th>
                    Beneficiaries
                  </th>
                  <th>Notes</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {distributions.map(
                  (distribution) => (
                    <tr
                      key={
                        distribution._id
                      }
                    >
                      <td>
                        {distribution
                          .donationId
                          ?.item ||
                          'Donation'}
                      </td>

                      <td>
                        {
                          distribution.quantityDistributed
                        }
                      </td>

                      <td>
                        {
                          distribution.beneficiariesAssisted
                        }
                      </td>

                      <td>
                        {distribution.notes ||
                          '—'}
                      </td>

                      <td>
                        {distribution.createdAt
                          ? new Date(
                              distribution.createdAt,
                            ).toLocaleDateString()
                          : '—'}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}