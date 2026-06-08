'use client'

import React, { useEffect, useState } from 'react'
import DynamicApplicationLogo from './DynamicLogo'
import SignUpUser from './SignUpUser'
import { SubscribeRequired } from '@/components/Marketplace/SubscribeRequired'
import { useSearchParams } from 'next/navigation'
import { verifyInvitationPending } from '@/app/api/Invitation'

export default function SignInPage(): React.JSX.Element {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? ''
  const invitationId = searchParams.get('invitationId')
  const email = searchParams.get('email') ?? ''
  const cameFromMarketplace = redirectTo.includes('/marketplace/landing')
  const marketplaceRequired =
    process.env.NEXT_PUBLIC_MARKETPLACE_REQUIRED === 'true'

  // null = still checking, true/false = result from backend
  const [invitationValid, setInvitationValid] = useState<boolean | null>(
    invitationId ? null : false,
  )

  useEffect(() => {
    if (!invitationId || !marketplaceRequired || cameFromMarketplace) {
      return
    }
    verifyInvitationPending(invitationId, email).then(({ valid }) => {
      setInvitationValid(valid)
    })
  }, [invitationId, email, marketplaceRequired, cameFromMarketplace])

  // While the backend check is in flight, render nothing to avoid a flash of the gate.
  if (invitationValid === null) {
    return <></>
  }

  // Full-page subscribe gate — rendered standalone so the absolute logo overlay
  // and h-screen scroll wrapper from the normal sign-up layout don't interfere.
  // Invited users bypass the gate — their org already has a subscription.
  if (marketplaceRequired && !cameFromMarketplace && !invitationValid) {
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
