import { MarketplaceLanding } from '@/components/Marketplace/Landing'
import { Suspense } from 'react'

export const metadata = {
  title: 'Marketplace landing',
}

export default function MarketplaceLandingPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center p-6">
          Loading Marketplace landing...
        </main>
      }
    >
      <MarketplaceLanding />
    </Suspense>
  )
}
