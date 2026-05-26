'use client'

import { JwtPayload, jwtDecode } from 'jwt-decode'
import axios, { AxiosError } from 'axios'
import { generateAccessToken, logoutUser } from '@/utils/session'
import { setRefreshToken, setToken } from '@/lib/authSlice'

import { apiStatusCodes } from '@/config/CommonConstant'
import { getSession } from 'next-auth/react'
import { store } from '@/lib/store'

interface JwtPaylodCustom extends JwtPayload {
  azp?: string
}

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
})

const EcosystemInstance = axios.create({
  baseURL: process.env.PUBLIC_ECOSYSTEM_BASE_URL,
})

export async function logoutAndRedirect(): Promise<void> {
  await generateAccessToken()
}

instance.interceptors.request.use(
  async (config) => {
    const { auth } = store.getState()
    let token: string | undefined = auth?.token
    let refreshToken: string | undefined = auth?.refreshToken

    if (!token || !refreshToken) {
      const session = await getSession()
      token = session?.accessToken
      refreshToken = session?.refreshToken

      if (token) {
        store.dispatch(setToken(token))
      }
      if (refreshToken) {
        store.dispatch(setRefreshToken(refreshToken))
      }
    }

    if (!token || !refreshToken) {
      await logoutUser()
      throw new Error('Session expired')
    }

    try {
      const currentTime = Math.floor(Date.now() / 1000)
      const client = jwtDecode<JwtPaylodCustom>(refreshToken).azp

      if (client === process.env.NEXT_PUBLIC_ADMIN_PORTAL_CLIENT_ID) {
        await logoutUser()
        throw new Error('Session expired')
      }
      const refreshTokenExp = jwtDecode<JwtPayload>(refreshToken).exp
      const isRefreshTokenExpired = refreshTokenExp
        ? refreshTokenExp - currentTime < 1
        : true
      const { exp: accessExp } = jwtDecode<JwtPayload>(token)
      const isExpired = accessExp ? accessExp - currentTime < 1 : true
      if (isExpired && !isRefreshTokenExpired) {
        const didRefresh = await generateAccessToken()
        const newToken = store.getState().auth?.token
        if (didRefresh && newToken) {
          return {
            ...config,
            headers: new axios.AxiosHeaders({
              ...config.headers,
              Authorization: `Bearer ${newToken}`,
            }),
          }
        }
        await logoutUser()
        throw new Error('Session expired')
      }
      if (isRefreshTokenExpired) {
        await logoutUser()
        throw new Error('Session expired')
      }
    } catch (error) {
      const isSessionExpired =
        error instanceof Error && error.message === 'Session expired'
      if (!isSessionExpired) {
        console.error('Error decoding token:', error)
        await logoutUser()
      }
      throw error
    }
    return {
      ...config,
      headers: new axios.AxiosHeaders({
        ...config.headers,
        Authorization: `Bearer ${token}`,
      }),
    }
  },
  async (error) => {
    if (error.response?.status === apiStatusCodes.API_STATUS_UNAUTHORIZED) {
      if (typeof window !== 'undefined') {
        await logoutAndRedirect()
      }
    }
    return Promise.reject(error)
  },
)

// RESPONSE INTERCEPTOR
instance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => Promise.reject(error),
)

export { instance, EcosystemInstance }
