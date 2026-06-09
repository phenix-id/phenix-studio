'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import DynamicApplicationLogo from './DynamicLogo'
import Loader from '@/components/Loader'
import SignUpUser from './SignUpUser'
import { SubscribeRequired } from '@/components/Marketplace/SubscribeRequired'
import { useSearchParams } from 'next/navigation'
import { verifyInvitationPending } from '@/app/api/Invitation'

type GateStatus = 'loading' | 'valid' | 'invalid' | 'error'

export default function SignInPage(): React.JSX.Element {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? ''
  const invitationId = searchParams.get('invitationId')
  const email = searchParams.get('email') ?? ''
  const cameFromMarketplace = redirectTo.includes('/marketplace/landing')
  const marketplaceRequired =
    process.env.NEXT_PUBLIC_MARKETPLACE_REQUIRED === 'true'

  const needsBackendCheck =
    Boolean(invitationId) &&
    Boolean(email) &&
    marketplaceRequired &&
    !cameFromMarketplace

  const [status, setStatus] = useState<GateStatus>(
    needsBackendCheck ? 'loading' : 'invalid',
  )
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (
      !invitationId ||
      !email ||
      !marketplaceRequired ||
      cameFromMarketplace
    ) {
      return
    }
    let cancelled = false
    setStatus('loading')
    verifyInvitationPending(invitationId, email).then(({ valid, error }) => {
      if (cancelled) {
        return
      }
      setStatus(error ? 'error' : valid ? 'valid' : 'invalid')
    })
    return () => {
      cancelled = true
    }
  }, [
    invitationId,
    email,
    marketplaceRequired,
    cameFromMarketplace,
    retryCount,
  ])

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader isExpand={false} />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground text-sm">
          Unable to verify your invitation. Please try again.
        </p>
        <Button variant="outline" onClick={() => setRetryCount((c) => c + 1)}>
          Retry
        </Button>
      </div>
    )
  }

  // Full-page subscribe gate — rendered standalone so the absolute logo overlay
  // and h-screen scroll wrapper from the normal sign-up layout don't interfere.
  // Invited users bypass the gate — their org already has a subscription.
  if (marketplaceRequired && !cameFromMarketplace && status !== 'valid') {
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
        <SignUpUser invitationVerified={status === 'valid'} />
      </div>
    </div>
  )
}
