import { useCallback, useEffect, useState } from 'react'
import {
  Check,
  Clock3,
  RefreshCw,
  UserRound,
  X,
} from 'lucide-react'
import VerificationSummary from '../../components/verification/VerificationSummary'
import { apiRequest } from '../../services/api'

export default function AdminVerificationPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actionId, setActionId] = useState('')
  const [rejectionReasons, setRejectionReasons] =
    useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadRequests = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError('')

      try {
        const data = await apiRequest(
          '/admin/partner-verifications?status=pending',
        )

        setRequests(data.verifications || [])
      } catch (requestError) {
        setError(
          requestError.message ||
            'Unable to load verification requests.',
        )
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [],
  )

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  const approve = async (requestId) => {
    setError('')
    setSuccess('')
    setActionId(requestId)

    try {
      const data = await apiRequest(
        `/admin/partner-verifications/${requestId}/approve`,
        {
          method: 'PATCH',
        },
      )

      setRequests((current) =>
        current.filter(
          (request) => request.id !== requestId,
        ),
      )

      setRejectionReasons((current) => {
        const updated = { ...current }
        delete updated[requestId]
        return updated
      })

      setSuccess(
        data.message ||
          'Partner verification approved successfully.',
      )
    } catch (requestError) {
      setError(
        requestError.message ||
          'Unable to approve the verification request.',
      )
    } finally {
      setActionId('')
    }
  }

  const reject = async (requestId) => {
    const rejectionReason =
      rejectionReasons[requestId]?.trim() || ''

    if (rejectionReason.length < 5) {
      setError(
        'Add a rejection reason of at least 5 characters before rejecting a request.',
      )
      return
    }

    setError('')
    setSuccess('')
    setActionId(requestId)

    try {
      const data = await apiRequest(
        `/admin/partner-verifications/${requestId}/reject`,
        {
          method: 'PATCH',
          body: {
            rejectionReason,
          },
        },
      )

      setRequests((current) =>
        current.filter(
          (request) => request.id !== requestId,
        ),
      )

      setRejectionReasons((current) => {
        const updated = { ...current }
        delete updated[requestId]
        return updated
      })

      setSuccess(
        data.message ||
          'Partner verification rejected.',
      )
    } catch (requestError) {
      setError(
        requestError.message ||
          'Unable to reject the verification request.',
      )
    } finally {
      setActionId('')
    }
  }

  const updateReason = (requestId, value) => {
    setRejectionReasons((current) => ({
      ...current,
      [requestId]: value,
    }))
  }

  return (
    <section className="dashboard-page admin-verification-page">
      <div className="page-heading admin-page-heading">
        <div>
          <p className="eyebrow">
            Admin workspace
          </p>

          <h1>Partner verification</h1>

          <p className="muted">
            Review organizations waiting to
            join the ClearGive partner network.
          </p>
        </div>

        <button
          className="secondary-button"
          type="button"
          onClick={() => loadRequests(true)}
          disabled={loading || refreshing}
        >
          <RefreshCw
            size={16}
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
          className="form-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          className="success-message"
          role="status"
        >
          <Check size={18} />
          {success}
        </div>
      )}

      {loading && (
        <div className="empty-state">
          <Clock3 size={26} />
          <strong>
            Loading verification requests...
          </strong>
        </div>
      )}

      {!loading &&
        requests.length === 0 && (
          <div className="empty-state">
            <Check size={26} />

            <strong>
              No pending verification
              requests
            </strong>

            <span>
              New partner submissions will
              appear here when they are ready
              for review.
            </span>
          </div>
        )}

      {!loading &&
        requests.length > 0 && (
          <div className="verification-request-list">
            {requests.map((request) => (
              <article
                className="verification-request-card"
                key={request.id}
              >
                <div className="request-heading">
                  <div>
                    <p className="eyebrow">
                      Pending review
                    </p>

                    <h2>
                      {request.organizationName}
                    </h2>

                    <p className="request-user">
                      <UserRound size={15} />

                      {request.user?.fullName ||
                        'Partner user'}

                      {' · '}

                      {request.user?.email ||
                        'No email available'}
                    </p>
                  </div>

                  <span className="status-pill status-pill-pending">
                    <Clock3 size={14} />
                    Pending
                  </span>
                </div>

                <VerificationSummary
                  verification={request}
                />

                <div className="review-actions">
                  <label
                    htmlFor={`rejection-${request.id}`}
                  >
                    Rejection reason{' '}
                    <span>
                      (required only to reject)
                    </span>
                  </label>

                  <textarea
                    id={`rejection-${request.id}`}
                    rows="2"
                    maxLength="500"
                    value={
                      rejectionReasons[
                        request.id
                      ] || ''
                    }
                    onChange={(event) =>
                      updateReason(
                        request.id,
                        event.target.value,
                      )
                    }
                    placeholder="Explain what should be corrected..."
                    disabled={
                      actionId === request.id
                    }
                  />

                  <div className="review-buttons">
                    <button
                      className="secondary-button reject-button"
                      type="button"
                      onClick={() =>
                        reject(request.id)
                      }
                      disabled={
                        actionId === request.id
                      }
                    >
                      <X size={17} />

                      {actionId === request.id
                        ? 'Saving...'
                        : 'Reject'}
                    </button>

                    <button
                      className="primary-button approve-button"
                      type="button"
                      onClick={() =>
                        approve(request.id)
                      }
                      disabled={
                        actionId === request.id
                      }
                    >
                      <Check size={17} />

                      {actionId === request.id
                        ? 'Saving...'
                        : 'Approve'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
    </section>
  )
}