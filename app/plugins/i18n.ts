export default defineNuxtPlugin((nuxtApp) => {
  const { t } = useI18n()
  nuxtApp.vueApp.config.globalProperties.$t = t
})
