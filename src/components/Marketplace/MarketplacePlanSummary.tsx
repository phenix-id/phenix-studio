'use client'

import { MarketplaceStatusBanner } from './MarketplaceStatusBanner'
import { MarketplaceSubscriptionSummary } from '@/app/api/marketplace'

interface MarketplacePlanSummaryProps {
  subscription?: MarketplaceSubscriptionSummary
}

const formatDate = (value?: string | null): string => {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date(value))
}

const detailRows = (
  subscription: MarketplaceSubscriptionSummary,
): [string, string][] => [
  ['Offer ID', subscription.offerId || '-'],
  ['Plan ID', subscription.planId || '-'],
  ['Subscription ID', subscription.subscriptionId || '-'],
  ['Quantity', subscription.quantity?.toString() || '-'],
  ['Purchaser', subscription.purchaserEmail || '-'],
  ['Beneficiary', subscription.beneficiaryEmail || '-'],
  ['Term start', formatDate(subscription.termStartDate)],
  ['Term end', formatDate(subscription.termEndDate)],
  ['Auto renew', subscription.autoRenew === false ? 'No' : 'Yes'],
]

export function MarketplacePlanSummary({
  subscription,
}: MarketplacePlanSummaryProps): React.JSX.Element {
  if (!subscription) {
    return (
      <div className="rounded-md border p-6">
        <p className="text-muted-foreground text-sm">
          Marketplace subscription details are not available yet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <MarketplaceStatusBanner
        subscriptionStatus={subscription.saasSubscriptionStatus}
        activationStatus={subscription.localActivationStatus}
      />

      <div className="rounded-md border">
        <div className="border-b p-4">
          <p className="text-base font-semibold">
            {subscription.subscriptionName || 'Phenix ID Platform'}
          </p>
          <p className="text-muted-foreground text-sm">
            Microsoft Marketplace SaaS subscription
          </p>
        </div>
        <dl className="bg-border grid gap-px sm:grid-cols-2">
          {detailRows(subscription).map(([label, value]) => (
            <div key={label} className="bg-background p-4">
              <dt className="text-muted-foreground text-xs font-medium uppercase">
                {label}
              </dt>
              <dd className="mt-1 text-sm break-words">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
