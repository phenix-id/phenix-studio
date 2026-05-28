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
  lastUpdated: 'May 28, 2026',
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
    title: 'Data we collect and process',
    items: [
      'Account identity details such as name, email address, organization membership, role, and authentication metadata.',
      'Organization details such as organization name, website, descriptions, administrative users, selected plan, billing identifiers, and Marketplace subscription references.',
      'Product activity needed to operate credential issuance, verification, schema, connection, wallet, DID, audit, entitlement, and usage workflows.',
      'Marketplace fulfillment data provided by Microsoft, including subscription ID, offer ID, plan ID, purchaser or beneficiary identifiers, term dates, activation status, and metering status.',
      'Support and operational records such as tickets, diagnostics, logs, error messages, IP address, browser details, device metadata, and timestamps.',
      'Billing usage events such as completed issuance, verification, schema, and overage-metering records required to operate the subscribed plan.',
    ],
  },
  {
    title: 'SSI-specific data handling',
    items: [
      'Customers control the credential schemas, credential definitions, issuance workflows, verification requests, connection invitations, and organization wallet configuration they create in the service.',
      'Decentralized identifiers, public DID documents, credential definitions, schemas, and ledger transactions may be written to supported SSI networks where they can be publicly visible or independently retained by those networks.',
      'Verifiable credential payloads, holder attributes, proof responses, and connection records are processed only to provide issuance, verification, wallet, audit, webhook, support, and compliance functions requested by the customer.',
      'Holders remain the owners of credentials and wallet-held data in their possession. Customers are responsible for the notices, consents, lawful basis, and data minimization required when issuing credentials to holders or requesting proofs from holders.',
      'The service does not sell holder data and does not use credential content, proof content, DIDs, or holder attributes for advertising.',
    ],
  },
  {
    title: 'How we use data',
    items: [
      'To authenticate users, provision organizations, activate Marketplace subscriptions, and enforce role-based access.',
      'To operate credential lifecycle features, maintain organization wallets, deliver webhooks, keep usage within plan limits, and submit metered usage where a Marketplace plan requires it.',
      'To maintain security, detect abuse, troubleshoot incidents, improve reliability, and respond to support requests.',
      'To meet legal, tax, audit, compliance, and contractual obligations connected with the service.',
      'To communicate administrative, security, support, product, billing, and Marketplace subscription notices.',
    ],
  },
  {
    title: 'Processing locations and subprocessors',
    items: [
      'Microsoft receives Marketplace subscription, activation, entitlement, and metering information needed for purchase, billing, and subscription management.',
      'Cloud, infrastructure, database, storage, identity, email, monitoring, analytics, and support providers may process data as subprocessors only for service operations.',
      'Data may be processed in the United States, the European Economic Area, the United Kingdom, India, and other locations where Phenix, Microsoft, cloud infrastructure, support, or subprocessors operate.',
      'When personal data is transferred across borders, we rely on contractual safeguards, technical controls, and other lawful transfer mechanisms required by applicable data-protection law.',
      'We do not sell customer personal data and do not use customer credential content for advertising.',
      'Customer administrators control which users and integrations can access organization data inside the service.',
    ],
  },
  {
    title: 'Retention and deletion',
    items: [
      'Operational records are retained only as needed for service delivery, security, audit, billing reconciliation, dispute handling, legal obligations, and customer support.',
      'Marketplace subscription, activation, entitlement, invoice-adjacent, and metering records may be retained for the period required by Microsoft Marketplace operations, tax, audit, accounting, legal, and dispute-resolution obligations.',
      'Credential workflow records, webhook records, DID records, organization wallet metadata, and logs are retained according to customer configuration, service operations, backups, audit needs, and legal obligations.',
      'Data written to public or permissioned SSI ledgers may not be erasable by Phenix because those ledgers are operated independently from the Studio service.',
      'After termination or deletion, data may remain in backups for a limited period before routine deletion, unless a longer period is required for legal, security, or billing reasons.',
    ],
  },
  {
    title: 'Security',
    items: [
      'Security controls include role-based access control, organization separation, encryption in transit, operational monitoring, audit logging, and administrative access controls.',
      'Customers are responsible for managing their authorized users, organization roles, wallet configuration, webhook endpoints, API credentials, credential content, and lawful use of the service.',
      'Security incidents affecting customer data will be handled according to applicable law, customer agreements, and the published support process.',
    ],
  },
  {
    title: 'GDPR and EU customer provisions',
    items: [
      'For EU, EEA, UK, and Swiss customers, Phenix processes personal data as a controller for account, billing-adjacent, security, compliance, and support data, and as a processor or service provider for customer-controlled credential workflow data where applicable.',
      'Customers are responsible for identifying the lawful basis for issuing credentials, requesting proofs, collecting holder data, and configuring SSI workflows that process personal data.',
      'Where GDPR applies, data subjects may request access, correction, erasure, portability, restriction, objection, or withdrawal of consent where applicable.',
      'We support reasonable customer requests needed to answer data-subject requests, complete data-protection assessments, and meet controller or processor obligations.',
      'Where required, cross-border transfers are protected through Standard Contractual Clauses, UK transfer mechanisms, adequacy decisions, or other lawful safeguards.',
      `EU privacy and data-protection requests can be sent to ${marketplaceLegal.privacyEmail}.`,
    ],
  },
  {
    title: 'Privacy rights and contact',
    items: [
      'Customers may request access, correction, export, deletion, restriction, or objection where applicable law provides those rights.',
      'Customers may request details about subprocessors, processing locations, retention, security, and Marketplace-related data sharing.',
      `Privacy requests can be sent to ${marketplaceLegal.privacyEmail}.`,
    ],
  },
]

export const termsSections = [
  {
    title: 'Marketplace subscription and account activation',
    items: [
      'The service is configured after a customer purchases or manages a SaaS subscription through Microsoft Marketplace.',
      'Microsoft remains responsible for Marketplace purchase, invoice, payment method, tax, refund, and subscription-management surfaces.',
      'Phenix ID Platform resolves the Marketplace purchase token, provisions the SaaS account, activates the subscription, and synchronizes entitlements after setup is complete.',
      'Plan changes, suspensions, renewals, cancellations, and reinstatements may affect access to paid features and usage limits.',
      'The customer is responsible for keeping Marketplace subscription details, administrative users, organization ownership, and billing contacts accurate.',
    ],
  },
  {
    title: 'Acceptable use and customer responsibilities',
    items: [
      'Customers are responsible for authorized user access, organization configuration, credential schemas, credential content, connection invitations, verification rules, and integrations they create.',
      'Customers must have the rights and consents required to process personal data, credential data, wallet data, and verification data through the service.',
      'Customers must not misuse the service, bypass limits, interfere with security, upload unlawful content, submit deceptive credentials, impersonate another party, or attempt unauthorized access.',
      'Customers are responsible for API keys, webhook destinations, credential templates, issuance policies, verification policies, holder communications, and downstream use of returned verification results.',
      'Customers must comply with laws that apply to identity, privacy, consumer protection, anti-discrimination, financial services, healthcare, employment, education, and other regulated uses of credentials.',
    ],
  },
  {
    title: 'SSI-specific terms',
    items: [
      'Customers retain ownership of credential content, organization data, issuer configuration, verifier configuration, schemas they author, and business records they upload or generate through the service.',
      'Holders retain ownership and control over credentials and holder wallet data in their possession. The service must not be used to deny holder rights required by applicable law.',
      'Issuers are responsible for the accuracy, legality, revocation policy, expiration policy, holder notice, and lifecycle management of credentials they issue.',
      'Verifiers are responsible for ensuring each proof request is lawful, proportionate, accurate, and limited to the information needed for the intended purpose.',
      'DIDs, schemas, credential definitions, revocation registries, and ledger transactions may be persistent on external SSI networks and may not be removable by Phenix.',
      'Phenix does not guarantee that third-party wallets, ledgers, holder devices, relying parties, or external agent infrastructure will accept, preserve, or interpret credentials exactly as configured.',
    ],
  },
  {
    title: 'SLA, support tiers, and uptime',
    items: [
      'The service target is 99.5% monthly uptime for production Studio and API services, excluding planned maintenance, emergency maintenance, customer-side issues, third-party Marketplace services, third-party ledgers, wallets, agents, internet outages, force majeure events, and preview or beta functionality.',
      'Starter support is provided during business hours with commercially reasonable response times for setup, subscription, entitlement, and product questions.',
      'Business support receives prioritized business-hour handling for production incidents, onboarding, entitlement sync, billing handoff, and operational questions.',
      'Enterprise support may include enhanced response targets, onboarding assistance, architecture review, and dedicated escalation paths when included in the customer plan or order.',
      `Support requests should be submitted to ${marketplaceLegal.supportEmail}. Microsoft Marketplace billing, payment, tax, refund, and invoice issues must be handled through Microsoft.`,
      'The service may be updated, limited, or maintained to improve security, reliability, compliance, Marketplace integration, or product functionality.',
    ],
  },
  {
    title: 'Data export, portability, and deletion',
    items: [
      'During an active subscription, customers may export available organization records, schemas, credential workflow records, verification records, usage records, and other data made available through product screens, APIs, or support-assisted export.',
      'After termination, customers should request export before access ends. Phenix may provide a reasonable export period where technically and legally feasible.',
      'Deletion requests are handled subject to legal, audit, security, billing, backup, Marketplace, and ledger-retention limitations.',
      'Data written to supported SSI ledgers, holder wallets, Microsoft Marketplace, customer-controlled systems, or third-party integrations may remain outside Phenix control after export, termination, or deletion.',
    ],
  },
  {
    title: 'Suspension and termination',
    items: [
      'Access may be suspended, limited, or terminated for security risk, policy violation, unlawful use, unpaid or inactive Marketplace subscriptions, excessive failed payments, fraud risk, abuse, customer request, Microsoft Marketplace lifecycle events, or legal requirements.',
      'Customers may cancel or manage the SaaS subscription through Microsoft Marketplace. Marketplace cancellation may stop entitlement synchronization and paid feature access.',
      'Phenix may terminate access if continued service would create legal, security, operational, or compliance risk.',
      'Upon termination, customers remain responsible for outstanding Marketplace charges, metered usage submitted before termination, exported data handling, and obligations that by nature should survive termination.',
    ],
  },
  {
    title: 'Liability limits and disclaimers',
    items: [
      'The service is provided for identity, credential, verification, workflow, and Marketplace subscription operations, but customers decide how to use credentials and verification outcomes in their business processes.',
      'To the maximum extent permitted by law, Phenix is not liable for indirect, incidental, special, consequential, exemplary, punitive, lost profit, lost revenue, lost goodwill, business interruption, or lost data damages.',
      'To the maximum extent permitted by law, aggregate liability for claims relating to the service is limited to the amounts paid for the affected service during the twelve months before the event giving rise to the claim.',
      'Phenix is not responsible for failures caused by Microsoft Marketplace, customer systems, third-party wallets, SSI ledgers, holder devices, network providers, customer configuration, or unauthorized customer-side access.',
      'Nothing in these terms limits liability that cannot be limited under applicable law.',
    ],
  },
  {
    title: 'Service ownership and changes',
    items: [
      'Phenix retains ownership of the platform software, documentation, designs, trademarks, service technology, APIs, templates, and Marketplace integration components.',
      'Terms, privacy information, support processes, plan limits, and service features may be updated as the Marketplace offer, service, or legal requirements change.',
      'Material changes will be reflected by updating the last-updated date and, where appropriate, by providing administrative notice through the service or support channel.',
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
