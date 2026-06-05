'use client'

import { PlanLimitNotice } from './PlanLimitNotice'
import { ReactNode } from 'react'
import { useEntitlements } from './useEntitlements'

interface EntitlementGateProps {
  orgId?: string
  feature: string
  /**
   * Optional billing usage dimension to also check (e.g. 'issuance_txn',
   * 'verification_txn', 'schema_create'). When set, the gate blocks if the
   * dimension's monthly usage has reached the plan's included allowance, even
   * if the feature flag itself is still enabled. This enables pre-flight limit
   * checks before the form renders, so users never fill out a form they can't submit.
   */
  usageDimension?: string
  children: ReactNode
  fallback?: ReactNode
}

export function EntitlementGate({
  orgId,
  feature,
  usageDimension,
  children,
  fallback,
}: EntitlementGateProps): React.JSX.Element {
  const {
    entitlements,
    error,
    isAllowed,
    loading,
    refresh,
    isUsageLimitReached,
    usageLimitCode,
  } = useEntitlements(orgId)

  // Only block render on the very first load (entitlements not yet fetched).
  // Background refreshes triggered by tab-focus must NOT unmount children —
  // doing so would destroy in-progress UI state (e.g. a generated QR code).
  if (loading && !entitlements) {
    return (
      <div className="text-muted-foreground rounded-md border p-4 text-sm">
        Checking Marketplace entitlement...
      </div>
    )
  }

  // Usage-dimension limit reached (e.g. issuance_txn, schema_create) — block even
  // when the feature flag is enabled, so the limit CTA shows before the form renders.
  const limitFromUsage =
    usageDimension && isUsageLimitReached(usageDimension)
      ? usageLimitCode(usageDimension)
      : null

  if (limitFromUsage) {
    return (
      <>
        {fallback || (
          <PlanLimitNotice code={limitFromUsage} onRefresh={refresh} />
        )}
      </>
    )
  }

  if (!orgId || error || !isAllowed(feature)) {
    return (
      <>
        {fallback || (
          <PlanLimitNotice
            title="Subscription required"
            code={entitlements?.blockedReason}
            message={error}
            onRefresh={refresh}
          />
        )}
      </>
    )
  }

  return <>{children}</>
}
