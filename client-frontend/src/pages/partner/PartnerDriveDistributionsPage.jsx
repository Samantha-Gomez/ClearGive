import { useCallback, useEffect, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle,
  FileText,
  LoaderCircle,
  Package,
  RefreshCw,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { apiRequest } from '../../services/api'

const emptyForm = {
  quantityDistributed: '',
  beneficiariesAssisted: '',
  notes: '',
  proofFileName: '',
  proofFileType: '',
  proofFileSize: '',
}

const getDonationId = (donation) => donation?.id || donation?._id

export default function PartnerDriveDistributionsPage() {
  const { id } = useParams()

  const [drive, setDrive] = useState(null)
  const [donations, setDonations] = useState([])
  const [distributions, setDistributions] = useState([])
  const [selectedDonation, setSelectedDonation] =
    useState(null)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState(emptyForm)

  const loadData = useCallback(
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
          apiRequest(
            `/partner/drives/${id}`,
          ),
          apiRequest(
            `/partner/drives/${id}/donations`,
          ),
          apiRequest(
            `/partner/drives/${id}/distributions`,
          ),
        ])

        const nextDrive =
          driveData.drive || driveData

        const nextDonations =
          donationData.donations ||
          donationData ||
          []

        const nextDistributions =
          distributionData.distributions ||
          distributionData ||
          []

        setDrive(nextDrive)
        setDonations(nextDonations)
        setDistributions(
          nextDistributions,
        )

        setSelectedDonation(
          (current) => {
            if (!current) return null

            return (
              nextDonations.find(
                (donation) =>
                  getDonationId(donation) ===
                  getDonationId(current),
              ) || null
            )
          },
        )
      } catch (err) {
        setError(
          err.message ||
            'Unable to load distribution information.',
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

  const getDistributedQuantity = (
    donationId,
  ) => {
    return distributions
      .filter((distribution) => {
        const distributionDonationId =
          distribution.donationId?._id ||
          distribution.donationId

        return (
          String(
            distributionDonationId,
          ) === String(donationId)
        )
      })
      .reduce(
        (total, distribution) =>
          total +
          Number(
            distribution.quantityDistributed ||
              0,
          ),
        0,
      )
  }

  const getRemainingQuantity = (
    donation,
  ) => {
    const distributed =
      getDistributedQuantity(
        getDonationId(donation),
      )

    return Math.max(
      Number(donation.quantity || 0) -
        distributed,
      0,
    )
  }

  const receivedDonations =
    donations.filter(
      (donation) =>
        donation.status === 'Received' &&
        getRemainingQuantity(
          donation,
        ) > 0,
    )

  const handleSelectDonation = (
    donation,
  ) => {
    setSelectedDonation(donation)
    setError('')
    setSuccess('')
    setForm({ ...emptyForm })
  }

  const handleChange = (event) => {
    const { name, value } =
      event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))

    if (error) {
      setError('')
    }

    if (success) {
      setSuccess('')
    }
  }

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault()

    if (!selectedDonation) {
      return
    }

    setError('')
    setSuccess('')

    const remainingQuantity =
      getRemainingQuantity(
        selectedDonation,
      )

    const quantityDistributed =
      Number(
        form.quantityDistributed,
      )

    const beneficiariesAssisted =
      Number(
        form.beneficiariesAssisted,
      )

    if (
      !Number.isInteger(
        quantityDistributed,
      ) ||
      quantityDistributed < 1
    ) {
      setError(
        'Quantity distributed must be a positive whole number.',
      )
      return
    }

    if (
      quantityDistributed >
      remainingQuantity
    ) {
      setError(
        `Quantity distributed cannot exceed the remaining quantity of ${remainingQuantity}.`,
      )
      return
    }

    if (
      !Number.isInteger(
        beneficiariesAssisted,
      ) ||
      beneficiariesAssisted < 1
    ) {
      setError(
        'Beneficiaries assisted must be a positive whole number.',
      )
      return
    }

    if (
      form.notes.trim().length > 1000
    ) {
      setError(
        'Notes must be 1000 characters or fewer.',
      )
      return
    }

    const proofFileName =
      form.proofFileName.trim()

    const proofFileType =
      form.proofFileType.trim()

    const proofFileSize =
      form.proofFileSize
        ? Number(form.proofFileSize)
        : undefined

    if (
      proofFileName &&
      (proofFileName.length > 255 ||
        proofFileName.includes('/') ||
        proofFileName.includes('\\'))
    ) {
      setError(
        'Proof file name must be a safe file name no longer than 255 characters.',
      )
      return
    }

    if (
      proofFileType &&
      proofFileType.length > 100
    ) {
      setError(
        'Proof MIME type must be 100 characters or fewer.',
      )
      return
    }

    if (
      proofFileSize !== undefined &&
      (!Number.isInteger(
        proofFileSize,
      ) ||
        proofFileSize < 1 ||
        proofFileSize >
          10 * 1024 * 1024)
    ) {
      setError(
        'Proof file size must be between 1 byte and 10MB.',
      )
      return
    }

    setSubmitting(true)

    try {
      const proofMetadata =
        proofFileName ||
        proofFileType ||
        proofFileSize !==
          undefined
          ? {
              originalName:
                proofFileName ||
                undefined,
              mimeType:
                proofFileType ||
                undefined,
              size:
                proofFileSize,
              storageStatus:
                'not_uploaded',
            }
          : undefined

      const data =
        await apiRequest(
          `/partner/drives/${id}/distributions`,
          {
            method: 'POST',
            body: {
              donationId:
                getDonationId(selectedDonation),
              quantityDistributed,
              beneficiariesAssisted,
              notes:
                form.notes.trim() ||
                undefined,
              proofMetadata,
            },
          },
        )

      const newDistribution =
        data.distribution || data

      setDistributions(
        (current) => [
          newDistribution,
          ...current,
        ],
      )

      const newDonationStatus =
        data.donationStatus

      if (newDonationStatus) {
        setDonations(
          (current) =>
            current.map(
              (donation) =>
                getDonationId(donation) ===
                getDonationId(selectedDonation)
                  ? {
                      ...donation,
                      status:
                        newDonationStatus,
                    }
                  : donation,
            ),
        )
      }

      setSuccess(
        'Distribution recorded successfully.',
      )

      setSelectedDonation(null)
      setForm({ ...emptyForm })
    } catch (err) {
      setError(
        err.message ||
          'Unable to record this distribution.',
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
        Loading distributions...
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

          <h1>Distributions</h1>
          <p>{drive.title}</p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            loadData(true)
          }
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
            className={
              refreshing
                ? 'spin'
                : ''
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
              Available Donations
            </span>

            <h2>
              Ready for Distribution
            </h2>
          </div>

          <Package size={26} />
        </div>

        {receivedDonations.length ===
        0 ? (
          <div className="empty-state">
            <Package size={32} />

            <h3>
              No donations ready for
              distribution
            </h3>

            <p>
              Donations must be
              received before they can
              be distributed.
            </p>
          </div>
        ) : (
          <div className="distribution-donation-list">
            {receivedDonations.map(
              (donation) => {
                const remaining =
                  getRemainingQuantity(
                    donation,
                  )

                const isSelected =
                  getDonationId(selectedDonation) ===
                  getDonationId(donation)

                return (
                  <div
                    className={`distribution-donation-card ${
                      isSelected
                        ? 'selected'
                        : ''
                    }`}
                    key={
                      getDonationId(donation)
                    }
                  >
                    <div>
                      <span className="detail-label">
                        Item
                      </span>

                      <h3>
                        {donation.item}
                      </h3>

                      <p>
                        Received:{' '}
                        {donation.quantity}
                        &nbsp;•&nbsp;
                        Remaining:{' '}
                        {remaining}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="primary-button small-button"
                      onClick={() =>
                        handleSelectDonation(
                          donation,
                        )
                      }
                      disabled={
                        submitting
                      }
                    >
                      {isSelected
                        ? 'Selected'
                        : 'Distribute'}
                    </button>
                  </div>
                )
              },
            )}
          </div>
        )}
      </section>

      {selectedDonation && (
        <section className="detail-card">
          <div className="detail-card-header">
            <div>
              <span className="detail-label">
                Distribution Record
              </span>

              <h2>
                {selectedDonation.item}
              </h2>
            </div>
          </div>

          <form
            onSubmit={
              handleSubmit
            }
          >
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="quantityDistributed">
                  Quantity Distributed
                </label>

                <input
                  id="quantityDistributed"
                  name="quantityDistributed"
                  type="number"
                  min="1"
                  max={getRemainingQuantity(
                    selectedDonation,
                  )}
                  step="1"
                  value={
                    form.quantityDistributed
                  }
                  onChange={
                    handleChange
                  }
                  required
                  disabled={
                    submitting
                  }
                />

                <span className="field-hint">
                  Maximum remaining
                  quantity:{' '}
                  {getRemainingQuantity(
                    selectedDonation,
                  )}
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="beneficiariesAssisted">
                  Beneficiaries Assisted
                </label>

                <input
                  id="beneficiariesAssisted"
                  name="beneficiariesAssisted"
                  type="number"
                  min="1"
                  step="1"
                  value={
                    form.beneficiariesAssisted
                  }
                  onChange={
                    handleChange
                  }
                  required
                  disabled={
                    submitting
                  }
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notes">
                Notes
              </label>

              <textarea
                id="notes"
                name="notes"
                value={form.notes}
                onChange={
                  handleChange
                }
                rows={4}
                maxLength={1000}
                placeholder="Add any relevant distribution notes."
                disabled={
                  submitting
                }
              />

              <span className="field-hint">
                {form.notes.length}
                /1000 characters
              </span>
            </div>

            <div className="form-section">
              <h3>
                <FileText size={18} />
                Proof Metadata
              </h3>

              <p className="form-section-description">
                Record basic proof-file
                information. The current
                backend stores metadata
                only; the actual file
                upload is not implemented
                yet.
              </p>

              <div className="form-group">
                <label htmlFor="proofFileName">
                  File Name
                </label>

                <input
                  id="proofFileName"
                  name="proofFileName"
                  type="text"
                  value={
                    form.proofFileName
                  }
                  onChange={
                    handleChange
                  }
                  maxLength={255}
                  placeholder="Example: distribution-proof-001.jpg"
                  disabled={
                    submitting
                  }
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="proofFileType">
                    MIME Type
                  </label>

                  <input
                    id="proofFileType"
                    name="proofFileType"
                    type="text"
                    value={
                      form.proofFileType
                    }
                    onChange={
                      handleChange
                    }
                    maxLength={100}
                    placeholder="Example: image/jpeg"
                    disabled={
                      submitting
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="proofFileSize">
                    Size in Bytes
                  </label>

                  <input
                    id="proofFileSize"
                    name="proofFileSize"
                    type="number"
                    min="1"
                    max={
                      10 * 1024 * 1024
                    }
                    step="1"
                    value={
                      form.proofFileSize
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Example: 250000"
                    disabled={
                      submitting
                    }
                  />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setSelectedDonation(
                    null,
                  )
                  setForm({
                    ...emptyForm,
                  })
                }}
                disabled={
                  submitting
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={
                  submitting
                }
              >
                {submitting ? (
                  <>
                    <LoaderCircle
                      size={18}
                      className="spin"
                    />
                    Recording...
                  </>
                ) : (
                  'Record Distribution'
                )}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="detail-card">
        <div className="detail-card-header">
          <div>
            <span className="detail-label">
              Distribution History
            </span>

            <h2>
              {distributions.length}{' '}
              {distributions.length ===
              1
                ? 'record'
                : 'records'}
            </h2>
          </div>
        </div>

        {distributions.length ===
        0 ? (
          <div className="empty-state">
            <FileText size={32} />

            <h3>
              No distributions
              recorded
            </h3>

            <p>
              Completed distribution
              records for this drive
              will appear here.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>
                    Beneficiaries
                  </th>
                  <th>Notes</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {distributions.map(
                  (
                    distribution,
                  ) => {
                    const distributionDonationId =
                      distribution.donationId?._id ||
                      distribution.donationId?.id ||
                      distribution.donationId

                    const donation =
                      distributionDonationId
                        ? donations.find(
                            (item) =>
                              String(getDonationId(item)) ===
                              String(distributionDonationId),
                          )
                        : null

                    const dateValue =
                      distribution.createdAt ||
                      distribution.distributedAt

                    return (
                      <tr
                        key={
                          distribution.id ||
                          distribution._id
                        }
                      >
                        <td>
                          {donation?.item ||
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
                          {dateValue
                            ? new Date(
                                dateValue,
                              ).toLocaleDateString()
                            : '—'}
                        </td>
                      </tr>
                    )
                  },
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}