'use client'

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Link as LinkIcon,
  XCircle,
} from 'lucide-react'
import {
  MarketplaceActivationStatus,
  MarketplaceSubscriptionStatus,
} from '@/app/api/marketplace'
import type { ElementType } from 'react'

interface MarketplaceStatusBannerProps {
  subscriptionStatus?: MarketplaceSubscriptionStatus
  activationStatus?: MarketplaceActivationStatus
  blockedReason?: string | null
}

interface BannerConfig {
  label: string
  message: string
  className: string
  Icon: ElementType
}

const bannerConfig: Record<MarketplaceSubscriptionStatus, BannerConfig> = {
  PendingFulfillmentStart: {
    label: 'Pending activation',
    message:
      'Finish account and organization setup to activate billing through Microsoft Marketplace.',
    className:
      'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300',
    Icon: Clock,
  },
  Subscribed: {
    label: 'Subscribed',
    message:
      'This organization has an active Microsoft Marketplace subscription.',
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    Icon: CheckCircle2,
  },
  Suspended: {
    label: 'Suspended',
    message:
      'Paid actions are paused. Read-only access remains while billing is resolved in Microsoft.',
    className:
      'border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-700 dark:bg-orange-950 dark:text-orange-300',
    Icon: AlertTriangle,
  },
  Unsubscribed: {
    label: 'Unsubscribed',
    message:
      'Paid actions are disabled. Organization data remains available per the retention policy.',
    className:
      'border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
    Icon: XCircle,
  },
}

const notLinkedConfig: BannerConfig = {
  label: 'Marketplace not linked',
  message:
    'Link a Microsoft Marketplace subscription before enabling paid organization actions.',
  className:
    'border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
  Icon: LinkIcon,
}

interface ActivationBadge {
  label: string
  className: string
}

// Only shown for non-terminal, non-success activation states.
// 'activated' is implied by 'Subscribed' and adds no value to the UI.
function getActivationBadge(
  status: MarketplaceActivationStatus,
): ActivationBadge | null {
  if (status === 'in_progress') {
    return {
      label: 'Activating…',
      className:
        'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
    }
  }
  if (status === 'not_started') {
    return {
      label: 'Not started',
      className:
        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    }
  }
  if (status === 'failed') {
    return {
      label: 'Activation failed',
      className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    }
  }
  return null
}

export function MarketplaceStatusBanner({
  subscriptionStatus,
  activationStatus,
  blockedReason,
}: MarketplaceStatusBannerProps): React.JSX.Element {
  const config = subscriptionStatus
    ? bannerConfig[subscriptionStatus]
    : notLinkedConfig
  const { label, message, className, Icon } = config

  const badge =
    activationStatus && activationStatus !== 'activated'
      ? getActivationBadge(activationStatus)
      : null

  return (
    <div className={`rounded-lg border p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm leading-none font-semibold">{label}</p>
            {badge && (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
              >
                {badge.label}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm leading-relaxed opacity-90">
            {blockedReason || message}
            {activationStatus === 'failed' &&
              ' Retry from onboarding or contact support with the subscription ID.'}
          </p>
        </div>
      </div>
    </div>
  )
}
