'use client'

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

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">
          Marketplace onboarding
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Link your account, create the buyer organization, then activate the
          Microsoft Marketplace subscription.
        </p>
      </div>

      {error && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border p-4 text-sm">
          {error}
        </div>
      )}

      <MarketplacePlanSummary subscription={sessionState?.subscription} />

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-md border p-4">
          <p className="font-semibold">1. Account</p>
          <p className="text-muted-foreground mt-2 text-sm">
            Link this Marketplace purchase to the signed-in Studio account.
          </p>
          <Button className="mt-4" onClick={linkAccount} disabled={loading}>
            Link current account
          </Button>
        </section>

        <section className="rounded-md border p-4 lg:col-span-2">
          <p className="font-semibold">2. Organization</p>
          <div className="mt-4 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="marketplace-org-name">Organization name</Label>
              <Input
                id="marketplace-org-name"
                value={orgName}
                onChange={(event) => setOrgName(event.target.value)}
                placeholder="Acme University"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="marketplace-org-website">Website</Label>
              <Input
                id="marketplace-org-website"
                value={orgWebsite}
                onChange={(event) => setOrgWebsite(event.target.value)}
                placeholder="https://acme.example"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="marketplace-org-description">Description</Label>
              <Textarea
                id="marketplace-org-description"
                value={orgDescription}
                onChange={(event) => setOrgDescription(event.target.value)}
                placeholder="Issuer and verifier organization"
              />
            </div>
            <Button
              className="w-fit"
              onClick={createOrganization}
              disabled={loading}
            >
              Create and link organization
            </Button>
          </div>
        </section>
      </div>

      <section className="rounded-md border p-4">
        <p className="font-semibold">3. Activate</p>
        <p className="text-muted-foreground mt-2 text-sm">
          Activation starts Microsoft billing only after the Studio account and
          organization are ready.
        </p>
        <Button
          className="mt-4"
          onClick={activate}
          disabled={loading || !orgId}
        >
          Activate subscription
        </Button>
      </section>

      {loading && (
        <p className="text-muted-foreground text-sm">
          Updating Marketplace onboarding...
        </p>
      )}
    </main>
  )
}
