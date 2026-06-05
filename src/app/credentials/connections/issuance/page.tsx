import { FeatureGateWrapper } from '@/components/Marketplace/FeatureGateWrapper'
import IssueCred from '@/features/organization/connectionIssuance/components/Issuance'
import React from 'react'

const page = (): React.JSX.Element => (
  <FeatureGateWrapper feature="issuance" usageDimension="issuance_txn">
    <IssueCred />
  </FeatureGateWrapper>
)

export default page
