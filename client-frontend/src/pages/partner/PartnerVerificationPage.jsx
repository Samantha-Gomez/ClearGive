import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Clock3, FileCheck2, Send, ShieldCheck } from 'lucide-react'
import { apiRequest, ApiError } from '../../services/api'
import DocumentMetadataFields from '../../components/verification/DocumentMetadataFields'
import { getDocumentMimeType } from '../../components/verification/documentMetadata'
import VerificationSummary from '../../components/verification/VerificationSummary'

const emptyDocument = { originalName: '', extension: '.pdf', size: '' }
const initialForm = {
  organizationName: '', organizationType: 'NGO/non-profit', address: '', officialEmail: '', contactNumber: '',
  authorizedRepresentativeName: '', representativePosition: '',
  registrationCertificate: { ...emptyDocument },
  supportingOrganizationDocument: { ...emptyDocument },
  representativeGovernmentId: { ...emptyDocument },
}

function formFromVerification(verification) {
  return {
    organizationName: verification.organizationName || '',
    organizationType: verification.organizationType || 'NGO/non-profit',
    address: verification.address || '',
    officialEmail: verification.officialEmail || '',
    contactNumber: verification.contactNumber || '',
    authorizedRepresentativeName: verification.authorizedRepresentativeName || '',
    representativePosition: verification.representativePosition || '',
    registrationCertificate: { ...emptyDocument, ...verification.registrationCertificate, size: verification.registrationCertificate?.size || '' },
    supportingOrganizationDocument: { ...emptyDocument, ...verification.supportingOrganizationDocument, size: verification.supportingOrganizationDocument?.size || '' },
    representativeGovernmentId: { ...emptyDocument, ...verification.representativeGovernmentId, size: verification.representativeGovernmentId?.size || '' },
  }
}

function toPayload(form) {
  const fields = ['registrationCertificate', 'supportingOrganizationDocument', 'representativeGovernmentId']
  const payload = { ...form }
  fields.forEach((field) => {
    payload[field] = {
      originalName: form[field].originalName,
      extension: form[field].extension,
      mimeType: getDocumentMimeType(form[field].extension),
      size: Number(form[field].size),
      storageStatus: 'not_uploaded',
    }
  })
  return payload
}

function StatusHeader({ status }) {
  const content = {
    not_submitted: { icon: FileCheck2, label: 'Not submitted', title: 'Verify your organization', text: 'Share your organization details so ClearGive can review your partner account.' },
    pending: { icon: Clock3, label: 'Pending', title: 'Verification pending', text: 'Your submission is waiting for an administrator to review it.' },
    approved: { icon: ShieldCheck, label: 'Approved', title: 'Organization verified', text: 'Your organization is approved to use partner features that require verification.' },
    rejected: { icon: AlertCircle, label: 'Rejected', title: 'Verification needs changes', text: 'Your submission was rejected. Review the reason below and submit the corrected details.' },
  }[status]
  const Icon = content.icon
  return <div className={`verification-status status-${status}`}><span className="status-icon"><Icon size={24} /></span><div><p className="eyebrow">Partner verification</p><span className={`status-pill status-pill-${status}`}>{content.label}</span><h1>{content.title}</h1><p className="muted">{content.text}</p></div></div>
}

export default function PartnerVerificationPage() {
  const [verification, setVerification] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState('not_submitted')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function loadVerification() {
      try {
        const data = await apiRequest('/partner-verification/me')
        setVerification(data.verification)
        setStatus(data.verification.status)
        setForm(formFromVerification(data.verification))
      } catch (requestError) {
        if (!(requestError instanceof ApiError && requestError.status === 404)) setError(requestError.message)
      } finally {
        setLoading(false)
      }
    }
    loadVerification()
  }, [])

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  function updateDocument(field, property, value) {
    setForm({ ...form, [field]: { ...form[field], [property]: value } })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)
    try {
      const data = await apiRequest(status === 'rejected' ? '/partner-verification/me' : '/partner-verification', { method: status === 'rejected' ? 'PATCH' : 'POST', body: toPayload(form) })
      setVerification(data.verification)
      setStatus(data.verification.status)
      setForm(formFromVerification(data.verification))
      setSuccess(data.message)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="page-state">Loading verification details...</div>

  return (
    <section className="dashboard-page verification-page">
      <StatusHeader status={status} />
      {error && <div className="form-error" role="alert">{error}</div>}
      {success && <div className="success-message" role="status"><CheckCircle2 size={18} /> {success}</div>}
      {verification && <VerificationSummary verification={verification} />}
      {status === 'rejected' && verification?.rejectionReason && <div className="rejection-panel"><strong>Admin feedback</strong><p>{verification.rejectionReason}</p></div>}
      {(status === 'not_submitted' || status === 'rejected') && <form className="verification-form" onSubmit={handleSubmit}>
        <fieldset className="verification-section">
          <legend>Organization information</legend>
          <div className="verification-form-grid">
            <div><label htmlFor="organizationName">Organization name</label><input id="organizationName" name="organizationName" value={form.organizationName} onChange={updateField} minLength="2" maxLength="150" required /></div>
            <div><label htmlFor="organizationType">Organization type</label><select id="organizationType" name="organizationType" value={form.organizationType} onChange={updateField}><option>NGO/non-profit</option><option>school</option><option>barangay/community organization</option><option>other</option></select></div>
            <div className="full-width"><label htmlFor="address">Organization address</label><textarea id="address" name="address" value={form.address} onChange={updateField} minLength="5" maxLength="300" rows="3" required /></div>
            <div><label htmlFor="officialEmail">Official email</label><input id="officialEmail" name="officialEmail" type="email" value={form.officialEmail} onChange={updateField} required /></div>
            <div><label htmlFor="contactNumber">Contact number</label><input id="contactNumber" name="contactNumber" type="tel" value={form.contactNumber} onChange={updateField} required /></div>
            <div><label htmlFor="authorizedRepresentativeName">Authorized representative</label><input id="authorizedRepresentativeName" name="authorizedRepresentativeName" value={form.authorizedRepresentativeName} onChange={updateField} required /></div>
            <div><label htmlFor="representativePosition">Representative position</label><input id="representativePosition" name="representativePosition" value={form.representativePosition} onChange={updateField} required /></div>
          </div>
        </fieldset>
        <DocumentMetadataFields documents={form} onChange={updateDocument} />
        <button className="primary-button verification-submit" type="submit" disabled={submitting}><Send size={18} /> {submitting ? 'Submitting...' : status === 'rejected' ? 'Resubmit for review' : 'Submit for review'}</button>
      </form>}
    </section>
  )
}