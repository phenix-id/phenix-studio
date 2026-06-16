'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import React, { useEffect, useState } from 'react'
import {
  deleteIssuanceRecords,
  deleteOrganization,
  deleteOrganizationWallet,
  deleteVerificationRecords,
  getOrganizationReferences,
} from '@/app/api/deleteorganization'
import { resetOrgState, setTenantData } from '@/lib/orgSlice'
import { useRouter, useSearchParams } from 'next/navigation'

import type { AxiosResponse } from 'axios'
import { DeleteOrganizationCard } from './DeleteOrganizationCard'
import { IOrganisation } from './interfaces/organization'
import { Loader2 } from 'lucide-react'
import PageContainer from '@/components/layout/page-container'
import { apiStatusCodes } from '@/config/CommonConstant'
import { deleteConnectionRecords } from '@/app/api/connection'
import { getOrganizationById } from '@/app/api/organization'
import { hardNavigate } from '@/utils/navigation'
import { pathRoutes } from '@/config/pathRoutes'
import { toast } from 'sonner'
import { useAppDispatch } from '@/lib/hooks'

interface IOrgCount {
  verificationRecordsCount?: number
  issuanceRecordsCount?: number
  connectionRecordsCount?: number
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'string') {
    return error
  }

  if (error instanceof Error) {
    return error.message
  }

  const possibleResponse = error as {
    data?: { message?: string; error?: string }
    response?: { data?: { message?: string; error?: string } }
  }

  return (
    possibleResponse?.response?.data?.message ??
    possibleResponse?.response?.data?.error ??
    possibleResponse?.data?.message ??
    possibleResponse?.data?.error ??
    fallback
  )
}

export default function DeleteOrganizationPage(): React.JSX.Element {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orgId = searchParams.get('orgId')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orgData, setOrgData] = useState<IOrganisation | null>(null)
  const [organizationData, setOrganizationData] = useState<IOrgCount | null>(
    null,
  )
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false)
  const [isWalletPresent, setIsWalletPresent] = useState<boolean>(false)
  const [showPopup, setShowPopup] = useState<boolean>(false)
  const [deleteAction, setDeleteAction] = useState<() => void>()
  const [confirmMessage, setConfirmMessage] = useState<
    string | React.ReactNode
  >('')
  const [description, setDescription] = useState<string>('')
  const dispatch = useAppDispatch()

  const fetchOrganizationDetails = async (): Promise<void> => {
    if (!orgId) {
      router.push(pathRoutes.organizations.root)
      return
    }

    try {
      setLoading(true)
      const response = await getOrganizationById(orgId)
      const { data } = response as AxiosResponse

      if (data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS) {
        const organizationData = data?.data
        setOrgData(organizationData)
        const walletName = organizationData?.org_agents?.[0]?.walletName

        if (walletName) {
          setIsWalletPresent(true)
        } else {
          setIsWalletPresent(false)
        }
      }
    } catch (error) {
      console.error('An error occurred:', error)
      setError('Failed to fetch organization details')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrganizationReferences = async (): Promise<void> => {
    if (!orgId) {
      return
    }

    setLoading(true)
    try {
      const response = await getOrganizationReferences(orgId)
      const { data } = response as AxiosResponse
      if (data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS) {
        const orgData = data?.data
        setOrganizationData(orgData)
      } else {
        setError(response as string)
      }
    } catch (error) {
      console.error('An error occurred:', error)
      setError(
        getErrorMessage(error, 'Failed to fetch organization references'),
      )
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchOrganizationDetails()
    fetchOrganizationReferences()
  }, [orgId])

  const deleteHandler = async (
    deleteFunc: () => Promise<void>,
  ): Promise<void> => {
    setDeleteLoading(true)
    try {
      await deleteFunc()
      setShowPopup(false)
    } catch (error) {
      console.error('An error occurred:', error)
      setShowPopup(false)
      setError(getErrorMessage(error, 'Delete failed'))
    } finally {
      setDeleteLoading(false)
    }
  }

  const deleteVerifications = async (): Promise<void> => {
    setDeleteLoading(true)
    try {
      const response = await deleteVerificationRecords(orgId as string)
      const { data } = response as AxiosResponse

      if (data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS) {
        toast.success(data?.message)
        await fetchOrganizationReferences()
        setShowPopup(false)
      } else {
        throw new Error(
          data?.message || 'Failed to delete verification records',
        )
      }
    } catch (error) {
      console.error('An error occurred:', error)
      setError(getErrorMessage(error, 'Failed to delete verification records'))
      throw error
    }
    setDeleteLoading(false)
  }

  const deleteIssuance = async (): Promise<void> => {
    setDeleteLoading(true)
    try {
      const response = await deleteIssuanceRecords(orgId as string)
      const { data } = response as AxiosResponse

      if (data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS) {
        toast.success(data?.message)
        await fetchOrganizationReferences()
        setShowPopup(false)
      } else {
        throw new Error(data?.message || 'Failed to delete issuance records')
      }
    } catch (error) {
      console.error('An error occurred:', error)
      setError(getErrorMessage(error, 'Failed to delete issuance records'))
      throw error
    }
    setDeleteLoading(false)
  }

  const deleteConnection = async (): Promise<void> => {
    setDeleteLoading(true)
    try {
      const response = await deleteConnectionRecords(orgId as string)
      const { data } = response as AxiosResponse

      if (data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS) {
        toast.success(data?.message)
        await fetchOrganizationReferences()
        setShowPopup(false)
      } else {
        throw new Error(data?.message || 'Failed to delete connection records')
      }
    } catch (error) {
      console.error('An error occurred:', error)
      setError(getErrorMessage(error, 'Failed to delete connection records'))
      throw error
    }
    setDeleteLoading(false)
  }

  const deleteOrgWallet = async (): Promise<void> => {
    try {
      // Assuming deleteOrganizationWallet needs orgId
      const response = await deleteOrganizationWallet(orgId as string)
      const { data } = response as AxiosResponse
      if (data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS) {
        toast.success(data?.message)
        setIsWalletPresent(false)
        await fetchOrganizationReferences()
        setShowPopup(false)
      } else {
        throw new Error(data?.message || 'Failed to delete organization wallet')
      }
    } catch (error) {
      console.error('An error occurred:', error)
      setError(getErrorMessage(error, 'Failed to delete organization wallet'))
      throw error
    }
  }

  const deleteOrganizations = async (): Promise<void> => {
    try {
      const response = await deleteOrganization(orgId as string)
      const { data } = response as AxiosResponse

      if (data?.statusCode === apiStatusCodes.API_STATUS_SUCCESS) {
        toast.success(data?.message)
        dispatch(resetOrgState())
        setShowPopup(false)
        dispatch(setTenantData(null))
        hardNavigate(pathRoutes.organizations.root, true)
      } else {
        throw new Error(data?.message || 'Failed to delete organization')
      }
    } catch (error) {
      console.error('An error occurred:', error)
      setError(getErrorMessage(error, 'Failed to delete organization'))
      throw error
    }
  }

  const deleteFunctions = {
    deleteVerifications,
    deleteIssuance,
    deleteConnection,
    deleteOrgWallet,
    deleteOrganizations,
  }

  if (loading && !orgData) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Loading organization data...</p>
      </div>
    )
  }

  if (!orgData && !loading) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertDescription>
            Organization not found or you don`t have permission to access it.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const verCount = organizationData?.verificationRecordsCount ?? 0
  const issCount = organizationData?.issuanceRecordsCount ?? 0
  const connCount = organizationData?.connectionRecordsCount ?? 0

  const deleteCardData = [
    {
      step: 1,
      title: 'Verifications',
      description: 'Delete all verification records for this organization.',
      count: verCount,
      deleteFunc: deleteFunctions.deleteVerifications,
      confirmMessage: 'Are you sure you want to delete verification records?',
      isDisabled: false,
      blockingReason: null,
    },
    {
      step: 2,
      title: 'Issuance',
      description:
        'Delete all issued credential records for this organization.',
      count: issCount,
      deleteFunc: deleteFunctions.deleteIssuance,
      confirmMessage: 'Are you sure you want to delete credential records?',
      isDisabled: verCount > 0,
      blockingReason:
        verCount > 0 ? 'Delete verifications first (Step 1)' : null,
    },
    {
      step: 3,
      title: 'Connections',
      description: 'Delete all connection records for this organization.',
      count: connCount,
      deleteFunc: deleteFunctions.deleteConnection,
      confirmMessage: 'Are you sure you want to delete connection records?',
      isDisabled: issCount > 0 || verCount > 0,
      blockingReason:
        issCount > 0
          ? 'Delete issuance records first (Step 2)'
          : verCount > 0
            ? 'Delete verifications first (Step 1)'
            : null,
    },
    {
      step: 4,
      title: 'Organization wallet',
      description: 'Delete the organization wallet and all associated DIDs.',
      count: isWalletPresent ? 1 : 0,
      deleteFunc: deleteFunctions.deleteOrgWallet,
      confirmMessage: 'Are you sure you want to delete organization wallet?',
      isDisabled: connCount > 0 || issCount > 0 || verCount > 0,
      blockingReason:
        connCount > 0
          ? 'Delete connections first (Step 3)'
          : issCount > 0
            ? 'Delete issuance records first (Step 2)'
            : verCount > 0
              ? 'Delete verifications first (Step 1)'
              : null,
    },
    {
      step: 5,
      title: 'Organization',
      description:
        'Permanently delete the organization including all users, schemas, and credential definitions.',
      deleteFunc: deleteFunctions.deleteOrganizations,
      confirmMessage: (
        <>
          Are you sure you want to delete organization{' '}
          <span className="text-lg font-bold">{orgData?.name}</span>?
        </>
      ),
      isDisabled:
        isWalletPresent || connCount > 0 || issCount > 0 || verCount > 0,
      blockingReason:
        connCount > 0
          ? 'Delete connections first (Step 3)'
          : issCount > 0
            ? 'Delete issuance records first (Step 2)'
            : verCount > 0
              ? 'Delete verifications first (Step 1)'
              : isWalletPresent
                ? 'Delete organization wallet first (Step 4)'
                : null,
    },
  ]

  return (
    <PageContainer>
      <div className="px-4 pt-2">
        <h1 className="mt-2 mr-auto mb-4 ml-1 text-xl font-semibold sm:text-2xl">
          Delete Organization
        </h1>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && (
          <div className="space-y-4">
            <div className="text-muted-foreground mb-4 flex flex-wrap items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="bg-destructive inline-block h-3.5 w-1 rounded-full" />
                Action required — delete this now
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3.5 w-1 rounded-full bg-amber-400" />
                Locked — complete the previous step first
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3.5 w-1 rounded-full bg-green-500" />
                Cleared — nothing left to delete
              </span>
            </div>

            {deleteCardData.map((card) => (
              <DeleteOrganizationCard
                key={card.title}
                step={card.step}
                title={card.title}
                description={card.description}
                count={card.count}
                isDisabled={card.isDisabled || deleteLoading || loading}
                blockingReason={card.blockingReason}
                onDeleteClick={() => {
                  setShowPopup(true)
                  setDeleteAction(() => card.deleteFunc)
                  setConfirmMessage(card.confirmMessage)
                  setDescription(card.description)
                }}
              />
            ))}

            <AlertDialog open={showPopup} onOpenChange={setShowPopup}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl">
                    Confirmation
                  </AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="space-y-2">
                      {confirmMessage}
                      {description && <div className="">{description}</div>}
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleteLoading}>
                    No, cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      deleteHandler(deleteAction as () => Promise<void>)
                    }
                    disabled={deleteLoading}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      'Yes, delete'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </PageContainer>
  )
}
