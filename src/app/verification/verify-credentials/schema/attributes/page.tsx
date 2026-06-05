import EmailAttributesSelection from '@/features/verification/components/EmailAttributesSelection'
import { FeatureGateWrapper } from '@/components/Marketplace/FeatureGateWrapper'
import React from 'react'

const page = (): React.JSX.Element => (
  <div>
    <FeatureGateWrapper
      feature="verification"
      usageDimension="verification_txn"
    >
      <EmailAttributesSelection />
    </FeatureGateWrapper>
  </div>
)

export default page
