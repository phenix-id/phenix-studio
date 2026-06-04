'use client'

import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import {
  MarketplaceOnboardingSession,
  activateMarketplaceSubscription,
  createMarketplaceOrganization,
  getMarketplaceOnboardingSession,
  linkMarketplaceAccount,
} from '@/app/api/marketplace'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AxiosResponse } from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MarketplacePlanSummary } from './MarketplacePlanSummary'
import { Textarea } from '@/components/ui/textarea'
import { pathRoutes } from '@/config/pathRoutes'
import { setOrgId } from '@/lib/orgSlice'
import { useAppDispatch } from '@/lib/hooks'
import { useSession } from 'next-auth/react'

const ONBOARDING_SESSION_KEY = 'marketplaceOnboardingSessionId'

interface OrganizationLinkResponse {
  orgId?: string
  organizationId?: string
}

function extractData<T>(response: AxiosResponse | string): T | null {
  if (typeof response === 'string') {
    return null
  }
  const envelope = response.data as { data?: T }
  return envelope.data || null
}

export function OnboardingWizard(): React.JSX.Element {
  const searchParams = useSearchParams()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { data: session } = useSession()
  const [sessionState, setSessionState] =
    useState<MarketplaceOnboardingSession | null>(null)
  const [orgName, setOrgName] = useState('')
  const [orgDescription, setOrgDescription] = useState('')
  const [orgWebsite, setOrgWebsite] = useState('')
  const [orgId, setLocalOrgId] = useState('')
  const [accountLinked, setAccountLinked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const autoLinkRef = useRef(false)

  const sessionId =
    searchParams.get('sessionId') ||
    (typeof window !== 'undefined'
      ? sessionStorage.getItem(ONBOARDING_SESSION_KEY)
      : null)

  const loadSession = useCallback(async (): Promise<void> => {
    if (!sessionId) {
      setError('Marketplace onboarding session is missing or expired.')
      return
    }

    const response = await getMarketplaceOnboardingSession(sessionId)
    const data = extractData<MarketplaceOnboardingSession>(response)

    if (!data) {
      setError(
        typeof response === 'string'
          ? response
          : 'Unable to load Marketplace onboarding session.',
      )
      return
    }

    setSessionState(data)
    // The backend's nextAction is the source of truth: anything past link_account means the
    // signed-in account is already linked to this subscription.
    setAccountLinked(data.nextAction !== 'link_account')

    const linkedOrgId =
      data.linkedOrgId || data.subscription.linkedOrgId || undefined

    if (linkedOrgId) {
      setLocalOrgId(linkedOrgId)
      dispatch(setOrgId(linkedOrgId))
    }
  }, [dispatch, sessionId])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  // Linking the signed-in account to the subscription needs no buyer input, so do it
  // automatically once the session says it's the next step — there is no "Link account"
  // button. autoLinkRef guards against re-firing when loadSession refreshes sessionState.
  useEffect(() => {
    const autoLink = async (): Promise<void> => {
      if (
        !sessionId ||
        !sessionState ||
        sessionState.nextAction !== 'link_account' ||
        autoLinkRef.current
      ) {
        return
      }
      autoLinkRef.current = true
      setError(null)

      const response = await linkMarketplaceAccount(sessionId, {
        mode: 'existing_user',
        email: session?.user?.email || undefined,
      })

      if (typeof response === 'string') {
        setError(response)
        autoLinkRef.current = false
        return
      }

      setAccountLinked(true)
      await loadSession()
    }

    autoLink()
  }, [sessionId, sessionState, session, loadSession])

  const createOrganizationAndActivate = async (): Promise<void> => {
    if (!sessionId || !orgName.trim()) {
      setError('Organization name is required.')
      return
    }

    setLoading(true)
    setError(null)

    const createResponse = await createMarketplaceOrganization(sessionId, {
      mode: 'create',
      organization: {
        name: orgName.trim(),
        description: orgDescription.trim() || undefined,
        website: orgWebsite.trim() || undefined,
      },
    })
    const created = extractData<OrganizationLinkResponse>(createResponse)
    const linkedOrgId = created?.orgId || created?.organizationId

    if (!linkedOrgId) {
      setError(
        typeof createResponse === 'string'
          ? createResponse
          : 'Organization was not linked to the Marketplace subscription.',
      )
      setLoading(false)
      return
    }

    setLocalOrgId(linkedOrgId)
    dispatch(setOrgId(linkedOrgId))

    const activateResponse = await activateMarketplaceSubscription(
      sessionId,
      linkedOrgId,
    )

    if (typeof activateResponse === 'string') {
      // Org is created/linked; only activation failed. Surface the error — the org now
      // exists, so the UI falls back to the activate-only path for a retry.
      setError(activateResponse)
      setLoading(false)
      return
    }

    router.push(pathRoutes.marketplace.success)
  }

  const activateExistingOrganization = async (): Promise<void> => {
    if (!sessionId || !orgId) {
      return
    }

    setLoading(true)
    setError(null)
    const response = await activateMarketplaceSubscription(sessionId, orgId)

    if (typeof response === 'string') {
      setError(response)
      setLoading(false)
      return
    }

    router.push(pathRoutes.marketplace.success)
  }

  return (
    <div className="h-screen overflow-y-auto bg-[image:var(--card-gradient)]">
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-8 sm:px-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">
            Finish Marketplace setup
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Name your organization to finish linking and activate your Microsoft
            Marketplace subscription.
          </p>
        </div>

        {/* Error alert */}
        {error && (
          <div className="border-destructive/30 bg-destructive/10 flex items-start gap-3 rounded-lg border p-4">
            <AlertTriangle className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Subscription summary */}
        <MarketplacePlanSummary subscription={sessionState?.subscription} />

        {/* Account link status — handled automatically, no buyer action */}
        <div className="bg-card border-border flex items-center gap-3 rounded-xl border p-4 shadow-sm">
          {accountLinked ? (
            <>
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
              <p className="text-sm">
                {session?.user?.email ? (
                  <>
                    Account linked as{' '}
                    <span className="font-medium text-green-500">
                      {session.user.email}
                    </span>
                  </>
                ) : (
                  'Account linked to this subscription.'
                )}
              </p>
            </>
          ) : (
            <>
              <Loader2 className="text-muted-foreground h-4 w-4 shrink-0 animate-spin" />
              <p className="text-muted-foreground text-sm">
                Linking your account to this subscription...
              </p>
            </>
          )}
        </div>

        {/* Organization + activation */}
        <div className="bg-card border-border rounded-xl border p-5 shadow-sm">
          {orgId ? (
            <div className="space-y-4">
              <div>
                <p className="font-semibold">Activate subscription</p>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  {orgName ? (
                    <>
                      <span className="font-medium text-green-500">
                        {orgName}
                      </span>{' '}
                      is linked to this subscription. Activate to start your
                      Microsoft billing.
                    </>
                  ) : (
                    'Your organization is linked. Activate to start your Microsoft billing.'
                  )}
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <p className="text-sm text-amber-500/90">
                  Activation starts Microsoft Marketplace billing for this
                  subscription.
                </p>
              </div>
              <Button
                onClick={activateExistingOrganization}
                disabled={loading || !accountLinked}
              >
                {loading && (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                )}
                Activate subscription
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="font-semibold">Your organization</p>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  Create the buyer organization for this subscription.
                  We&apos;ll link it and activate billing in a single step.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="marketplace-org-name">
                  Organization name{' '}
                  <span className="text-destructive text-xs">*</span>
                </Label>
                <Input
                  id="marketplace-org-name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Acme University"
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="marketplace-org-website">Website</Label>
                <Input
                  id="marketplace-org-website"
                  value={orgWebsite}
                  onChange={(e) => setOrgWebsite(e.target.value)}
                  placeholder="https://acme.example"
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="marketplace-org-description">Description</Label>
                <Textarea
                  id="marketplace-org-description"
                  value={orgDescription}
                  onChange={(e) => setOrgDescription(e.target.value)}
                  placeholder="Issuer and verifier organization"
                  disabled={loading}
                  rows={3}
                />
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <p className="text-sm text-amber-500/90">
                  Creating your organization activates this Microsoft
                  Marketplace subscription and starts billing.
                </p>
              </div>
              <Button
                onClick={createOrganizationAndActivate}
                disabled={loading || !accountLinked || !orgName.trim()}
              >
                {loading && (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                )}
                Create organization & activate subscription
              </Button>
              {!accountLinked && (
                <p className="text-muted-foreground text-xs">
                  Linking your account — the button enables once it&apos;s done.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
