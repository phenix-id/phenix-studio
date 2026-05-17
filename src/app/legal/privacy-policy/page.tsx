import { marketplaceLegal, privacySections } from '@/config/marketplaceLegal'
import { LegalPage } from '@/components/Legal/LegalPage'

export const metadata = {
  title: 'Privacy Policy | Phenix ID Platform',
}

export default function PrivacyPolicyPage(): React.JSX.Element {
  return (
    <LegalPage
      title="Privacy Policy"
      description={`${marketplaceLegal.publisherName} uses this policy to explain how ${marketplaceLegal.productName} processes personal data, customer data, Marketplace subscription information, and support data while providing the Studio service.`}
      sections={privacySections}
    />
  )
}
