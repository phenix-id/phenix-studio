import { FeatureGateWrapper } from '@/components/Marketplace/FeatureGateWrapper'
import OobIssuance from '@/features/organization/oobIssuance/components/OobIssuance'
import React from 'react'

const page = (): React.JSX.Element => (
  <FeatureGateWrapper feature="issuance" usageDimension="issuance_txn">
    <OobIssuance />
  </FeatureGateWrapper>
)

export default page
