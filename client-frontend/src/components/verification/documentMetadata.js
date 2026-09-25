export const documentFormats = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
}

export function getDocumentMimeType(extension) {
  return documentFormats[extension] || 'application/pdf'
}