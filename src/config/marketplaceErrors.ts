/**
 * Machine-readable marketplace error/blocked-reason codes returned by the platform.
 *
 * The backend attaches these as the `code` field on error responses (preserved through
 * `apiRequests.ts#HandleResponse` and the per-API `ApiErrorResult`), and as
 * `entitlements.blockedReason`. Branch on these codes instead of matching message text,
 * which is brittle to wording changes.
 */

/** Plan limits that are reached during an action (the user can upgrade to proceed). */
export const MARKETPLACE_LIMIT_CODES = [
  'marketplace_org_limit_reached',
  'marketplace_user_limit_reached',
  'marketplace_schema_limit_reached',
  'marketplace_issuance_limit_reached',
  'marketplace_verification_limit_reached',
] as const

/** A subscription is needed but the action is otherwise unavailable. */
export const MARKETPLACE_BLOCKED_CODES = [
  'marketplace_subscription_required',
  'marketplace_feature_not_allowed',
  'marketplace_activation_required',
  'marketplace_subscription_suspended',
  'marketplace_subscription_unsubscribed',
  'marketplace_activation_failed',
  'marketplace_entitlement_unavailable',
] as const

export type MarketplaceLimitCode = (typeof MARKETPLACE_LIMIT_CODES)[number]
export type MarketplaceBlockedCode = (typeof MARKETPLACE_BLOCKED_CODES)[number]
export type MarketplaceCode = MarketplaceLimitCode | MarketplaceBlockedCode

const LIMIT_SET = new Set<string>(MARKETPLACE_LIMIT_CODES)
const BLOCKED_SET = new Set<string>(MARKETPLACE_BLOCKED_CODES)

/**
 * Codes handled by a dedicated inline CTA in their own flow (org-create modal, invite
 * dialog, subscribe screen / EntitlementGate) — the central error toast skips these to
 * avoid a duplicate notice. Everything else in the limit/blocked sets is a mid-workflow
 * gate (issuance, verification, schema, suspended/unsubscribed, …) surfaced uniformly via
 * the central toast-with-CTA.
 */
const INLINE_HANDLED_CODES = new Set<string>([
  'marketplace_org_limit_reached',
  'marketplace_user_limit_reached',
  'marketplace_subscription_required',
])

/** True for codes that should surface the central "manage subscription" toast CTA. */
export const isMarketplaceToastCode = (code?: string | null): boolean =>
  Boolean(
    code &&
      (LIMIT_SET.has(code) || BLOCKED_SET.has(code)) &&
      !INLINE_HANDLED_CODES.has(code),
  )

/** True when a plan limit was reached and the user should be offered an upgrade CTA. */
export const isMarketplaceLimitError = (code?: string | null): boolean =>
  Boolean(code && LIMIT_SET.has(code))

/** True for any marketplace gate (limit reached OR otherwise blocked/subscription needed). */
export const isMarketplaceGateError = (code?: string | null): boolean =>
  Boolean(code && (LIMIT_SET.has(code) || BLOCKED_SET.has(code)))

/**
 * Friendly, user-facing copy for a marketplace code. Falls back to the backend message
 * (or a generic line) for unknown codes.
 */
export const marketplaceCodeMessage = (
  code?: string | null,
  fallback?: string | null,
): string => {
  switch (code) {
    case 'marketplace_org_limit_reached':
      return 'You have reached the number of organizations included in your current plan. Upgrade your subscription to add more.'
    case 'marketplace_user_limit_reached':
      return 'You have reached the number of Studio users included in your current plan. Upgrade your subscription to invite more.'
    case 'marketplace_schema_limit_reached':
      return 'You have reached your plan’s schema creation limit. Upgrade your subscription to create more.'
    case 'marketplace_issuance_limit_reached':
      return 'You have reached your plan’s credential issuance limit for this billing period. Upgrade your subscription to issue more.'
    case 'marketplace_verification_limit_reached':
      return 'You have reached your plan’s verification limit for this billing period. Upgrade your subscription to verify more.'
    case 'marketplace_subscription_suspended':
      return 'Your Microsoft Marketplace subscription is suspended. Reinstate it in Microsoft to restore access.'
    case 'marketplace_subscription_unsubscribed':
      return 'Your Microsoft Marketplace subscription has been cancelled. Re-subscribe in Microsoft to restore access.'
    case 'marketplace_activation_required':
      return 'Your subscription is not active yet. Finish activation to start using this feature.'
    case 'marketplace_activation_failed':
      return 'Subscription activation failed. Manage your subscription in Microsoft and try again.'
    case 'marketplace_subscription_required':
      return 'This action requires an active Microsoft Marketplace subscription.'
    case 'marketplace_feature_not_allowed':
    case 'marketplace_entitlement_unavailable':
    default:
      return (
        fallback ||
        'This action requires an active Microsoft Marketplace subscription.'
      )
  }
}
