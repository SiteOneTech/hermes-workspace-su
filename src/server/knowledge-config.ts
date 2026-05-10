import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export type KnowledgeBaseSource =
  | { type: 'local'; path: string }
  | { type: 'github'; repo: string; branch: string; path: string }

export type KnowledgeBaseConfig = {
  source: KnowledgeBaseSource
}

const DEFAULT_CONFIG: KnowledgeBaseConfig = {
  source: { type: 'local', path: '' },
}

export function getHermesHome(): string {
  return path.resolve(
    process.env.HERMES_HOME ??
      process.env.CLAUDE_HOME ??
      path.join(os.homedir(), '.hermes'),
  )
}

export function expandHomePath(input: string): string {
  const value = input.trim()
  if (value === '~') return os.homedir()
  if (value.startsWith('~/')) return path.join(os.homedir(), value.slice(2))
  return value
}

export function getDefaultLocalKnowledgeRoot(): string {
  return path.join(getHermesHome(), 'knowledge')
}

function getConfigPath(): string {
  return path.join(getHermesHome(), 'knowledge-config.json')
}

export function readKnowledgeBaseConfig(): KnowledgeBaseConfig {
  const configPath = getConfigPath()
  try {
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8')
      const parsed = JSON.parse(raw) as Partial<KnowledgeBaseConfig>
      return {
        source: parsed.source ?? DEFAULT_CONFIG.source,
      }
    }
  } catch {
    // ignore parse errors, use default
  }
  return DEFAULT_CONFIG
}

export function writeKnowledgeBaseConfig(config: KnowledgeBaseConfig): void {
  const configPath = getConfigPath()
  const dir = path.dirname(configPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
}

export function getKnowledgeBaseEffectiveRoot(): string {
  const config = readKnowledgeBaseConfig()
  if (config.source.type === 'local') {
    const p = config.source.path.trim()
    if (p) return path.resolve(expandHomePath(p))
  }

  if (process.env.KNOWLEDGE_DIR)
    return path.resolve(expandHomePath(process.env.KNOWLEDGE_DIR))

  const hermesKnowledge = getDefaultLocalKnowledgeRoot()
  if (fs.existsSync(hermesKnowledge)) return hermesKnowledge

  const claudeKnowledge = path.join(os.homedir(), '.claude', 'knowledge')
  if (fs.existsSync(claudeKnowledge)) return claudeKnowledge

  const homeKnowledge = path.join(os.homedir(), 'knowledge', 'wiki')
  if (fs.existsSync(homeKnowledge)) return homeKnowledge

  return hermesKnowledge
}
