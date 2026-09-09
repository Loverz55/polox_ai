<script setup>
definePageMeta({
  layout: 'blank',
})

const router = useRouter()
const { t } = useI18n()
</script>

<template>
  <div class="h-svh">
    <div class="m-auto h-full w-full flex flex-col items-center justify-center gap-2">
      <h1 class="text-[7rem] font-bold leading-tight">
        500
      </h1>
      <span class="font-medium">{{ t('Oops! Something went wrong :\')') }}</span>
      <p class="text-center text-muted-foreground">
        {{ t('We apologize for the inconvenience.') }} <br> {{ t('Please try again later.') }}
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
