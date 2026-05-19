export const passwordValueEncryption = async (
  value: string,
): Promise<string> => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    if (!baseUrl) {
      throw new Error('Missing NEXT_PUBLIC_BASE_URL')
    }

    const res = await fetch(`${baseUrl}/auth/encrypt`, {
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
