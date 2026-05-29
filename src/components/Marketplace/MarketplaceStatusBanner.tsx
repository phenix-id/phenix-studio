'use client'

import {
  MarketplaceActivationStatus,
  MarketplaceSubscriptionStatus,
} from '@/app/api/marketplace'

import { Badge } from '@/components/ui/badge'

interface MarketplaceStatusBannerProps {
  subscriptionStatus?: MarketplaceSubscriptionStatus
  activationStatus?: MarketplaceActivationStatus
  blockedReason?: string | null
}

const bannerCopy = {
  PendingFulfillmentStart: {
    label: 'Pending activation',
    message:
      'Finish account and organization setup to activate billing through Microsoft Marketplace.',
    className:
      'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300',
  },
  Subscribed: {
    label: 'Subscribed',
    message:
      'This organization has an active Microsoft Marketplace subscription.',
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  },
  Suspended: {
    label: 'Suspended',
    message:
      'Paid actions are paused. Read-only access remains available while billing is resolved in Microsoft.',
    className:
      'border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-700 dark:bg-orange-950 dark:text-orange-300',
  },
  Unsubscribed: {
    label: 'Unsubscribed',
    message:
      'Paid actions are disabled. Organization data remains available according to the retention policy.',
    className:
      'border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
  },
}

export function MarketplaceStatusBanner({
  subscriptionStatus,
  activationStatus,
  blockedReason,
}: MarketplaceStatusBannerProps): React.JSX.Element {
  const copy = subscriptionStatus
    ? bannerCopy[subscriptionStatus]
    : {
        label: 'Marketplace not linked',
        message:
          'Link a Microsoft Marketplace subscription before enabling paid organization actions.',
        className:
          'border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
      }

  const activationMessage =
    activationStatus === 'failed'
      ? ' Activation failed; retry from onboarding or contact support with the subscription details.'
      : ''

  return (
    <div className={`rounded-md border p-4 ${copy.className}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{copy.label}</p>
            {activationStatus && (
              <Badge variant="outline" className="border-current text-current">
                {activationStatus.replaceAll('_', ' ')}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm">
            {blockedReason || copy.message}
            {activationMessage}
          </p>
        </div>
      </div>
    </div>
  )
}
