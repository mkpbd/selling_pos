const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || '/api/v1'

/** Origin that serves `/sanctum/*` — same origin as the API (proxied in dev). */
function resolveBackendOrigin(base: string): string {
  if (/^https?:\/\//i.test(base)) return new URL(base).origin
  return ''
}

export const env = {
  appName: import.meta.env.VITE_APP_NAME?.trim() || 'Selling POS',
  apiBaseUrl,
  backendOrigin: resolveBackendOrigin(apiBaseUrl),
  isDev: import.meta.env.DEV,
} as const
