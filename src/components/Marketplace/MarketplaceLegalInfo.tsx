'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ExternalLink, LifeBuoy, LockKeyhole, ShieldCheck } from 'lucide-react'
import {
  marketplaceLegal,
  marketplaceTrustItems,
} from '@/config/marketplaceLegal'
import Link from 'next/link'

export function MarketplaceLegalInfo(): React.JSX.Element {
  return (
    <section className="bg-card text-card-foreground rounded-lg border p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="size-4" aria-hidden="true" />
            Marketplace trust and legal information
          </div>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
            Review the Phenix ID Platform privacy, terms, and support details
            before linking a Microsoft Marketplace purchase to your Studio
            organization.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
            <LockKeyhole className="size-3.5" aria-hidden="true" />
            Secure onboarding
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
            <LifeBuoy className="size-3.5" aria-hidden="true" />
            {marketplaceLegal.supportEmail}
          </span>
        </div>
      </div>

      <Accordion type="single" collapsible className="mt-4">
        {marketplaceTrustItems.map((item) => (
          <AccordionItem
            key={item.title}
            value={item.title}
            className="border-t first:border-t-0"
          >
            <AccordionTrigger>{item.title}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-3">
              <p>{item.description}</p>
              <Link
                href={item.href}
                target="_blank"
                className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
              >
                Open {item.title.toLowerCase()}
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </Link>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
