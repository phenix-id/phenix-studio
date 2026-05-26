'use client'

export const hardNavigate = (href: string, replace = false): void => {
  if (typeof window === 'undefined') {
    return
  }

  const targetUrl = new URL(href, window.location.href)

  if (replace) {
    window.location.replace(targetUrl.href)
    return
  }

  window.location.assign(targetUrl.href)
}
