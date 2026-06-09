'use client'
/* eslint-disable sort-imports */

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import React, { useState } from 'react'
import { useSearchParams } from 'next/navigation'

import { AlertComponent } from '@/components/AlertComponent'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader } from 'lucide-react'
import SharedAgentForm from './SharedAgentForm'
import Stepper from '@/components/StepperComponent'
import { apiStatusCodes } from '@/config/CommonConstant'
import { hardNavigate } from '@/utils/navigation'
import { useAppSelector } from '@/lib/hooks'

const isValidUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )

export enum AgentType {
  SHARED = 'shared',
  DEDICATED = 'dedicated',
}

export interface WalletData {
  id: string
  orgId: string
  agentSpinUpStatus: number
  agentEndPoint: string
  tenantId: string | null
  walletName: string
}

export interface WalletResponse {
  statusCode: number
  message: string
  data: WalletData
}

const WalletSetup = (): React.JSX.Element => {
  const [alert, setAlert] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const totalSteps = 4
  const [sharedWalletResponse, setSharedWalletResponse] =
    useState<WalletResponse | null>()
  const [activeButton, setActiveButton] = useState<'skip' | 'continue' | null>(
    null,
  )
  const searchParams = useSearchParams()
  const selectedOrgId = useAppSelector((state) => state.organization.orgId)
  const orgId = (searchParams.get('orgId') || selectedOrgId || '').trim()
  const clientAlias = searchParams.get('clientAlias')
  const redirectTo = searchParams.get('redirectTo')

  const handleSharedWalletCreated = (response?: WalletResponse): void => {
    setSharedWalletResponse(response ?? null)
    if (response?.statusCode === apiStatusCodes.API_STATUS_CREATED) {
      setIsDialogOpen(true)
    } else {
      setAlert(response?.message || 'Failed to create shared wallet')
    }
  }

  const handleContinue = (): void => {
    if (!orgId || !isValidUuid(orgId)) {
      setAlert('Please select an organization before continuing.')
      hardNavigate('/organizations')
      return
    }

    const redirectUrl =
      redirectTo && clientAlias
        ? `/create-did?orgId=${orgId}&redirectTo=${encodeURIComponent(
            redirectTo,
          )}&clientAlias=${clientAlias}`
        : `/create-did?orgId=${orgId}`

    hardNavigate(redirectUrl)
  }

  const isAnyWalletCreated = Boolean(sharedWalletResponse)

  return (
    <div className="mx-auto mt-10 max-w-5xl">
      {alert && (
        <div className="mx-auto mt-6 w-full max-w-5xl" role="alert">
          <AlertComponent
            message={alert}
            type="failure"
            onAlertClose={() => setAlert(null)}
          />
        </div>
      )}

      <Card className="p-6">
        <div
          className={`${
            isAnyWalletCreated
              ? 'pointer-events-none opacity-60 select-none'
              : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Wallet type</h1>
              <p className="">Setup wallet for your organization</p>
            </div>

            <div className="text-muted-foreground text-sm">
              Step 2 of {totalSteps}
            </div>
          </div>
          <Stepper currentStep={2} totalSteps={totalSteps} />

          <div className="border-primary bg-accent dark:bg-accent rounded-2xl border p-5 shadow-md">
            <div>
              <h3 className="text-foreground mb-1 font-semibold">
                Shared Agent
              </h3>
              <p className="text-muted-foreground text-sm">
                Use our cloud-hosted shared agent infrastructure
              </p>
              <ul className="text-muted-foreground mt-2 ml-5 list-disc space-y-1 text-sm">
                <li>Cost-effective solution</li>
                <li>Managed infrastructure</li>
                <li>Quick setup with no maintenance</li>
              </ul>
            </div>
          </div>

          <div className="mt-10">
            <SharedAgentForm
              orgId={orgId}
              onSuccess={handleSharedWalletCreated}
              disabled={!orgId || !isValidUuid(orgId)}
            />
          </div>
        </div>
      </Card>

      <Dialog open={isDialogOpen}>
        <DialogTitle></DialogTitle>
        <DialogContent
          className="max-w-md rounded-2xl p-8 text-center [&>button]:hidden"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <svg
                className="h-9 w-9 text-green-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          <h2 className="text-foreground text-xl font-semibold">
            Wallet created successfully!
          </h2>

          <p className="text-muted-foreground">
            {redirectTo || clientAlias
              ? 'Proceed to DID creation to continue your setup.'
              : 'Would you like to continue with DID creation or skip it for now?'}
          </p>

          <div className="flex justify-center gap-4 pt-4">
            {!redirectTo && !clientAlias && (
              <Button
                variant="outline"
                onClick={() => {
                  setActiveButton('skip')
                  hardNavigate('/dashboard')
                }}
                className="px-6"
                disabled={activeButton !== null}
              >
                {activeButton === 'skip' ? <Loader /> : 'Skip'}
              </Button>
            )}

            <Button
              onClick={() => {
                setActiveButton('continue')
                handleContinue()
              }}
              className="px-6"
              disabled={activeButton !== null}
            >
              {activeButton === 'continue' ? <Loader /> : 'Continue'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default WalletSetup
