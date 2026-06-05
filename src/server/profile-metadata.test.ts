import { describe, expect, it } from 'vitest'

import { getBuiltInProfileMetadata } from './profile-metadata'

const FACTORY_PROFILE_IDS = [
  'default',
  'factory-orchestrator',
  'solution-architect',
  'implementation-planner',
  'claude-builder',
  'codex-builder',
  'quality-reviewer',
  'security-reviewer',
  'qa-verifier',
  'product-analyst',
  'devops-release',
  'factory-reporter',
  'openhands-lab',
]

describe('built-in profile metadata', () => {
  it('assigns a unique canonical avatar to every real factory profile', () => {
    const avatars = FACTORY_PROFILE_IDS.map(
      (id) => getBuiltInProfileMetadata(id).avatarImage,
    )

    expect(avatars.every(Boolean)).toBe(true)
    expect(new Set(avatars).size).toBe(FACTORY_PROFILE_IDS.length)
    expect(avatars).toEqual(
      expect.arrayContaining(
        FACTORY_PROFILE_IDS.map((id) =>
          id === 'default'
            ? '/agent-avatars/zeus.webp'
            : `/agent-avatars/${id}.webp`,
        ),
      ),
    )
  })
})
