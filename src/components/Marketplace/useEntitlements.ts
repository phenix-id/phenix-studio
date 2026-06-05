'use client'

import {
  MarketplaceEntitlements,
  getOrgEntitlements,
} from '@/app/api/marketplace'
import { useCallback, useEffect, useRef, useState } from 'react'

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

  return {
    entitlements,
    loading,
    error,
    refresh,
    isAllowed,
  }
}
