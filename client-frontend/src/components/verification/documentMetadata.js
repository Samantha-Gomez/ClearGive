export const documentFormats = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
}

export const maxDocumentSize = 10 * 1024 * 1024

export function validateDocumentFile(file) {
  if (!file) {
    return 'Choose a document file.'
  }

  if (file.size < 1 || file.size > maxDocumentSize) {
    return 'Each document must be between 1 byte and 10 MB.'
  }

  const extension = file.name
    .slice(file.name.lastIndexOf('.'))
    .toLowerCase()
  const expectedMimeType = documentFormats[extension]

  if (!expectedMimeType) {
    return 'Choose a PDF, JPG/JPEG, or PNG document.'
  }

  if (file.type && file.type !== expectedMimeType) {
    return 'The selected file type does not match its extension.'
  }

  return null
}