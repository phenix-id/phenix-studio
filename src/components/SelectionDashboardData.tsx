'use client'

import { FileSpreadsheet, Mail, QrCode, Users } from 'lucide-react'
import { JSX, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/lib/hooks'
import { IOptions } from './types/Dashboard'
import SelectionDashboard from './SelectionDashboard'
import { getOrganizationById } from '@/app/api/organization'
import { pathRoutes } from '@/config/pathRoutes'
import { setLedgerId } from '@/lib/orgSlice'
import { usePathname } from 'next/navigation'

const SelectionDashboardData = (): JSX.Element => {
  const path = usePathname()
  const dispatch = useAppDispatch()
  const isVerification = path.includes('/verification')
  const orgId = useAppSelector((state) => state.organization.orgId)

  const orgData = async (): Promise<void> => {
    const response = await getOrganizationById(orgId)
    if (typeof response === 'string') {
      console.error('Error fetching organization:', response)
    } else {
      const { data } = response
      dispatch(setLedgerId(data.data.org_agents[0].ledgers.id))
    }
  }

  useEffect(() => {
    orgData()
  }, [])

  const issueOptions: IOptions[] = [
    {
      heading: 'Connection',
      icon: Users,
      description:
        "Issue credential(s) to a holder you're already connected with — no new invitation required.",
      path: '/credentials/connections',
      tag: 'Existing holders',
      tagVariant: 'neutral',
    },
    {
      heading: 'Email',
      icon: Mail,
      description:
        'Send a credential offer to a specific holder by email address. They accept in the Phenix App.',
      path: pathRoutes.organizations.Issuance.email,
      tag: 'Single holder',
      tagVariant: 'neutral',
    },
    {
      heading: 'Bulk',
      icon: FileSpreadsheet,
      description:
        'Issue to many holders at once by uploading a .CSV of records mapped to your schema.',
      path: pathRoutes.organizations.Issuance.bulkIssuance,
      tag: '.CSV upload',
      tagVariant: 'purple',
    },
    {
      heading: 'QR Code',
      icon: QrCode,
      description:
        'Generate a scannable QR code that issues on scan — no prior connection needed.',
      path: pathRoutes.organizations.Issuance.connectionOob,
      tag: 'No connection needed',
      tagVariant: 'green',
      isRecommended: true,
    },
  ]

  const verifyOptions: IOptions[] = [
    {
      heading: 'Connection',
      icon: Users,
      description:
        "Request a verifiable presentation from a holder you're already connected with.",
      path: pathRoutes.organizations.verification.schema,
      tag: 'Existing holders',
      tagVariant: 'neutral',
    },
    {
      heading: 'Email',
      icon: Mail,
      description:
        'Send a proof request to a specific holder by email address. They respond in the Phenix App.',
      path: pathRoutes.organizations.verification.email,
      tag: 'Single holder',
      tagVariant: 'neutral',
    },
    {
      heading: 'Bulk',
      icon: FileSpreadsheet,
      description:
        'Verify credentials from many holders at once by uploading a .CSV of records.',
      path: '',
      tag: '.CSV upload',
      tagVariant: 'purple',
    },
    {
      heading: 'QR Code',
      icon: QrCode,
      description:
        'Generate a scannable QR code that requests a proof — no prior connection needed.',
      path: pathRoutes.organizations.verification.email,
      tag: 'No connection needed',
      tagVariant: 'green',
      isRecommended: true,
    },
  ]

  return (
    <SelectionDashboard
      eyebrow={isVerification ? 'VERIFY CREDENTIAL' : 'ISSUE CREDENTIAL'}
      title={
        isVerification
          ? 'How would you like to verify?'
          : 'How would you like to issue?'
      }
      subtitle={
        isVerification
          ? 'Choose how the proof request reaches your holders. You can review before anything is sent.'
          : 'Choose how the credential offer reaches your holders. You can sign and review before anything is sent.'
      }
      options={isVerification ? verifyOptions : issueOptions}
      gridCols={4}
      backButtonPath={
        isVerification
          ? pathRoutes.organizations.credentials
          : pathRoutes.back.credentials.credentials
      }
    />
  )
}

export default SelectionDashboardData
