// ponytail: hand-rolled i18n. English source text is the key; only a zh dictionary
// is maintained and missing entries fall back to the English key. Swap for
// @nuxtjs/i18n if pluralization or per-locale routes are ever needed.
import type { Locale, TranslateParams } from './tr'
import { translate } from './tr'
import agentCore from './zh/agentCore'
import agentLab from './zh/agentLab'
import common from './zh/common'
import generator from './zh/generator'
import home from './zh/home'
import layout from './zh/layout'
import projects from './zh/projects'
import tools from './zh/tools'

export type { Locale, TranslateParams } from './tr'
export const LOCALES: Locale[] = ['zh', 'en']
export const DEFAULT_LOCALE: Locale = 'zh'

export const zh: Record<string, string> = {
  ...common,
  ...layout,
  ...home,
  ...agentLab,
  ...generator,
  ...projects,
  ...tools,
  ...agentCore,
}

/** Pure translate for code without Nuxt context (utils: pass the locale explicitly). */
export function tr(locale: Locale, key: string, params?: TranslateParams): string {
  return translate(zh, locale, key, params)
}
