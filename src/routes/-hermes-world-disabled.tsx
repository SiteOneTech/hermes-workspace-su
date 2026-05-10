import { usePageTitle } from '@/hooks/use-page-title'

const DISABLED_VALUES = new Set(['0', 'false', 'no', 'off', 'disabled'])

export function isHermesWorldDisabled() {
  const value = String(import.meta.env.VITE_HERMESWORLD_ENABLED ?? '')
    .trim()
    .toLowerCase()
  return DISABLED_VALUES.has(value)
}

export function HermesWorldDisabled() {
  usePageTitle('404 — Not Found')

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-50 p-6 text-center text-primary-900">
      <div className="max-w-md rounded-xl border border-primary-200 bg-white p-6 shadow-sm">
        <div className="text-5xl font-bold text-accent-500/20">404</div>
        <h1 className="mt-4 text-2xl font-semibold">Page Not Found</h1>
        <p className="mt-2 text-sm text-primary-600">
          HermesWorld is disabled on this Zeus sidecar.
        </p>
      </div>
    </div>
  )
}
