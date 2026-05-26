import './globals.css'
import './theme.css'
import type { Metadata, Viewport } from 'next'

import { FaviconUpdater } from '@/components/FaviconUpdater'
import { HardNavigationBoundary } from '@/components/HardNavigationBoundary'
import { Session as NextAuthSession } from 'next-auth'
import NextTopLoader from 'nextjs-toploader'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import PageLayout from '@/components/PageLayout'
import Providers from '@/components/layout/providers'
import React from 'react'
import { SessionManager } from '@/features/components/SessionManager'
import StoreProvider from './StoreProvider'
import { Toaster } from '@/components/ui/sonner'
import { appFaviconPath } from '@/config/CommonConstant'
import { authOptions } from '@/utils/authOptions'
import { cn } from '@/lib/utils'
import { cookies } from 'next/headers'
import { fontVariables } from '@/lib/font'
import { getServerSession } from 'next-auth/next'

// Create a new type extending Session to guarantee expires is defined
type SessionWithExpires = NextAuthSession & { expires: string }

const META_THEME_COLORS = {
  light: '#ffffff',
  dark: '#09090b',
}
const SESSION_FALLBACK_DURATION_MS = 1000 * 60 * 30

export const viewport: Viewport = {
  themeColor: META_THEME_COLORS.light,
}

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_TITLE?.trim() || 'Phenix Studio',
  icons: {
    icon: [{ url: appFaviconPath, type: 'image/png' }],
    shortcut: [{ url: appFaviconPath, type: 'image/png' }],
    apple: [{ url: appFaviconPath, type: 'image/png' }],
  },
}

export default async function RootLayout({
  children,
}: {
  readonly children: React.ReactNode
}): Promise<React.JSX.Element> {
  // Get the session raw
  const sessionRaw = (await getServerSession(
    authOptions,
  )) as SessionWithExpires | null

  const session: SessionWithExpires | null = sessionRaw
    ? {
        ...sessionRaw,
        expires:
          sessionRaw.expires ??
          new Date(Date.now() + SESSION_FALLBACK_DURATION_MS).toISOString(),
      }
    : null

  const cookieStore = await cookies()
  const activeThemeValue = cookieStore.get('active_theme')?.value
  const isScaled = activeThemeValue?.endsWith('-scaled')

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || ((!('theme' in localStorage) || localStorage.theme === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.querySelector('meta[name="theme-color"]').setAttribute('content', '${META_THEME_COLORS.dark}')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body
        className={cn(
          'bg-background overflow-hidden overscroll-none font-sans antialiased',
          activeThemeValue ? `theme-${activeThemeValue}` : '',
          isScaled ? 'theme-scaled' : '',
          fontVariables,
        )}
      >
        <NextTopLoader showSpinner={false} />
        <NuqsAdapter>
          <StoreProvider>
            <Providers
              session={session}
              activeThemeValue={activeThemeValue as string}
            >
              <SessionManager>
                <Toaster />
                <FaviconUpdater />
                <HardNavigationBoundary>
                  <PageLayout>{children}</PageLayout>
                </HardNavigationBoundary>
              </SessionManager>
            </Providers>
          </StoreProvider>
        </NuqsAdapter>
      </body>
    </html>
  )
}
