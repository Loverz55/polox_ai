<script setup>
const { theme } = useAppSettings()

useHead({
  bodyAttrs: {
    class: computed(() => `color-${theme.value?.color || 'green'} theme-${theme.value?.type || 'mono'} theme-rounded-none`),
  },
})

const router = useRouter()
const { t } = useI18n()
</script>

<template>
  <div class="h-svh">
    <div class="m-auto h-full w-full flex flex-col items-center justify-center gap-2">
      <h1 class="text-[7rem] font-bold leading-tight">
        404
      </h1>
      <span class="font-medium">{{ t('Oops! Page Not Found!') }}</span>
      <p class="text-center text-muted-foreground">
        {{ t('It seems like the page you\'re looking for') }} <br>
        {{ t('does not exist or might have been removed.') }}
      </p>
      <div class="mt-6 flex gap-4">
        <Button variant="outline" @click="router.back()">
          {{ t('Go Back') }}
        </Button>
        <Button @click="router.push('/')">
          {{ t('Back to Home') }}
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
