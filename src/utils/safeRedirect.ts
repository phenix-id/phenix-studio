/**
 * Returns `redirectTo` only when it is a safe same-origin relative path, otherwise
 * returns `fallback`. Prevents open-redirects through the `redirectTo` query param
 * (e.g. `//evil.com`, `https://evil.com`, `/\evil.com`). A safe path must begin with
 * a single `/` followed by a non-slash, non-backslash character — or be exactly `/`.
 */
export function safeInternalRedirect(
  redirectTo: string | null | undefined,
  fallback = '/dashboard',
): string {
  if (!redirectTo) {
    return fallback
  }

  if (redirectTo === '/') {
    return redirectTo
  }

  if (!/^\/[^/\\]/.test(redirectTo)) {
    return fallback
  }

  return redirectTo
}
