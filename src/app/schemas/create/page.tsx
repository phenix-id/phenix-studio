import CreateSchema from '@/features/schemas/components/Create'
import { FeatureGateWrapper } from '@/components/Marketplace/FeatureGateWrapper'
import PageContainer from '@/components/layout/page-container'
import React from 'react'

const page = (): React.JSX.Element => (
  <div>
    <PageContainer>
      <FeatureGateWrapper feature="schemaCreate" usageDimension="schema_create">
        <CreateSchema />
      </FeatureGateWrapper>
    </PageContainer>
  </div>
)

export default page
