'use client'

import { JSX, useEffect } from 'react'

import { appFaviconPath } from '@/config/CommonConstant'

const APP_TITLE = process.env.NEXT_PUBLIC_APP_TITLE?.trim()

const DEFAULT_CONFIG = {
  favicon: appFaviconPath,
  title: APP_TITLE ? APP_TITLE : 'Phenix Studio',
}

export function FaviconUpdater(): JSX.Element | null {
  useEffect(() => {
    // Track the link element we create so we never touch React-owned head nodes.
    // In React 19, <link>/<title> in <head> are HostSingleton fibers. Removing
    // them outside React (e.g. with .remove()) nullifies their parentNode, which
    // causes "Cannot read properties of null (reading 'removeChild')" on the
    // next soft navigation when React tries to reconcile those fibers.
    let managedLink: HTMLLinkElement | null = null

    const updateFaviconAndTitle = (): void => {
      const { favicon, title } = DEFAULT_CONFIG

      if (!managedLink) {
        managedLink = document.createElement('link')
        managedLink.rel = 'icon'
        managedLink.type = 'image/png'
        document.head.appendChild(managedLink)
      }
      managedLink.href = favicon
      document.title = title
    }

    updateFaviconAndTitle()

    const handleThemeChange = (): void => {
      updateFaviconAndTitle()
    }

    window.addEventListener('themeChanged', handleThemeChange)

    return () => {
      window.removeEventListener('themeChanged', handleThemeChange)
      managedLink?.remove()
    }
  }, [])

  return null
}
