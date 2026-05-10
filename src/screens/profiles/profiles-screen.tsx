import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Copy01Icon,
  Delete02Icon,
  Edit02Icon,
  Folder01Icon,
  Key01Icon,
  SparklesIcon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { DialogContent, DialogRoot, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

type ProfileSummary = {
  name: string
  displayName?: string
  avatarDataUrl?: string | null
  path: string
  active: boolean
  exists: boolean
  model?: string
  provider?: string
  skillCount: number
  sessionCount: number
  hasEnv: boolean
  updatedAt?: string
}

const PROFILE_IMAGE_MAX_DIMENSION = 128
const PROFILE_IMAGE_MAX_FILE_SIZE = 10 * 1024 * 1024

type ProfileDetail = {
  name: string
  displayName?: string
  avatarDataUrl?: string | null
  path: string
  active: boolean
  config: Record<string, unknown>
  envPath?: string
  hasEnv: boolean
  sessionsDir?: string
  skillsDir?: string
}

async function readJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(text || `Request failed (${response.status})`)
  }
  return (await response.json()) as T
}

function formatDate(value?: string): string {
  if (!value) return '—'
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return value
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed)
}

function StatChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-primary-200 bg-primary-100/60 px-2.5 py-1 text-xs text-primary-700">
      <span className="font-semibold text-primary-900">{value}</span> {label}
    </div>
  )
}

function ProfileStat({
  label,
  value,
  truncate,
}: {
  label: string
  value: string | number
  truncate?: boolean
}) {
  return (
    <div className="flex flex-col items-center py-2.5 px-1">
      <div
        className={cn(
          'text-sm font-bold text-primary-900 dark:text-neutral-100',
          truncate && 'max-w-[72px] truncate text-xs',
        )}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-primary-400 dark:text-neutral-500">
        {label}
      </div>
    </div>
  )
}

export function ProfilesScreen() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [detailsName, setDetailsName] = useState<string | null>(null)
  const [renameTarget, setRenameTarget] = useState<ProfileSummary | null>(null)
  const [identityTarget, setIdentityTarget] = useState<ProfileSummary | null>(
    null,
  )
  const [identityDisplayName, setIdentityDisplayName] = useState('')
  const [identityAvatarDataUrl, setIdentityAvatarDataUrl] = useState<
    string | null
  >(null)
  const [identityError, setIdentityError] = useState<string | null>(null)
  const [identityProcessing, setIdentityProcessing] = useState(false)
  const [newProfileName, setNewProfileName] = useState('')
  const [wizardStep, setWizardStep] = useState(1)
  const [cloneFrom, setCloneFrom] = useState('')
  const [wizardProvider, setWizardProvider] = useState('')
  const [wizardModel, setWizardModel] = useState('')
  const [allModels, setAllModels] = useState<
    Array<{ id: string; name?: string; provider?: string }>
  >([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [busyName, setBusyName] = useState<string | null>(null)

  const profilesQuery = useQuery({
    queryKey: ['profiles', 'list'],
    queryFn: () =>
      readJson<{ profiles: Array<ProfileSummary>; activeProfile: string }>(
        '/api/profiles/list',
      ),
  })

  const detailQuery = useQuery({
    queryKey: ['profiles', 'read', detailsName],
    queryFn: () =>
      readJson<{ profile: ProfileDetail }>(
        `/api/profiles/read?name=${encodeURIComponent(detailsName || '')}`,
      ),
    enabled: Boolean(detailsName),
  })

  const profiles = profilesQuery.data?.profiles ?? []
  const activeProfile = profilesQuery.data?.activeProfile ?? 'default'

  const sorted = useMemo(() => profiles, [profiles])

  async function refreshProfiles() {
    await queryClient.invalidateQueries({ queryKey: ['profiles'] })
  }

  async function postJson(url: string, body: Record<string, unknown>) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok || payload?.error) {
      throw new Error(payload?.error || `Request failed (${response.status})`)
    }
    return payload
  }

  const fetchAllModels = useCallback(async () => {
    setLoadingModels(true)
    try {
      const res = await fetch('/api/models')
      if (res.ok) {
        const result = (await res.json()) as {
          models?: Array<{ id: string; name?: string; provider?: string }>
        }
        setAllModels(result.models || [])
      }
    } catch {
      /* ignore */
    }
    setLoadingModels(false)
  }, [])

  useEffect(() => {
    if (createOpen && wizardStep === 2 && allModels.length === 0) {
      void fetchAllModels()
    }
  }, [createOpen, wizardStep, allModels.length, fetchAllModels])

  const nameValid =
    /^[A-Za-z0-9_-]+$/.test(newProfileName.trim()) &&
    newProfileName.trim() !== 'default'

  function resetWizard() {
    setNewProfileName('')
    setCloneFrom('')
    setWizardProvider('')
    setWizardModel('')
    setWizardStep(1)
    setAllModels([])
  }

  async function handleCreate() {
    if (!newProfileName.trim()) return
    setBusyName('__create__')
    try {
      await postJson('/api/profiles/create', {
        name: newProfileName.trim(),
        ...(cloneFrom ? { cloneFrom } : {}),
        ...(wizardModel ? { model: wizardModel } : {}),
        ...(wizardProvider ? { provider: wizardProvider } : {}),
      })
      toast(`Created profile ${newProfileName.trim()}`, { type: 'success' })
      setCreateOpen(false)
      resetWizard()
      await refreshProfiles()
    } catch (error) {
      toast(
        error instanceof Error ? error.message : 'Failed to create profile',
        { type: 'error' },
      )
    } finally {
      setBusyName(null)
    }
  }

  async function handleActivate(name: string) {
    setBusyName(name)
    try {
      await postJson('/api/profiles/activate', { name })
      toast(`Activated profile ${name}`, { type: 'success' })
      await refreshProfiles()
    } catch (error) {
      toast(
        error instanceof Error ? error.message : 'Failed to activate profile',
        { type: 'error' },
      )
    } finally {
      setBusyName(null)
    }
  }

  async function handleDelete(name: string) {
    if (
      typeof window !== 'undefined' &&
      !window.confirm(`Delete profile ${name}?`)
    )
      return
    setBusyName(name)
    try {
      await postJson('/api/profiles/delete', { name })
      toast(`Deleted profile ${name}`, { type: 'success' })
      await refreshProfiles()
    } catch (error) {
      toast(
        error instanceof Error ? error.message : 'Failed to delete profile',
        { type: 'error' },
      )
    } finally {
      setBusyName(null)
    }
  }

  function profileDisplayLabel(
    profile: ProfileSummary | ProfileDetail,
  ): string {
    return profile.displayName?.trim() || profile.name
  }

  function openIdentityDialog(profile: ProfileSummary) {
    setIdentityTarget(profile)
    setIdentityDisplayName(profile.displayName?.trim() || '')
    setIdentityAvatarDataUrl(profile.avatarDataUrl || null)
    setIdentityError(null)
  }

  async function handleIdentityAvatarUpload(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setIdentityError('Unsupported file type.')
      return
    }
    if (file.size > PROFILE_IMAGE_MAX_FILE_SIZE) {
      setIdentityError('Image too large (max 10MB).')
      return
    }
    setIdentityError(null)
    setIdentityProcessing(true)
    try {
      const url = URL.createObjectURL(file)
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image()
        i.onload = () => resolve(i)
        i.onerror = () => reject(new Error('Failed to load image'))
        i.src = url
      })
      const scale = Math.min(
        1,
        PROFILE_IMAGE_MAX_DIMENSION / Math.max(img.width, img.height),
      )
      const width = Math.round(img.width * scale)
      const height = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas unavailable')
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      setIdentityAvatarDataUrl(canvas.toDataURL(outputType, 0.82))
    } catch {
      setIdentityError('Failed to process image.')
    } finally {
      setIdentityProcessing(false)
    }
  }

  async function handleSaveIdentity() {
    if (!identityTarget) return
    if (identityDisplayName.length > 50) {
      setIdentityError('Display name too long (max 50 characters)')
      return
    }
    setBusyName(identityTarget.name)
    try {
      await postJson('/api/profiles/update-identity', {
        name: identityTarget.name,
        displayName: identityDisplayName.trim(),
        avatarDataUrl: identityAvatarDataUrl,
      })
      toast(`Updated ${identityDisplayName.trim() || identityTarget.name}`, {
        type: 'success',
      })
      setIdentityTarget(null)
      setIdentityDisplayName('')
      setIdentityAvatarDataUrl(null)
      setIdentityError(null)
      await refreshProfiles()
    } catch (error) {
      toast(
        error instanceof Error ? error.message : 'Failed to update identity',
        { type: 'error' },
      )
    } finally {
      setBusyName(null)
    }
  }

  async function handleRename() {
    if (!renameTarget || !renameValue.trim()) return
    setBusyName(renameTarget.name)
    try {
      await postJson('/api/profiles/rename', {
        oldName: renameTarget.name,
        newName: renameValue.trim(),
      })
      toast(`Renamed ${renameTarget.name} → ${renameValue.trim()}`, {
        type: 'success',
      })
      setRenameTarget(null)
      setRenameValue('')
      await refreshProfiles()
    } catch (error) {
      toast(
        error instanceof Error ? error.message : 'Failed to rename profile',
        { type: 'error' },
      )
    } finally {
      setBusyName(null)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 md:px-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-primary-200 bg-primary-50/80 p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={UserGroupIcon} size={22} strokeWidth={1.7} />
            <h1 className="text-lg font-semibold text-primary-900">Profiles</h1>
          </div>
          <p className="mt-1 text-sm text-primary-600">
            Browse and manage Hermes profiles stored under{' '}
            <span className="font-mono">~/.hermes/profiles</span>.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={1.8} />
          Create profile
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map((profile) => {
          const busy = busyName === profile.name
          return (
            <article
              key={profile.name}
              className="group relative overflow-hidden rounded-2xl border border-primary-200 bg-primary-50/80 shadow-sm dark:border-neutral-800 dark:bg-neutral-950"
            >
              {/* Active glow accent */}
              {profile.active && (
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-accent-500 to-emerald-400" />
              )}

              {/* Centered avatar hero */}
              <div className="flex flex-col items-center pt-6 pb-1">
                <div className="relative">
                  <div
                    className={cn(
                      'rounded-full p-1',
                      profile.active
                        ? 'bg-gradient-to-br from-emerald-400 via-accent-500 to-emerald-500 shadow-lg shadow-emerald-500/20'
                        : 'bg-gradient-to-br from-primary-200 to-primary-300 dark:from-neutral-700 dark:to-neutral-600',
                    )}
                  >
                    <img
                      src={profile.avatarDataUrl || '/claude-avatar.webp'}
                      alt={profileDisplayLabel(profile)}
                      className={cn(
                        'size-20 rounded-full border-2 object-cover',
                        profile.active
                          ? 'border-white dark:border-neutral-950'
                          : 'border-primary-50 dark:border-neutral-950',
                      )}
                      style={{
                        filter: profile.active
                          ? 'none'
                          : 'grayscale(0.5) brightness(0.9)',
                      }}
                    />
                  </div>
                  {profile.active && (
                    <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full border-2 border-white bg-emerald-500 px-2 py-0.5 dark:border-neutral-950">
                      <HugeiconsIcon
                        icon={CheckmarkCircle02Icon}
                        size={10}
                        strokeWidth={2.5}
                        className="text-white"
                      />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-white">
                        Active
                      </span>
                    </div>
                  )}
                </div>

                {/* Name + provider */}
                <h2 className="mt-3 text-center text-lg font-bold text-primary-900 dark:text-neutral-100">
                  {profileDisplayLabel(profile)}
                </h2>
                {profile.displayName ? (
                  <span className="mt-1 text-[11px] font-medium text-primary-400 dark:text-neutral-500">
                    profile id: {profile.name}
                  </span>
                ) : null}
                <span className="mt-1 inline-block rounded-full bg-primary-100 px-2.5 py-0.5 text-[11px] font-medium text-primary-600 dark:bg-neutral-800 dark:text-neutral-400">
                  {profile.provider || 'no provider'}
                </span>
              </div>

              {/* Stats ring */}
              <div className="mx-4 mt-4 grid grid-cols-4 divide-x divide-primary-200 rounded-xl border border-primary-200 bg-primary-100/50 dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900/50">
                <ProfileStat label="Skills" value={profile.skillCount} />
                <ProfileStat label="Sessions" value={profile.sessionCount} />
                <ProfileStat
                  label="Model"
                  value={profile.model || '\u2014'}
                  truncate
                />
                <ProfileStat
                  label="Env"
                  value={profile.hasEnv ? '\u2713' : '\u2014'}
                />
              </div>

              {/* Updated timestamp */}
              <div className="mx-4 mt-3 flex items-center justify-center gap-1.5 text-xs text-primary-400 dark:text-neutral-500">
                <HugeiconsIcon icon={Clock01Icon} size={12} strokeWidth={1.7} />
                {formatDate(profile.updatedAt)}
              </div>

              {/* Actions */}
              <div className="mt-4 flex border-t border-primary-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => void handleActivate(profile.name)}
                  disabled={profile.active || busy}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 border-r border-primary-200 py-2.5 text-xs font-semibold transition-colors dark:border-neutral-800',
                    profile.active
                      ? 'cursor-default text-primary-300 dark:text-neutral-600'
                      : 'text-primary-700 hover:bg-primary-100 dark:text-neutral-300 dark:hover:bg-neutral-900',
                  )}
                >
                  <HugeiconsIcon
                    icon={SparklesIcon}
                    size={13}
                    strokeWidth={1.8}
                  />{' '}
                  Activate
                </button>
                <button
                  type="button"
                  onClick={() => setDetailsName(profile.name)}
                  className="flex flex-1 items-center justify-center gap-1.5 border-r border-primary-200 py-2.5 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
                >
                  <HugeiconsIcon
                    icon={Folder01Icon}
                    size={13}
                    strokeWidth={1.8}
                  />{' '}
                  Details
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (profile.name === 'default') {
                      openIdentityDialog(profile)
                    } else {
                      setRenameTarget(profile)
                      setRenameValue(profile.name)
                    }
                  }}
                  className="flex flex-1 items-center justify-center gap-1.5 border-r border-primary-200 py-2.5 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
                >
                  <HugeiconsIcon
                    icon={Edit02Icon}
                    size={13}
                    strokeWidth={1.8}
                  />{' '}
                  {profile.name === 'default' ? 'Identity' : 'Rename'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(profile.name)}
                  disabled={profile.active || busy}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors',
                    profile.active
                      ? 'cursor-default text-primary-300 dark:text-neutral-600'
                      : 'text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20',
                  )}
                >
                  <HugeiconsIcon
                    icon={Delete02Icon}
                    size={13}
                    strokeWidth={1.8}
                  />{' '}
                  Delete
                </button>
              </div>
            </article>
          )
        })}
      </div>

      {sorted.length === 0 && !profilesQuery.isLoading ? (
        <div className="rounded-2xl border border-dashed border-primary-200 bg-primary-50/70 p-8 text-center text-sm text-primary-600">
          No named profiles found yet. The active profile is{' '}
          <span className="font-semibold">{activeProfile}</span>.
        </div>
      ) : null}

      <DialogRoot
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) resetWizard()
        }}
      >
        <DialogContent className="w-[min(560px,94vw)] max-w-none p-0">
          {/* ── Header ─────────────────────────────────── */}
          <div className="border-b border-primary-200 px-6 pb-4 pt-5 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="inline-flex size-10 items-center justify-center rounded-xl border border-primary-200 bg-primary-100/70 dark:border-neutral-700 dark:bg-neutral-900">
                <HugeiconsIcon icon={Add01Icon} size={20} strokeWidth={1.7} />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  Create profile
                </DialogTitle>
                <p className="mt-0.5 text-xs text-primary-500 dark:text-neutral-400">
                  {wizardStep === 1
                    ? 'Name & template'
                    : wizardStep === 2
                      ? 'Choose model'
                      : 'Review & create'}
                </p>
              </div>
            </div>

            {/* Step indicator */}
            <div className="mt-4 flex items-center gap-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex flex-1 items-center gap-2">
                  <div
                    className={cn(
                      'flex size-7 items-center justify-center rounded-full text-xs font-bold transition-colors',
                      wizardStep > step
                        ? 'bg-emerald-500 text-white'
                        : wizardStep === step
                          ? 'bg-accent-500 text-white'
                          : 'border border-primary-200 bg-primary-100 text-primary-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-500',
                    )}
                  >
                    {wizardStep > step ? (
                      <HugeiconsIcon
                        icon={CheckmarkCircle02Icon}
                        size={16}
                        strokeWidth={2}
                      />
                    ) : (
                      step
                    )}
                  </div>
                  {step < 3 && (
                    <div
                      className={cn(
                        'h-0.5 flex-1 rounded-full transition-colors',
                        wizardStep > step
                          ? 'bg-emerald-400'
                          : 'bg-primary-200 dark:bg-neutral-700',
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Body ──────────────────────────────────── */}
          <div className="px-6 py-5">
            {wizardStep === 1 && (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-neutral-400">
                    Profile name
                  </label>
                  <Input
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    placeholder="e.g. builder, researcher, ops"
                    className="h-11 text-sm"
                    autoFocus
                  />
                  {newProfileName.trim() && !nameValid ? (
                    <p className="text-xs text-red-500">
                      Use letters, numbers, underscores, or hyphens. Cannot be
                      &quot;default&quot;.
                    </p>
                  ) : newProfileName.trim() && nameValid ? (
                    <p className="text-xs text-emerald-600">✓ Valid name</p>
                  ) : (
                    <p className="text-xs text-primary-400 dark:text-neutral-500">
                      Choose a short, memorable identifier
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-neutral-400">
                    <span className="flex items-center gap-1.5">
                      <HugeiconsIcon
                        icon={Copy01Icon}
                        size={13}
                        strokeWidth={1.8}
                      />
                      Clone from existing
                    </span>
                  </label>
                  <select
                    value={cloneFrom}
                    onChange={(e) => setCloneFrom(e.target.value)}
                    className="h-11 w-full rounded-xl border border-primary-200 bg-primary-50 px-3 text-sm text-primary-900 outline-none transition-colors focus:border-accent-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  >
                    <option value="">Start fresh — empty config</option>
                    {profiles.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name} {p.model ? `(${p.model})` : ''}{' '}
                        {p.active ? '• active' : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-primary-400 dark:text-neutral-500">
                    Copies config, skills path, and env from the selected
                    profile
                  </p>
                </div>

                <div className="rounded-xl border border-primary-200 bg-primary-50/60 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
                  <p className="text-xs text-primary-500 dark:text-neutral-400">
                    Profiles are stored under{' '}
                    <code className="rounded bg-primary-100 px-1 py-0.5 font-mono text-[11px] dark:bg-neutral-800">
                      ~/.hermes/profiles/&lt;name&gt;/
                    </code>{' '}
                    with their own config, skills, sessions, and env.
                  </p>
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-neutral-400">
                    Default model
                  </label>
                  {loadingModels ? (
                    <div className="flex h-11 items-center rounded-xl border border-primary-200 bg-primary-50 px-3 text-sm text-primary-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-500">
                      Loading configured models…
                    </div>
                  ) : allModels.length === 0 ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                      No models found. Make sure Hermes Agent is running and has
                      models configured.
                    </div>
                  ) : (
                    <select
                      value={wizardModel}
                      onChange={(e) => {
                        const modelId = e.target.value
                        setWizardModel(modelId)
                        const matched = allModels.find((m) => m.id === modelId)
                        setWizardProvider(matched?.provider || '')
                      }}
                      className="h-11 w-full rounded-xl border border-primary-200 bg-primary-50 px-3 text-sm text-primary-900 outline-none transition-colors focus:border-accent-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                    >
                      <option value="">Skip — configure later</option>
                      {allModels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name || m.id}
                          {m.provider ? ` (${m.provider})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  {wizardModel && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      ✓ {wizardModel}
                      {wizardProvider ? ` via ${wizardProvider}` : ''}
                    </p>
                  )}
                </div>

                {!wizardModel && !loadingModels && allModels.length > 0 && (
                  <div className="rounded-xl border border-primary-200 bg-primary-50/60 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
                    <p className="text-xs text-primary-500 dark:text-neutral-400">
                      Select a model or skip to configure later from profile
                      details or config.yaml.
                    </p>
                  </div>
                )}
              </div>
            )}

            {wizardStep === 3 && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-primary-200 bg-primary-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary-500 dark:text-neutral-400">
                    Profile summary
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SummaryField label="Name" value={newProfileName.trim()} />
                    <SummaryField
                      label="Template"
                      value={cloneFrom || 'Fresh start'}
                    />
                    <SummaryField
                      label="Model"
                      value={
                        wizardModel
                          ? `${wizardModel}${wizardProvider ? ` (${wizardProvider})` : ''}`
                          : 'Not set'
                      }
                      muted={!wizardModel}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    This will create{' '}
                    <code className="rounded bg-emerald-100 px-1 py-0.5 font-mono text-[11px] dark:bg-emerald-900/40">
                      ~/.hermes/profiles/{newProfileName.trim()}/
                    </code>{' '}
                    with config.yaml
                    {cloneFrom ? ` cloned from ${cloneFrom}` : ''}, skills/, and
                    sessions/ directories.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Footer ─────────────────────────────────── */}
          <div className="flex items-center justify-between border-t border-primary-200 px-6 py-4 dark:border-neutral-800">
            <div>
              {wizardStep > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWizardStep((s) => (s - 1) as 1 | 2 | 3)}
                >
                  Back
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCreateOpen(false)
                  resetWizard()
                }}
              >
                Cancel
              </Button>
              {wizardStep < 3 ? (
                <Button
                  size="sm"
                  onClick={() => setWizardStep((s) => (s + 1) as 1 | 2 | 3)}
                  disabled={wizardStep === 1 && !nameValid}
                  className="gap-1.5"
                >
                  Next
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={14}
                    strokeWidth={1.8}
                  />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => void handleCreate()}
                  disabled={busyName === '__create__'}
                  className="gap-1.5"
                >
                  <HugeiconsIcon
                    icon={SparklesIcon}
                    size={14}
                    strokeWidth={1.8}
                  />
                  Create Profile
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </DialogRoot>

      <DialogRoot
        open={Boolean(renameTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setRenameTarget(null)
            setRenameValue('')
          }
        }}
      >
        <DialogContent className="w-[min(440px,94vw)] max-w-none p-0">
          <div className="border-b border-primary-200 px-6 pb-4 pt-5 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="inline-flex size-10 items-center justify-center rounded-xl border border-primary-200 bg-primary-100/70 dark:border-neutral-700 dark:bg-neutral-900">
                <HugeiconsIcon icon={Edit02Icon} size={20} strokeWidth={1.7} />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  Rename profile
                </DialogTitle>
                <p className="mt-0.5 text-xs text-primary-500 dark:text-neutral-400">
                  Renaming{' '}
                  <span className="font-semibold text-primary-700 dark:text-neutral-200">
                    {renameTarget?.name}
                  </span>
                </p>
              </div>
            </div>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-neutral-400">
                New name
              </label>
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="new-profile-name"
                className="h-11 text-sm"
                autoFocus
              />
              {renameValue.trim() &&
                !/^[A-Za-z0-9_-]+$/.test(renameValue.trim()) && (
                  <p className="text-xs text-red-500">
                    Use letters, numbers, underscores, or hyphens.
                  </p>
                )}
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-primary-200 px-6 py-3 dark:border-neutral-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRenameTarget(null)
                setRenameValue('')
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => void handleRename()}
              disabled={
                !renameTarget ||
                !renameValue.trim() ||
                !/^[A-Za-z0-9_-]+$/.test(renameValue.trim())
              }
            >
              Rename
            </Button>
          </div>
        </DialogContent>
      </DialogRoot>

      <DialogRoot
        open={Boolean(identityTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setIdentityTarget(null)
            setIdentityDisplayName('')
            setIdentityAvatarDataUrl(null)
            setIdentityError(null)
          }
        }}
      >
        <DialogContent className="w-[min(480px,94vw)] max-w-none p-0">
          <div className="border-b border-primary-200 px-6 pb-4 pt-5 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <img
                src={identityAvatarDataUrl || '/claude-avatar.webp'}
                alt={identityDisplayName || identityTarget?.name || 'Profile'}
                className="size-12 rounded-full border-2 border-primary-200 object-cover dark:border-neutral-700"
              />
              <div>
                <DialogTitle className="text-base font-semibold">
                  Profile identity
                </DialogTitle>
                <p className="mt-0.5 text-xs text-primary-500 dark:text-neutral-400">
                  Visual alias for{' '}
                  <span className="font-mono font-semibold">
                    {identityTarget?.name}
                  </span>
                  . Runtime profile id is not renamed.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4 px-6 py-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-neutral-400">
                Display name
              </label>
              <Input
                value={identityDisplayName}
                onChange={(e) => setIdentityDisplayName(e.target.value)}
                placeholder={identityTarget?.name || 'default'}
                className="h-11 text-sm"
                maxLength={50}
                autoFocus
              />
              <p className="text-xs text-primary-400 dark:text-neutral-500">
                Use this for labels in the Workspace UI. Leave blank to show the
                profile id.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-neutral-400">
                Avatar
              </label>
              <div className="flex items-center gap-3">
                <img
                  src={identityAvatarDataUrl || '/claude-avatar.webp'}
                  alt={identityDisplayName || identityTarget?.name || 'Profile'}
                  className="size-16 rounded-full border-2 border-primary-200 object-cover dark:border-neutral-700"
                />
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIdentityAvatarUpload}
                    disabled={identityProcessing}
                    aria-label="Upload profile avatar"
                    className="block max-w-[15rem] cursor-pointer text-xs text-primary-700 dark:text-neutral-300 file:mr-2 file:cursor-pointer file:rounded-lg file:border file:border-primary-200 file:bg-primary-100 file:px-2.5 file:py-1.5 file:text-xs file:font-medium file:text-primary-900 file:transition-colors hover:file:bg-primary-200 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIdentityAvatarDataUrl(null)}
                    disabled={!identityAvatarDataUrl || identityProcessing}
                    className="h-8 w-fit rounded-lg border-primary-200 px-3"
                  >
                    Remove avatar
                  </Button>
                </div>
              </div>
              <p className="text-xs text-primary-400 dark:text-neutral-500">
                Images are resized to 128px and stored in UI metadata, not in
                Hermes runtime config.
              </p>
            </div>

            {identityError ? (
              <p className="text-xs text-red-600" role="alert">
                {identityError}
              </p>
            ) : null}
          </div>
          <div className="flex justify-end gap-2 border-t border-primary-200 px-6 py-3 dark:border-neutral-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIdentityTarget(null)
                setIdentityDisplayName('')
                setIdentityAvatarDataUrl(null)
                setIdentityError(null)
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => void handleSaveIdentity()}
              disabled={
                !identityTarget ||
                identityProcessing ||
                busyName === identityTarget?.name
              }
            >
              Save identity
            </Button>
          </div>
        </DialogContent>
      </DialogRoot>

      <DialogRoot
        open={Boolean(detailsName)}
        onOpenChange={(open) => !open && setDetailsName(null)}
      >
        <DialogContent className="w-[min(640px,94vw)] max-w-none p-0 max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="shrink-0 border-b border-primary-200 px-6 pb-4 pt-5 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <img
                src={
                  detailQuery.data?.profile?.avatarDataUrl ||
                  '/claude-avatar.webp'
                }
                alt={
                  detailQuery.data?.profile
                    ? profileDisplayLabel(detailQuery.data.profile)
                    : detailsName || ''
                }
                className="size-12 rounded-full border-2 border-primary-200 object-cover dark:border-neutral-700"
              />
              <div className="min-w-0">
                <DialogTitle className="text-base font-semibold">
                  {detailQuery.data?.profile
                    ? profileDisplayLabel(detailQuery.data.profile)
                    : detailsName}
                </DialogTitle>
                <p className="mt-0.5 text-xs text-primary-500 dark:text-neutral-400">
                  Profile details &amp; configuration
                </p>
              </div>
            </div>
          </div>

          {/* Body — scrollable */}
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {detailQuery.data?.profile ? (
              <div className="space-y-4 text-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailField
                    label="Display name"
                    value={profileDisplayLabel(detailQuery.data.profile)}
                  />
                  <DetailField
                    label="Profile id"
                    value={detailQuery.data.profile.name}
                  />
                  <DetailField
                    label="Active"
                    value={detailQuery.data.profile.active ? 'Yes' : 'No'}
                    accent={detailQuery.data.profile.active}
                  />
                </div>
                <DetailField
                  label="Path"
                  value={detailQuery.data.profile.path}
                  mono
                />
                <div className="grid gap-3 sm:grid-cols-3">
                  <DetailField
                    label="Env file"
                    value={detailQuery.data.profile.envPath || 'Not set'}
                    mono
                    muted={!detailQuery.data.profile.envPath}
                  />
                  <DetailField
                    label="Sessions"
                    value={detailQuery.data.profile.sessionsDir || 'Not set'}
                    mono
                    muted={!detailQuery.data.profile.sessionsDir}
                  />
                  <DetailField
                    label="Skills"
                    value={detailQuery.data.profile.skillsDir || 'Not set'}
                    mono
                    muted={!detailQuery.data.profile.skillsDir}
                  />
                </div>
                <div className="rounded-xl border border-primary-200 bg-primary-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
                  <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary-500 dark:text-neutral-400">
                    <HugeiconsIcon
                      icon={Key01Icon}
                      size={14}
                      strokeWidth={1.8}
                    />{' '}
                    Config
                  </div>
                  <pre className="max-h-48 overflow-auto rounded-lg border border-primary-200 bg-primary-100/70 p-3 text-xs leading-relaxed text-primary-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">
                    {JSON.stringify(detailQuery.data.profile.config, null, 2)}
                  </pre>
                </div>
              </div>
            ) : detailQuery.isLoading ? (
              <div className="flex min-h-[120px] items-center justify-center text-sm text-primary-500 dark:text-neutral-400">
                Loading profile\u2026
              </div>
            ) : (
              <div className="flex min-h-[120px] items-center justify-center text-sm text-red-500">
                Failed to load profile.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 flex justify-end border-t border-primary-200 px-6 py-3 dark:border-neutral-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDetailsName(null)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </DialogRoot>
    </div>
  )
}

function SummaryField({
  label,
  value,
  muted,
}: {
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <div className="rounded-lg border border-primary-200 bg-primary-100/60 p-2.5 dark:border-neutral-700 dark:bg-neutral-800/60">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-primary-400 dark:text-neutral-500">
        {label}
      </div>
      <div
        className={cn(
          'mt-0.5 text-sm font-medium',
          muted
            ? 'text-primary-400 dark:text-neutral-500'
            : 'text-primary-900 dark:text-neutral-100',
        )}
      >
        {value}
      </div>
    </div>
  )
}

function DetailField({
  label,
  value,
  mono,
  muted,
  accent,
  full,
}: {
  label: string
  value: string
  mono?: boolean
  muted?: boolean
  accent?: boolean
  full?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-primary-200 bg-primary-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/60',
        full && 'sm:col-span-2',
      )}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider text-primary-400 dark:text-neutral-500">
        {label}
      </div>
      <div
        className={cn(
          'mt-1 text-sm break-all',
          mono && 'font-mono text-xs',
          muted
            ? 'text-primary-400 dark:text-neutral-500'
            : accent
              ? 'font-semibold text-emerald-600 dark:text-emerald-400'
              : 'text-primary-900 dark:text-neutral-100',
        )}
      >
        {value}
      </div>
    </div>
  )
}
