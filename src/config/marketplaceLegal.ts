const envValue = (value: string | undefined, fallback: string): string => {
  const normalized = value?.trim()

  if (!normalized || normalized.startsWith('#')) {
    return fallback
  }

  return normalized
}

export const marketplaceLegal = {
  productName: envValue(
    process.env.NEXT_PUBLIC_MARKETPLACE_PRODUCT_NAME,
    'Phenix ID Platform',
  ),
  publisherName: envValue(
    process.env.NEXT_PUBLIC_MARKETPLACE_PUBLISHER_NAME,
    'Phenix',
  ),
  supportEmail: envValue(
    process.env.NEXT_PUBLIC_MARKETPLACE_SUPPORT_EMAIL,
    'support@phenix-id.com',
  ),
  privacyEmail: envValue(
    process.env.NEXT_PUBLIC_MARKETPLACE_PRIVACY_EMAIL,
    'privacy@phenix-id.com',
  ),
  supportUrl: '/legal/support',
  privacyUrl: '/legal/privacy-policy',
  termsUrl: '/legal/terms-of-use',
  lastUpdated: 'May 17, 2026',
}

export const marketplaceTrustItems = [
  {
    title: 'Privacy policy',
    description:
      'Explains what account, organization, credential workflow, Marketplace subscription, usage, device, and support data may be processed to provide the service.',
    href: marketplaceLegal.privacyUrl,
  },
  {
    title: 'Terms of use',
    description:
      'Defines account responsibilities, permitted use, Marketplace subscription handling, service restrictions, suspension, and support expectations.',
    href: marketplaceLegal.termsUrl,
  },
  {
    title: 'Support',
    description:
      'Provides the support path for onboarding, subscription activation, entitlement sync, account access, billing handoff, and security/privacy requests.',
    href: marketplaceLegal.supportUrl,
  },
]

export const privacySections = [
  {
    title: 'Information we process',
    items: [
      'Account identity details such as name, email address, organization membership, role, and authentication metadata.',
      'Organization details such as organization name, website, descriptions, selected plan, billing identifiers, and Marketplace subscription references.',
      'Product activity needed to operate credential issuance, verification, schema, connection, wallet, audit, entitlement, and usage workflows.',
      'Marketplace fulfillment data provided by Microsoft, including subscription ID, offer ID, plan ID, purchaser or beneficiary identifiers, term dates, activation status, and metering status.',
      'Support and operational records such as tickets, diagnostics, logs, error messages, IP address, browser details, and timestamps.',
    ],
  },
  {
    title: 'How we use information',
    items: [
      'To authenticate users, provision organizations, activate Marketplace subscriptions, and enforce role-based access.',
      'To operate credential lifecycle features, keep usage within plan limits, and submit metered usage where a Marketplace plan requires it.',
      'To maintain security, detect abuse, troubleshoot incidents, improve reliability, and respond to support requests.',
      'To meet legal, tax, audit, compliance, and contractual obligations connected with the service.',
    ],
  },
  {
    title: 'Sharing and subprocessors',
    items: [
      'Microsoft receives Marketplace subscription, activation, entitlement, and metering information needed for purchase, billing, and subscription management.',
      'Cloud, infrastructure, email, monitoring, identity, and support providers may process data as subprocessors only for service operations.',
      'We do not sell customer personal data and do not use customer credential content for advertising.',
      'Customer administrators control which users and integrations can access organization data inside the service.',
    ],
  },
  {
    title: 'Retention, security, and rights',
    items: [
      'Records are retained only as needed for service delivery, billing reconciliation, security, audit, dispute handling, and legal obligations.',
      'Security controls include access control, encryption in transit, operational monitoring, and administrative separation by organization.',
      'Customers may request access, correction, export, deletion, restriction, or objection where applicable law provides those rights.',
      `Privacy requests can be sent to ${marketplaceLegal.privacyEmail}.`,
    ],
  },
]

export const termsSections = [
  {
    title: 'Marketplace subscription',
    items: [
      'The service is configured after a customer purchases or manages a SaaS subscription through Microsoft Marketplace.',
      'Microsoft remains responsible for Marketplace purchase, invoice, payment method, tax, refund, and subscription-management surfaces.',
      'Phenix ID Platform resolves the Marketplace purchase token, provisions the SaaS account, activates the subscription, and synchronizes entitlements after setup is complete.',
      'Plan changes, suspensions, renewals, cancellations, and reinstatements may affect access to paid features and usage limits.',
    ],
  },
  {
    title: 'Customer responsibilities',
    items: [
      'Customers are responsible for authorized user access, organization configuration, credential schemas, credential content, connection invitations, verification rules, and integrations they create.',
      'Customers must have the rights and consents required to process personal data, credential data, wallet data, and verification data through the service.',
      'Customers must not misuse the service, bypass limits, interfere with security, upload unlawful content, or attempt unauthorized access.',
    ],
  },
  {
    title: 'Service use and availability',
    items: [
      'The service may be updated to improve security, reliability, compliance, Marketplace integration, or product functionality.',
      'Access may be suspended or limited for security risk, policy violation, unpaid or inactive Marketplace subscriptions, or legal requirements.',
      'Support is provided through the published support contact and does not replace Microsoft Marketplace billing support.',
    ],
  },
  {
    title: 'Data, ownership, and changes',
    items: [
      'Customers retain ownership of their organization data and credential workflow content.',
      'Phenix retains ownership of the platform software, documentation, designs, trademarks, and service technology.',
      'Terms, privacy information, and support processes may be updated as the Marketplace offer, service, or legal requirements change.',
    ],
  },
]

export const supportSections = [
  {
    title: 'Support scope',
    items: [
      'Marketplace onboarding, subscription activation, entitlement synchronization, and organization linking.',
      'Account access, role assignment, credential workflow setup, product usage questions, and operational errors.',
      'Security, privacy, data access, deletion, and incident-reporting requests.',
    ],
  },
  {
    title: 'Billing handoff',
    items: [
      'Marketplace invoices, payment methods, taxes, cancellations, refunds, and subscription purchases are handled in Microsoft Marketplace.',
      'Studio displays subscription, entitlement, and usage status for operational awareness, but it does not collect cards or issue Marketplace invoices.',
    ],
  },
  {
    title: 'What to include',
    items: [
      'Your organization name, signed-in email, Marketplace subscription ID if available, plan name, approximate time of issue, and screenshots or error messages.',
      `Email ${marketplaceLegal.supportEmail} for help with Phenix ID Platform support requests.`,
    ],
  },
]
