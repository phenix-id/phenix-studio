import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { pathRoutes } from '@/config/pathRoutes'

export const metadata = {
  title: 'Marketplace activated',
}

export default function MarketplaceSuccessPage(): React.JSX.Element {
  return (
    <div className="flex h-screen items-center justify-center overflow-y-auto bg-[image:var(--card-gradient)] p-6">
      <div className="bg-card border-border w-full max-w-md overflow-hidden rounded-xl border shadow-xl">
        <div className="flex flex-col items-center gap-6 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle2
              className="h-9 w-9 text-green-500"
              strokeWidth={1.5}
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-normal">
              Marketplace subscription activated
            </h1>
            <p className="text-muted-foreground text-sm leading-6">
              PHENIX ID is linked to your organization. You can now continue to
              the organization workspace and complete wallet, DID, schema,
              issuance, and verification setup.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href={pathRoutes.organizations.dashboard}>
                Open dashboard
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={pathRoutes.organizations.billing}>View billing</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
