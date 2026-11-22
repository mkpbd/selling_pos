import axios from 'axios'
import { env } from '@/app/config/env'

let inflight: Promise<void> | null = null

/** GET /sanctum/csrf-cookie sets the XSRF-TOKEN cookie. Concurrent calls share one request. */
export function fetchCsrfCookie(): Promise<void> {
  inflight ??= axios
    .get(`${env.backendOrigin}/sanctum/csrf-cookie`, {
      withCredentials: true,
      headers: { Accept: 'application/json' },
    })
    .then(() => undefined)
    .finally(() => {
      inflight = null
    })
  return inflight
}
