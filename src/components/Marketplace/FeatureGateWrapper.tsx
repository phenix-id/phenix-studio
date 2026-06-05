'use client'

import { EntitlementGate } from './EntitlementGate'
import { ReactNode } from 'react'
import { useAppSelector } from '@/lib/hooks'

interface FeatureGateWrapperProps {
  /** Feature flag key to check (e.g. 'issuance', 'verification', 'schemaCreate'). */
  readonly feature: string
  /**
   * Billing usage dimension to also pre-check against the plan's monthly allowance
   * (e.g. 'issuance_txn', 'verification_txn', 'schema_create'). When the allowance
   * is exhausted the limit CTA is shown before the form even renders.
   */
  readonly usageDimension?: string
  readonly children: ReactNode
}

/**
 * Client-side wrapper that reads the current org from Redux and gates its
 * children via EntitlementGate. Use this in Next.js page files (which are server
 * components) to add marketplace entitlement + usage-limit checks to a feature.
 *
 * Usage:
 *   <FeatureGateWrapper feature="issuance" usageDimension="issuance_txn">
 *     <IssueCred />
 *   </FeatureGateWrapper>
 */
export function FeatureGateWrapper({
  feature,
  usageDimension,
  children,
}: FeatureGateWrapperProps): React.JSX.Element {
  const orgId = useAppSelector((state) => state.organization.orgId)

  return (
    <EntitlementGate
      orgId={orgId || undefined}
      feature={feature}
      usageDimension={usageDimension}
    >
      {children}
    </EntitlementGate>
  )
}
