import type { Locale, TranslateParams } from '~/i18n'
import { DEFAULT_LOCALE, LOCALES, tr } from '~/i18n'

export function useI18n() {
  const cookie = useCookie<Locale>('polox-locale', { default: () => DEFAULT_LOCALE, maxAge: 60 * 60 * 24 * 365 })
  const locale = useState<Locale>('locale', () => LOCALES.includes(cookie.value) ? cookie.value : DEFAULT_LOCALE)

  function setLocale(next: Locale) {
    locale.value = next
    cookie.value = next
  }

  function t(key: string, params?: TranslateParams) {
    return tr(locale.value, key, params)
  }

  return { locale: readonly(locale), setLocale, t }
}
