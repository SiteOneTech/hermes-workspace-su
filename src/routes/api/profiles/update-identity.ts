import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../../server/auth-middleware'
import { updateProfileIdentity } from '../../../server/profiles-browser'
import { requireJsonContentType } from '../../../server/rate-limit'

export const Route = createFileRoute('/api/profiles/update-identity')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return json({ error: 'Unauthorized' }, { status: 401 })
        }
        const csrfCheck = requireJsonContentType(request)
        if (csrfCheck) return csrfCheck
        try {
          const body = (await request.json()) as {
            name?: string
            displayName?: string
            avatarDataUrl?: string | null
          }
          const profile = updateProfileIdentity(body.name || 'default', {
            displayName: body.displayName,
            avatarDataUrl: body.avatarDataUrl,
          })
          return json({ ok: true, profile })
        } catch (error) {
          return json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to update profile identity',
            },
            { status: 500 },
          )
        }
      },
    },
  },
})
