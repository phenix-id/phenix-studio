'use client'

import DynamicApplicationLogo from './DynamicLogo'
import React from 'react'
import SignUpUser from './SignUpUser'
import { SubscribeRequired } from '@/components/Marketplace/SubscribeRequired'
import { useSearchParams } from 'next/navigation'

export default function SignInPage(): React.JSX.Element {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? ''
  const cameFromMarketplace = redirectTo.includes('/marketplace/landing')
  const marketplaceRequired =
    process.env.NEXT_PUBLIC_MARKETPLACE_REQUIRED === 'true'

  // Full-page subscribe gate — rendered standalone so the absolute logo overlay
  // and h-screen scroll wrapper from the normal sign-up layout don't interfere.
  if (marketplaceRequired && !cameFromMarketplace) {
    return (
      <SubscribeRequired
        fullPage
        title="Subscribe to get started"
        description="PHENIX ID is available through the Microsoft commercial marketplace. Subscribe on Microsoft to get started — after purchase you'll be brought back here to create your account."
      />
    )
  }

  return (
    <div className="relative flex h-screen flex-col overflow-y-auto bg-[image:var(--card-gradient)]">
      <div className="absolute top-4 left-4 z-20">
        <DynamicApplicationLogo />
      </div>
      <div className="relative flex w-full flex-1 items-center justify-center bg-[image:var(--card-gradient)]">
        <SignUpUser />
      </div>
    </div>
  )
}
