import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../../server/auth-middleware'
import {
  clearPendingReleaseNotes,
  readUpdateStatus,
} from '../../../server/update-system'
import {
  getClientIp,
  rateLimit,
  rateLimitResponse,
  requireJsonContentType,
} from '../../../server/rate-limit'

export const Route = createFileRoute('/api/update/dismiss-notes')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        const csrfCheck = requireJsonContentType(request)
        if (csrfCheck) return csrfCheck
        if (!rateLimit(`update-dismiss:${getClientIp(request)}`, 10, 60_000)) {
          return rateLimitResponse()
        }
        clearPendingReleaseNotes()
        return json({ ok: true, status: readUpdateStatus() })
      },
    },
  },
})
