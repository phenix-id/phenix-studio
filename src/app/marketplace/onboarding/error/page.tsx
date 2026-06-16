import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { pathRoutes } from '@/config/pathRoutes'

export const metadata = {
  title: 'Marketplace onboarding error',
}

export default function MarketplaceErrorPage(): React.JSX.Element {
  return (
    <div className="flex h-screen items-center justify-center overflow-y-auto bg-[image:var(--card-gradient)] p-6">
      <div className="bg-card border-border w-full max-w-md overflow-hidden rounded-xl border shadow-xl">
        <div className="flex flex-col items-center gap-6 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
            <AlertTriangle
              className="h-9 w-9 text-amber-500"
              strokeWidth={1.5}
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-normal">
              Marketplace onboarding needs attention
            </h1>
            <p className="text-muted-foreground text-sm leading-6">
              Reopen Configure account or Manage account from Microsoft, then
              retry the Marketplace landing page. If activation already started,
              contact support with your Marketplace subscription ID.
            </p>
          </div>
          <Button asChild className="w-full sm:w-fit">
            <Link href={pathRoutes.marketplace.landing}>Return to landing</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
