/* eslint-disable max-lines, sort-imports */
import * as React from 'react'
import * as z from 'zod'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Check, Copy, Download, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DidMethod, Network, Roles } from '@/common/enums'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  apiStatusCodes,
  currentPageNumber,
  itemPerPage,
  polygonFaucet,
} from '@/config/CommonConstant'
import {
  createDid,
  createPolygonKeyValuePair,
  generateDidWeb,
  getDids,
  updatePrimaryDid,
} from '@/app/api/Agent'
import { getOrganizationById, getOrganizations } from '@/app/api/organization'
import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { AlertComponent } from '@/components/AlertComponent'
import { AlertDialogDemo } from './ConfirmationDialogue'
import { AxiosResponse } from 'axios'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { CommonConstants } from '../common/enum'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Loader from '@/components/Loader'
import { dateConversion } from '@/utils/DateConversion'
import { ethers } from 'ethers'
import { nanoid } from 'nanoid'
import { useRouter } from 'next/navigation'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IDidListData {
  id: string
  did: string
  isPrimaryDid: boolean
  createDateTime: string
  lastChangedDateTime: string
}

interface IUpdatePrimaryDid {
  id: string
  did: string
}

interface IPolygonKeys {
  privateKey: string
  publicKeyBase58: string
  address: string
}

interface OrgRole {
  name: string
}

interface UserOrgRole {
  orgId: string | null
  organisation: {
    id: string
    name: string
  } | null
  orgRole: OrgRole
}

interface Organization {
  id: string
  name: string
  userOrgRoles: UserOrgRole[]
}

// Read-only org-derived values used when building the API payload
interface IOrgDidInfo {
  method: string
  ledger: string
  network: string
  endorserDid: string
}

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const webDidSchema = z.object({
  domain: z.string().min(1, 'Domain is required'),
})

const polygonDidSchema = z.object({
  privatekey: z
    .string()
    .min(1, 'Private key is required')
    .length(64, 'Private key must be exactly 64 characters'),
})

type WebDidFormValues = z.infer<typeof webDidSchema>
type PolygonFormValues = z.infer<typeof polygonDidSchema>

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

const DateTooltip = ({
  date,
  children,
}: {
  date: string
  children: React.ReactNode
}): React.JSX.Element => (
  <Tooltip>
    <TooltipTrigger asChild>
      <span>{children}</span>
    </TooltipTrigger>
    <TooltipContent>
      <p>{new Date(date).toLocaleString()}</p>
    </TooltipContent>
  </Tooltip>
)

const CopyDid = ({
  value,
  className,
  showCheck = false,
  didListLoading,
}: {
  value: string
  className?: string
  showCheck?: boolean
  didListLoading?: boolean
}): React.JSX.Element => {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = (): void => {
    const resetCopied = (): void => setCopied(false)
    const handleCopySuccess = (): void => {
      setCopied(true)
      setTimeout(resetCopied, 2000)
    }
    const handleCopyError = (): void => {
      console.error('Failed to copy text to clipboard')
    }
    navigator.clipboard
      .writeText(value)
      .then(handleCopySuccess)
      .catch(handleCopyError)
  }

  if (showCheck) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="truncate">{value}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={copyToClipboard}
          className="h-8 w-8"
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    )
  }

  if (didListLoading) {
    return <Loader />
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`flex items-center gap-2 ${className}`}>
          <span className="truncate font-mono">{value}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={copyToClipboard}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>Copy to clipboard</p>
      </TooltipContent>
    </Tooltip>
  )
}

const TokenWarningMessage = (): React.JSX.Element => (
  <div className="mt-3 text-xs">
    <p>Note: You need to have tokens in your wallet to create a DID.</p>
  </div>
)

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const DIDListComponent = ({ orgId }: { orgId: string }): React.JSX.Element => {
  // DID list state
  const [didList, setDidList] = useState<IDidListData[]>([])
  const [showPopup, setShowPopup] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isMethodLoading, setIsMethodLoading] = useState(false)

  // Dialog shared state
  const [loading, setLoading] = useState<boolean>(false)
  const [errMsg, setErrMsg] = useState<string | null>(null)
  const [isCreatingDid, setIsCreatingDid] = useState(false)
  const [seed, setSeed] = useState('')
  const [method, setMethod] = useState<DidMethod>()
  const [completeDidMethodValue, setCompleteDidMethodValue] = useState<
    string | null
  >(null)
  const [orgDidInfo, setOrgDidInfo] = useState<IOrgDidInfo>({
    method: '',
    ledger: '',
    network: '',
    endorserDid: '',
  })
  const [currentPage] = useState(currentPageNumber)
  const [pageSize] = useState(itemPerPage)
  const [searchTerm] = useState('')
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [didListLoading, setDidListLoading] = useState<boolean>(true)

  // Polygon-specific state
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [generatedKeys, setGeneratedKeys] = useState<IPolygonKeys | null>(null)
  const [havePrivateKey, setHavePrivateKey] = useState(false)
  const [privateKeyValue, setPrivateKeyValue] = useState<string>('')
  const [walletErrorMessage, setWalletErrorMessage] = useState<string | null>(
    null,
  )

  // did:web two-step flow state
  const [webDialogStep, setWebDialogStep] = useState<'domain' | 'hosting'>(
    'domain',
  )
  const [generatedDidDoc, setGeneratedDidDoc] = useState<Record<
    string,
    unknown
  > | null>(null)
  const [isHostingConfirmed, setIsHostingConfirmed] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [didDocCopied, setDidDocCopied] = useState(false)

  const router = useRouter()

  // ---------------------------------------------------------------------------
  // react-hook-form instances
  // ---------------------------------------------------------------------------

  const webDidForm = useForm<WebDidFormValues>({
    resolver: zodResolver(webDidSchema),
    defaultValues: { domain: '' },
  })

  const polygonForm = useForm<PolygonFormValues>({
    resolver: zodResolver(polygonDidSchema),
    defaultValues: { privatekey: '' },
  })

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const getData = async (): Promise<void> => {
    setDidListLoading(true)
    try {
      const response = await getDids(orgId)
      const { data } = response as AxiosResponse
      if (data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS) {
        const sortedDids = data?.data.sort(
          (a: { isPrimaryDid: boolean }, b: { isPrimaryDid: boolean }) => {
            if (a.isPrimaryDid && !b.isPrimaryDid) {
              return -1
            }
            if (!a.isPrimaryDid && b.isPrimaryDid) {
              return 1
            }
            return 0
          },
        )
        setDidList(sortedDids)
      }
    } catch (error) {
      console.error('Error fetching DIDs:', error)
    } finally {
      setDidListLoading(false)
    }
  }

  const setPrimaryDid = async (id: string, did: string): Promise<void> => {
    try {
      const payload: IUpdatePrimaryDid = { id, did }
      const response = await updatePrimaryDid(orgId, payload)
      const { data } = response as AxiosResponse

      if (data?.statusCode === apiStatusCodes.API_STATUS_CREATED) {
        getData()
        router.refresh()
      } else {
        setErrorMsg(response as string)
      }
    } catch (error) {
      console.error('Error setting primary DID:', error)
    }
  }

  const fetchOrganizations = async (): Promise<void> => {
    try {
      const response = await getOrganizations(
        currentPage,
        pageSize,
        searchTerm,
        '',
      )
      if (typeof response !== 'string' && response?.data?.data?.organizations) {
        const { organizations } = response.data.data
        const currentOrg = organizations.find(
          (org: Organization) => org.id === orgId,
        )
        const roles =
          currentOrg?.userOrgRoles?.map(
            (role: UserOrgRole) => role.orgRole.name,
          ) || []
        setUserRoles(roles)
      } else {
        setUserRoles([])
      }
    } catch (err) {
      console.error('Error fetching organizations:', err)
    }
  }

  const fetchOrganizationDetails = async (): Promise<void> => {
    const response = await getOrganizationById(orgId)
    const { data } = response as AxiosResponse
    setLoading(false)
    if (data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS) {
      const didMethod = data?.data?.org_agents[0]?.orgDid
        ?.split(':')
        .slice(0, 2)
        .join(':')
      setMethod(didMethod)

      let ledgerName = ''
      if (didMethod === DidMethod.INDY || didMethod === DidMethod.POLYGON) {
        ledgerName = data?.data?.org_agents[0]?.orgDid.split(':')[1]
      } else {
        ledgerName = 'No Ledger'
      }

      let networkName = ''
      if (didMethod === DidMethod.INDY) {
        networkName = data?.data?.org_agents[0]?.orgDid
          .split(':')
          .slice(2, 4)
          .join(':')
      } else if (didMethod === DidMethod.POLYGON) {
        networkName = data?.data?.org_agents[0]?.orgDid.split(':')[2]
      }

      let completeDidMethod = ''
      if (didMethod === DidMethod.INDY) {
        completeDidMethod = data?.data?.org_agents[0]?.orgDid
          .split(':')
          .slice(0, 4)
          .join(':')
      } else {
        completeDidMethod = didMethod
      }
      setCompleteDidMethodValue(completeDidMethod)

      setOrgDidInfo({
        method: didMethod,
        ledger: ledgerName,
        network: networkName,
        endorserDid: '',
      })

      // Pre-fill polygon form with any previously generated key
      if (generatedKeys?.privateKey) {
        polygonForm.setValue('privatekey', generatedKeys.privateKey.slice(2))
      }
    } else {
      console.error('Error fetching organization details')
    }
  }

  useEffect(() => {
    fetchOrganizations()
  }, [currentPage, pageSize, searchTerm])

  useEffect(() => {
    getData()
  }, [])

  React.useEffect(() => {
    fetchOrganizationDetails()
  }, [])

  React.useEffect(() => {
    setSeed(nanoid(32))
  }, [])

  // ---------------------------------------------------------------------------
  // Polygon balance check
  // ---------------------------------------------------------------------------

  const checkBalance = async (
    privateKey: string,
    network: Network,
  ): Promise<string | null> => {
    try {
      const rpcUrls = {
        testnet: `${process.env.NEXT_PUBLIC_POLYGON_TESTNET_URL}`,
        mainnet: `${process.env.NEXT_PUBLIC_POLYGON_MAINNET_URL}`,
      }
      const networkUrl = rpcUrls?.[network]
      const provider = new ethers.JsonRpcProvider(networkUrl)
      const wallet = new ethers.Wallet(privateKey, provider)
      const address = await wallet.getAddress()
      const balance = await provider.getBalance(address)
      const etherBalance = ethers.formatEther(balance)

      if (parseFloat(etherBalance) < CommonConstants.BALANCELIMIT) {
        setWalletErrorMessage('You have insufficient funds.')
      } else {
        setWalletErrorMessage(null)
      }

      return etherBalance
    } catch (error) {
      console.error('Error checking wallet balance:', error)
      return null
    }
  }

  React.useEffect(() => {
    if (privateKeyValue && privateKeyValue.length === 64) {
      checkBalance(privateKeyValue, Network.TESTNET)
    } else {
      setWalletErrorMessage(null)
    }
  }, [privateKeyValue])

  React.useEffect(() => {
    if (havePrivateKey) {
      setPrivateKeyValue('')
      setWalletErrorMessage(null)
      setGeneratedKeys(null)
    } else {
      setPrivateKeyValue('')
      setWalletErrorMessage(null)
    }
  }, [havePrivateKey])

  const generatePolygonKeyValuePair = async (): Promise<void> => {
    setIsLoading(true)
    try {
      const resCreatePolygonKeys = await createPolygonKeyValuePair(orgId)
      const { data } = resCreatePolygonKeys as AxiosResponse

      if (data?.statusCode === apiStatusCodes.API_STATUS_CREATED) {
        setGeneratedKeys(data?.data)
        const privateKey = data?.data?.privateKey.slice(2)
        setPrivateKeyValue(privateKey)
        polygonForm.setValue('privatekey', privateKey)
        await checkBalance(privateKey, Network.TESTNET)
      }
    } catch (err) {
      console.error('Generate private key ERROR:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Dialog helpers
  // ---------------------------------------------------------------------------

  const resetWebDialog = (): void => {
    setWebDialogStep('domain')
    setGeneratedDidDoc(null)
    setIsHostingConfirmed(false)
    setDidDocCopied(false)
    setErrMsg(null)
    webDidForm.reset()
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

  // ---------------------------------------------------------------------------
  // DID creation handlers
  // ---------------------------------------------------------------------------

  // Non-Polygon, non-Web methods — called directly without a dialog
  const createNewDidDirect = async (): Promise<void> => {
    setLoading(true)
    setErrMsg(null)
    setIsCreatingDid(true)

    let network = ''
    if (orgDidInfo.method === DidMethod.INDY) {
      network = orgDidInfo.network || ''
    }

    const didData = {
      seed,
      keyType: 'ed25519',
      method: orgDidInfo.method?.split(':')[1] || '',
      network,
      domain: '',
      role: orgDidInfo.method === DidMethod.INDY ? 'endorser' : '',
      privatekey: '',
      did: '',
      endorserDid: orgDidInfo.endorserDid || '',
      isPrimaryDid: false,
    }

    try {
      const response = await createDid(orgId, didData)
      const { data } = response as AxiosResponse

      if (data?.statusCode === apiStatusCodes.API_STATUS_CREATED) {
        setSuccessMsg(data?.message)
        setIsCreatingDid(false)
        await getData()
        setTimeout(() => router.refresh(), 2000)
      } else {
        setErrorMsg(response as string)
        setIsCreatingDid(false)
      }
    } catch (error) {
      console.error('Error creating DID:', error)
      setIsCreatingDid(false)
    } finally {
      setLoading(false)
    }
  }

  // did:web Step 1 — generate the DID document
  const handleGenerateDidWeb = async (
    formData: WebDidFormValues,
  ): Promise<void> => {
    setIsGenerating(true)
    setErrMsg(null)

    const payload = {
      method: 'web',
      keyType: 'ed25519',
      domain: formData.domain,
      seed,
      isPrimaryDid: false,
    }

    try {
      const response = await generateDidWeb(orgId, payload)
      const { data } = response as AxiosResponse

      if (data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS) {
        setGeneratedDidDoc(data?.data?.didDocument)
        setWebDialogStep('hosting')
      } else {
        setErrMsg(data?.message || 'Failed to generate DID document')
      }
    } catch (error) {
      console.error('Error generating did:web document:', error)
      setErrMsg('Failed to generate DID document. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  // did:web Step 2 — create (after user has hosted the document)
  const handleCreateWebDid = async (): Promise<void> => {
    setLoading(true)
    setErrMsg(null)

    const domain = webDidForm.getValues('domain')
    const didData = {
      seed,
      keyType: 'ed25519',
      method: 'web',
      network: '',
      domain,
      role: '',
      privatekey: '',
      did: '',
      endorserDid: '',
      isPrimaryDid: false,
    }

    try {
      const response = await createDid(orgId, didData)
      const { data } = response as AxiosResponse

      if (data?.statusCode === apiStatusCodes.API_STATUS_CREATED) {
        setShowPopup(false)
        setSuccessMsg(data?.message)
        resetWebDialog()
        await getData()
        setTimeout(() => router.refresh(), 2000)
      } else {
        // Surface a clearer message for the document mismatch case
        const isMismatch =
          typeof data?.message === 'string' &&
          data.message.toLowerCase().includes('does not match')
        setErrMsg(
          isMismatch
            ? "Document not hosted or doesn't match. Re-check the file at your domain and try again."
            : data?.message || 'Failed to create DID',
        )
      }
    } catch (error) {
      console.error('Error creating did:web:', error)
      setErrMsg('An error occurred while creating the DID')
    } finally {
      setLoading(false)
    }
  }

  // Polygon — called from RHF form submit
  const handleCreatePolygonDid = async (
    formData: PolygonFormValues,
  ): Promise<void> => {
    setLoading(true)
    setErrMsg(null)
    setIsCreatingDid(true)

    const network = `${orgDidInfo.ledger}:${orgDidInfo.network}`
    const didData = {
      seed: '',
      keyType: 'ed25519',
      method: 'polygon',
      network,
      domain: '',
      role: '',
      privatekey: formData.privatekey,
      did: '',
      endorserDid: '',
      isPrimaryDid: false,
    }

    try {
      const response = await createDid(orgId, didData)
      const { data } = response as AxiosResponse

      if (data?.statusCode === apiStatusCodes.API_STATUS_CREATED) {
        setShowPopup(false)
        setSuccessMsg(data?.message)
        setIsCreatingDid(false)
        await getData()
        setTimeout(() => router.refresh(), 2000)
      } else {
        setErrMsg(response as string)
        setIsCreatingDid(false)
        setShowPopup(true)
        setTimeout(() => router.refresh(), 2000)
      }
    } catch (error) {
      console.error('Error creating Polygon DID:', error)
      setIsCreatingDid(false)
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Button label helper
  // ---------------------------------------------------------------------------

  const getButtonLabel = (): React.ReactNode => {
    if (isMethodLoading) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      )
    }

    if (
      isCreatingDid &&
      method !== DidMethod.POLYGON &&
      method !== DidMethod.WEB
    ) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating DID...
        </>
      )
    }

    return 'Create DID'
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="w-full space-y-4">
      {successMsg && (
        <div className="w-full" role="alert">
          <AlertComponent
            message={successMsg}
            type="success"
            onAlertClose={() => setSuccessMsg(null)}
          />
        </div>
      )}
      {errorMsg && (
        <div className="w-full" role="alert">
          <AlertComponent
            message={errorMsg}
            type="failure"
            onAlertClose={() => setErrorMsg(null)}
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button
          onClick={async () => {
            setIsMethodLoading(true)
            await fetchOrganizationDetails()
            setIsMethodLoading(false)
            setErrMsg(null)

            if (method === DidMethod.POLYGON || method === DidMethod.WEB) {
              if (method === DidMethod.WEB) {
                resetWebDialog()
              }
              setShowPopup(true)
            } else {
              createNewDidDirect()
            }
          }}
          disabled={
            userRoles.includes(Roles.MEMBER) ||
            userRoles.includes(Roles.ISSUER) ||
            userRoles.includes(Roles.VERIFIER) ||
            isMethodLoading ||
            isCreatingDid
          }
        >
          {getButtonLabel()}
        </Button>
      </div>

      {/* DID list */}
      <div className="divide-y rounded-lg border">
        {didListLoading ? (
          <div className="my-5">
            <Loader />
          </div>
        ) : (
          <>
            {didList.map((item: IDidListData, index: number) => (
              <div key={item.id} className="grid h-20 items-center p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex gap-4">
                    <span className="w-16 shrink-0">DID {index + 1}</span>
                    <span>:</span>
                    {item?.did ? (
                      <CopyDid value={item.did} className="flex-1 font-mono" />
                    ) : (
                      <span className="flex-1 font-mono">Not available</span>
                    )}
                  </div>
                  <div className={item.isPrimaryDid ? 'grow' : ''}>
                    {item.isPrimaryDid ? (
                      <Badge
                        variant="default"
                        className="cursor-default text-sm"
                      >
                        Primary DID
                      </Badge>
                    ) : (
                      <div className="ml-auto">
                        <AlertDialogDemo
                          handler={() => setPrimaryDid(item.id, item.did)}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <p className="text-muted-foreground text-sm">Created</p>
                  <DateTooltip
                    date={item.lastChangedDateTime ?? item.createDateTime}
                  >
                    <div className="text-muted-foreground text-sm">
                      {dateConversion(
                        item.lastChangedDateTime ?? item.createDateTime,
                      )}
                    </div>
                  </DateTooltip>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Dialog — Polygon and did:web only */}
      {(method === DidMethod.POLYGON || method === DidMethod.WEB) && (
        <Dialog
          open={showPopup}
          onOpenChange={(open) => {
            if (!open && method === DidMethod.WEB) {
              resetWebDialog()
            }
            setShowPopup(open)
          }}
        >
          <DialogContent className="max-w-2xl!">
            <DialogHeader>
              <DialogTitle>
                {method === DidMethod.WEB ? 'Create did:web DID' : 'Create DID'}
              </DialogTitle>
            </DialogHeader>

            {/* Shared error / success banner */}
            {(successMsg || errMsg) && (
              <Alert variant={successMsg ? 'default' : 'destructive'}>
                <AlertDescription>{successMsg || errMsg}</AlertDescription>
              </Alert>
            )}

            {/* ── did:web Step 1: enter domain ── */}
            {method === DidMethod.WEB && webDialogStep === 'domain' && (
              <form
                onSubmit={webDidForm.handleSubmit(handleGenerateDidWeb)}
                className="space-y-4"
              >
                {/* Read-only method display */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label>DID Method</Label>
                    <Input
                      value={completeDidMethodValue || ''}
                      readOnly
                      tabIndex={-1}
                      className="bg-muted mt-1 cursor-default select-none"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="web-domain">
                    Domain <span className="text-destructive text-xs">*</span>
                  </Label>
                  <Input
                    id="web-domain"
                    {...webDidForm.register('domain')}
                    placeholder="Enter domain (e.g., example.com)"
                    className="mt-1"
                  />
                  {webDidForm.formState.errors.domain && (
                    <p className="text-destructive mt-1 text-sm">
                      {webDidForm.formState.errors.domain.message}
                    </p>
                  )}
                  <p className="text-muted-foreground mt-1 text-sm">
                    No protocol or path — just the domain (e.g.,{' '}
                    <span className="font-mono">example.com</span>)
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate DID Document'
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* ── did:web Step 2: host document & confirm ── */}
            {method === DidMethod.WEB &&
              webDialogStep === 'hosting' &&
              generatedDidDoc && (
                <div className="space-y-4">
                  {/* Hosting URL */}
                  <div>
                    <p className="text-foreground mb-1 text-sm font-medium">
                      Required hosting URL
                    </p>
                    <div className="bg-muted rounded-md px-3 py-2 font-mono text-sm break-all">
                      {`https://${webDidForm.getValues('domain')}/.well-known/did.json`}
                    </div>
                  </div>

                  {/* JSON document */}
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
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Hosting confirmation checkbox */}
                  <div className="flex items-start space-x-2 pt-1">
                    <Checkbox
                      id="hosting-confirmed-dialog"
                      checked={isHostingConfirmed}
                      onCheckedChange={(checked) =>
                        setIsHostingConfirmed(checked === true)
                      }
                    />
                    <Label
                      htmlFor="hosting-confirmed-dialog"
                      className="cursor-pointer text-sm leading-relaxed"
                    >
                      I have hosted the DID document at{' '}
                      <span className="font-mono text-xs">{`https://${webDidForm.getValues('domain')}/.well-known/did.json`}</span>
                    </Label>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setWebDialogStep('domain')
                        setGeneratedDidDoc(null)
                        setIsHostingConfirmed(false)
                        setErrMsg(null)
                      }}
                    >
                      ← Back
                    </Button>
                    <Button
                      type="button"
                      onClick={handleCreateWebDid}
                      disabled={!isHostingConfirmed || loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating DID...
                        </>
                      ) : (
                        'Create DID'
                      )}
                    </Button>
                  </div>
                </div>
              )}

            {/* ── Polygon ── */}
            {method === DidMethod.POLYGON && (
              <form
                onSubmit={polygonForm.handleSubmit(handleCreatePolygonDid)}
                className="space-y-4"
              >
                {/* Read-only org info */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="polygon-ledger">
                      Ledger <span className="text-destructive text-xs">*</span>
                    </Label>
                    <Input
                      id="polygon-ledger"
                      readOnly
                      tabIndex={-1}
                      className="bg-muted mt-1 cursor-default select-none"
                      value={orgDidInfo.ledger}
                    />
                  </div>
                  <div>
                    <Label>
                      DID Method{' '}
                      <span className="text-destructive text-xs">*</span>
                    </Label>
                    <Input
                      value={completeDidMethodValue || ''}
                      readOnly
                      tabIndex={-1}
                      className="bg-muted mt-1 cursor-default select-none"
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-2">
                    <div className="mb-4 flex items-center space-x-2">
                      <Checkbox
                        id="havePrivateKey"
                        checked={havePrivateKey}
                        onCheckedChange={(checked) =>
                          setHavePrivateKey(checked === true)
                        }
                      />
                      <Label htmlFor="havePrivateKey">
                        Already have a private key?
                      </Label>
                    </div>

                    {!havePrivateKey ? (
                      <>
                        <div className="my-3 flex items-center justify-between">
                          <Label>
                            Generate private key{' '}
                            <span className="text-destructive text-xs">*</span>
                          </Label>
                          <Button
                            type="button"
                            onClick={generatePolygonKeyValuePair}
                            disabled={isLoading}
                          >
                            {isLoading ? 'Generating...' : 'Generate'}
                          </Button>
                        </div>

                        {generatedKeys && (
                          <>
                            <div className="relative mt-3">
                              <div className="relative mt-3 w-full overflow-x-auto">
                                <div className="flex w-full items-center">
                                  <div className="ml-2 shrink-0">
                                    <CopyDid
                                      value={generatedKeys.privateKey.slice(2)}
                                      showCheck={true}
                                    />
                                  </div>
                                </div>
                              </div>
                              {polygonForm.formState.errors.privatekey && (
                                <p className="text-destructive mt-1 text-sm">
                                  {
                                    polygonForm.formState.errors.privatekey
                                      .message
                                  }
                                </p>
                              )}
                              {walletErrorMessage && (
                                <p className="text-destructive text-sm">
                                  {walletErrorMessage}
                                </p>
                              )}
                            </div>
                            <TokenWarningMessage />
                            <div className="my-3">
                              <div className="text-sm">
                                <span className="font-semibold">Address:</span>
                                <CopyDid
                                  value={generatedKeys.address}
                                  className="mt-1"
                                  showCheck={true}
                                />
                              </div>
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <div>
                        <Controller
                          name="privatekey"
                          control={polygonForm.control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              placeholder="Enter private key"
                              onChange={(e) => {
                                field.onChange(e)
                                setPrivateKeyValue(e.target.value)
                                setWalletErrorMessage(null)
                                if (e.target.value.length === 64) {
                                  checkBalance(e.target.value, Network.TESTNET)
                                }
                              }}
                            />
                          )}
                        />
                        {polygonForm.formState.errors.privatekey && (
                          <p className="text-destructive mt-1 text-sm">
                            {polygonForm.formState.errors.privatekey.message}
                          </p>
                        )}
                        {walletErrorMessage && (
                          <p className="text-destructive text-sm">
                            {walletErrorMessage}
                          </p>
                        )}
                        <TokenWarningMessage />
                      </div>
                    )}
                  </div>

                  <div className="col-span-1 sm:col-span-2">
                    <h3 className="mb-2 text-sm font-semibold">
                      Follow these instructions to generate polygon tokens:
                    </h3>
                    <ol className="space-y-2 text-sm">
                      <li>
                        <span className="font-semibold">Step 1:</span>
                        <div className="ml-4">
                          Copy the address and get the free tokens for the
                          testnet.
                          <div>
                            For eg. use{' '}
                            <a
                              href={polygonFaucet}
                              className="font-semibold underline"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {polygonFaucet}
                            </a>{' '}
                            to get free token
                          </div>
                        </div>
                      </li>
                      <li>
                        <span className="font-semibold">Step 2:</span>
                        <div className="ml-4">
                          Check that you have received the tokens.
                          <div>
                            For eg. copy the address and check the balance on{' '}
                            <a
                              href="https://mumbai.polygonscan.com/"
                              className="underline"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              https://mumbai.polygonscan.com/
                            </a>
                          </div>
                        </div>
                      </li>
                    </ol>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={
                      loading ||
                      !polygonForm.watch('privatekey') ||
                      Boolean(walletErrorMessage)
                    }
                  >
                    {loading ? 'Submitting...' : 'Submit'}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default DIDListComponent
