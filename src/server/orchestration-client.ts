import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const DEFAULT_ORCHESTRATION_URL = 'http://127.0.0.1:8650'

function hermesHome(): string {
  return process.env.HERMES_HOME ?? path.join(os.homedir(), '.hermes')
}

function readEnvFileValue(filePath: string, key: string): string {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const body = trimmed.startsWith('export ')
        ? trimmed.slice('export '.length).trim()
        : trimmed
      const eq = body.indexOf('=')
      if (eq <= 0) continue
      if (body.slice(0, eq).trim() !== key) continue
      let value = body.slice(eq + 1).trim()
      if (
        value.length >= 2 &&
        ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'")))
      ) {
        value = value.slice(1, -1)
      }
      return value
    }
  } catch {
    // Missing local env files simply mean orchestration is not configured here.
  }
  return ''
}

function orchestrationToken(): string {
  return (
    process.env.HERMES_ORCHESTRATION_API_KEY ||
    readEnvFileValue(
      path.join(hermesHome(), 'orchestration.env'),
      'HERMES_ORCHESTRATION_API_KEY',
    )
  ).trim()
}

function orchestrationBaseUrl(): string {
  return (
    process.env.HERMES_ORCHESTRATION_API_URL ||
    readEnvFileValue(
      path.join(hermesHome(), 'orchestration.env'),
      'HERMES_ORCHESTRATION_API_URL',
    ) ||
    DEFAULT_ORCHESTRATION_URL
  ).replace(/\/+$/, '')
}

export async function orchestrationRequest<T>(
  pathName: string,
  init: RequestInit = {},
): Promise<T> {
  const token = orchestrationToken()
  if (!token) {
    throw new Error('Hermes Orchestration Core token is not configured.')
  }
  const pathWithSlash = pathName.startsWith('/') ? pathName : `/${pathName}`
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(`${orchestrationBaseUrl()}${pathWithSlash}`, {
    ...init,
    headers,
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(
      `Orchestration Core ${res.status}${body ? `: ${body.slice(0, 220)}` : ''}`,
    )
  }
  return (await res.json()) as T
}
