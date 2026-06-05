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
    avatarImage: '/agent-avatars/zeus.webp',
  },
  'factory-orchestrator': {
    displayName: 'Factory Orchestrator',
    description:
      'CEO-style control plane for Software Factory missions: decomposes work, routes agents, enforces proof contracts, and owns greenlight gates.',
    avatarImage: '/agent-avatars/factory-orchestrator.webp',
  },
  'solution-architect': {
    displayName: 'Solution Architect',
    description:
      'Architecture and system design specialist: turns business requirements into canonical technical plans, boundaries, and implementation contracts.',
    avatarImage: '/agent-avatars/solution-architect.webp',
  },
  'implementation-planner': {
    displayName: 'Implementation Planner',
    description:
      'Fast planning worker for task graphs, implementation sequencing, acceptance criteria, and low-risk execution plans.',
    avatarImage: '/agent-avatars/implementation-planner.webp',
  },
  'claude-builder': {
    displayName: 'Claude Builder',
    description:
      'Premium implementation worker for complex product/code slices where stronger reasoning, careful diffs, and integration judgment matter.',
    avatarImage: '/agent-avatars/claude-builder.webp',
  },
  'codex-builder': {
    displayName: 'Codex Builder',
    description:
      'Focused implementation worker using DeepSeek for scoped code changes, tests, and economical build/debug loops.',
    avatarImage: '/agent-avatars/codex-builder.webp',
  },
  'quality-reviewer': {
    displayName: 'Quality Reviewer',
    description:
      'Independent quality gate for regressions, logic review, code quality, test coverage, and acceptance criteria verification.',
    avatarImage: '/agent-avatars/quality-reviewer.webp',
  },
  'security-reviewer': {
    displayName: 'Security Reviewer',
    description:
      'Security-focused reviewer for secrets, unsafe flows, auth boundaries, data exposure, and destructive-operation risk.',
    avatarImage: '/agent-avatars/security-reviewer.webp',
  },
  'qa-verifier': {
    displayName: 'QA Verifier',
    description:
      'Fast QA worker for smoke tests, acceptance checks, browser/API verification, and evidence capture after implementation.',
    avatarImage: '/agent-avatars/qa-verifier.webp',
  },
  'product-analyst': {
    displayName: 'Product Analyst',
    description:
      'Research and product analysis worker for personas, competitive context, user stories, success criteria, and market-facing recommendations.',
    avatarImage: '/agent-avatars/product-analyst.webp',
  },
  'devops-release': {
    displayName: 'DevOps Release',
    description:
      'Release and operations worker for deployment checks, environment readiness, docs, versioning, and production handoff evidence.',
    avatarImage: '/agent-avatars/devops-release.webp',
  },
  'factory-reporter': {
    displayName: 'Factory Reporter',
    description:
      'Reporting worker for delivery summaries, Notion/exec reports, progress evidence, audit trails, and stakeholder-ready status updates.',
    avatarImage: '/agent-avatars/factory-reporter.webp',
  },
  'openhands-lab': {
    displayName: 'OpenHands Lab',
    description:
      'Experimental sandbox profile for OpenHands/GCP style implementation runs, spikes, and comparative autonomous-agent evaluations.',
    avatarImage: '/agent-avatars/openhands-lab.webp',
  },
}

export function getBuiltInProfileMetadata(
  name: string,
): BuiltInProfileMetadata {
  return PROFILE_METADATA[name] ?? {}
}
