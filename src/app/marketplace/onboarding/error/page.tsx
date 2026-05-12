import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { pathRoutes } from '@/config/pathRoutes'

export const metadata = {
  title: 'Marketplace onboarding error',
}

export default function MarketplaceErrorPage(): React.JSX.Element {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold tracking-normal">
        Marketplace onboarding needs attention
      </h1>
      <p className="text-muted-foreground text-sm">
        Reopen Configure account or Manage account from Microsoft, then retry
        the Marketplace landing page. If activation already started, contact
        support with your Marketplace subscription ID.
      </p>
      <Button asChild className="w-fit">
        <Link href={pathRoutes.marketplace.landing}>Return to landing</Link>
      </Button>
    </main>
  )
}
