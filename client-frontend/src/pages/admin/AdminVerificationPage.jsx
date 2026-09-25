import { useEffect, useState } from 'react'
import { Check, Clock3, RefreshCw, UserRound, X } from 'lucide-react'
import VerificationSummary from '../../components/verification/VerificationSummary'
import { apiRequest } from '../../services/api'

export default function AdminVerificationPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actionId, setActionId] = useState('')
  const [rejectionReasons, setRejectionReasons] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadRequests(showRefresh = false) {
    setError('')
    if (showRefresh) setRefreshing(true)
    try {
      const data = await apiRequest('/admin/partner-verifications?status=pending')
      setRequests(data.verifications)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    let active = true

    async function loadInitialRequests() {
      try {
        const data = await apiRequest('/admin/partner-verifications?status=pending')
        if (active) setRequests(data.verifications)
      } catch (requestError) {
        if (active) setError(requestError.message)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadInitialRequests()
    return () => {
      active = false
    }
  }, [])

  async function approve(requestId) {
    setError('')
    setSuccess('')
    setActionId(requestId)
    try {
      const data = await apiRequest(`/admin/partner-verifications/${requestId}/approve`, { method: 'PATCH' })
      setRequests((current) => current.filter((request) => request.id !== requestId))
      setSuccess(data.message)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setActionId('')
    }
  }

  async function reject(requestId) {
    const rejectionReason = rejectionReasons[requestId]?.trim() || ''
    if (rejectionReason.length < 5) {
      setError('Add a rejection reason of at least 5 characters before rejecting a request.')
      return
    }
    setError('')
    setSuccess('')
    setActionId(requestId)
    try {
      const data = await apiRequest(`/admin/partner-verifications/${requestId}/reject`, { method: 'PATCH', body: { rejectionReason } })
      setRequests((current) => current.filter((request) => request.id !== requestId))
      setSuccess(data.message)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setActionId('')
    }
  }

  function updateReason(requestId, value) {
    setRejectionReasons({ ...rejectionReasons, [requestId]: value })
  }

  return (
    <section className="dashboard-page admin-verification-page">
      <div className="page-heading admin-page-heading">
        <div>
          <p className="eyebrow">Admin workspace</p>
          <h1>Partner verification</h1>
          <p className="muted">Review organizations waiting to join the ClearGive partner network.</p>
        </div>
        <button className="secondary-button" type="button" onClick={() => loadRequests(true)} disabled={loading || refreshing}><RefreshCw size={16} /> {refreshing ? 'Refreshing...' : 'Refresh'}</button>
      </div>
      {error && <div className="form-error" role="alert">{error}</div>}
      {success && <div className="success-message" role="status"><Check size={18} /> {success}</div>}
      {loading && <div className="empty-state"><Clock3 size={26} /><strong>Loading verification requests...</strong></div>}
      {!loading && requests.length === 0 && <div className="empty-state"><Check size={26} /><strong>No pending verification requests</strong><span>New partner submissions will appear here when they are ready for review.</span></div>}
      <div className="verification-request-list">
        {requests.map((request) => (
          <article className="verification-request-card" key={request.id}>
            <div className="request-heading">
              <div>
                <p className="eyebrow">Pending review</p>
                <h2>{request.organizationName}</h2>
                <p className="request-user"><UserRound size={15} /> {request.user?.fullName} · {request.user?.email}</p>
              </div>
              <span className="status-pill status-pill-pending"><Clock3 size={14} /> Pending</span>
            </div>
            <VerificationSummary verification={request} />
            <div className="review-actions">
              <label htmlFor={`rejection-${request.id}`}>Rejection reason <span>(required only to reject)</span></label>
              <textarea id={`rejection-${request.id}`} rows="2" maxLength="500" value={rejectionReasons[request.id] || ''} onChange={(event) => updateReason(request.id, event.target.value)} placeholder="Explain what should be corrected..." />
              <div className="review-buttons">
                <button className="secondary-button reject-button" type="button" onClick={() => reject(request.id)} disabled={actionId === request.id}><X size={17} /> Reject</button>
                <button className="primary-button approve-button" type="button" onClick={() => approve(request.id)} disabled={actionId === request.id}><Check size={17} /> {actionId === request.id ? 'Saving...' : 'Approve'}</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}