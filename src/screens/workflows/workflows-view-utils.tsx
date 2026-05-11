import type React from 'react'
import { cn } from '@/lib/utils'

export type WorkflowStage = {
  key: string
  owner_role: string
  title: string
  required_outputs?: Array<string>
  timeout_seconds?: number
  gate_reviewer?: string | null
}

export type WorkflowDefinitionJson = {
  display_name?: string
  description?: string
  methodology?: string
  stages?: Array<WorkflowStage>
  kanban_columns?: Array<string>
  metadata?: Record<string, unknown>
}

export type WorkflowDefinition = {
  workflow_definition_id: string
  domain: string
  display_name: string
  description: string
  workflow_version: string
  definition_json?: WorkflowDefinitionJson
  status: string
  published_at?: string | null
}

export type WorkflowRun = {
  workflow_run_id: string
  workflow_definition_id: string
  workflow_version: string
  title: string
  description?: string
  status: string
  current_step_id?: string | null
  created_by: string
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type StepRun = {
  step_run_id: string
  step_key: string
  owner_role: string
  status: string
  updated_at: string
}

export type WorkOrder = {
  work_order_id: string
  step_run_id: string
  owner_role: string
  task: string
  status: string
  timeout_seconds: number
  updated_at: string
}

export type KanbanCard = {
  id: string
  type: string
  title: string
  column: string
  owner_role: string
  status: string
}

export type KanbanColumn = {
  id: string
  title: string
  count: number
  cards: Array<KanbanCard>
}

export type KanbanProjection = {
  source_of_truth?: string
  summary?: {
    card_count?: number
    event_count?: number
    counts?: Record<string, number>
  }
  columns?: Array<KanbanColumn>
}

export type WorkflowEvent = {
  event_id: string
  event_type: string
  actor: string
  created_at: string
  step_run_id?: string | null
  work_order_id?: string | null
}

export type OverviewResponse = {
  ok: true
  definitions: {
    workflow_definitions: Array<WorkflowDefinition>
  }
  runs: {
    workflow_runs: Array<WorkflowRun>
  }
  fetchedAt: number
}

export type DetailResponse = {
  ok: true
  workflow_run: WorkflowRun
  steps: {
    steps: Array<StepRun>
  }
  work_orders: {
    work_orders: Array<WorkOrder>
  }
  kanban: KanbanProjection
  timeline: {
    events: Array<WorkflowEvent>
  }
  fetchedAt: number
}

type ApiErrorResponse = {
  ok: false
  error: string
}

export async function fetchWorkflowJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' })
  const data = (await res.json().catch(() => null)) as
    | T
    | ApiErrorResponse
    | null
  if (!res.ok || (data && 'ok' in data && data.ok === false)) {
    throw new Error(data && 'error' in data ? data.error : `HTTP ${res.status}`)
  }
  return data as T
}

export function formatWorkflowDate(value?: string | null): string {
  if (!value) return 'n/a'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function compactWorkflowId(value: string): string {
  if (value.length <= 18) return value
  return `${value.slice(0, 9)}...${value.slice(-6)}`
}

export function labelWorkflowStatus(value: string): string {
  return value.replaceAll('_', ' ')
}

export function workflowRunDescription(
  run: WorkflowRun | null | undefined,
): string {
  if (!run) return ''
  if (typeof run.description === 'string' && run.description.trim()) {
    return run.description.trim()
  }
  const metadataDescription = run.metadata?.functional_description
  return typeof metadataDescription === 'string'
    ? metadataDescription.trim()
    : ''
}

function statusClass(value: string): string {
  if (value === 'completed' || value === 'done') {
    return 'border-emerald-400/35 bg-emerald-500/10 text-emerald-600'
  }
  if (value === 'active' || value === 'running' || value === 'dispatched') {
    return 'border-sky-400/35 bg-sky-500/10 text-sky-600'
  }
  if (value === 'waiting_gate' || value === 'review' || value === 'hold') {
    return 'border-amber-400/40 bg-amber-500/10 text-amber-700'
  }
  if (value === 'blocked' || value === 'failed' || value === 'timed_out') {
    return 'border-red-400/35 bg-red-500/10 text-red-600'
  }
  return 'border-[var(--theme-border)] bg-[var(--theme-card)] text-[var(--theme-muted)]'
}

export function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium capitalize',
        statusClass(value),
      )}
    >
      {labelWorkflowStatus(value)}
    </span>
  )
}

export function Metric({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-card)] px-3 py-2">
      <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--theme-muted)]">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-[var(--theme-text)]">
        {value}
      </div>
    </div>
  )
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--theme-border)] bg-[var(--theme-card)] px-4 py-8 text-center text-sm text-[var(--theme-muted)]">
      {children}
    </div>
  )
}
