import { OnboardingWizard } from '@/components/Marketplace/OnboardingWizard'
import { Suspense } from 'react'

export const metadata = {
  title: 'Marketplace onboarding',
}

export default function MarketplaceOnboardingPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center p-6">
          Loading Marketplace onboarding...
        </main>
      }
    >
      <OnboardingWizard />
    </Suspense>
  )
}
