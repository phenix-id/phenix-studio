'use client'

import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import {
  MarketplaceOnboardingSession,
  activateMarketplaceSubscription,
  createMarketplaceOrganization,
  getMarketplaceOnboardingSession,
  linkMarketplaceAccount,
} from '@/app/api/marketplace'
import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AxiosResponse } from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MarketplacePlanSummary } from './MarketplacePlanSummary'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
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

interface StepBadgeProps {
  step: number
  completed: boolean
  active: boolean
}

function StepBadge({
  step,
  completed,
  active,
}: StepBadgeProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-200',
        completed && 'border-green-500 bg-green-500/10',
        active && !completed && 'border-primary bg-primary/10',
        !active && !completed && 'border-border bg-muted',
      )}
    >
      {completed ? (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      ) : (
        <span
          className={cn(
            active && !completed ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          {step}
        </span>
      )}
    </div>
  )
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

    setLoading(true)
    const response = await getMarketplaceOnboardingSession(sessionId)
    const data = extractData<MarketplaceOnboardingSession>(response)

    if (!data) {
      setError(
        typeof response === 'string'
          ? response
          : 'Unable to load Marketplace onboarding session.',
      )
      setLoading(false)
      return
    }

    setSessionState(data)
    const linkedOrgId =
      data.linkedOrgId || data.subscription.linkedOrgId || undefined

    if (linkedOrgId) {
      setLocalOrgId(linkedOrgId)
      dispatch(setOrgId(linkedOrgId))
    }

    setLoading(false)
  }, [dispatch, sessionId])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  const linkAccount = async (): Promise<void> => {
    if (!sessionId) {
      return
    }

    setLoading(true)
    setError(null)
    const response = await linkMarketplaceAccount(sessionId, {
      mode: 'existing_user',
      email: session?.user?.email || undefined,
    })

    if (typeof response === 'string') {
      setError(response)
      setLoading(false)
      return
    }

    setAccountLinked(true)
    await loadSession()
  }

  const createOrganization = async (): Promise<void> => {
    if (!sessionId || !orgName.trim()) {
      setError('Organization name is required.')
      return
    }

    setLoading(true)
    setError(null)
    const response = await createMarketplaceOrganization(sessionId, {
      mode: 'create',
      organization: {
        name: orgName.trim(),
        description: orgDescription.trim() || undefined,
        website: orgWebsite.trim() || undefined,
      },
    })
    const data = extractData<OrganizationLinkResponse>(response)
    const linkedOrgId = data?.orgId || data?.organizationId

    if (!linkedOrgId) {
      setError(
        typeof response === 'string'
          ? response
          : 'Organization was not linked to the Marketplace subscription.',
      )
      setLoading(false)
      return
    }

    setLocalOrgId(linkedOrgId)
    dispatch(setOrgId(linkedOrgId))
    await loadSession()
  }

  const activate = async (): Promise<void> => {
    if (!sessionId || !orgId) {
      setError('Create or link an organization before activation.')
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

  const step2Active = accountLinked || Boolean(orgId)
  const step3Active = Boolean(orgId)

  return (
    <div className="h-screen overflow-y-auto bg-[image:var(--card-gradient)]">
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-8 sm:px-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">
            Marketplace onboarding
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Link your account, create the buyer organization, then activate the
            Microsoft Marketplace subscription.
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

        {/* Step progress tracker */}
        <div className="flex items-center gap-2 py-1">
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all',
                accountLinked
                  ? 'bg-green-500 text-white'
                  : 'bg-primary text-white',
              )}
            >
              {accountLinked ? '✓' : '1'}
            </div>
            <span className="text-muted-foreground hidden text-[11px] sm:block">
              Account
            </span>
          </div>

          <div
            className={cn(
              'mb-4 h-px flex-1 transition-colors sm:mb-0',
              accountLinked ? 'bg-green-500' : 'bg-border',
            )}
          />

          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all',
                orgId
                  ? 'bg-green-500 text-white'
                  : step2Active
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground',
              )}
            >
              {orgId ? '✓' : '2'}
            </div>
            <span className="text-muted-foreground hidden text-[11px] sm:block">
              Organization
            </span>
          </div>

          <div
            className={cn(
              'mb-4 h-px flex-1 transition-colors sm:mb-0',
              orgId ? 'bg-green-500' : 'bg-border',
            )}
          />

          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all',
                step3Active
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              3
            </div>
            <span className="text-muted-foreground hidden text-[11px] sm:block">
              Activate
            </span>
          </div>
        </div>

        {/* ── Step 1: Account ── */}
        <div
          className={cn(
            'bg-card border-border rounded-xl border p-5 shadow-sm transition-all',
            accountLinked && 'border-green-500/25',
          )}
        >
          <div className="flex items-start gap-4">
            <StepBadge step={1} completed={accountLinked} active={true} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p
                  className={cn(
                    'font-semibold',
                    accountLinked && 'text-green-500',
                  )}
                >
                  Account
                </p>
                {accountLinked && (
                  <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-500">
                    Linked
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Link this Marketplace purchase to your signed-in Studio account.
              </p>

              {!accountLinked ? (
                <div className="mt-4 space-y-3">
                  {session?.user?.email && (
                    <p className="text-muted-foreground text-sm">
                      Signing in as{' '}
                      <span className="text-foreground font-medium">
                        {session.user.email}
                      </span>
                    </p>
                  )}
                  <Button size="sm" onClick={linkAccount} disabled={loading}>
                    {loading && (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    )}
                    Link current account
                  </Button>
                </div>
              ) : (
                session?.user?.email && (
                  <p className="text-muted-foreground mt-3 text-sm">
                    Linked as{' '}
                    <span className="font-medium text-green-500">
                      {session.user.email}
                    </span>
                  </p>
                )
              )}
            </div>
          </div>
        </div>

        {/* ── Step 2: Organization ── */}
        <div
          className={cn(
            'bg-card border-border rounded-xl border p-5 shadow-sm transition-all',
            Boolean(orgId) && 'border-green-500/25',
          )}
        >
          <div className="flex items-start gap-4">
            <StepBadge
              step={2}
              completed={Boolean(orgId)}
              active={step2Active}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p
                  className={cn(
                    'font-semibold',
                    Boolean(orgId) && 'text-green-500',
                  )}
                >
                  Organization
                </p>
                {Boolean(orgId) && (
                  <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-500">
                    Created
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Create and link the buyer organization for this Marketplace
                subscription.
              </p>

              {!orgId ? (
                <div className="mt-4 space-y-4">
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
                    <Label htmlFor="marketplace-org-description">
                      Description
                    </Label>
                    <Textarea
                      id="marketplace-org-description"
                      value={orgDescription}
                      onChange={(e) => setOrgDescription(e.target.value)}
                      placeholder="Issuer and verifier organization"
                      disabled={loading}
                      rows={3}
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={createOrganization}
                    disabled={loading || !orgName.trim()}
                  >
                    {loading && (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    )}
                    Create and link organization
                  </Button>
                </div>
              ) : (
                orgName && (
                  <p className="text-muted-foreground mt-3 text-sm">
                    <span className="font-medium text-green-500">
                      {orgName}
                    </span>{' '}
                    linked to this subscription.
                  </p>
                )
              )}
            </div>
          </div>
        </div>

        {/* ── Step 3: Activate ── */}
        <div className="bg-card border-border rounded-xl border p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <StepBadge step={3} completed={false} active={step3Active} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Activate</p>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Activation starts Microsoft billing only after the account and
                organization are linked.
              </p>
              <div className="mt-4 space-y-2">
                <Button
                  size="sm"
                  onClick={activate}
                  disabled={loading || !orgId}
                  variant={!orgId ? 'outline' : 'default'}
                >
                  {loading && (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  )}
                  Activate subscription
                </Button>
                {!orgId && (
                  <p className="text-muted-foreground text-xs">
                    Complete steps 1 and 2 before activating.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
