export type WorkflowTemplate = {
  id: string
  name: string
  description: string
  icon: string
  goal: string
  tags?: Array<string>
  teamConfigId?: string
  tasks: Array<{
    title: string
    description?: string
  }>
  createdAt: number
  updatedAt: number
  isBuiltIn?: boolean
}

const STORAGE_KEY = 'sitiouno-factory:workflow-templates'

// Built-in templates aligned with the SitioUno Software Factory.
export const BUILT_IN_TEMPLATES: Array<WorkflowTemplate> = [
  {
    id: 'tpl-sitiouno-factory-dual-method',
    name: 'SitioUno Factory: Zeus + BMAD Parallel',
    description: 'Run Zeus Native Factory and BMAD/Hybrid lanes in parallel, then integrate the winning output',
    icon: '🏭',
    goal: 'Create parallel lanes for Zeus Native and BMAD/Hybrid, execute the same project spec in isolated branches/worktrees, compare objective evidence, then integrate the selected result.',
    tags: ['factory', 'zeus', 'bmad', 'benchmark', 'integration'],
    tasks: [
      { title: 'Create intake and functional spec from user request' },
      { title: 'Create Zeus lane task graph and gates' },
      { title: 'Create BMAD/Hybrid lane PRD, architecture and stories' },
      { title: 'Execute both lanes in isolated worktrees/branches' },
      { title: 'Run quality, QA, security and delivery gates' },
      { title: 'Compare method benchmark and choose integration path' },
      { title: 'Integrate selected output and produce delivery report' },
    ],
    createdAt: 0,
    updatedAt: 0,
    isBuiltIn: true,
  },
  {
    id: 'tpl-sitiouno-factory-critical-fintech',
    name: 'SitioUno Factory: Critical Fintech Delivery',
    description: 'Factory flow for payments, auth, PII, PCI or financial workflows with mandatory security gates',
    icon: '🔐',
    goal: 'Deliver a critical fintech feature through functional analysis, architecture, threat review, implementation, QA, security review, and human delivery approval.',
    tags: ['factory', 'fintech', 'security', 'qa', 'payments'],
    tasks: [
      { title: 'Document business rules, actors, risk areas and acceptance criteria' },
      { title: 'Design architecture, DB/API changes and rollback strategy' },
      { title: 'Create implementation plan with isolated branch/worktree' },
      { title: 'Implement with evidence and tests' },
      { title: 'Run QA verifier smoke/regression pass' },
      { title: 'Run security reviewer gate for auth, PII, secrets and payment risks' },
      { title: 'Prepare release report and human approval checklist' },
    ],
    createdAt: 0,
    updatedAt: 0,
    isBuiltIn: true,
  },
  {
    id: 'tpl-code-review',
    name: 'Code Review',
    description: 'Review codebase for bugs, performance issues, and code quality',
    icon: '🔍',
    goal: 'Review the codebase for bugs, performance issues, and code quality improvements',
    tags: ['review', 'quality', 'audit'],
    tasks: [
      { title: 'Read all source files and understand architecture' },
      { title: 'Identify bugs and logic errors' },
      { title: 'Check for security vulnerabilities' },
      { title: 'Suggest code quality improvements' },
      { title: 'Write summary report with prioritized findings' },
    ],
    createdAt: 0,
    updatedAt: 0,
    isBuiltIn: true,
  },
  {
    id: 'tpl-bug-fix',
    name: 'Bug Fix',
    description: 'Diagnose and fix a specific bug with tests',
    icon: '🐛',
    goal: 'Investigate the reported bug, identify the root cause, implement a fix, and verify it works. Write tests if appropriate.',
    tasks: [
      { title: 'Reproduce the bug and understand the symptoms' },
      { title: 'Trace the code path to find root cause' },
      { title: 'Implement the fix' },
      { title: 'Run type check (npx tsc --noEmit)' },
      { title: 'Commit with descriptive message' },
    ],
    createdAt: 0,
    updatedAt: 0,
    isBuiltIn: true,
  },
  {
    id: 'tpl-feature-build',
    name: 'Feature Build',
    description: 'Plan and implement a new feature end-to-end',
    icon: '🏗️',
    goal: 'Plan, implement, test, and document the new feature',
    tags: ['build', 'feature', 'implementation'],
    tasks: [
      { title: 'Analyze existing code patterns and architecture' },
      { title: 'Create new files and components' },
      { title: 'Wire up routes, state management, and API calls' },
      { title: 'Add error handling and edge cases' },
      { title: 'Run type check and fix any issues' },
      { title: 'Commit and push' },
    ],
    createdAt: 0,
    updatedAt: 0,
    isBuiltIn: true,
  },
  {
    id: 'tpl-research',
    name: 'Research & Analysis',
    description: 'Research a topic and produce a structured report',
    icon: '📊',
    goal: 'Research the given topic thoroughly. Analyze findings and produce a structured report with key insights, comparisons, and recommendations.',
    tasks: [
      { title: 'Search for relevant sources and documentation' },
      { title: 'Analyze and compare approaches' },
      { title: 'Write structured findings report' },
      { title: 'Add recommendations section' },
    ],
    createdAt: 0,
    updatedAt: 0,
    isBuiltIn: true,
  },
  {
    id: 'tpl-refactor',
    name: 'Refactor',
    description: 'Refactor code for better organization, performance, or readability',
    icon: '♻️',
    goal: 'Refactor the specified code area to improve organization, reduce complexity, and maintain existing functionality. No behavioral changes.',
    tasks: [
      { title: 'Read and understand current implementation' },
      { title: 'Identify refactoring opportunities' },
      { title: 'Implement changes incrementally' },
      { title: 'Verify no behavioral changes (type check + manual review)' },
      { title: 'Commit with clear refactoring message' },
    ],
    createdAt: 0,
    updatedAt: 0,
    isBuiltIn: true,
  },
  {
    id: 'tpl-audit',
    name: 'Security Audit',
    description: 'Audit codebase for security vulnerabilities and best practices',
    icon: '🛡️',
    goal: 'Perform a security audit of the codebase. Check for common vulnerabilities (XSS, injection, auth bypass, secrets exposure, dependency issues). Produce a severity-ranked report.',
    tasks: [
      { title: 'Scan for hardcoded secrets and API keys' },
      { title: 'Check input validation and sanitization' },
      { title: 'Review authentication and authorization flows' },
      { title: 'Check dependency vulnerabilities' },
      { title: 'Write security audit report with severity ratings' },
    ],
    createdAt: 0,
    updatedAt: 0,
    isBuiltIn: true,
  },
]

export function loadCustomTemplates(): Array<WorkflowTemplate> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Array<WorkflowTemplate>
  } catch {
    return []
  }
}

export function saveCustomTemplates(templates: Array<WorkflowTemplate>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
  } catch { /* ignore */ }
}

export function getAllTemplates(): Array<WorkflowTemplate> {
  return [...BUILT_IN_TEMPLATES, ...loadCustomTemplates()]
}

export function saveAsTemplate(template: Omit<WorkflowTemplate, 'id' | 'createdAt' | 'updatedAt'>): WorkflowTemplate {
  const newTemplate: WorkflowTemplate = {
    ...template,
    id: `tpl-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  const existing = loadCustomTemplates()
  saveCustomTemplates([newTemplate, ...existing])
  return newTemplate
}

export function deleteTemplate(id: string): void {
  const existing = loadCustomTemplates()
  saveCustomTemplates(existing.filter((t) => t.id !== id))
}
