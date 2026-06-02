'use client'

import {
  ResolveMarketplaceResponse,
  resolveMarketplaceSubscription,
} from '@/app/api/marketplace'
import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { AxiosResponse } from 'axios'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { MarketplaceLegalInfo } from './MarketplaceLegalInfo'
import { MarketplacePlanSummary } from './MarketplacePlanSummary'
import { marketplaceLegal } from '@/config/marketplaceLegal'
import { pathRoutes } from '@/config/pathRoutes'
import { setOrgId } from '@/lib/orgSlice'
import { useAppDispatch } from '@/lib/hooks'
import { useSession } from 'next-auth/react'

const ONBOARDING_SESSION_KEY = 'marketplaceOnboardingSessionId'
const MARKETPLACE_LEGAL_ACCEPTANCE_KEY = `marketplaceLegalAccepted:${marketplaceLegal.lastUpdated}`

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
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [readyToResolve, setReadyToResolve] = useState(false)
  const resolveStarted = useRef(false)
  const navigatedRef = useRef(false)
  const initiallyAcceptedRef = useRef(false)
  const marketplaceToken = searchParams.get('token')
  const clientAlias = process.env.NEXT_PUBLIC_PLATFORM_NAME || 'Phenix'
  const landingWithToken = `${pathRoutes.marketplace.landing}?token=${encodeURIComponent(
    marketplaceToken ?? '',
  )}`
  const purchaserEmail =
    resolved?.beneficiaryEmail || resolved?.purchaserEmail || ''

  const handleTermsAcceptedChange = (checked: boolean): void => {
    // Only record acceptance here. Resolving the subscription is triggered explicitly
    // by the "Continue" button (setReadyToResolve), not as a side effect of the checkbox.
    setAcceptedTerms(checked)

    if (checked) {
      sessionStorage.setItem(MARKETPLACE_LEGAL_ACCEPTANCE_KEY, 'true')
      return
    }

    sessionStorage.removeItem(MARKETPLACE_LEGAL_ACCEPTANCE_KEY)
  }

  useEffect(() => {
    const accepted =
      sessionStorage.getItem(MARKETPLACE_LEGAL_ACCEPTANCE_KEY) === 'true'
    initiallyAcceptedRef.current = accepted
    setAcceptedTerms(accepted)
  }, [])

  // A returning authenticated user who already accepted terms in a previous step (e.g.
  // before signing up) skips the terms screen, avoiding a redundant second "Continue".
  // Only applies to acceptance restored at mount — a fresh checkbox tick still requires
  // an explicit Continue click (resolve is never a silent checkbox side effect).
  useEffect(() => {
    if (status === 'authenticated' && initiallyAcceptedRef.current) {
      setReadyToResolve(true)
    }
  }, [status])

  // Resolve the subscription as soon as terms are accepted — independent of auth, so the
  // buyer confirms their purchase before signing in / creating an account. This never
  // navigates (the wizard/billing pages are JWT-guarded); navigation is handled below.
  useEffect(() => {
    const resolveSubscription = async (): Promise<void> => {
      if (
        !marketplaceToken ||
        !readyToResolve ||
        !acceptedTerms ||
        resolveStarted.current
      ) {
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
        resolveStarted.current = false
        return
      }

      sessionStorage.setItem(ONBOARDING_SESSION_KEY, data.onboardingSessionId)
      setResolved(data)
      setLoading(false)

      if (data.linkedOrgId) {
        dispatch(setOrgId(data.linkedOrgId))
      }
    }

    resolveSubscription()
  }, [acceptedTerms, dispatch, marketplaceToken, readyToResolve, session])

  // Navigate to the JWT-guarded wizard/billing only once authenticated AND resolved.
  // Kept separate from resolve so a resolve that completes while the session is still
  // 'loading' still navigates correctly once auth settles.
  useEffect(() => {
    if (status !== 'authenticated' || !resolved || navigatedRef.current) {
      return
    }
    navigatedRef.current = true

    if (
      resolved.nextAction === 'open_dashboard' ||
      resolved.nextAction === 'manage_billing'
    ) {
      router.push(pathRoutes.organizations.billing)
      return
    }

    router.push(
      `${pathRoutes.marketplace.onboarding}?sessionId=${resolved.onboardingSessionId}`,
    )
  }, [status, resolved, router])

  if (!marketplaceToken) {
    return (
      <div className="h-screen overflow-y-auto bg-[image:var(--card-gradient)] px-6 py-12">
        <div className="bg-card border-border mx-auto w-full max-w-2xl overflow-hidden rounded-xl border shadow-xl">
          <div className="flex flex-col gap-6 p-8">
            <div className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <p className="text-sm font-semibold text-amber-500">
                  Marketplace token missing
                </p>
                <p className="mt-1 text-sm text-amber-500/80">
                  Reopen Configure account or Manage account from Azure Portal
                  or Microsoft 365 Admin Center, then return to this landing
                  page.
                </p>
              </div>
            </div>
            <MarketplaceLegalInfo />
          </div>
        </div>
      </div>
    )
  }

  // Step 1 (both auth states): accept terms, then explicitly Continue. Continue is the
  // only trigger that resolves the subscription — the checkbox alone does not.
  if (!readyToResolve) {
    return (
      <div className="h-screen overflow-y-auto bg-[image:var(--card-gradient)] px-6 py-12">
        <div className="bg-card border-border mx-auto w-full max-w-2xl overflow-hidden rounded-xl border shadow-xl">
          <div className="flex flex-col gap-6 p-8">
            <div>
              <h1 className="text-2xl font-semibold tracking-normal">
                Review Marketplace terms
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Accept the required privacy, terms, and support information,
                then continue to confirm your Microsoft Marketplace
                subscription.
              </p>
            </div>
            <MarketplaceLegalInfo />
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <Checkbox
                id="marketplace-legal-accept"
                checked={acceptedTerms}
                onCheckedChange={(checked) =>
                  handleTermsAcceptedChange(checked === true)
                }
              />
              <Label
                htmlFor="marketplace-legal-accept"
                className="text-sm leading-5 font-normal"
              >
                I have reviewed and accept the Privacy Policy, Terms of Use, and
                support information for Phenix ID Platform.
              </Label>
            </div>
            <Button
              className="w-fit"
              disabled={!acceptedTerms}
              onClick={() => setReadyToResolve(true)}
            >
              Continue to Marketplace setup
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Step 2 (unauthenticated): subscription resolved — show the plan, then let the buyer
  // sign in or create an account. Buttons wait until the resolve completes so the
  // purchaser email is available to pre-fill signup.
  if (status === 'unauthenticated') {
    return (
      <div className="h-screen overflow-y-auto bg-[image:var(--card-gradient)] px-6 py-12">
        <div className="bg-card border-border mx-auto w-full max-w-2xl overflow-hidden rounded-xl border shadow-xl">
          <div className="flex flex-col gap-6 p-8">
            <div>
              <h1 className="text-2xl font-semibold tracking-normal">
                Sign in to configure Phenix ID Platform
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Continue with your organization account, or create a new one to
                finish linking this Microsoft Marketplace subscription.
              </p>
            </div>
            <MarketplaceLegalInfo />
            {loading && (
              <div className="text-muted-foreground rounded-md border p-4 text-sm">
                Confirming your Microsoft Marketplace purchase...
              </div>
            )}
            {error && (
              <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border p-4 text-sm">
                {error}
              </div>
            )}
            {resolved && <MarketplacePlanSummary subscription={resolved} />}
            <div className="flex flex-wrap gap-3">
              <Button
                className="w-fit"
                disabled={loading || !resolved}
                onClick={() =>
                  router.push(
                    `/sign-in?redirectTo=${encodeURIComponent(
                      landingWithToken,
                    )}&clientAlias=${encodeURIComponent(clientAlias)}`,
                  )
                }
              >
                Sign in
              </Button>
              <Button
                variant="outline"
                className="w-fit"
                disabled={loading || !resolved}
                onClick={() =>
                  router.push(
                    `/sign-up?redirectTo=${encodeURIComponent(
                      landingWithToken,
                    )}&clientAlias=${encodeURIComponent(clientAlias)}${
                      purchaserEmail
                        ? `&email=${encodeURIComponent(purchaserEmail)}`
                        : ''
                    }`,
                  )
                }
              >
                Create account
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center overflow-y-auto bg-[image:var(--card-gradient)] p-6">
      <div className="bg-card border-border w-full max-w-2xl overflow-hidden rounded-xl border shadow-xl">
        <div className="flex flex-col gap-6 p-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">
              Phenix ID Platform
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Resolving your Microsoft Marketplace subscription and preparing
              organization setup.
            </p>
          </div>
          <MarketplaceLegalInfo />

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
        </div>
      </div>
    </div>
  )
}
