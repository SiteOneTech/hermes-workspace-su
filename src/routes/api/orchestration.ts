import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../server/auth-middleware'
import { orchestrationRequest } from '../../server/orchestration-client'

function clampLimit(value: string | null): number {
  const parsed = Number.parseInt(value ?? '50', 10)
  if (!Number.isFinite(parsed)) return 50
  return Math.max(1, Math.min(parsed, 100))
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Orchestration Core request failed'
}

export const Route = createFileRoute('/api/orchestration')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }

        const url = new URL(request.url)
        const workflowRunId = url.searchParams.get('workflowRunId')?.trim()

        try {
          if (workflowRunId) {
            const [workflowRun, steps, workOrders, kanban, timeline] =
              await Promise.all([
                orchestrationRequest(`/v1/workflow-runs/${workflowRunId}`),
                orchestrationRequest(
                  `/v1/workflow-runs/${workflowRunId}/steps`,
                ),
                orchestrationRequest(
                  `/v1/workflow-runs/${workflowRunId}/work-orders`,
                ),
                orchestrationRequest(
                  `/v1/workflow-runs/${workflowRunId}/kanban`,
                ),
                orchestrationRequest(
                  `/v1/workflow-runs/${workflowRunId}/timeline`,
                ),
              ])

            return json({
              ok: true,
              workflow_run: workflowRun,
              steps,
              work_orders: workOrders,
              kanban,
              timeline,
              fetchedAt: Date.now(),
            })
          }

          const limit = clampLimit(url.searchParams.get('limit'))
          const status = url.searchParams.get('status')?.trim()
          const runsPath = status
            ? `/v1/workflow-runs?limit=${limit}&status=${encodeURIComponent(status)}`
            : `/v1/workflow-runs?limit=${limit}`

          const [definitions, runs] = await Promise.all([
            orchestrationRequest('/v1/workflow-definitions'),
            orchestrationRequest(runsPath),
          ])

          return json({
            ok: true,
            definitions,
            runs,
            fetchedAt: Date.now(),
          })
        } catch (error) {
          return json(
            {
              ok: false,
              error: errorMessage(error),
            },
            { status: 502 },
          )
        }
      },
    },
  },
})
