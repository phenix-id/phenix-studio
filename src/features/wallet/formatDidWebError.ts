/**
 * Maps raw backend error messages from the did:web create endpoint to
 * user-friendly strings.
 *
 * Defined once here so all four call-sites in CreateDid.tsx and
 * DidListComponent.tsx stay in sync automatically if the backend wording
 * in ResponseMessages ever changes.
 */
export const formatDidWebError = (
  raw: string,
  fallback = 'Failed to create DID',
): string => {
  if (raw.toLowerCase().includes('not reachable')) {
    return 'DID document not found at the hosting URL. Make sure the file is publicly accessible, then try again.'
  }
  if (raw.toLowerCase().includes('does not match')) {
    return 'The hosted document does not match the generated one. Use the copy or download button to get the exact document and replace the file at your domain.'
  }
  return raw || fallback
}
