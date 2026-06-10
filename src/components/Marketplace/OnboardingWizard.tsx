'use client'

import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import {
  MarketplaceOnboardingSession,
  activateMarketplaceSubscription,
  createMarketplaceOrganization,
  getMarketplaceOnboardingSession,
  linkMarketplaceAccount,
} from '@/app/api/marketplace'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AxiosResponse } from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MarketplacePlanSummary } from './MarketplacePlanSummary'
import { Textarea } from '@/components/ui/textarea'
import { getOrganizations } from '@/app/api/organization'
import { marketplaceLegal } from '@/config/marketplaceLegal'
import { pathRoutes } from '@/config/pathRoutes'
import { setOrgId } from '@/lib/orgSlice'
import { useAppDispatch } from '@/lib/hooks'
import { useSession } from 'next-auth/react'

const ONBOARDING_SESSION_KEY = 'marketplaceOnboardingSessionId'
const MARKETPLACE_LEGAL_ACCEPTANCE_KEY = `marketplaceLegalAccepted:${marketplaceLegal.lastUpdated}`

interface OrganizationLinkResponse {
  orgId?: string
  organizationId?: string
}

interface OwnedOrganization {
  id: string
  name: string
}

// Org list rows expose roles via userOrgRoles[].orgRole.name; we only offer orgs the
// signed-in user owns. The backend re-verifies ownership on link_existing — this filter
// is just so the picker doesn't show orgs the user can't actually link.
interface OrgListRow {
  id: string
  name: string
  userOrgRoles?: { orgRole?: { name?: string } }[]
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
  // Organizations the signed-in user owns, offered for reuse so a returning buyer
  // (plan change / cancel + re-subscribe) doesn't have to create a duplicate org.
  const [ownedOrgs, setOwnedOrgs] = useState<OwnedOrganization[]>([])
  const [orgMode, setOrgMode] = useState<'existing' | 'create'>('create')
  const [selectedExistingOrgId, setSelectedExistingOrgId] = useState('')
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

  // Once the account is linked and no org is linked to this subscription yet, load the
  // user's owned organizations so they can reuse one instead of being forced to create a
  // new org (the bug when changing plan / cancelling + re-subscribing).
  useEffect(() => {
    const loadOwnedOrgs = async (): Promise<void> => {
      if (!accountLinked || orgId) {
        return
      }

      const response = await getOrganizations(1, 100, '')
      if (typeof response === 'string') {
        return
      }

      const rows =
        ((response.data as { data?: { organizations?: OrgListRow[] } }).data
          ?.organizations as OrgListRow[]) || []
      const owned = rows
        .filter((row) =>
          (row.userOrgRoles || []).some(
            (role) => role.orgRole?.name?.toLowerCase() === 'owner',
          ),
        )
        .map((row) => ({ id: row.id, name: row.name }))

      setOwnedOrgs(owned)
      if (owned.length > 0) {
        setOrgMode('existing')
        setSelectedExistingOrgId(owned[0].id)
      }
    }

    loadOwnedOrgs()
  }, [accountLinked, orgId])

  const completeOnboarding = (): void => {
    localStorage.removeItem(MARKETPLACE_LEGAL_ACCEPTANCE_KEY)
    router.push(pathRoutes.marketplace.success)
  }

  // Link the chosen org (existing or newly created) to the subscription, then activate.
  const linkAndActivate = async (): Promise<void> => {
    if (!sessionId) {
      return
    }

    setLoading(true)
    setError(null)

    let linkedOrgId: string | undefined = undefined

    if (orgMode === 'existing') {
      if (!selectedExistingOrgId) {
        setError('Select an organization to link.')
        setLoading(false)
        return
      }

      const linkResponse = await createMarketplaceOrganization(sessionId, {
        mode: 'link_existing',
        orgId: selectedExistingOrgId,
      })
      const linked = extractData<OrganizationLinkResponse>(linkResponse)
      linkedOrgId =
        linked?.orgId || linked?.organizationId || selectedExistingOrgId

      if (typeof linkResponse === 'string') {
        setError(linkResponse)
        setLoading(false)
        return
      }
    } else {
      if (!orgName.trim()) {
        setError('Organization name is required.')
        setLoading(false)
        return
      }

      const createResponse = await createMarketplaceOrganization(sessionId, {
        mode: 'create',
        organization: {
          name: orgName.trim(),
          description: orgDescription.trim() || undefined,
          website: orgWebsite.trim() || undefined,
        },
      })
      const created = extractData<OrganizationLinkResponse>(createResponse)
      linkedOrgId = created?.orgId || created?.organizationId

      if (!linkedOrgId) {
        setError(
          typeof createResponse === 'string'
            ? createResponse
            : 'Organization was not linked to the Marketplace subscription.',
        )
        setLoading(false)
        return
      }
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

    completeOnboarding()
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

    completeOnboarding()
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
                  {ownedOrgs.length > 0
                    ? 'Link an organization you already own to this subscription, or create a new one. We’ll link it and activate billing in a single step.'
                    : 'Create the buyer organization for this subscription. We’ll link it and activate billing in a single step.'}
                </p>
              </div>

              {ownedOrgs.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={orgMode === 'existing' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setOrgMode('existing')}
                    disabled={loading}
                  >
                    Use existing organization
                  </Button>
                  <Button
                    type="button"
                    variant={orgMode === 'create' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setOrgMode('create')}
                    disabled={loading}
                  >
                    Create new organization
                  </Button>
                </div>
              )}

              {orgMode === 'existing' && ownedOrgs.length > 0 ? (
                <div className="grid gap-2">
                  <Label htmlFor="marketplace-existing-org">
                    Organization{' '}
                    <span className="text-destructive text-xs">*</span>
                  </Label>
                  <Select
                    value={selectedExistingOrgId}
                    onValueChange={setSelectedExistingOrgId}
                    disabled={loading}
                  >
                    <SelectTrigger id="marketplace-existing-org">
                      <SelectValue placeholder="Select an organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {ownedOrgs.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <>
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
                </>
              )}

              <div className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <p className="text-sm text-amber-500/90">
                  {orgMode === 'existing'
                    ? 'Linking your organization activates this Microsoft Marketplace subscription and starts billing.'
                    : 'Creating your organization activates this Microsoft Marketplace subscription and starts billing.'}
                </p>
              </div>
              <Button
                onClick={linkAndActivate}
                disabled={
                  loading ||
                  !accountLinked ||
                  (orgMode === 'existing'
                    ? !selectedExistingOrgId
                    : !orgName.trim())
                }
              >
                {loading && (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                )}
                {orgMode === 'existing'
                  ? 'Link organization & activate subscription'
                  : 'Create organization & activate subscription'}
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
