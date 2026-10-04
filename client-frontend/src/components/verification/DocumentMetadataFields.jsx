import { useRef, useState } from 'react'
import { X } from 'lucide-react'
import { maxDocumentSize, validateDocumentFile } from './documentMetadata'

const documentDefinitions = [
  ['registrationCertificate', 'Registration certificate'],
  ['supportingOrganizationDocument', 'Supporting organization document'],
  ['representativeGovernmentId', 'Representative government ID'],
]

function DocumentFileField({
  field,
  label,
  file,
  existingDocument,
  required,
  onChange,
}) {
  const inputRef = useRef(null)
  const [error, setError] = useState('')
  const isRequired = required || !existingDocument?.downloadAvailable

  const handleChange = (event) => {
    const selectedFile = event.target.files?.[0] || null
    const validationError = validateDocumentFile(selectedFile)

    if (validationError) {
      event.target.value = ''
      setError(validationError)
      onChange(field, null)
      return
    }

    setError('')
    onChange(field, selectedFile)
  }

  const clearSelection = () => {
    if (inputRef.current) inputRef.current.value = ''
    setError('')
    onChange(field, null)
  }

  return (
    <div className="document-card">
      <div className="document-card-heading">
        <strong>{label}</strong>
        <span className="metadata-badge">
          PDF, JPG, PNG · Max {maxDocumentSize / 1024 / 1024} MB
        </span>
      </div>

      <label htmlFor={`${field}-file`}>
        {isRequired ? 'Choose file (required)' : 'Choose replacement file (optional)'}
      </label>
      <input
        ref={inputRef}
        id={`${field}-file`}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        onChange={handleChange}
        required={isRequired}
      />

      {file ? (
        <div className="selected-document" role="status">
          <span>
            Selected: <strong>{file.name}</strong> ({file.size.toLocaleString()} bytes)
          </span>
          <button
            className="secondary-button"
            type="button"
            onClick={clearSelection}
            aria-label={`Remove selected ${label.toLowerCase()}`}
          >
            <X size={16} />
            Remove
          </button>
        </div>
      ) : existingDocument?.originalName ? (
        <p className="document-note">
          Current file: <strong>{existingDocument.originalName}</strong>
          {existingDocument.downloadAvailable ? ' · Uploaded' : ' · File must be uploaded again'}
        </p>
      ) : null}

      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  )
}

export default function DocumentMetadataFields({
  documents,
  existingDocuments,
  required,
  onChange,
}) {
  return (
    <fieldset className="verification-section">
      <legend>Verification documents</legend>
      <p className="section-help">
        Select the original document from your device. Files are limited to 10 MB each.
      </p>
      <div className="document-grid">
        {documentDefinitions.map(([field, label]) => (
          <DocumentFileField
            key={field}
            field={field}
            label={label}
            file={documents[field]}
            existingDocument={existingDocuments?.[field]}
            required={required}
            onChange={onChange}
          />
        ))}
      </div>
    </fieldset>
  )
}