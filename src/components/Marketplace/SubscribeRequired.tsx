'use client'

import { ArrowUpRight, Lock } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { SubscribeCredentialIllustration } from './SubscribeCredentialIllustration'
// eslint-disable-next-line sort-imports
import { appLogoDarkPath, appLogoPath } from '@/config/CommonConstant'
import { useTheme } from 'next-themes'

const OFFER_URL = process.env.NEXT_PUBLIC_MARKETPLACE_OFFER_URL
const PRODUCT_NAME =
  process.env.NEXT_PUBLIC_MARKETPLACE_PRODUCT_NAME || 'PHENIX ID'

interface SubscribeRequiredProps {
  readonly title?: string
  readonly description?: string
  /** true = standalone page (no app header); wrapper uses h-screen.
   *  false (default) = inside the app layout (64px header); wrapper uses h-[calc(100vh-4rem)]. */
  readonly fullPage?: boolean
}

// ── Style constants ────────────────────────────────────────────────────────────
// The left panel is intentionally always a light/white surface regardless of
// the app's dark-mode setting. Use hardcoded light-mode values here — never
// theme CSS variables whose resolved colours flip in dark mode.
const sf = 'var(--font-serif)' // same in both modes
const ss = 'var(--font-sans)' // same in both modes
const sm = 'var(--font-mono)' // same in both modes
const PANEL_FG = '#0c0c1a'
const PANEL_FG_2 = 'rgba(12,12,26,0.55)'
const PANEL_BORDER = 'rgba(87,29,247,0.1)'

const sty = {
  h1: {
    fontFamily: sf,
    fontWeight: 700,
    fontSize: 'clamp(18px,4vw,24px)',
    letterSpacing: '-0.025em',
    lineHeight: 1.1,
    color: PANEL_FG,
  },
  lead: {
    fontFamily: ss,
    fontSize: '13.5px',
    lineHeight: 1.6,
    color: PANEL_FG_2,
    marginTop: '16px',
  },
  stepText: {
    fontFamily: ss,
    fontSize: '12.5px',
    color: PANEL_FG_2,
    lineHeight: 1.45,
  },
  numBubble: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#f2ecff',
    color: '#571df7',
    border: `0.5px solid ${PANEL_BORDER}`,
    fontFamily: sf,
    fontWeight: 600,
    fontSize: '11px',
  },
  btnPrimary: {
    borderRadius: '9999px',
    backgroundColor: '#571df7',
    color: '#fff',
    fontFamily: ss,
    fontWeight: 600,
    textDecoration: 'none',
    boxShadow: '0 10px 28px rgba(87,29,247,0.32)',
    transition: 'all 200ms cubic-bezier(0.2, 0.6, 0.2, 1)',
  },
  secNote: {
    fontFamily: ss,
    fontSize: '12px',
    color: 'rgba(12,12,26,0.45)',
    lineHeight: 1.5,
  },
  footer: { fontFamily: ss, fontSize: '12px', color: 'rgba(12,12,26,0.35)' },
} as const

// Inline bold helper keeps step copy concise
const B = ({ children }: { children: React.ReactNode }): React.JSX.Element => (
  <strong style={{ color: PANEL_FG, fontWeight: 600 }}>{children}</strong>
)

const STEPS: { n: string; detail: React.ReactNode }[] = [
  {
    n: '1',
    detail: (
      <>
        {' '}
        Find <B>{PRODUCT_NAME}</B> on the <B>Microsoft Azure Marketplace</B>.{' '}
      </>
    ),
  },
  {
    n: '2',
    detail: (
      <>
        {' '}
        Choose a plan — <B>Starter</B>, <B>Business</B>, or <B>Enterprise</B> —
        and complete checkout on Microsoft.{' '}
      </>
    ),
  },
  {
    n: '3',
    detail: (
      <>
        {' '}
        Return here to <B>link your account</B> and activate your subscription
        automatically.{' '}
      </>
    ),
  },
]

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Full-page subscribe gate — shown when a Marketplace subscription is required
 * but the user arrived without a valid purchase token, or when the backend
 * returns marketplace_subscription_required from the create-org flow.
 *
 * Layout: two-column split card (form left, brand illustration right).
 * Right panel hides at ≤920px.
 */
export function SubscribeRequired({
  title = 'Subscribe to get started',
  description = `${PRODUCT_NAME} is available through the Microsoft commercial marketplace. Subscribe on Microsoft, then return here — your purchase token is resolved automatically.`,
  fullPage = false,
}: SubscribeRequiredProps = {}): React.JSX.Element {
  // Hydration-safe theme detection — same pattern as DynamicApplicationLogo
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    setMounted(true)
  }, [])
  // Logo outside the card sits on the page background, which follows the theme
  const logoSrc =
    mounted && resolvedTheme === 'dark' ? appLogoDarkPath : appLogoPath

  return (
    <div
      className={`relative grid place-items-center p-0 min-[921px]:p-7 ${fullPage ? 'h-screen' : 'h-[calc(100vh_-_4rem)]'}`}
    >
      {/* Logo — outside the card on desktop only; hidden on mobile/tablet */}
      <div className="absolute top-4 left-4 z-10 hidden min-[921px]:top-7 min-[921px]:left-7 min-[921px]:block">
        <Image
          alt="PHENIX ID"
          src={logoSrc}
          height={204}
          width={781}
          className="h-7 w-auto object-contain min-[921px]:h-8"
          priority
        />
      </div>

      {/* Shell card */}
      <div
        className="w-full overflow-hidden rounded-none min-[921px]:rounded-[32px]"
        style={{
          maxWidth: '960px',
          height: fullPage
            ? 'min(700px,calc(100vh - 56px))'
            : 'min(680px,calc(100vh - 120px))',
          border: '0.5px solid var(--border)',
          boxShadow:
            '0 40px 100px rgba(12,12,26,0.16),0 8px 24px rgba(12,12,26,0.06)',
        }}
      >
        <div
          className="grid grid-cols-1 min-[921px]:grid-cols-2"
          style={{ height: '100%' }}
        >
          {/* ── Left: form panel ── */}
          {/* pt-14 on mobile gives clearance for the absolute logo above the card */}
          <div
            className="flex flex-col px-6 pt-6 pb-5 min-[921px]:px-10 min-[921px]:py-7"
            style={{ backgroundColor: '#ffffff' }}
          >
            {/* Logo — inside card on mobile/tablet; panel is always white so always use dark variant */}
            <div className="mb-5 shrink-0 min-[921px]:hidden">
              <Image
                alt="PHENIX ID"
                src={appLogoPath}
                height={204}
                width={781}
                className="h-8 w-auto object-contain"
                priority
              />
            </div>

            <div className="my-auto py-4 min-[921px]:py-8">
              <h1 style={sty.h1}>{title}</h1>
              <p style={sty.lead}>{description}</p>

              {/* Steps */}
              <div className="mt-5 min-[921px]:mt-7">
                {STEPS.map((step, i) => (
                  <div
                    key={step.n}
                    className="flex items-start gap-[14px] py-[12px]"
                    style={{
                      borderBottom:
                        i < STEPS.length - 1
                          ? `0.5px solid ${PANEL_BORDER}`
                          : 'none',
                    }}
                  >
                    <div
                      className="flex shrink-0 items-center justify-center"
                      style={sty.numBubble}
                    >
                      {step.n}
                    </div>
                    <p style={sty.stepText}>{step.detail}</p>
                  </div>
                ))}
              </div>

              {/* CTA buttons */}
              <div className="mt-6 flex flex-col min-[921px]:mt-7">
                {OFFER_URL ? (
                  <a
                    href={OFFER_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-1.5 px-4 py-[8px] text-[12.5px] active:scale-[0.985] min-[921px]:gap-[8px] min-[921px]:px-[18px] min-[921px]:py-[11px] min-[921px]:text-[13.5px]"
                    style={sty.btnPrimary}
                  >
                    <span
                      className="shrink-0"
                      style={{
                        display: 'inline-grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '2px',
                        width: '16px',
                        height: '16px',
                      }}
                    >
                      <i style={{ background: '#F25022', display: 'block' }} />
                      <i style={{ background: '#7FBA00', display: 'block' }} />
                      <i style={{ background: '#00A4EF', display: 'block' }} />
                      <i style={{ background: '#FFB900', display: 'block' }} />
                    </span>
                    Get it on Microsoft Marketplace
                    <ArrowUpRight
                      className="h-3.5 w-3.5 shrink-0"
                      strokeWidth={2}
                    />
                  </a>
                ) : (
                  <p
                    className="text-center"
                    style={{
                      fontFamily: ss,
                      fontSize: '12px',
                      color: PANEL_FG_2,
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: '#eeeef8',
                    }}
                  >
                    Marketplace offer link not configured.{' '}
                    <code style={{ fontFamily: sm, fontSize: '11px' }}>
                      NEXT_PUBLIC_MARKETPLACE_OFFER_URL
                    </code>
                  </p>
                )}
              </div>

              {/* Security note */}
              <div
                className="mt-5 flex items-start gap-[10px] pt-5"
                style={{ borderTop: `0.5px solid ${PANEL_BORDER}` }}
              >
                <Lock
                  className="mt-px shrink-0"
                  style={{ width: '13px', height: '13px', color: '#5ac994' }}
                />
                <p style={sty.secNote}>
                  Subscription is billed and secured by Microsoft Entra through
                  the commercial marketplace.
                </p>
              </div>

              {/* Sign-in nudge */}
              <p
                className="mt-4 text-center"
                style={{
                  fontFamily: ss,
                  fontSize: '12.5px',
                  color: PANEL_FG_2,
                }}
              >
                Already onboarded?{' '}
                <Link
                  href="/sign-in"
                  style={{
                    color: '#571df7',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Sign in
                </Link>
              </p>
            </div>

            <div
              className="mt-auto flex items-center justify-between pt-5"
              style={sty.footer}
            >
              <span>© 2026 PHENIX ID</span>
              <a
                href="mailto:hello@phenix.id"
                style={{ color: 'inherit', textDecoration: 'underline' }}
              >
                hello@phenix.id
              </a>
            </div>
          </div>

          {/* ── Right: brand panel (hidden ≤920px) ── */}
          <div
            className="relative hidden flex-col overflow-hidden min-[921px]:flex"
            aria-hidden="true"
            style={{
              background:
                'linear-gradient(165deg,#150A3C 0%,#28106A 58%,#571DF7 135%)',
              padding: '48px',
              color: '#fff',
            }}
          >
            {/* Ambient glows */}
            <div
              className="pointer-events-none absolute"
              style={{
                right: '-240px',
                top: '-260px',
                width: '600px',
                height: '600px',
                borderRadius: '50%',
                background:
                  'radial-gradient(circle,rgba(90,201,148,0.30) 0%,transparent 70%)',
                filter: 'blur(100px)',
              }}
            />
            <div
              className="pointer-events-none absolute"
              style={{
                left: '-220px',
                bottom: '-260px',
                width: '600px',
                height: '600px',
                borderRadius: '50%',
                background:
                  'radial-gradient(circle,rgba(87,29,247,0.50) 0%,transparent 70%)',
                filter: 'blur(110px)',
              }}
            />

            <SubscribeCredentialIllustration />

            {/* Bottom copy */}
            <div className="relative z-10 mt-auto">
              <div className="mb-3 flex items-center gap-4">
                <div
                  style={{
                    width: '20px',
                    height: '0.5px',
                    backgroundColor: 'rgba(255,255,255,0.5)',
                  }}
                />
                <p
                  style={{
                    fontFamily: ss,
                    fontSize: '12px',
                    fontWeight: 600,
                    letterSpacing: '0.10em',
                    color: 'rgba(255,255,255,0.7)',
                    textTransform: 'uppercase',
                  }}
                >
                  WHY PHENIX ID
                </p>
              </div>
              <h2
                style={{
                  fontFamily: sf,
                  fontWeight: 700,
                  fontSize: 'clamp(24px,2.4vw,30px)',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.15,
                  color: '#fff',
                }}
              >
                Issue your first credential on{' '}
                <span
                  style={{
                    background: 'linear-gradient(120deg,#94DDB8,#C3A3FD)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  your terms
                </span>
              </h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
