'use client'

import { appFaviconPath, appLogoAltText } from '@/config/CommonConstant'
import { setRefreshToken, setSessionId, setToken } from '@/lib/authSlice'
import { useAppDispatch, useAppSelector } from '@/lib/hooks'
import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Loader from '@/components/Loader'
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
  const hasValidatedRef = useRef(false)

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

    // Only show the loader before the very first successful validation.
    // After that, keep sessionReady=true across page navigations.
    if (!hasValidatedRef.current) {
      setSessionReady(false)
    }

    const delay = hasValidatedRef.current ? 0 : 500

    const timeout = setTimeout(() => {
      if (status === 'authenticated' && session?.sessionId) {
        const hasSessionTokens = setSessionTokens()
        hasValidatedRef.current = true
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
        hasValidatedRef.current = false
        if (!isIgnoreSessionCheck) {
          router.push('/sign-in')
        }
      } else {
        hasValidatedRef.current = true
        setSessionReady(true)
      }
    }, delay)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.sessionId, isIgnoreSessionCheck])

  if (
    status === 'loading' ||
    (status === 'authenticated' && !sessionReady && !isIgnoreSessionCheck)
  ) {
    return (
      <div className="bg-background fixed top-0 left-0 z-[9999] flex h-full w-full items-center justify-center">
        <div className="relative">
          <Loader size={90} />
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src={appFaviconPath}
              alt={appLogoAltText}
              className="h-14 w-14 object-contain"
            />
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
