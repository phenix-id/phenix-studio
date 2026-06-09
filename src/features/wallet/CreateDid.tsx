'use client'
/* eslint-disable sort-imports, max-lines, @typescript-eslint/no-use-before-define */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { InfoText, apiStatusCodes } from '@/config/CommonConstant'
import React, { useEffect, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  didExamples,
  didOptionsMap,
  protocolOptions,
  subOptionsMap,
} from '@/config/didOptions'
import { useSearchParams } from 'next/navigation'

import { AlertComponent } from '@/components/AlertComponent'
import type { AxiosResponse } from 'axios'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Check, Copy, Download } from 'lucide-react'
import { DidMethod } from '@/common/enums'
import PageContainer from '@/components/layout/page-container'
import SetDomainValueInput from './SetDomainValueInput'
import SetPrivateKeyValueInput from './SetPrivateKeyValue'
import Stepper from '@/components/StepperComponent'
import TooltipInfo from '@/components/TooltipInfo'
import { createDid, generateDidWeb } from '@/app/api/Agent'
import { getOrganizationById } from '@/app/api/organization'
import { hardNavigate } from '@/utils/navigation'
import { useAppSelector } from '@/lib/hooks'
import { nanoid } from 'nanoid'

const isValidUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )

const normalizeDomain = (value: string): string =>
  value
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .replace(/\/$/, '')

const isValidDomain = (value: string): boolean =>
  /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/.test(
    value,
  )

const CreateDid = (): React.JSX.Element => {
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(
    'didcomm',
  )
  const [selectedOption, setSelectedOption] = useState<string | null>('w3c')
  const [isApiInProgress, setIsApiInProgress] = useState<boolean>(false)
  const [selectedDid, setSelectedDid] = useState<string | null>(null)
  const [seeds, setSeeds] = useState<string>('')
  const [privateKeyValue, setPrivateKeyValue] = useState<string>('')
  const [alert, setAlert] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [domainValue, setDomainValue] = useState<string>('')
  const [domainError, setDomainError] = useState<string | null>(null)
  type Protocol = 'didcomm' | 'oid4vp'
  const [step, setStep] = useState(3)

  // did:web two-step flow state
  type WebFlowState = 'idle' | 'generating' | 'generated'
  const [webFlowState, setWebFlowState] = useState<WebFlowState>('idle')
  const [generatedDidDoc, setGeneratedDidDoc] = useState<Record<
    string,
    unknown
  > | null>(null)
  const [isHostingConfirmed, setIsHostingConfirmed] = useState(false)
  const [didDocCopied, setDidDocCopied] = useState(false)

  const totalSteps = 4
  const searchParams = useSearchParams()
  const selectedOrgId = useAppSelector((state) => state.organization.orgId)
  const orgId = (searchParams.get('orgId') || selectedOrgId || '').trim()
  const redirectTo = searchParams.get('redirectTo')
  const clientAlias = searchParams.get('clientAlias')

  useEffect(() => {
    const generatedSeeds = nanoid(32)
    setSeeds(generatedSeeds)
  }, [])

  // Reset the did:web generate flow whenever the domain input changes
  useEffect(() => {
    setWebFlowState('idle')
    setGeneratedDidDoc(null)
    setIsHostingConfirmed(false)
  }, [domainValue])

  useEffect(() => {
    const ensureWalletExists = async (): Promise<void> => {
      if (!orgId) {
        return
      }

      if (!isValidUuid(orgId)) {
        setAlert('Please select an organization before creating a DID.')
        setTimeout(() => hardNavigate('/organizations'), 800)
        return
      }

      try {
        const response = await getOrganizationById(orgId)
        const { data } = response as AxiosResponse
        const hasWallet = data?.data?.org_agents?.some(
          (agent: { tenantId?: string | null; walletName?: string | null }) =>
            Boolean(agent?.tenantId || agent?.walletName),
        )

        if (
          data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS &&
          !hasWallet
        ) {
          setAlert(
            'Please create an organization wallet before creating a DID.',
          )
          setTimeout(() => hardNavigate(`/wallet-setup?orgId=${orgId}`), 800)
        }
      } catch (error) {
        console.error('Error checking organization wallet:', error)
      }
    }

    ensureWalletExists()
  }, [orgId])

  const validateForm = (): boolean => {
    setDomainError(null)

    let isValid = true

    if (selectedDid === 'did:web') {
      if (!domainValue.trim()) {
        setDomainError('Domain is required')
        isValid = false
      } else if (!isValidDomain(domainValue)) {
        setDomainError(
          'Please enter a valid domain without protocol or path (e.g., example.com)',
        )
        isValid = false
      }
    }

    if (!selectedDid) {
      setAlert('Please select a DID method before continuing.')
      isValid = false
    }

    return isValid
  }
  const handleSubmit = async (): Promise<void> => {
    if (!orgId || !isValidUuid(orgId)) {
      setAlert('Please select an organization before creating a DID.')
      setTimeout(() => hardNavigate('/organizations'), 800)
      return
    }

    if (!validateForm()) {
      return
    }

    // did:web Step 1 — generate the document first; user must host it before create
    if (selectedDid === 'did:web' && webFlowState === 'idle') {
      await handleGenerateDidWeb()
      return
    }

    try {
      setStep(4)
      setIsApiInProgress(true)
      setAlert(null)
      setSuccess(null)

      const didParts = selectedDid!.split(':')
      const [didPrefix, method] = didParts
      const fullMethod = `${didPrefix}:${method}`
      let network = ''

      if (fullMethod === DidMethod.INDY || fullMethod === DidMethod.POLYGON) {
        network = didParts.slice(-2).join(':')
      }

      const payload = {
        seed: fullMethod === DidMethod.POLYGON ? '' : seeds,
        keyType: 'ed25519',
        method,
        ledger: didParts[2] || '',
        privatekey: privateKeyValue,
        network,
        domain: domainValue,
        role: method === 'indy' ? 'endorser' : '',
        endorserDid: '',
        clientSocketId: '',
        isPrimaryDid: true,
      }

      const spinupRes = await createDid(orgId!, payload)
      const { data } = spinupRes as AxiosResponse

      if (data?.statusCode === apiStatusCodes.API_STATUS_CREATED) {
        const generatedDid = data?.did || data?.data?.did || data?.result?.did

        if (!generatedDid) {
          console.error('API Response:', data)
          setAlert(
            'DID created but could not retrieve DID identifier. Please check the response.',
          )
          return
        }
        setSuccess(data?.message)
        setAlert(null)

        const params = new URLSearchParams({
          protocol: selectedProtocol || '',
          credentialType: selectedOption || '',
          didMethod: selectedDid || '',
          generatedDid,
          orgId: orgId || '',
        })
        if (redirectTo && clientAlias) {
          hardNavigate(redirectTo)
        } else {
          hardNavigate(`/did-details?${params.toString()}`)
        }
      } else {
        setAlert(data?.message || 'Failed to create DID')
        setSuccess(null)
      }
    } catch (error) {
      console.error('Error creating did', error)
    } finally {
      setIsApiInProgress(false)
    }
  }

  const handleGenerateDidWeb = async (): Promise<void> => {
    setIsApiInProgress(true)
    setAlert(null)
    setWebFlowState('generating')

    const payload = {
      method: 'web',
      keyType: 'ed25519',
      domain: domainValue,
      seed: seeds,
      isPrimaryDid: false,
    }

    try {
      const res = await generateDidWeb(orgId!, payload)
      const { data } = res as AxiosResponse

      if (data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS) {
        setGeneratedDidDoc(data?.data?.didDocument)
        setWebFlowState('generated')
      } else {
        setAlert(data?.message || 'Failed to generate DID document')
        setWebFlowState('idle')
      }
    } catch {
      setAlert('Failed to generate DID document. Please try again.')
      setWebFlowState('idle')
    } finally {
      setIsApiInProgress(false)
    }
  }

  const copyDidDocument = (): void => {
    if (!generatedDidDoc) {
      return
    }
    const json = JSON.stringify(generatedDidDoc, null, 2)
    navigator.clipboard.writeText(json).then(() => {
      setDidDocCopied(true)
      setTimeout(() => setDidDocCopied(false), 2000)
    })
  }

  const downloadDidDocument = (): void => {
    if (!generatedDidDoc) {
      return
    }
    const json = JSON.stringify(generatedDidDoc, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'did.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDomainChange = (value: string): void => {
    const normalized = normalizeDomain(value)
    setDomainValue(normalized)
    if (domainError && normalized.trim()) {
      setDomainError(null)
    }
  }

  const subOptions = subOptionsMap[selectedProtocol!] ?? []
  const selectedProtocolTitle =
    protocolOptions.find((option) => option.id === selectedProtocol)?.title ??
    selectedProtocol?.toUpperCase()

  const didOptions = selectedOption ? (didOptionsMap[selectedOption] ?? []) : []

  // When only one option is active (others are commented out), render it as
  // non-interactive so the user isn't shown a clickable card with nothing to switch to.
  const activeProtocols = protocolOptions.filter((o) => !o.disabled)
  const activeSubOptions = subOptions.filter((o) => !o.disabled)

  return (
    <PageContainer>
      <div className="bg-background min-h-screen p-6 md:p-10">
        <div className="mx-auto max-w-4xl space-y-8">
          <Card className="border-border border shadow-sm">
            <CardHeader className="border-border bg-background border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-foreground text-2xl font-semibold">
                    Wallet type
                  </h1>
                  <p className="text-muted-foreground">
                    Setup wallet for your organization
                  </p>
                </div>

                <div className="text-muted-foreground text-sm">
                  Step {step} of {totalSteps}
                </div>
              </div>

              <Stepper currentStep={step} totalSteps={totalSteps} />

              <CardTitle className="text-foreground text-lg font-semibold">
                Select Protocol
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm">
                Choose the protocol to issue your credential.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              <div
                className={`mb-8 grid gap-4 ${activeProtocols.length === 1 ? 'grid-cols-1' : 'md:grid-cols-2'}`}
              >
                {protocolOptions.map((option) => {
                  if (option.disabled) {
                    return (
                      <div
                        key={option.id}
                        className="border-border bg-background relative cursor-not-allowed rounded-xl border-2 p-6 text-left opacity-60"
                      >
                        <span className="bg-muted text-muted-foreground absolute top-3 right-3 rounded-full px-2 py-0.5 text-xs font-medium">
                          Coming Soon
                        </span>

                        <div className="mb-6">{option.icon}</div>

                        <h3 className="text-foreground mb-1 font-semibold">
                          {option.title}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {option.desc}
                        </p>
                      </div>
                    )
                  }

                  // Single active protocol — render as non-interactive pre-selected card
                  if (activeProtocols.length === 1) {
                    return (
                      <div
                        key={option.id}
                        className="border-primary bg-secondary relative cursor-default rounded-xl border-2 p-6 text-left shadow-sm"
                      >
                        {option.id === 'didcomm' && (
                          <TooltipInfo text={InfoText.DIDCommInfoText} />
                        )}
                        {option.id === 'oid4vp' && (
                          <TooltipInfo text={InfoText.OpenID4VPInfoText} />
                        )}

                        <div className="mb-6">{option.icon}</div>

                        <div className="mb-1 flex items-center gap-2">
                          <h3 className="text-foreground font-semibold">
                            {option.title}
                          </h3>
                          <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs font-medium">
                            Selected
                          </span>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {option.desc}
                        </p>
                      </div>
                    )
                  }

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setSelectedProtocol(option.id as Protocol)
                        setSelectedOption(null)
                        setSelectedDid(null)
                        setDomainError(null)
                      }}
                      className={`relative rounded-xl border-2 p-6 text-left transition-all ${selectedProtocol === option.id ? 'border-primary bg-secondary shadow-sm' : 'border-border bg-background hover:shadow-sm'}`}
                    >
                      {option.id === 'didcomm' && (
                        <TooltipInfo text={InfoText.DIDCommInfoText} />
                      )}
                      {option.id === 'oid4vp' && (
                        <TooltipInfo text={InfoText.OpenID4VPInfoText} />
                      )}

                      <div className="mb-6">{option.icon}</div>

                      <div className="mb-1 flex items-center gap-2">
                        <h3 className="text-foreground font-semibold">
                          {option.title}
                        </h3>
                        {selectedProtocol === option.id && (
                          <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs font-medium">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {option.desc}
                      </p>
                    </button>
                  )
                })}
              </div>

              {selectedProtocol && (
                <div className="border-border -mx-6 mt-6 border-t px-6 pt-6">
                  <p className="text-foreground mb-2 font-medium">
                    Select Credential Format for {selectedProtocolTitle}
                  </p>

                  <div
                    className={`grid gap-4 ${activeSubOptions.length === 1 ? 'grid-cols-1' : 'md:grid-cols-2'}`}
                  >
                    {subOptions.map((option) => {
                      if (option.disabled) {
                        return (
                          <div
                            key={option.id}
                            className="border-border bg-background relative cursor-not-allowed rounded-xl border-2 p-6 text-left opacity-60"
                          >
                            <span className="bg-muted text-muted-foreground absolute top-3 right-3 rounded-full px-2 py-0.5 text-xs font-medium">
                              Coming Soon
                            </span>

                            <h3 className="text-foreground mb-1 font-semibold">
                              {option.title}
                            </h3>
                            <p className="text-muted-foreground text-sm">
                              {option.desc}
                            </p>
                          </div>
                        )
                      }

                      // Single active format — render as non-interactive pre-selected card
                      if (activeSubOptions.length === 1) {
                        return (
                          <div
                            key={option.id}
                            className="border-primary bg-secondary relative cursor-default rounded-xl border-2 p-6 text-left shadow-sm"
                          >
                            <TooltipInfo text={option.tooltip} />
                            <div className="mb-1 flex items-center gap-2">
                              <h3 className="text-foreground font-semibold">
                                {option.title}
                              </h3>
                              <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs font-medium">
                                Selected
                              </span>
                            </div>
                            <p className="text-muted-foreground text-sm">
                              {option.desc}
                            </p>
                          </div>
                        )
                      }

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            setSelectedOption(option.id)
                            setSelectedDid(null)
                            setDomainError(null)
                          }}
                          className={`relative rounded-xl border-2 p-6 text-left transition-all ${
                            selectedOption === option.id
                              ? 'border-primary bg-secondary shadow-sm'
                              : 'border-border bg-background hover:border-foreground/30 hover:shadow-sm'
                          }`}
                        >
                          <TooltipInfo text={option.tooltip} />

                          <div className="mb-1 flex items-center gap-2">
                            <h3 className="text-foreground font-semibold">
                              {option.title}
                            </h3>
                            {selectedOption === option.id && (
                              <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs font-medium">
                                Selected
                              </span>
                            )}
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {option.desc}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {selectedOption && (
                <div className="mt-6">
                  <label className="text-foreground mb-2 block text-sm font-medium">
                    Select DID Method{' '}
                    <span className="text-destructive">*</span>
                  </label>

                  <div className="flex items-center gap-4">
                    <Select
                      value={selectedDid ?? ''}
                      onValueChange={(value) => {
                        setSelectedDid(value)
                        setDomainError(null)
                        setWebFlowState('idle')
                        setGeneratedDidDoc(null)
                        setIsHostingConfirmed(false)
                      }}
                    >
                      <SelectTrigger className="w-full md:w-1/2">
                        <SelectValue placeholder="Select DID" />
                      </SelectTrigger>

                      <SelectContent>
                        {didOptions.map((did) => (
                          <SelectItem key={did} value={did}>
                            {did}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedDid && (
                      <div className="rounded-md px-3 py-2 font-mono text-sm font-semibold whitespace-nowrap">
                        <span className="text-muted-foreground font-normal">
                          e.g.
                        </span>
                        <span className="ml-1">{didExamples[selectedDid]}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* DID:web Domain Input */}
              {selectedDid === 'did:web' && (
                <SetDomainValueInput
                  domainValue={domainValue}
                  setDomainValue={handleDomainChange}
                  domainError={domainError}
                />
              )}
            </CardContent>
          </Card>

          {selectedDid === 'did:polygon:testnet' && (
            <Card className="border-border mt-6 border shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground text-lg font-semibold">
                  Polygon Configuration
                </CardTitle>
                <CardDescription className="text-muted-foreground text-sm">
                  Configure your Polygon DID by setting the private key.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 pt-6">
                <SetPrivateKeyValueInput
                  orgId={orgId || ''}
                  privateKeyValue={privateKeyValue}
                  setPrivateKeyValue={setPrivateKeyValue}
                />

                <div className="space-y-5">
                  <h4 className="text-foreground/80 text-sm font-medium">
                    Steps to get Polygon Testnet Tokens
                  </h4>

                  <div className="space-y-4">
                    <div className="border-border bg-secondary rounded-lg border p-4">
                      <div className="flex items-start space-x-3">
                        <span className="text-primary text-sm font-semibold">
                          Step 1
                        </span>
                        <div className="text-foreground/80 text-sm">
                          Copy your address and claim test tokens.
                        </div>
                      </div>
                    </div>

                    <div className="border-border bg-secondary rounded-lg border p-4">
                      <div className="flex items-start space-x-3">
                        <span className="text-primary text-sm font-semibold">
                          Step 2
                        </span>
                        <div className="text-foreground/80 text-sm">
                          Verify the balance using Polygon Scan.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* did:web Step 2 — host document confirmation */}
          {selectedDid === 'did:web' &&
            webFlowState === 'generated' &&
            generatedDidDoc && (
              <Card className="border-border border shadow-sm">
                <CardHeader className="border-border bg-background border-b">
                  <CardTitle className="text-foreground text-lg font-semibold">
                    Host Your DID Document
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-sm">
                    Copy or download this file and host it at the URL below. The
                    next step will verify it is publicly accessible before
                    saving the DID.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-6">
                  <div>
                    <p className="text-foreground mb-1 text-sm font-medium">
                      Required hosting URL
                    </p>
                    <div className="bg-muted rounded-md px-3 py-2 font-mono text-sm break-all">
                      {`https://${domainValue}/.well-known/did.json`}
                    </div>
                  </div>

                  <div>
                    <p className="text-foreground mb-1 text-sm font-medium">
                      DID Document
                    </p>
                    <div className="relative">
                      <pre className="bg-muted max-h-60 overflow-auto rounded-md p-4 font-mono text-xs">
                        {JSON.stringify(generatedDidDoc, null, 2)}
                      </pre>
                      <div className="absolute top-2 right-2 flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="bg-muted/80 h-7 w-7"
                          onClick={copyDidDocument}
                          aria-label="Copy DID document"
                        >
                          {didDocCopied ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="bg-muted/80 h-7 w-7"
                          onClick={downloadDidDocument}
                          aria-label="Download DID document"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 pt-1">
                    <Checkbox
                      id="hosting-confirmed"
                      checked={isHostingConfirmed}
                      onCheckedChange={(checked) =>
                        setIsHostingConfirmed(checked === true)
                      }
                    />
                    <Label
                      htmlFor="hosting-confirmed"
                      className="cursor-pointer text-sm leading-relaxed"
                    >
                      I have hosted the DID document at{' '}
                      <span className="font-mono text-xs">{`https://${domainValue}/.well-known/did.json`}</span>
                    </Label>
                  </div>
                </CardContent>
              </Card>
            )}

          {(alert || success) && (
            <div className="space-y-2">
              {alert && (
                <AlertComponent
                  message={alert}
                  type="failure"
                  onAlertClose={() => setAlert(null)}
                />
              )}
              {success && (
                <AlertComponent
                  message={success}
                  type="success"
                  onAlertClose={() => setSuccess(null)}
                />
              )}
            </div>
          )}

          {selectedDid && (
            <div className="mt-6 flex flex-col items-end gap-2">
              {selectedDid === 'did:web' && webFlowState === 'generated' && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-muted-foreground text-sm"
                  onClick={() => {
                    setWebFlowState('idle')
                    setGeneratedDidDoc(null)
                    setIsHostingConfirmed(false)
                  }}
                >
                  ← Back to edit
                </Button>
              )}
              <Button
                onClick={handleSubmit}
                disabled={
                  isApiInProgress ||
                  (selectedDid === 'did:web' &&
                    webFlowState === 'generated' &&
                    !isHostingConfirmed)
                }
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-8 py-2 font-medium shadow-sm disabled:opacity-50"
              >
                {isApiInProgress
                  ? webFlowState === 'generating'
                    ? 'Generating...'
                    : 'Creating DID...'
                  : selectedDid === 'did:web' && webFlowState === 'idle'
                    ? 'Generate DID Document'
                    : 'Create DID'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  )
}

export default CreateDid
