'use client'

import * as React from 'react'

import { IconMoon, IconSun } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'

export function ModeToggle(): React.JSX.Element {
  const { setTheme, resolvedTheme } = useTheme()

  const toggleTheme = React.useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }, [resolvedTheme, setTheme])

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8"
      onClick={toggleTheme}
      aria-label="Toggle light/dark mode"
    >
      <IconSun className="dark:hidden" strokeWidth={1.5} size={17} />
      <IconMoon className="hidden dark:block" strokeWidth={1.5} size={17} />
    </Button>
  )
}
