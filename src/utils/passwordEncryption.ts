/**
 * Encrypts a plain-text value via the local Next.js /api/encrypt route.
 *
 * NOTE: This calls the local server route (src/app/api/encrypt/route.ts) which
 * uses CRYPTO_PRIVATE_KEY from the server-side environment. This is a temporary
 * arrangement — once the backend deploys POST /auth/encrypt, switch the fetch
 * URL back to `${process.env.NEXT_PUBLIC_BASE_URL}/auth/encrypt` and delete
 * the local route file.
 */
export const passwordValueEncryption = async (
  value: string,
): Promise<string> => {
  try {
    const res = await fetch('/api/encrypt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    })
    const responseData = await res.json()
    if (!res.ok) {
      throw new Error(responseData?.message || 'Encryption failed')
    }

    const encrypted = responseData.data
    return encrypted
  } catch (error) {
    console.error('Failed to encrypt value:', error)
    throw error
  }
}
