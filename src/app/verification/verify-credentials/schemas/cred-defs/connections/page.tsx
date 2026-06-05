import Connections from '@/features/verification/components/Connections'
import { FeatureGateWrapper } from '@/components/Marketplace/FeatureGateWrapper'
import React from 'react'

const page = (): React.JSX.Element => (
  <div>
    <FeatureGateWrapper
      feature="verification"
      usageDimension="verification_txn"
    >
      <Connections />
    </FeatureGateWrapper>
  </div>
)

export default page
