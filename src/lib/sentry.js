import * as Sentry from '@sentry/react'

// DSN comes from env. With no DSN, every function here is a safe no-op, so
// local dev and previews never report. Set VITE_SENTRY_DSN in Netlify to enable.
const DSN = import.meta.env.VITE_SENTRY_DSN || ''

export function initSentry() {
  if (!DSN) return
  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE,
    // Don't report noise: aborted fetches (our own timeouts) and benign rejections
    ignoreErrors: ['AbortError', 'timeout', 'Non-Error promise rejection captured'],
    // Trim breadcrumb/network bodies that could contain user data
    sendDefaultPii: false,
  })
}

// Capture a handled/swallowed error with optional context tags
export function logError(err, context) {
  if (DSN) Sentry.captureException(err, context ? { extra: context } : undefined)
  console.error(err, context || '')
}

// Tie errors to the signed-in user (id/email only)
export function setUserContext(user) {
  if (!DSN) return
  if (user) Sentry.setUser({ id: user.id, email: user.email })
  else Sentry.setUser(null)
}

export { Sentry }
