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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  marketplacePlanCatalog,
  marketplaceSetupFeeUsd,
} from '@/config/marketplacePlans'
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
        <CardDescription>
          A one-time setup fee of {formatUsd(marketplaceSetupFeeUsd)} is billed
          during the first organization setup. Standard monthly plan billing
          applies from the next billing month.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
