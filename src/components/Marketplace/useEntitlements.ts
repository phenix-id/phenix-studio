'use client'

import {
  MarketplaceEntitlements,
  getOrgEntitlements,
  refreshMarketplaceSubscription,
} from '@/app/api/marketplace'
import { useCallback, useEffect, useRef, useState } from 'react'

import { AxiosResponse } from 'axios'

interface UseEntitlementsResult {
  entitlements: MarketplaceEntitlements | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  isAllowed: (feature: string) => boolean
  isUsageLimitReached: (dimension: string) => boolean
  usageLimitCode: (dimension: string) => string | null
}

const extractData = <T>(response: AxiosResponse | string): T | null => {
  if (typeof response === 'string') {
    return null
  }

  const envelope = response.data as { data?: T }
  return envelope.data || null
}

export const useEntitlements = (orgId?: string): UseEntitlementsResult => {
  const [entitlements, setEntitlements] =
    useState<MarketplaceEntitlements | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Guards against overlapping fetches: this hook can be mounted by several
  // EntitlementGates at once, and a focus/visibility burst could otherwise fire
  // multiple concurrent requests for the same org.
  const inFlightRef = useRef(false)

  const refresh = useCallback(async (): Promise<void> => {
    if (!orgId) {
      setEntitlements(null)
      return
    }

    if (inFlightRef.current) {
      return
    }
    inFlightRef.current = true

    setLoading(true)
    setError(null)
    const response = await getOrgEntitlements(orgId)
    const data = extractData<MarketplaceEntitlements>(response)

    if (!data) {
      setError(
        typeof response === 'string'
          ? response
          : 'Unable to load Marketplace entitlements.',
      )
      setLoading(false)
      inFlightRef.current = false
      return
    }

    // Auto-sync with Microsoft when the subscription is linked but the status
    // hasn't propagated to 'Subscribed' yet — covers the window right after
    // Marketplace onboarding before the backend processes the webhook.
    // Once status is 'Subscribed' this branch never runs again.
    if (
      data.subscription?.subscriptionId &&
      data.subscription.status !== 'Subscribed'
    ) {
      await refreshMarketplaceSubscription(data.subscription.subscriptionId)
      const syncedResponse = await getOrgEntitlements(orgId)
      const syncedData = extractData<MarketplaceEntitlements>(syncedResponse)
      setEntitlements(syncedData ?? data)
      setLoading(false)
      inFlightRef.current = false
      return
    }

    setEntitlements(data)
    setLoading(false)
    inFlightRef.current = false
  }, [orgId])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Re-fetch entitlements when the user returns to the tab. After upgrading/changing the
  // plan in Microsoft, the ChangePlan webhook updates the plan immediately backend-side;
  // refreshing on return reflects the new plan without a manual reload.
  useEffect(() => {
    if (!orgId) {
      return
    }

    const onFocus = (): void => {
      void refresh()
    }
    const onVisible = (): void => {
      if (document.visibilityState === 'visible') {
        void refresh()
      }
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [orgId, refresh])

  const isAllowed = useCallback(
    (feature: string): boolean => Boolean(entitlements?.features?.[feature]),
    [entitlements],
  )

  // Returns true when the usage for a billing dimension has reached the plan's
  // included allowance (e.g. issuance_txn, verification_txn, schema_create).
  // Used by EntitlementGate to pre-check transactional limits before the form renders.
  const isUsageLimitReached = useCallback(
    (dimension: string): boolean => {
      const usage = entitlements?.usage?.[dimension]
      if (!usage || usage.included === null || usage.included === undefined) {
        return false
      }
      return Number(usage.used ?? 0) >= Number(usage.included)
    },
    [entitlements],
  )

  // Returns the machine-readable code to pass to PlanLimitNotice for a dimension.
  const usageLimitCode = useCallback(
    (dimension: string): string | null => {
      if (!isUsageLimitReached(dimension)) {
        return null
      }
      // eslint-disable-next-line camelcase
      const codeByDimension: Record<string, string> = {
        /* eslint-disable camelcase */
        issuance_txn: 'marketplace_issuance_limit_reached',
        verification_txn: 'marketplace_verification_limit_reached',
        schema_create: 'marketplace_schema_limit_reached',
        /* eslint-enable camelcase */
      }
      return codeByDimension[dimension] ?? 'marketplace_feature_not_allowed'
    },
    [isUsageLimitReached],
  )

  return {
    entitlements,
    loading,
    error,
    refresh,
    isAllowed,
    isUsageLimitReached,
    usageLimitCode,
  }
}
