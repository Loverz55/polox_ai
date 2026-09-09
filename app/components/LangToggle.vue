<script setup lang="ts">
const { locale, setLocale, t } = useI18n()
const next = computed(() => locale.value === 'zh' ? 'en' : 'zh')
</script>

<template>
  <Button
    variant="ghost"
    size="sm"
    class="gap-1.5 px-2 text-xs font-medium"
    :title="t('Switch language')"
    :aria-label="t('Switch language')"
    @click="setLocale(next)"
  >
    <Icon name="i-lucide-languages" size="16" />
    <span>{{ locale === 'zh' ? 'EN' : '中文' }}</span>
  </Button>
</template>
