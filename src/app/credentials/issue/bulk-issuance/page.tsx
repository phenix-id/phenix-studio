import BulkIssuance from '@/features/organization/bulkIssuance/components/BulkIssuance'
import { FeatureGateWrapper } from '@/components/Marketplace/FeatureGateWrapper'
import React from 'react'

const page = (): React.JSX.Element => (
  <FeatureGateWrapper feature="bulkIssuance" usageDimension="issuance_txn">
    <BulkIssuance />
  </FeatureGateWrapper>
)

export default page
