import { setRefreshToken, setToken } from '@/lib/authSlice'

import { apiRoutes } from '@/config/apiRoutes'
import { signOut } from 'next-auth/react'
import { store } from '@/lib/store'

let refreshPromise: Promise<boolean> | null = null

export async function logoutUser(): Promise<void> {
  if (typeof window === 'undefined') {
    return
  }

  const searchParam = new URLSearchParams(window.location.search)
  const redirectTo = searchParam.get('redirectTo')
  const signInUrl = redirectTo
    ? `/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`
    : '/sign-in'

  // localStorage.removeItem is synchronous — no interval needed.
  localStorage.removeItem('persist:root')

  // Clear the NextAuth session cookie then hard-navigate.
  // redirect:false prevents NextAuth from driving navigation so we can do it
  // ourselves with window.location.href — a guaranteed hard reload that bypasses
  // SPA routing and avoids any React re-render on the current page.
  try {
    await signOut({ redirect: false })
  } catch {
    // If NextAuth signOut fails, still force-navigate
  }

  window.location.href = signInUrl
}

export const generateAccessToken = async (): Promise<boolean> => {
  const state = store.getState()
  const refreshToken = state?.auth?.refreshToken
  if (!refreshToken) {
    await logoutUser()
    return false
  }
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async (): Promise<boolean> => {
    try {
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}${apiRoutes.auth.refreshToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        },
      )

      const data = await resp.json()
      const message = data?.message || ''
      const isInvalidRefreshToken =
        message === 'Refresh token has expired' ||
        message === 'Invalid refreshToken provided' ||
        resp.status === 401 ||
        resp.status === 403 ||
        resp.status === 404

      if (isInvalidRefreshToken) {
        await logoutUser()
        return false
      }

      if (!resp.ok) {
        return false
      }

      if (data?.data?.access_token) {
        store.dispatch(setToken(data.data.access_token))
      }
      if (data?.data?.refresh_token) {
        store.dispatch(setRefreshToken(data.data.refresh_token))
      }
      return Boolean(data?.data?.access_token)
    } catch (error) {
      console.error('Failed to generate access token:', error)
      return false
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}
