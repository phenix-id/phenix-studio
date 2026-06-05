'use client'

import { PlanLimitNotice } from './PlanLimitNotice'
import { ReactNode } from 'react'
import { useEntitlements } from './useEntitlements'

interface EntitlementGateProps {
  orgId?: string
  feature: string
  children: ReactNode
  fallback?: ReactNode
}

export function EntitlementGate({
  orgId,
  feature,
  children,
  fallback,
}: EntitlementGateProps): React.JSX.Element {
  const { entitlements, error, isAllowed, loading, refresh } =
    useEntitlements(orgId)

  if (loading) {
    return (
      <div className="text-muted-foreground rounded-md border p-4 text-sm">
        Checking Marketplace entitlement...
      </div>
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
