'use client'

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
  const { entitlements, error, isAllowed, loading } = useEntitlements(orgId)

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
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
            {entitlements?.blockedReason ||
              error ||
              'This action requires an active Marketplace subscription.'}
          </div>
        )}
      </>
    )
  }

  return <>{children}</>
}
