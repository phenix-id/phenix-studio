'use client'

import { ExternalLink, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import PageContainer from '@/components/layout/page-container'

const OFFER_URL = process.env.NEXT_PUBLIC_MARKETPLACE_OFFER_URL
const MANAGE_URL = process.env.NEXT_PUBLIC_MARKETPLACE_MANAGE_URL
const PRODUCT_NAME =
  process.env.NEXT_PUBLIC_MARKETPLACE_PRODUCT_NAME || 'Phenix ID Platform'

interface SubscribeRequiredProps {
  readonly title?: string
  readonly description?: string
}

/**
 * Shown when access requires a Microsoft Marketplace subscription (e.g. creating an
 * organization, or signing up as a net-new customer). The Marketplace is the only
 * supported source of subscriptions, so this funnels the user to the Azure offer
 * listing. The backend (MarketplaceSubscriptionRequiredGuard) is the actual
 * enforcement point. `title`/`description` let callers tailor the copy.
 */
export function SubscribeRequired({
  title = 'Subscription required',
  description = `Creating an organization on ${PRODUCT_NAME} requires an active Microsoft Marketplace subscription. Subscribe on the Microsoft commercial marketplace, then return here to finish onboarding — your purchase token will be resolved automatically.`,
}: SubscribeRequiredProps = {}): React.JSX.Element {
  return (
    <PageContainer>
      <div className="flex min-h-screen items-start justify-center p-6">
        <Card className="border-border w-full max-w-[640px] overflow-hidden rounded-xl border p-8 shadow-xl">
          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="text-primary mt-0.5 h-6 w-6 shrink-0" />
              <div>
                <h1 className="text-2xl font-semibold tracking-normal">
                  {title}
                </h1>
                <p className="text-muted-foreground mt-2 text-sm">
                  {description}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {OFFER_URL && (
                <Button asChild>
                  <a href={OFFER_URL} target="_blank" rel="noopener noreferrer">
                    Get it on Microsoft Marketplace
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              )}
              {MANAGE_URL && (
                <Button variant="outline" asChild>
                  <a
                    href={MANAGE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Manage existing subscription
                  </a>
                </Button>
              )}
            </div>

            {!OFFER_URL && (
              <p className="text-muted-foreground text-xs">
                Marketplace offer link is not configured. Set
                <code className="mx-1">NEXT_PUBLIC_MARKETPLACE_OFFER_URL</code>
                to enable the subscribe button.
              </p>
            )}
          </div>
        </Card>
      </div>
    </PageContainer>
  )
}
