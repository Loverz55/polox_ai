// Dependency-free so plain Node (scripts/test-i18n.mjs) can import it.
export type Locale = 'zh' | 'en'
export type TranslateParams = Record<string, string | number>

export function translate(dict: Record<string, string>, locale: Locale, key: string, params?: TranslateParams): string {
  const text = locale === 'zh' ? (dict[key] ?? key) : key
  if (!params)
    return text
  return text.replace(/\{(\w+)\}/g, (match, name) => name in params ? String(params[name]) : match)
}
