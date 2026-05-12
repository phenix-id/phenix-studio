'use client'

import {
  ResolveMarketplaceResponse,
  resolveMarketplaceSubscription,
} from '@/app/api/marketplace'
import { signIn, useSession } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AxiosResponse } from 'axios'
import { Button } from '@/components/ui/button'
import { MarketplacePlanSummary } from './MarketplacePlanSummary'
import { pathRoutes } from '@/config/pathRoutes'
import { setOrgId } from '@/lib/orgSlice'
import { useAppDispatch } from '@/lib/hooks'

const ONBOARDING_SESSION_KEY = 'marketplaceOnboardingSessionId'

function extractData<T>(response: AxiosResponse | string): T | null {
  if (typeof response === 'string') {
    return null
  }

  const envelope = response.data as { data?: T }
  return envelope.data || null
}

export function MarketplaceLanding(): React.JSX.Element {
  const searchParams = useSearchParams()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { data: session, status } = useSession()
  const [resolved, setResolved] = useState<ResolveMarketplaceResponse | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const resolveStarted = useRef(false)
  const marketplaceToken = searchParams.get('token')

  useEffect(() => {
    const resolveSubscription = async (): Promise<void> => {
      if (!marketplaceToken || status !== 'authenticated') {
        return
      }

      if (resolveStarted.current) {
        return
      }

      resolveStarted.current = true
      setLoading(true)
      setError(null)

      const response = await resolveMarketplaceSubscription({
        marketplaceToken,
        buyerClaims: {
          email: session?.user?.email || undefined,
          name: session?.user?.name || undefined,
        },
      })
      const data = extractData<ResolveMarketplaceResponse>(response)

      if (!data) {
        setError(
          typeof response === 'string'
            ? response
            : 'Unable to resolve the Microsoft Marketplace subscription.',
        )
        setLoading(false)
        return
      }

      sessionStorage.setItem(ONBOARDING_SESSION_KEY, data.onboardingSessionId)
      setResolved(data)

      if (data.linkedOrgId) {
        dispatch(setOrgId(data.linkedOrgId))
      }

      if (
        data.nextAction === 'open_dashboard' ||
        data.nextAction === 'manage_billing'
      ) {
        router.push(pathRoutes.organizations.billing)
        return
      }

      router.push(
        `${pathRoutes.marketplace.onboarding}?sessionId=${data.onboardingSessionId}`,
      )
    }

    resolveSubscription()
  }, [dispatch, marketplaceToken, router, session, status])

  if (!marketplaceToken) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-4 p-6">
        <h1 className="text-2xl font-semibold tracking-normal">
          Marketplace token missing
        </h1>
        <p className="text-muted-foreground text-sm">
          Reopen Configure account or Manage account from Azure Portal or
          Microsoft 365 Admin Center, then return to this landing page.
        </p>
      </main>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-4 p-6">
        <h1 className="text-2xl font-semibold tracking-normal">
          Sign in to configure Phenix ID Platform
        </h1>
        <p className="text-muted-foreground text-sm">
          Continue with your organization account. The Marketplace purchase
          token will be resolved by Platform after sign-in.
        </p>
        <Button
          className="w-fit"
          onClick={() =>
            signIn(undefined, {
              callbackUrl: `${pathRoutes.marketplace.landing}?token=${encodeURIComponent(
                marketplaceToken,
              )}`,
            })
          }
        >
          Sign in
        </Button>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">
          Phenix ID Platform
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Resolving your Microsoft Marketplace subscription and preparing
          organization setup.
        </p>
      </div>

      {loading && (
        <div className="text-muted-foreground rounded-md border p-4 text-sm">
          Resolving Marketplace purchase...
        </div>
      )}

      {error && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border p-4 text-sm">
          {error}
        </div>
      )}

      {resolved && <MarketplacePlanSummary subscription={resolved} />}
    </main>
  )
}
