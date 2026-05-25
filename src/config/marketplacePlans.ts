export interface MarketplacePlanCatalogItem {
  planId: 'starter' | 'business' | 'enterprise'
  planName: string
  baseMonthlyPriceUsd: number
  includedIssuanceTransactions: number
  includedVerificationTransactions: number
  includedSchemas: number
  maxOrganizations: number
  maxUsers: number
}

export const marketplaceSetupFeeUsd = 30000

export const marketplacePlanCatalog: MarketplacePlanCatalogItem[] = [
  {
    planId: 'starter',
    planName: 'Starter',
    baseMonthlyPriceUsd: 550,
    includedIssuanceTransactions: 1000,
    includedVerificationTransactions: 1000,
    includedSchemas: 1,
    maxOrganizations: 1,
    maxUsers: 1,
  },
  {
    planId: 'business',
    planName: 'Business',
    baseMonthlyPriceUsd: 2750,
    includedIssuanceTransactions: 5000,
    includedVerificationTransactions: 5000,
    includedSchemas: 5,
    maxOrganizations: 1,
    maxUsers: 2,
  },
  {
    planId: 'enterprise',
    planName: 'Enterprise',
    baseMonthlyPriceUsd: 5500,
    includedIssuanceTransactions: 10000,
    includedVerificationTransactions: 10000,
    includedSchemas: 10,
    maxOrganizations: 5,
    maxUsers: 5,
  },
]

export const marketplaceMeterUnitPricesUsd: Record<string, number> = {
  ['setup_fee']: marketplaceSetupFeeUsd,
  ['issuance_txn']: 0.5,
  ['verification_txn']: 0.05,
}
