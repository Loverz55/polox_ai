import type { TranslateParams } from '~/i18n'
import type { AppSettings } from '~/types/appSettings'

declare module 'nuxt/schema' {
  interface AppConfigInput {
    /** App settings */
    appSettings: AppSettings
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $t: (key: string, params?: TranslateParams) => string
  }
}

// It is always important to ensure you import/export something when augmenting a type
export {}
