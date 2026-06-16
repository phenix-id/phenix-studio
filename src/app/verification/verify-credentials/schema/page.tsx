import { FeatureGateWrapper } from '@/components/Marketplace/FeatureGateWrapper'
import React from 'react'
import VerificationSchemasList from '@/features/verification/components/VerificationSchemasList'

const page = (): React.JSX.Element => (
  <div>
    <FeatureGateWrapper
      feature="verification"
      usageDimension="verification_txn"
    >
      <VerificationSchemasList />
    </FeatureGateWrapper>
  </div>
)

export default page
