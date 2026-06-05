'use client'

import { ExternalLink, Loader2, RefreshCw, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { marketplaceCodeMessage } from '@/config/marketplaceErrors'
import { useState } from 'react'

const MANAGE_URL = process.env.NEXT_PUBLIC_MARKETPLACE_MANAGE_URL

interface PlanLimitNoticeProps {
  /** Backend marketplace code (e.g. marketplace_org_limit_reached). */
  readonly code?: string | null
  /** Backend message, used as fallback copy when the code is unknown. */
  readonly message?: string | null
  /** Optional override for the heading. */
  readonly title?: string
  /**
   * Called when the user clicks "I've upgraded — Refresh" so the caller can re-fetch
   * entitlements / retry. Awaited to show a spinner. Omit to hide the refresh button.
   */
  readonly onRefresh?: () => void | Promise<void>
  readonly className?: string
}

/**
 * Shown when an action is blocked by a Microsoft Marketplace plan limit (or another
 * subscription gate). Replaces a plain error message with actionable CTAs: manage/upgrade
 * the subscription in Microsoft, and refresh once the change has been made. Plan changes
 * apply immediately backend-side (entitlements are computed live), so refreshing — or
 * simply returning to the tab — reflects the new plan.
 */
export function PlanLimitNotice({
  code,
  message,
  title = 'Plan limit reached',
  onRefresh,
  className,
}: PlanLimitNoticeProps): React.JSX.Element {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async (): Promise<void> => {
    if (!onRefresh) {
      return
    }
    setRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div
      className={`rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200 ${
        className || ''
      }`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="flex flex-col gap-3">
          <div>
            <p className="font-semibold">{title}</p>
            <p className="mt-0.5">{marketplaceCodeMessage(code, message)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {MANAGE_URL && (
              <Button asChild size="sm">
                <a href={MANAGE_URL} target="_blank" rel="noopener noreferrer">
                  Manage subscription in Microsoft
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            )}
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                I&apos;ve upgraded — Refresh
              </Button>
            )}
          </div>
          {!MANAGE_URL && (
            <p className="text-xs">
              Subscription management link is not configured. Set
              <code className="mx-1">NEXT_PUBLIC_MARKETPLACE_MANAGE_URL</code>
              to enable the manage button.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
