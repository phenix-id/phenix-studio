'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  MarketplaceEntitlements,
  MarketplaceMeteringEvent,
  MarketplaceSubscriptionSummary,
  MarketplaceUsageSummary,
  getMarketplaceSubscription,
  getOrgEntitlements,
  getOrgMeteringEvents,
  getOrgUsageSummary,
  refreshMarketplaceSubscription,
} from '@/app/api/marketplace'
import { useCallback, useEffect, useState } from 'react'
import { AxiosResponse } from 'axios'
import { Button } from '@/components/ui/button'
import { MarketplacePlanSummary } from './MarketplacePlanSummary'
import { MarketplaceStatusBanner } from './MarketplaceStatusBanner'
import { UsageMeterTable } from './UsageMeterTable'
import { useAppSelector } from '@/lib/hooks'

function extractData<T>(response: AxiosResponse | string): T | null {
  if (typeof response === 'string') {
    return null
  }

  const envelope = response.data as { data?: T }
  return envelope.data || null
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
  const [meteringEvents, setMeteringEvents] = useState<
    MarketplaceMeteringEvent[]
  >([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const manageUrl = process.env.NEXT_PUBLIC_MARKETPLACE_MANAGE_URL

  const loadBilling = useCallback(async (): Promise<void> => {
    if (!orgId) {
      setError('Select an organization to view Marketplace billing.')
      return
    }

    setLoading(true)
    setError(null)

    const entitlementsResponse = await getOrgEntitlements(orgId)
    const entitlementData =
      extractData<MarketplaceEntitlements>(entitlementsResponse)

    if (!entitlementData) {
      setError(
        typeof entitlementsResponse === 'string'
          ? entitlementsResponse
          : 'Unable to load Marketplace entitlements.',
      )
      setLoading(false)
      return
    }

    setEntitlements(entitlementData)

    if (entitlementData.subscription?.subscriptionId) {
      const subscriptionResponse = await getMarketplaceSubscription(
        entitlementData.subscription.subscriptionId,
      )
      setSubscription(
        extractData<MarketplaceSubscriptionSummary>(subscriptionResponse),
      )
    }

    const usageResponse = await getOrgUsageSummary(orgId)
    setUsageSummary(extractData<MarketplaceUsageSummary>(usageResponse))

    const eventsResponse = await getOrgMeteringEvents(orgId)
    setMeteringEvents(
      extractData<MarketplaceMeteringEvent[]>(eventsResponse) || [],
    )

    setLoading(false)
  }, [orgId])

  useEffect(() => {
    loadBilling()
  }, [loadBilling])

  const refreshSubscription = async (): Promise<void> => {
    const subscriptionId = entitlements?.subscription?.subscriptionId
    if (!subscriptionId) {
      return
    }

    setLoading(true)
    await refreshMarketplaceSubscription(subscriptionId)
    await loadBilling()
  }

  return (
    <main className="space-y-6 p-4 sm:p-6">
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
            disabled={loading || !entitlements?.subscription?.subscriptionId}
          >
            Refresh status
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

      {!error && entitlements && (
        <MarketplaceStatusBanner
          subscriptionStatus={entitlements.subscription?.status}
          blockedReason={entitlements.blockedReason}
        />
      )}

      <MarketplacePlanSummary subscription={subscription || undefined} />

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
            <UsageMeterTable
              dimensions={usageSummary?.dimensions || []}
              events={meteringEvents}
            />
          )}
        </CardContent>
      </Card>
    </main>
  )
}
