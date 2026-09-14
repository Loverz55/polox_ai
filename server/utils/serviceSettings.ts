import { randomUUID } from 'node:crypto'
import { connectDatabase } from './sqlite'

export interface ServiceSettings {
  openRouterBaseUrl: string
  openRouterKey: string
  openRouterModel: string
  imageBaseUrl: string
  imageKey: string
  imageModel: string
  /** auto = infer from model name; task = new-api job API (POST /v1/videos + poll). */
  imageFormat: 'auto' | 'openai' | 'gemini' | 'task'
  falKey: string
  revision: string
  openRouterOk: boolean
  imageOk: boolean
  falOk: boolean
  checkedAt: string
}
export const DEFAULT_MODEL = 'deepseek/deepseek-v4-flash-vision-exp'
export const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1'
export const DEFAULT_IMAGE_MODEL = 'gpt-image-2'
export type ServiceSettingsInput = Partial<Pick<ServiceSettings, 'openRouterBaseUrl' | 'openRouterKey' | 'openRouterModel' | 'imageBaseUrl' | 'imageKey' | 'imageModel' | 'falKey'>> & { imageFormat?: string }
export const SERVICE_SETTING_KEYS = ['openRouterBaseUrl', 'openRouterKey', 'openRouterModel', 'imageBaseUrl', 'imageKey', 'imageModel', 'imageFormat', 'falKey'] as const
const IMAGE_FORMATS = ['auto', 'openai', 'gemini', 'task'] as const
export function readServiceSettings(): ServiceSettings {
  const db = connectDatabase()
  db.exec('CREATE TABLE IF NOT EXISTS local_service_settings (id INTEGER PRIMARY KEY CHECK (id = 1), body TEXT NOT NULL)')
  const row = db.prepare('SELECT body FROM local_service_settings WHERE id = 1').get()
  const empty: ServiceSettings = { openRouterBaseUrl: DEFAULT_BASE_URL, openRouterKey: '', openRouterModel: DEFAULT_MODEL, imageBaseUrl: '', imageKey: '', imageModel: DEFAULT_IMAGE_MODEL, imageFormat: 'auto', falKey: '', revision: '', openRouterOk: false, imageOk: false, falOk: false, checkedAt: '' }
  return row ? { ...empty, ...JSON.parse(String(row.body)) } : empty
}
export function writeServiceSettings(settings: ServiceSettings) {
  readServiceSettings()
  connectDatabase().prepare('INSERT INTO local_service_settings(id, body) VALUES(1, ?) ON CONFLICT(id) DO UPDATE SET body = excluded.body').run(JSON.stringify(settings))
}
export function updateServiceSettings(input: ServiceSettingsInput) {
  const current = readServiceSettings()
  const pick = (key: keyof ServiceSettingsInput) => input[key] === undefined ? current[key] : String(input[key]).trim()
  const settings: ServiceSettings = {
    openRouterBaseUrl: pick('openRouterBaseUrl') || DEFAULT_BASE_URL,
    openRouterKey: pick('openRouterKey'),
    openRouterModel: pick('openRouterModel') || DEFAULT_MODEL,
    imageBaseUrl: pick('imageBaseUrl'),
    imageKey: pick('imageKey'),
    imageModel: pick('imageModel') || DEFAULT_IMAGE_MODEL,
    imageFormat: (IMAGE_FORMATS as readonly string[]).includes(String(pick('imageFormat'))) ? pick('imageFormat') as ServiceSettings['imageFormat'] : 'auto',
    falKey: pick('falKey'),
    revision: randomUUID(),
    openRouterOk: false,
    imageOk: false,
    falOk: false,
    checkedAt: '',
  }
  writeServiceSettings(settings)
  return settings
}
export function publicServiceStatus(settings = readServiceSettings()) {
  const fresh = Boolean(settings.checkedAt)
  return {
    openRouterConfigured: Boolean(settings.openRouterKey),
    imageConfigured: Boolean(settings.imageBaseUrl && settings.imageKey),
    falConfigured: Boolean(settings.falKey),
    openRouterBaseUrl: settings.openRouterBaseUrl,
    openRouterModel: settings.openRouterModel,
    imageBaseUrl: settings.imageBaseUrl,
    imageModel: settings.imageModel,
    imageFormat: settings.imageFormat,
    openRouterOk: fresh && settings.openRouterOk,
    imageOk: fresh && settings.imageOk,
    falOk: fresh && settings.falOk,
    // Text is required; either image relay or fal must work.
    connected: fresh && settings.openRouterOk && (settings.imageOk || settings.falOk),
    checkedAt: settings.checkedAt,
  }
}
