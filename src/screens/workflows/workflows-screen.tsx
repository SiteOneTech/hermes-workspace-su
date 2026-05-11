'use client'

import { useEffect, useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon,
  Building01Icon,
  CheckListIcon,
  Clock01Icon,
  RefreshIcon,
} from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'
import {
  EmptyState,
  Metric,
  StatusBadge,
  compactWorkflowId,
  fetchWorkflowJson,
  formatWorkflowDate,
  labelWorkflowStatus,
  workflowRunDescription,
  type DetailResponse,
  type OverviewResponse,
  type WorkflowDefinition,
} from './workflows-view-utils'

export function WorkflowsScreen() {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)

  const overviewQuery = useQuery({
    queryKey: ['orchestration', 'overview'],
    queryFn: () =>
      fetchWorkflowJson<OverviewResponse>('/api/orchestration?limit=50'),
    refetchInterval: 20_000,
    placeholderData: keepPreviousData,
  })

  const runs = overviewQuery.data?.runs.workflow_runs ?? []
  const definitions = overviewQuery.data?.definitions.workflow_definitions ?? []

  const definitionsById = useMemo(() => {
    const map = new Map<string, WorkflowDefinition>()
    for (const item of definitions) map.set(item.workflow_definition_id, item)
    return map
  }, [definitions])

  useEffect(() => {
    if (selectedRunId || runs.length === 0) return
    setSelectedRunId(runs[0].workflow_run_id)
  }, [runs, selectedRunId])

  const detailQuery = useQuery({
    queryKey: ['orchestration', 'detail', selectedRunId],
    queryFn: () =>
      fetchWorkflowJson<DetailResponse>(
        `/api/orchestration?workflowRunId=${encodeURIComponent(selectedRunId ?? '')}`,
      ),
    enabled: Boolean(selectedRunId),
    refetchInterval: 15_000,
    placeholderData: keepPreviousData,
  })

  const detail = detailQuery.data
  const selectedRun =
    detail?.workflow_run ??
    runs.find((run) => run.workflow_run_id === selectedRunId)
  const selectedDefinition = selectedRun
    ? definitionsById.get(selectedRun.workflow_definition_id)
    : null
  const selectedDescription = workflowRunDescription(selectedRun)
  const steps = detail?.steps.steps ?? []
  const workOrders = detail?.work_orders.work_orders ?? []
  const events = detail?.timeline.events ?? []
  const kanbanColumns = detail?.kanban.columns ?? []
  const activeRuns = runs.filter((run) =>
    ['active', 'waiting_gate', 'hold', 'blocked'].includes(run.status),
  ).length

  return (
    <div className="min-h-full overflow-y-auto bg-surface text-ink">
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-5 px-4 py-6 pb-[calc(var(--tabbar-h,80px)+1.5rem)] sm:px-6 lg:px-8">
        <header className="rounded-lg border border-primary-200 bg-primary-50/85 p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--theme-border)] bg-[var(--theme-card)] text-[var(--theme-accent)]">
                <HugeiconsIcon icon={Building01Icon} size={22} />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-primary-900">
                  Orchestrator Workflows
                </h1>
                <p className="mt-1 max-w-4xl text-sm text-[var(--theme-muted-2)]">
                  Durable workflow state for Zeus and every branch node. The
                  database is the source of truth; Kanban, Notion reports, and
                  markdown logs are projections or evidence.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                void overviewQuery.refetch()
                void detailQuery.refetch()
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-card)] px-3 py-2 text-sm text-[var(--theme-text)] hover:bg-[var(--theme-card2)]"
            >
              <HugeiconsIcon icon={RefreshIcon} size={16} />
              Refresh
            </button>
          </div>
        </header>

        {overviewQuery.isError ? (
          <div className="rounded-lg border border-red-400/35 bg-red-500/10 p-4 text-sm text-red-600">
            <div className="flex items-center gap-2 font-medium">
              <HugeiconsIcon icon={Alert02Icon} size={17} />
              Orchestration Core is not reachable
            </div>
            <p className="mt-1">
              {overviewQuery.error instanceof Error
                ? overviewQuery.error.message
                : 'The workspace could not load workflow state.'}
            </p>
          </div>
        ) : null}

        <section className="grid gap-3 md:grid-cols-3">
          <Metric label="Published packs" value={definitions.length} />
          <Metric label="Workflow runs" value={runs.length} />
          <Metric label="Active or blocked" value={activeRuns} />
        </section>

        <section className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-card)] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-card2)] text-[var(--theme-accent)]">
              <HugeiconsIcon icon={CheckListIcon} size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--theme-text)]">
                How to use it
              </h2>
              <p className="mt-1 text-sm text-[var(--theme-muted)]">
                Ask Zeus in chat to open a workflow. Give the branch,
                department, objective, repos or assets, acceptance criteria, and
                autonomy level. Zeus creates the workflow run, delegates work
                orders, watches heartbeats and timeouts, intervenes on blockers,
                and records evidence for the final report.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
          <div className="flex min-w-0 flex-col gap-5">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[var(--theme-text)]">
                  Workflow Packs
                </h2>
                <span className="text-xs text-[var(--theme-muted)]">
                  Canonical templates
                </span>
              </div>
              <div className="grid gap-2">
                {definitions.length === 0 && !overviewQuery.isLoading ? (
                  <EmptyState>No workflow packs published yet.</EmptyState>
                ) : null}
                {definitions.map((definition) => {
                  const def = definition.definition_json
                  const stages = def?.stages ?? []
                  return (
                    <article
                      key={`${definition.workflow_definition_id}:${definition.workflow_version}`}
                      className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-card)] p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-[var(--theme-text)]">
                            {definition.display_name}
                          </h3>
                          <p className="mt-1 line-clamp-2 text-xs text-[var(--theme-muted)]">
                            {definition.description}
                          </p>
                        </div>
                        <StatusBadge value={definition.status} />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[var(--theme-muted)]">
                        <span className="rounded-md bg-[var(--theme-card2)] px-2 py-1">
                          {definition.domain}
                        </span>
                        <span className="rounded-md bg-[var(--theme-card2)] px-2 py-1">
                          {def?.methodology ?? 'methodology n/a'}
                        </span>
                        <span className="rounded-md bg-[var(--theme-card2)] px-2 py-1">
                          {stages.length} stages
                        </span>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[var(--theme-text)]">
                  Recent Runs
                </h2>
                <span className="text-xs text-[var(--theme-muted)]">
                  Live state
                </span>
              </div>
              <div className="grid gap-2">
                {runs.length === 0 && !overviewQuery.isLoading ? (
                  <EmptyState>No workflow runs yet.</EmptyState>
                ) : null}
                {runs.map((run) => {
                  const active = run.workflow_run_id === selectedRunId
                  const definition = definitionsById.get(
                    run.workflow_definition_id,
                  )
                  return (
                    <button
                      key={run.workflow_run_id}
                      type="button"
                      onClick={() => setSelectedRunId(run.workflow_run_id)}
                      className={cn(
                        'rounded-lg border p-3 text-left transition-colors',
                        active
                          ? 'border-[var(--theme-accent)] bg-[var(--theme-accent-soft)]'
                          : 'border-[var(--theme-border)] bg-[var(--theme-card)] hover:bg-[var(--theme-card2)]',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-[var(--theme-text)]">
                            {run.title}
                          </h3>
                          <p className="mt-1 truncate text-xs text-[var(--theme-muted)]">
                            {definition?.display_name ??
                              run.workflow_definition_id}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs text-[var(--theme-muted-2)]">
                            {workflowRunDescription(run)}
                          </p>
                        </div>
                        <StatusBadge value={run.status} />
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-[var(--theme-muted)]">
                        <span>{compactWorkflowId(run.workflow_run_id)}</span>
                        <span>{formatWorkflowDate(run.updated_at)}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--theme-text)]">
                Run Detail
              </h2>
              {detailQuery.isFetching ? (
                <span className="inline-flex items-center gap-1 text-xs text-[var(--theme-muted)]">
                  <HugeiconsIcon icon={Clock01Icon} size={14} />
                  Updating
                </span>
              ) : null}
            </div>

            {!selectedRun ? (
              <EmptyState>
                Select a workflow run to inspect its board, work orders, and
                timeline.
              </EmptyState>
            ) : (
              <div className="flex flex-col gap-4">
                <section className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-card)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-[var(--theme-text)]">
                        {selectedRun.title}
                      </h3>
                      <p className="mt-1 text-xs text-[var(--theme-muted)]">
                        {selectedDefinition?.display_name ??
                          selectedRun.workflow_definition_id}{' '}
                        v{selectedRun.workflow_version}
                      </p>
                      <p className="mt-3 max-w-3xl text-sm text-[var(--theme-muted-2)]">
                        {selectedDescription ||
                          'This workflow was created before functional descriptions were required.'}
                      </p>
                    </div>
                    <StatusBadge value={selectedRun.status} />
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-4">
                    <Metric label="Steps" value={steps.length} />
                    <Metric label="Work orders" value={workOrders.length} />
                    <Metric
                      label="Cards"
                      value={detail?.kanban.summary?.card_count ?? 'n/a'}
                    />
                    <Metric
                      label="Events"
                      value={
                        detail?.kanban.summary?.event_count ?? events.length
                      }
                    />
                  </div>
                </section>

                <section className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-card)] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[var(--theme-text)]">
                      Kanban Projection
                    </h3>
                    <span className="text-xs text-[var(--theme-muted)]">
                      {detail?.kanban.source_of_truth ??
                        'Hermes Orchestration Core'}
                    </span>
                  </div>
                  {kanbanColumns.length === 0 ? (
                    <EmptyState>
                      Board projection will appear after the run is loaded.
                    </EmptyState>
                  ) : (
                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                      {kanbanColumns.map((column) => (
                        <div
                          key={column.id}
                          className="min-h-28 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] p-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--theme-muted)]">
                              {column.title}
                            </h4>
                            <span className="rounded-md bg-[var(--theme-card2)] px-1.5 py-0.5 text-[11px] text-[var(--theme-muted)]">
                              {column.count}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-col gap-2">
                            {column.cards.slice(0, 4).map((card) => (
                              <div
                                key={card.id}
                                className="rounded-md border border-[var(--theme-border)] bg-[var(--theme-card)] px-2 py-1.5"
                              >
                                <p className="line-clamp-2 text-xs font-medium text-[var(--theme-text)]">
                                  {card.title}
                                </p>
                                <p className="mt-1 text-[11px] text-[var(--theme-muted)]">
                                  {card.owner_role} -{' '}
                                  {labelWorkflowStatus(card.status)}
                                </p>
                              </div>
                            ))}
                            {column.cards.length > 4 ? (
                              <p className="text-[11px] text-[var(--theme-muted)]">
                                +{column.cards.length - 4} more
                              </p>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-card)] p-4">
                    <h3 className="text-sm font-semibold text-[var(--theme-text)]">
                      Steps
                    </h3>
                    <div className="mt-3 flex flex-col gap-2">
                      {steps.length === 0 ? (
                        <EmptyState>No steps recorded yet.</EmptyState>
                      ) : null}
                      {steps.map((step) => (
                        <div
                          key={step.step_run_id}
                          className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-[var(--theme-text)]">
                                {step.step_key}
                              </p>
                              <p className="mt-1 text-xs text-[var(--theme-muted)]">
                                Owner: {step.owner_role}
                              </p>
                            </div>
                            <StatusBadge value={step.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-card)] p-4">
                    <h3 className="text-sm font-semibold text-[var(--theme-text)]">
                      Work Orders
                    </h3>
                    <div className="mt-3 flex flex-col gap-2">
                      {workOrders.length === 0 ? (
                        <EmptyState>No work orders recorded yet.</EmptyState>
                      ) : null}
                      {workOrders.map((order) => (
                        <div
                          key={order.work_order_id}
                          className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="line-clamp-2 text-sm font-medium text-[var(--theme-text)]">
                                {order.task}
                              </p>
                              <p className="mt-1 text-xs text-[var(--theme-muted)]">
                                {order.owner_role} - timeout{' '}
                                {order.timeout_seconds}s
                              </p>
                            </div>
                            <StatusBadge value={order.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-card)] p-4">
                  <h3 className="text-sm font-semibold text-[var(--theme-text)]">
                    Timeline
                  </h3>
                  <div className="mt-3 flex flex-col gap-2">
                    {events.length === 0 ? (
                      <EmptyState>No events recorded yet.</EmptyState>
                    ) : null}
                    {events.slice(0, 20).map((event) => (
                      <div
                        key={event.event_id}
                        className="grid gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] p-3 text-xs sm:grid-cols-[minmax(0,1fr)_auto]"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[var(--theme-text)]">
                            {event.event_type}
                          </p>
                          <p className="mt-1 text-[var(--theme-muted)]">
                            Actor: {event.actor}
                          </p>
                        </div>
                        <span className="text-[var(--theme-muted)]">
                          {formatWorkflowDate(event.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
