'use client'

import { setRefreshToken, setSessionId, setToken } from '@/lib/authSlice'
import { useAppDispatch, useAppSelector } from '@/lib/hooks'
import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { generateAccessToken } from '@/utils/session'
import { useSession } from 'next-auth/react'

const preventRedirectOnPaths = [
  '/create-organization',
  '/agent-config',
  '/wallet-setup',
  '/create-did',
  '/x509-certificate',
  '/intents',
  '/did-details',
  '/organizations',
  '/users',
  '/connections',
  '/ecosystems',
  '/profile',
  '/developers-setting',
  '/billing',
  '/organizations/billing',
  '/marketplace',
  '/legal',
  '/schemas',
  '/invitations',
  '/delete-organization',
  '/agent-config',
  '/credentials',
  '/verification',
]
const excludeRouteForSessionCheck = [
  '/verify-email-success',
  '/reset-password',
  '/sign-up',
  '/sign-in',
  '/marketplace',
  '/legal',
]

export const SessionManager = ({
  children,
}: {
  children: React.ReactNode
}): React.ReactElement => {
  const { data: session, status } = useSession({
    required: false,
  })

  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  const auth = useAppSelector((state) => state.auth)
  const [sessionReady, setSessionReady] = useState(false)

  const redirectTo = searchParams.get('redirectTo')
  const isIgnoreSessionCheck = excludeRouteForSessionCheck.some((page) =>
    pathname.startsWith(page),
  )

  const setSessionTokens = useCallback((): boolean => {
    const sessionId = session?.sessionId
    const hasStoredTokens = Boolean(auth?.token && auth?.refreshToken)
    const isSameSession = Boolean(sessionId && auth?.sessionId === sessionId)

    if (sessionId) {
      dispatch(setSessionId(sessionId))
    }

    if (hasStoredTokens && isSameSession) {
      return true
    }

    if (session?.accessToken) {
      dispatch(setToken(session.accessToken))
    }
    if (session?.refreshToken) {
      dispatch(setRefreshToken(session.refreshToken))
    }
    return Boolean(
      (hasStoredTokens && isSameSession) ||
        (session?.accessToken && session?.refreshToken),
    )
  }, [
    auth?.refreshToken,
    auth?.sessionId,
    auth?.token,
    dispatch,
    session?.accessToken,
    session?.refreshToken,
    session?.sessionId,
  ])

  const logoutSession = useCallback(async (): Promise<void> => {
    await generateAccessToken()
  }, [])

  useEffect(() => {
    if (status === 'loading') {
      return
    }
    setSessionReady(false)
    const timeout = setTimeout(() => {
      if (status === 'authenticated' && session?.sessionId) {
        const hasSessionTokens = setSessionTokens()
        if (!hasSessionTokens) {
          void logoutSession()
          return
        } else if (redirectTo) {
          const isOnRestrictedPage = preventRedirectOnPaths.some((page) =>
            pathname.startsWith(page),
          )
          if (!isOnRestrictedPage) {
            window.location.href = redirectTo
          }
        }
        setSessionReady(true)
      } else if (status === 'unauthenticated' || session === null) {
        if (!isIgnoreSessionCheck) {
          router.push('/sign-in')
        }
      } else {
        setSessionReady(true)
      }
    }, 500)

    return () => clearTimeout(timeout)
  }, [
    isIgnoreSessionCheck,
    logoutSession,
    pathname,
    redirectTo,
    router,
    session,
    session?.sessionId,
    setSessionTokens,
    status,
  ])

  if (
    status === 'loading' ||
    (status === 'authenticated' && !sessionReady && !isIgnoreSessionCheck)
  ) {
    return <div>Loading session...</div>
  }

  return <>{children}</>
}
