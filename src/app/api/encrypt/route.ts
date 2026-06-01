import CryptoJS from 'crypto-js'
import { NextResponse } from 'next/server'
import { apiStatusCodes } from '@/config/CommonConstant'

/**
 * POST /api/encrypt
 *
 * Encrypts a plain-text value using AES with the server-side CRYPTO_PRIVATE_KEY.
 * This is a temporary Next.js server route that stands in until the backend
 * deploys its own POST /auth/encrypt endpoint.
 *
 * Once the backend endpoint is live, update passwordEncryption.ts to call
 * `${NEXT_PUBLIC_BASE_URL}/auth/encrypt` and delete this file.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { CRYPTO_PRIVATE_KEY } = process.env

    if (!CRYPTO_PRIVATE_KEY) {
      return NextResponse.json(
        { message: 'CRYPTO_PRIVATE_KEY is not configured on this server' },
        { status: apiStatusCodes.API_STATUS_SERVER_ERROR },
      )
    }

    if (!body?.value) {
      return NextResponse.json(
        { message: 'value is required' },
        { status: apiStatusCodes.API_STATUS_BAD_REQUEST },
      )
    }

    const encrypted = CryptoJS.AES.encrypt(
      body.value,
      CRYPTO_PRIVATE_KEY,
    ).toString()

    return NextResponse.json(
      { message: 'Value encrypted successfully', data: encrypted },
      { status: apiStatusCodes.API_STATUS_SUCCESS },
    )
  } catch (error: unknown) {
    console.error('Error encrypting value', error)
    return NextResponse.json(
      {
        message: 'Encryption failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: apiStatusCodes.API_STATUS_SERVER_ERROR },
    )
  }
}
