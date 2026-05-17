import { marketplaceLegal, termsSections } from '@/config/marketplaceLegal'
import { LegalPage } from '@/components/Legal/LegalPage'

export const metadata = {
  title: 'Terms of Use | Phenix ID Platform',
}

export default function TermsOfUsePage(): React.JSX.Element {
  return (
    <LegalPage
      title="Terms of Use"
      description={`These terms describe the operational conditions for using ${marketplaceLegal.productName}, including Microsoft Marketplace subscription activation, customer responsibilities, acceptable use, data ownership, support, and service changes.`}
      sections={termsSections}
    />
  )
}
