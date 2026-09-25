const documentLabels = {
  registrationCertificate: 'Registration certificate',
  supportingOrganizationDocument: 'Supporting organization document',
  representativeGovernmentId: 'Representative government ID',
}

function formatDate(value) {
  if (!value) return 'Not available'
  return new Date(value).toLocaleDateString()
}

export default function VerificationSummary({ verification, showDocuments = true }) {
  return (
    <div className="verification-summary">
      <div className="summary-fields">
        <div><span>Organization</span><strong>{verification.organizationName}</strong></div>
        <div><span>Organization type</span><strong>{verification.organizationType}</strong></div>
        <div><span>Address</span><strong>{verification.address}</strong></div>
        <div><span>Official email</span><strong>{verification.officialEmail}</strong></div>
        <div><span>Contact number</span><strong>{verification.contactNumber}</strong></div>
        <div><span>Authorized representative</span><strong>{verification.authorizedRepresentativeName}</strong></div>
        <div><span>Representative position</span><strong>{verification.representativePosition}</strong></div>
        <div><span>Submitted</span><strong>{formatDate(verification.submittedAt)}</strong></div>
      </div>
      {showDocuments && <div className="submitted-documents">
        <h3>Submitted document metadata</h3>
        {Object.entries(documentLabels).map(([field, label]) => {
          const document = verification[field]
          return <div className="submitted-document" key={field}>
            <span>{label}</span>
            <strong>{document?.originalName || 'Not available'}</strong>
            <small>{document ? `${document.mimeType} · ${document.size} bytes · ${document.storageStatus}` : 'Not available'}</small>
          </div>
        })}
      </div>}
    </div>
  )
}