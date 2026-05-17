import { marketplaceLegal, supportSections } from '@/config/marketplaceLegal'
import { LegalPage } from '@/components/Legal/LegalPage'

export const metadata = {
  title: 'Support | Phenix ID Platform',
}

export default function SupportPage(): React.JSX.Element {
  return (
    <LegalPage
      title="Support"
      description={`${marketplaceLegal.productName} support covers Studio onboarding, Microsoft Marketplace activation, entitlement synchronization, organization linking, product operations, and security or privacy requests.`}
      sections={supportSections}
    />
  )
}
