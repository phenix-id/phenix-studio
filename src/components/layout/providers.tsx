'use client'

import { SessionProvider, SessionProviderProps } from 'next-auth/react'

import { ActiveThemeProvider } from '../active-theme'
import React from 'react'
import ThemeProvider from './ThemeToggle/theme-provider'
import { TooltipProvider } from '@/components/ui/tooltip'

export default function Providers({
  session,
  activeThemeValue,
  children,
}: Readonly<{
  session: SessionProviderProps['session']
  activeThemeValue: string
  children: React.ReactNode
}>): React.JSX.Element {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
    >
      <ActiveThemeProvider initialTheme={activeThemeValue}>
        <SessionProvider
          session={session}
          refetchOnWindowFocus={false}
          refetchInterval={0}
          key={session?.user.id}
        >
          <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
        </SessionProvider>
      </ActiveThemeProvider>
    </ThemeProvider>
  )
}
