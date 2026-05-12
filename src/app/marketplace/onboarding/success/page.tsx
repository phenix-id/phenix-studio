import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { pathRoutes } from '@/config/pathRoutes'

export const metadata = {
  title: 'Marketplace activated',
}

export default function MarketplaceSuccessPage(): React.JSX.Element {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold tracking-normal">
        Marketplace subscription activated
      </h1>
      <p className="text-muted-foreground text-sm">
        Phenix ID Platform is linked to your organization. You can now continue
        to the organization workspace and complete wallet, DID, schema,
        issuance, and verification setup.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href={pathRoutes.organizations.dashboard}>Open dashboard</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={pathRoutes.organizations.billing}>View billing</Link>
        </Button>
      </div>
    </main>
  )
}
