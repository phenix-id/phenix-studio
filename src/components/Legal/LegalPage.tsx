import Link from 'next/link'
import { marketplaceLegal } from '@/config/marketplaceLegal'

interface LegalSection {
  title: string
  items: string[]
}

interface LegalPageProps {
  title: string
  description: string
  sections: LegalSection[]
}

export function LegalPage({
  title,
  description,
  sections,
}: LegalPageProps): React.JSX.Element {
  return (
    <main className="bg-background h-screen overflow-y-auto">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-12">
        <header className="space-y-3">
          <Link
            href="/marketplace/landing"
            className="text-primary text-sm font-medium hover:underline"
          >
            Back to Marketplace landing
          </Link>
          <div>
            <p className="text-muted-foreground text-sm font-medium">
              {marketplaceLegal.productName}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
              {title}
            </h1>
          </div>
          <p className="text-muted-foreground max-w-3xl text-sm leading-6">
            {description}
          </p>
          <p className="text-muted-foreground text-xs">
            Last updated: {marketplaceLegal.lastUpdated}
          </p>
        </header>

        <div className="space-y-6">
          {sections.map((section) => (
            <section key={section.title} className="rounded-lg border p-5">
              <h2 className="text-lg font-semibold tracking-normal">
                {section.title}
              </h2>
              <ul className="text-muted-foreground mt-4 list-disc space-y-2 pl-5 text-sm leading-6">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <footer className="text-muted-foreground border-t pt-6 text-sm">
          Contact{' '}
          <a
            href={`mailto:${marketplaceLegal.supportEmail}`}
            className="text-primary font-medium hover:underline"
          >
            {marketplaceLegal.supportEmail}
          </a>{' '}
          for Marketplace onboarding or service support.
        </footer>
      </div>
    </main>
  )
}
