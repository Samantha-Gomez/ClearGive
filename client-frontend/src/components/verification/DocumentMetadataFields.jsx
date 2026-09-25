const documentDefinitions = [
  ['registrationCertificate', 'Registration certificate'],
  ['supportingOrganizationDocument', 'Supporting organization document'],
  ['representativeGovernmentId', 'Representative government ID'],
]

import { documentFormats, getDocumentMimeType } from './documentMetadata'

export default function DocumentMetadataFields({ documents, onChange }) {
  return (
    <fieldset className="verification-section">
      <legend>Required document metadata</legend>
      <p className="section-help">Add information about each document. Files are not uploaded or stored at this stage.</p>
      <div className="document-grid">
        {documentDefinitions.map(([field, label]) => (
          <div className="document-card" key={field}>
            <div className="document-card-heading">
              <strong>{label}</strong>
              <span className="metadata-badge">Metadata only</span>
            </div>
            <label htmlFor={`${field}-name`}>Original filename</label>
            <input
              id={`${field}-name`}
              value={documents[field].originalName}
              onChange={(event) => onChange(field, 'originalName', event.target.value)}
              placeholder={`example${documents[field].extension}`}
              required
            />
            <div className="form-grid document-fields">
              <div>
                <label htmlFor={`${field}-extension`}>Extension</label>
                <select
                  id={`${field}-extension`}
                  value={documents[field].extension}
                  onChange={(event) => onChange(field, 'extension', event.target.value)}
                >
                  {Object.keys(documentFormats).map((extension) => <option key={extension}>{extension}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor={`${field}-size`}>Size in bytes</label>
                <input
                  id={`${field}-size`}
                  type="number"
                  min="1"
                  max="10485760"
                  value={documents[field].size}
                  onChange={(event) => onChange(field, 'size', event.target.value)}
                  required
                />
              </div>
            </div>
            <small className="document-note">MIME type will be sent as {getDocumentMimeType(documents[field].extension)}. Storage status: not_uploaded.</small>
          </div>
        ))}
      </div>
    </fieldset>
  )
}