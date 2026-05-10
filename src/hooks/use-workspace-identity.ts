import { useQuery } from '@tanstack/react-query'

export const ZEUS_WORKSPACE_NAME = 'Zeus SitioUno'
export const ZEUS_PROFILE_FALLBACK_NAME = 'Zeus'
export const DEFAULT_WORKSPACE_AVATAR = '/claude-avatar.webp'

type ProfileSummary = {
  name: string
  displayName?: string
  avatarDataUrl?: string | null
  active?: boolean
  model?: string
}

type ProfilesListResponse = {
  profiles?: Array<ProfileSummary>
}

async function fetchActiveProfile(): Promise<ProfileSummary | null> {
  const response = await fetch('/api/profiles/list')
  if (!response.ok) return null

  const data = (await response.json()) as ProfilesListResponse
  const profiles = data.profiles ?? []
  return (
    profiles.find((profile) => profile.active) ??
    profiles.find((profile) => profile.name === 'default') ??
    profiles[0] ??
    null
  )
}

export function useWorkspaceIdentity() {
  const query = useQuery({
    queryKey: ['workspace-identity', 'active-profile'],
    queryFn: fetchActiveProfile,
    staleTime: 5_000,
    retry: false,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })

  const activeProfile = query.data ?? null
  const profileDisplayName =
    activeProfile?.displayName?.trim() || ZEUS_PROFILE_FALLBACK_NAME
  const avatarSrc = activeProfile?.avatarDataUrl || DEFAULT_WORKSPACE_AVATAR

  return {
    ...query,
    activeProfile,
    avatarSrc,
    profileDisplayName,
    workspaceName: ZEUS_WORKSPACE_NAME,
  }
}
