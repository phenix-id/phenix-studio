'use client'

import React, { useEffect } from 'react'

import { hardNavigate } from '@/utils/navigation'

const isPlainLeftClick = (event: MouseEvent): boolean =>
  event.button === 0 &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.shiftKey &&
  !event.altKey

export function HardNavigationBoundary({
  children,
}: {
  children: React.ReactNode
}): React.JSX.Element {
  useEffect(() => {
    const handleClick = (event: MouseEvent): void => {
      if (event.defaultPrevented || !isPlainLeftClick(event)) {
        return
      }

      const { target } = event
      if (!(target instanceof Element)) {
        return
      }

      const anchor = target.closest('a[href]')
      if (!(anchor instanceof HTMLAnchorElement)) {
        return
      }

      if (anchor.target && anchor.target !== '_self') {
        return
      }

      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#')) {
        return
      }

      const url = new URL(href, window.location.href)
      if (url.origin !== window.location.origin) {
        return
      }

      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return
      }

      event.preventDefault()
      hardNavigate(url.href)
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [])

  return <>{children}</>
}
