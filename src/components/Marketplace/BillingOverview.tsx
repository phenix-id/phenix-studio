'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Loader2, RefreshCw } from 'lucide-react'
import {
  MarketplaceEntitlements,
  MarketplaceSubscriptionSummary,
  MarketplaceUsageSummary,
  getMarketplaceSubscription,
  getOrgEntitlements,
  getOrgUsageSummary,
  refreshMarketplaceSubscription,
} from '@/app/api/marketplace'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useCallback, useEffect, useState } from 'react'
import { AxiosResponse } from 'axios'
import { Button } from '@/components/ui/button'
import { MarketplacePlanSummary } from './MarketplacePlanSummary'
import { MarketplaceStatusBanner } from './MarketplaceStatusBanner'
import PageContainer from '@/components/layout/page-container'
import { UsageMeterTable } from './UsageMeterTable'
import { marketplacePlanCatalog } from '@/config/marketplacePlans'
import { useAppSelector } from '@/lib/hooks'

function extractData<T>(response: AxiosResponse | string): T | null {
  if (typeof response === 'string') {
    return null
  }

  const envelope = response.data as { data?: T }
  return envelope.data || null
}

// Bounded poll settings for the post-subscribe status sync. The backend may not
// report 'Subscribed' on the very next read after a /refresh (read-after-write
// lag or an asynchronous Microsoft sync), so we re-read a few times before
// giving up. Worst case only applies while a subscription is still pending.
const STATUS_POLL_ATTEMPTS = 4
const STATUS_POLL_DELAY_MS = 1500

const sleep = (ms: number): Promise<void> =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

// Force a Microsoft sync, then re-read the subscription a few times until it
// reports 'Subscribed'. Robust whether the backend /refresh is synchronous
// (the first read settles it) or asynchronous/lagging (a later read does).
// Returns the freshest subscription summary observed, or null if every read
// failed. Stops early the moment the status settles.
const syncUntilSettled = async (
  subscriptionId: string,
): Promise<MarketplaceSubscriptionSummary | null> => {
  await refreshMarketplaceSubscription(subscriptionId)

  let latest: MarketplaceSubscriptionSummary | null = null

  for (let attempt = 0; attempt < STATUS_POLL_ATTEMPTS; attempt += 1) {
    const response = await getMarketplaceSubscription(subscriptionId)
    const data = extractData<MarketplaceSubscriptionSummary>(response)

    if (data) {
      latest = data
      if (data.saasSubscriptionStatus === 'Subscribed') {
        break
      }
    }

    // Not settled yet — wait before the next read (skip the wait on the last
    // attempt since we're about to return regardless).
    if (attempt < STATUS_POLL_ATTEMPTS - 1) {
      await sleep(STATUS_POLL_DELAY_MS)
    }
  }

  return latest
}

const formatLimit = (value?: number | null): string => {
  if (value === null || value === undefined) {
    return '-'
  }

  return new Intl.NumberFormat('en-US').format(value)
}

const formatUsd = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)

interface PlanLimitRow {
  label: string
  value?: number | null
}

function MarketplacePricingCard(): React.JSX.Element {
  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle>Marketplace pricing</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan ID</TableHead>
                <TableHead>Plan name</TableHead>
                <TableHead>Base monthly</TableHead>
                <TableHead>Issuance</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Schemas</TableHead>
                <TableHead>Organizations</TableHead>
                <TableHead>Users</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {marketplacePlanCatalog.map((plan) => (
                <TableRow key={plan.planId}>
                  <TableCell>{plan.planId}</TableCell>
                  <TableCell>{plan.planName}</TableCell>
                  <TableCell>{formatUsd(plan.baseMonthlyPriceUsd)}</TableCell>
                  <TableCell>
                    {formatLimit(plan.includedIssuanceTransactions)}
                  </TableCell>
                  <TableCell>
                    {formatLimit(plan.includedVerificationTransactions)}
                  </TableCell>
                  <TableCell>{formatLimit(plan.includedSchemas)}</TableCell>
                  <TableCell>{formatLimit(plan.maxOrganizations)}</TableCell>
                  <TableCell>{formatLimit(plan.maxUsers)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

function PlanLimitsCard({
  limits,
}: {
  limits?: Record<string, number | null>
}): React.JSX.Element {
  const rows: PlanLimitRow[] = [
    { label: 'Studio users', value: limits?.maxUsers },
    { label: 'Organizations', value: limits?.maxOrganizations },
  ]

  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle>Plan limits</CardTitle>
        <CardDescription>
          Current Marketplace limits applied to this organization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map(({ label, value }) => (
            <div key={label} className="rounded-md border p-3">
              <p className="text-muted-foreground text-sm">{label}</p>
              <p className="mt-1 text-2xl font-semibold tracking-normal">
                {formatLimit(value)}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function BillingOverview(): React.JSX.Element {
  const orgId = useAppSelector((state) => state.organization.orgId)
  const orgInfo = useAppSelector((state) => state.organization.orgInfo)
  const [entitlements, setEntitlements] =
    useState<MarketplaceEntitlements | null>(null)
  const [subscription, setSubscription] =
    useState<MarketplaceSubscriptionSummary | null>(null)
  const [usageSummary, setUsageSummary] =
    useState<MarketplaceUsageSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Normalize to null so SSR and client evaluate identically — guards against
  // an empty-string placeholder in .env.local causing a hydration mismatch
  // that makes the button disappear after the first render.
  const manageUrl =
    process.env.NEXT_PUBLIC_MARKETPLACE_MANAGE_URL?.trim() || null

  // triggerSyncIfPending — true on the initial page load so we auto-sync with
  // Microsoft if activation is still pending. Pass false after a manual refresh
  // to avoid firing the sync endpoint twice in a row.
  const loadBilling = useCallback(
    async (triggerSyncIfPending = true): Promise<void> => {
      if (!orgId) {
        // Ensure loading is never left stuck when we can't proceed.
        setLoading(false)
        setError('Select an organization to view Marketplace billing.')
        return
      }

      setLoading(true)
      setError(null)

      try {
        const entitlementsResponse = await getOrgEntitlements(orgId)
        const entitlementData =
          extractData<MarketplaceEntitlements>(entitlementsResponse)

        if (!entitlementData) {
          setError(
            typeof entitlementsResponse === 'string'
              ? entitlementsResponse
              : 'Unable to load Marketplace entitlements.',
          )
          return
        }

        if (entitlementData.subscription?.subscriptionId) {
          const { subscriptionId } = entitlementData.subscription
          const subResponse = await getMarketplaceSubscription(subscriptionId)
          const subData =
            extractData<MarketplaceSubscriptionSummary>(subResponse)

          // Auto-sync with Microsoft when the SaaS subscription status has not
          // yet been confirmed as 'Subscribed' — this covers the gap between
          // completing Marketplace onboarding and the backend receiving the
          // Microsoft activation webhook. Note: check saasSubscriptionStatus
          // (the Microsoft-side status), NOT localActivationStatus which the
          // backend may already mark as 'activated' before Microsoft confirms.
          if (
            triggerSyncIfPending &&
            subData &&
            subData.saasSubscriptionStatus !== 'Subscribed'
          ) {
            // Trigger the sync and poll the status until it settles, so the
            // banner flips to 'Subscribed' on landing instead of forcing the
            // user to click "Refresh status" manually.
            const settledSub = await syncUntilSettled(subscriptionId)
            setSubscription(settledSub ?? subData)

            // Re-read entitlements after the status settles so plan limits and
            // feature flags reflect the confirmed subscription.
            const syncedEntRsp = await getOrgEntitlements(orgId)
            setEntitlements(
              extractData<MarketplaceEntitlements>(syncedEntRsp) ??
                entitlementData,
            )
          } else {
            setSubscription(subData)
            setEntitlements(entitlementData)
          }
        } else {
          setEntitlements(entitlementData)
        }

        const usageResponse = await getOrgUsageSummary(orgId)
        setUsageSummary(extractData<MarketplaceUsageSummary>(usageResponse))
      } finally {
        // Guaranteed to run on success, early return, or any unexpected throw —
        // prevents loading from ever getting stuck at true.
        setLoading(false)
      }
    },
    [orgId],
  )

  useEffect(() => {
    loadBilling()
  }, [loadBilling])

  // Reload billing when the user returns from managing their subscription in Microsoft, so
  // a plan change reflects immediately without a manual reload.
  useEffect(() => {
    if (!orgId) {
      return
    }

    const onVisible = (): void => {
      if (document.visibilityState === 'visible') {
        void loadBilling()
      }
    }

    window.addEventListener('focus', onVisible)
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.removeEventListener('focus', onVisible)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [orgId, loadBilling])

  const refreshSubscription = async (): Promise<void> => {
    const subscriptionId = entitlements?.subscription?.subscriptionId

    setLoading(true)
    // If we have a subscription ID, push an explicit sync to Microsoft first.
    // If not, just reload — the org's subscription state may have changed.
    if (subscriptionId) {
      await refreshMarketplaceSubscription(subscriptionId)
    }
    // Pass false so loadBilling skips the auto-sync — we just did it above.
    await loadBilling(false)
  }

  return (
    <PageContainer>
      <main className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">
              Organization billing
            </h1>
            <p className="text-muted-foreground text-sm">
              {orgInfo?.name || 'Current organization'} subscription, usage, and
              Microsoft Marketplace status.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={refreshSubscription}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {loading ? 'Refreshing…' : 'Refresh status'}
            </Button>
            {manageUrl && (
              <Button asChild>
                <a href={manageUrl} target="_blank" rel="noreferrer">
                  Manage in Microsoft
                </a>
              </Button>
            )}
          </div>
        </div>

        {error && (
          <MarketplaceStatusBanner
            subscriptionStatus={entitlements?.subscription?.status}
            blockedReason={error}
          />
        )}

        <MarketplacePlanSummary subscription={subscription || undefined} />

        <MarketplacePricingCard />

        <PlanLimitsCard limits={entitlements?.limits} />

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle>Usage and metering</CardTitle>
            <CardDescription>
              Microsoft invoices and payment methods stay in Microsoft
              Marketplace. Studio only mirrors entitlement and usage status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && (
              <p className="text-muted-foreground text-sm">
                Loading billing usage...
              </p>
            )}
            {!loading && (
              <UsageMeterTable dimensions={usageSummary?.dimensions || []} />
            )}
          </CardContent>
        </Card>
      </main>
    </PageContainer>
  )
}
