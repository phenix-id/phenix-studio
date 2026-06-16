import React, { JSX } from 'react'

import EmailIssuance from '@/features/organization/emailIssuance/components/EmailIssuance'
import { FeatureGateWrapper } from '@/components/Marketplace/FeatureGateWrapper'

const page = (): JSX.Element => (
  <FeatureGateWrapper feature="issuance" usageDimension="issuance_txn">
    <EmailIssuance />
  </FeatureGateWrapper>
)

export default page
