import { axiosGet, axiosPost } from '@/services/apiRequests'

import { AxiosResponse } from 'axios'
import { apiRoutes } from '@/config/apiRoutes'
import { getHeaderConfigs } from '@/config/GetHeaderConfigs'

export type MarketplaceSubscriptionStatus =
  | 'PendingFulfillmentStart'
  | 'Subscribed'
  | 'Suspended'
  | 'Unsubscribed'

export type MarketplaceActivationStatus =
  | 'not_started'
  | 'in_progress'
  | 'activated'
  | 'failed'

export type MarketplaceNextAction =
  | 'link_account'
  | 'create_organization'
  | 'activate'
  | 'open_dashboard'
  | 'manage_billing'

export interface MarketplaceBuyerClaims {
  tid?: string
  oid?: string
  email?: string
  preferred_username?: string
  name?: string
}

export interface ResolveMarketplacePayload {
  marketplaceToken: string
  microsoftIdToken?: string
  buyerClaims?: MarketplaceBuyerClaims
}

export interface MarketplaceSubscriptionSummary {
  subscriptionId: string
  offerId: string
  planId: string
  subscriptionName: string
  saasSubscriptionStatus: MarketplaceSubscriptionStatus
  localActivationStatus: MarketplaceActivationStatus
  linkedOrgId?: string | null
  purchaserEmail?: string | null
  beneficiaryEmail?: string | null
  quantity?: number | null
  termStartDate?: string | null
  termEndDate?: string | null
  autoRenew?: boolean | null
}

export interface ResolveMarketplaceResponse
  extends MarketplaceSubscriptionSummary {
  onboardingSessionId: string
  nextAction: MarketplaceNextAction
}

export type MarketplaceOnboardingStatus =
  | 'resolved'
  | 'account_linked'
  | 'org_linked'
  | 'activation_pending'
  | 'activated'
  | 'expired'
  | 'failed'

export interface MarketplaceOnboardingSession {
  id: string
  status: MarketplaceOnboardingStatus
  expiresAt?: string
  nextAction?: MarketplaceNextAction
  subscription: MarketplaceSubscriptionSummary
  linkedOrgId?: string | null
}

export interface LinkMarketplaceAccountPayload {
  mode: 'existing_user' | 'create_from_microsoft_sso'
  email?: string
  firstName?: string
  lastName?: string
  microsoftTenantId?: string
  microsoftObjectId?: string
}

export interface MarketplaceOrganizationPayload {
  mode: 'create' | 'link_existing'
  orgId?: string
  organization?: {
    name: string
    description?: string
    website?: string
    logo?: string
  }
}

export interface MarketplaceUsageDimension {
  dimension: string
  displayName: string
  included: number
  used: number
  overage: number
  pendingSubmission?: number
  acceptedByMicrosoft?: number
}

export interface MarketplaceUsageSummary {
  billingPeriod?: {
    start: string
    end: string
    termUnit?: string
  }
  dimensions: MarketplaceUsageDimension[]
}

export interface MarketplaceEntitlements {
  orgId: string
  subscription?: {
    subscriptionId: string
    status: MarketplaceSubscriptionStatus
    planId: string
  }
  features: Record<string, boolean>
  limits?: Record<string, number | null>
  usage?: Record<
    string,
    {
      included: number
      used: number
      overage: number
    }
  >
  blockedReason?: string | null
}

export interface MarketplaceMeteringEvent {
  id: string
  dimension: string
  quantity: number
  usageStartTime: string
  status: string
  marketplaceMessage?: string | null
  submittedAt?: string | null
}

export const resolveMarketplaceSubscription = async (
  data: ResolveMarketplacePayload,
): Promise<AxiosResponse | string> => {
  try {
    return await axiosPost({
      url: apiRoutes.Marketplace.resolve,
      payload: data,
    })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const getMarketplaceOnboardingSession = async (
  sessionId: string,
): Promise<AxiosResponse | string> => {
  try {
    return await axiosGet({
      url: `${apiRoutes.Marketplace.onboardingSession}/${sessionId}`,
      config: getHeaderConfigs(),
    })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const linkMarketplaceAccount = async (
  sessionId: string,
  data: LinkMarketplaceAccountPayload,
): Promise<AxiosResponse | string> => {
  try {
    return await axiosPost({
      url: `${apiRoutes.Marketplace.onboarding}/${sessionId}/account`,
      payload: data,
      config: getHeaderConfigs(),
    })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const createMarketplaceOrganization = async (
  sessionId: string,
  data: MarketplaceOrganizationPayload,
): Promise<AxiosResponse | string> => {
  try {
    return await axiosPost({
      url: `${apiRoutes.Marketplace.onboarding}/${sessionId}/organization`,
      payload: data,
      config: getHeaderConfigs(),
    })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const activateMarketplaceSubscription = async (
  sessionId: string,
  orgId: string,
): Promise<AxiosResponse | string> => {
  try {
    return await axiosPost({
      url: `${apiRoutes.Marketplace.onboarding}/${sessionId}/activate`,
      payload: { orgId },
      config: getHeaderConfigs(),
    })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const getMarketplaceSubscription = async (
  subscriptionId: string,
): Promise<AxiosResponse | string> => {
  try {
    return await axiosGet({
      url: `${apiRoutes.Marketplace.subscription}/${subscriptionId}`,
      config: getHeaderConfigs(),
    })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const refreshMarketplaceSubscription = async (
  subscriptionId: string,
): Promise<AxiosResponse | string> => {
  try {
    return await axiosPost({
      url: `${apiRoutes.Marketplace.subscription}/${subscriptionId}/refresh`,
      config: getHeaderConfigs(),
    })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const getOrgEntitlements = async (
  orgId: string,
): Promise<AxiosResponse | string> => {
  try {
    return await axiosGet({
      url: `${apiRoutes.Marketplace.entitlements}/${orgId}/entitlements`,
      config: getHeaderConfigs(),
    })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const getOrgUsageSummary = async (
  orgId: string,
): Promise<AxiosResponse | string> => {
  try {
    return await axiosGet({
      url: `${apiRoutes.Marketplace.usageSummary}/${orgId}/usage-summary`,
      config: getHeaderConfigs(),
    })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}

export const getOrgMeteringEvents = async (
  orgId: string,
): Promise<AxiosResponse | string> => {
  try {
    return await axiosGet({
      url: `${apiRoutes.Marketplace.meteringEvents}/${orgId}/metering-events`,
      config: getHeaderConfigs(),
    })
  } catch (error) {
    const err = error as Error
    return err?.message
  }
}
