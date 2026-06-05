'use client'

import {
  MarketplaceEntitlements,
  getOrgEntitlements,
  refreshMarketplaceSubscription,
} from '@/app/api/marketplace'
import { useCallback, useEffect, useState } from 'react'

import { AxiosResponse } from 'axios'

interface UseEntitlementsResult {
  entitlements: MarketplaceEntitlements | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  isAllowed: (feature: string) => boolean
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

  const refresh = useCallback(async (): Promise<void> => {
    if (!orgId) {
      setEntitlements(null)
      return
    }

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
      return
    }

    setEntitlements(data)
    setLoading(false)
  }, [orgId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const isAllowed = useCallback(
    (feature: string): boolean => Boolean(entitlements?.features?.[feature]),
    [entitlements],
  )

  return {
    entitlements,
    loading,
    error,
    refresh,
    isAllowed,
  }
}
