export type BuiltInProfileMetadata = {
  displayName?: string
  description?: string
  avatarImage?: string
}

const PROFILE_METADATA: Record<string, BuiltInProfileMetadata> = {
  default: {
    displayName: 'Zeus',
    description:
      'Primary SitioUno operator profile: CEO/orchestrator interface with GPT-5.5, full workspace control, memory, tools, and gateway access.',
    avatarImage: '/claude-avatar.webp',
  },
  builder: {
    displayName: 'Builder',
    description:
      'Scoped implementation worker for focused product/code slices, integration fixes, tests, and small diffs with concrete verification evidence.',
    avatarImage: '/agent-avatars/builder.webp',
  },
  reviewer: {
    displayName: 'Reviewer',
    description:
      'Independent review and merge gate for security, logic, regressions, quality standards, and tested delivery evidence.',
    avatarImage: '/agent-avatars/reviewer.webp',
  },
  qa: {
    displayName: 'QA',
    description:
      'Quality-assurance worker for browser/API checks, smoke tests, acceptance criteria, and reproducible verification evidence.',
    avatarImage: '/agent-avatars/qa.webp',
  },
  researcher: {
    displayName: 'Researcher',
    description:
      'Research worker for market scans, technical discovery, source-backed synthesis, and decision support.',
    avatarImage: '/agent-avatars/researcher.webp',
  },
  'ops-watch': {
    displayName: 'Ops Watch',
    description:
      'Operations monitor for deployments, runtime health, logs, incidents, and infrastructure readiness checks.',
    avatarImage: '/agent-avatars/ops-watch.webp',
  },
  maintainer: {
    displayName: 'Maintainer',
    description:
      'Repository hygiene worker for dependency upkeep, small maintenance diffs, documentation drift, and technical-debt cleanup.',
    avatarImage: '/agent-avatars/maintainer.webp',
  },
  strategist: {
    displayName: 'Strategist',
    description:
      'Strategy worker for product positioning, business framing, roadmap options, and executive-level tradeoff analysis.',
    avatarImage: '/agent-avatars/strategist.webp',
  },
  'inbox-triage': {
    displayName: 'Inbox Triage',
    description:
      'Intake and triage worker for classifying incoming requests, extracting action items, and routing work to the right owner.',
    avatarImage: '/agent-avatars/inbox-triage.webp',
  },
  'km-agent': {
    displayName: 'KM Agent',
    description:
      'Knowledge steward for RAZSOC/GBrain/Obsidian hygiene: keeps durable context coherent, searchable, and source-of-record aligned.',
    avatarImage: '/agent-avatars/km-agent.webp',
  },
  'factory-orchestrator': {
    displayName: 'Factory Orchestrator',
    description:
      'CEO-style control plane for Software Factory missions: decomposes work, routes agents, enforces proof contracts, and owns greenlight gates.',
    avatarImage: '/agent-avatars/orchestrator.webp',
  },
  'solution-architect': {
    displayName: 'Solution Architect',
    description:
      'Architecture and system design specialist: turns business requirements into canonical technical plans, boundaries, and implementation contracts.',
    avatarImage: '/agent-avatars/strategist.webp',
  },
  'implementation-planner': {
    displayName: 'Implementation Planner',
    description:
      'Fast planning worker for task graphs, implementation sequencing, acceptance criteria, and low-risk execution plans.',
    avatarImage: '/agent-avatars/strategist.webp',
  },
  'claude-builder': {
    displayName: 'Claude Builder',
    description:
      'Premium implementation worker for complex product/code slices where stronger reasoning, careful diffs, and integration judgment matter.',
    avatarImage: '/agent-avatars/builder.webp',
  },
  'codex-builder': {
    displayName: 'Codex Builder',
    description:
      'Focused implementation worker using DeepSeek for scoped code changes, tests, and economical build/debug loops.',
    avatarImage: '/agent-avatars/builder.webp',
  },
  'quality-reviewer': {
    displayName: 'Quality Reviewer',
    description:
      'Independent quality gate for regressions, logic review, code quality, test coverage, and acceptance criteria verification.',
    avatarImage: '/agent-avatars/reviewer.webp',
  },
  'security-reviewer': {
    displayName: 'Security Reviewer',
    description:
      'Security-focused reviewer for secrets, unsafe flows, auth boundaries, data exposure, and destructive-operation risk.',
    avatarImage: '/agent-avatars/reviewer.webp',
  },
  'qa-verifier': {
    displayName: 'QA Verifier',
    description:
      'Fast QA worker for smoke tests, acceptance checks, browser/API verification, and evidence capture after implementation.',
    avatarImage: '/agent-avatars/qa.webp',
  },
  'product-analyst': {
    displayName: 'Product Analyst',
    description:
      'Research and product analysis worker for personas, competitive context, user stories, success criteria, and market-facing recommendations.',
    avatarImage: '/agent-avatars/researcher.webp',
  },
  'devops-release': {
    displayName: 'DevOps Release',
    description:
      'Release and operations worker for deployment checks, environment readiness, docs, versioning, and production handoff evidence.',
    avatarImage: '/agent-avatars/ops-watch.webp',
  },
  'factory-reporter': {
    displayName: 'Factory Reporter',
    description:
      'Reporting worker for delivery summaries, Notion/exec reports, progress evidence, audit trails, and stakeholder-ready status updates.',
    avatarImage: '/agent-avatars/inbox-triage.webp',
  },
  'openhands-lab': {
    displayName: 'OpenHands Lab',
    description:
      'Experimental sandbox profile for OpenHands/GCP style implementation runs, spikes, and comparative autonomous-agent evaluations.',
    avatarImage: '/agent-avatars/maintainer.webp',
  },
}

export function getBuiltInProfileMetadata(name: string): BuiltInProfileMetadata {
  return PROFILE_METADATA[name] ?? {}
}
