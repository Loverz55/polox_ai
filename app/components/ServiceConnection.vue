<script setup lang="ts">
import { AlertTriangle, CheckCircle2, LoaderCircle } from 'lucide-vue-next'
import { useServiceConnection } from '~/composables/useServiceConnection'

interface ConnectionStatus {
  connected: boolean
  openRouterConfigured: boolean
  imageConfigured: boolean
  falConfigured: boolean
  openRouterBaseUrl: string
  openRouterModel: string
  imageBaseUrl: string
  imageModel: string
  openRouterOk: boolean
  imageOk: boolean
  falOk: boolean
  checkedAt: string
}
interface CheckResult { ok: boolean, message: string }
const status = ref<ConnectionStatus | null>(null)
const { dialogOpen: open } = useServiceConnection()
const { t } = useI18n()
const testing = ref(false)
const MASKED_KEY = '********'
const openRouterBaseUrl = ref('')
const openRouterKey = ref('')
const openRouterModel = ref('')
const imageBaseUrl = ref('')
const imageKey = ref('')
const imageModel = ref('')
const falKey = ref('')
function showSavedKeys() {
  openRouterKey.value = status.value?.openRouterConfigured ? MASKED_KEY : ''
  imageKey.value = status.value?.imageConfigured ? MASKED_KEY : ''
  falKey.value = status.value?.falConfigured ? MASKED_KEY : ''
}
function unmasked(value: string) {
  return value === MASKED_KEY ? undefined : value
}
function selectKey(event: FocusEvent) {
  (event.target as HTMLInputElement).select()
}
const error = ref('')
const results = ref<{ openRouter: CheckResult, image: CheckResult, fal: CheckResult } | null>(null)
const connected = computed(() => Boolean(status.value?.connected))
async function refresh() {
  try { status.value = await $fetch<ConnectionStatus>('/api/settings/services') }
  catch { status.value = null }
}
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  refresh()
  timer = setInterval(refresh, 30000)
})
onUnmounted(() => clearInterval(timer))
watch(open, async (value) => {
  openRouterKey.value = ''
  imageKey.value = ''
  falKey.value = ''
  if (!value)
    return
  await refresh()
  showSavedKeys()
  openRouterBaseUrl.value = status.value?.openRouterBaseUrl || 'https://openrouter.ai/api/v1'
  openRouterModel.value = status.value?.openRouterModel || 'deepseek/deepseek-v4-flash-vision-exp'
  imageBaseUrl.value = status.value?.imageBaseUrl || ''
  imageModel.value = status.value?.imageModel || 'gpt-image-2'
  results.value = null
  error.value = ''
})
async function testConnection() {
  testing.value = true
  results.value = null
  error.value = ''
  // A new test invalidates the previous green indicator immediately.
  if (status.value)
    status.value.connected = false
  try {
    const result = await $fetch<ConnectionStatus & { openRouter: CheckResult, image: CheckResult, fal: CheckResult, superseded: boolean }>('/api/settings/services', {
      method: 'POST',
      body: { openRouterBaseUrl: openRouterBaseUrl.value, openRouterKey: unmasked(openRouterKey.value), openRouterModel: openRouterModel.value, imageBaseUrl: imageBaseUrl.value, imageKey: unmasked(imageKey.value), imageModel: imageModel.value, falKey: unmasked(falKey.value) },
      timeout: 65000,
    })
    status.value = result
    results.value = result
    if (result.superseded)
      error.value = t('Settings changed in another window. Test the current settings again.')
    showSavedKeys()
  }
  catch { error.value = t('Connection test could not finish. Please try again.'); await refresh() }
  finally { testing.value = false }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <button type="button" class="inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring" :class="connected ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'" :aria-label="t('Service connection')" :title="connected ? t('Text and image providers tested successfully') : t('Configure and test your text and image providers')">
        <CheckCircle2 v-if="connected" class="size-4" />
        <AlertTriangle v-else class="size-4" />
        <span>{{ connected ? t('Services connected') : t('API keys not configured') }}</span>
      </button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ t('Service connection') }}</DialogTitle>
        <DialogDescription>{{ t('Connect a text model (OpenRouter or any OpenAI-compatible relay) plus an image provider (OpenAI-compatible / Gemini relay, or fal). Keys are stored locally on this computer.') }}</DialogDescription>
      </DialogHeader>
      <form class="space-y-4" @submit.prevent="testConnection">
        <div class="space-y-2">
          <Label for="openrouter-base">{{ t('Text API base URL') }}</Label>
          <Input id="openrouter-base" v-model="openRouterBaseUrl" required autocomplete="off" :disabled="testing" placeholder="https://openrouter.ai/api/v1" />
        </div>
        <div class="space-y-2">
          <div class="flex items-center gap-3">
            <Label for="openrouter-key">{{ t('Text API key') }}</Label>
            <a href="https://openrouter.ai/workspaces/default/keys" target="_blank" rel="noopener noreferrer" class="text-xs text-primary underline underline-offset-4 hover:opacity-80" :aria-label="t('Get OpenRouter API key (opens in a new tab)')">{{ t('Get API key ↗') }}</a>
          </div>
          <Input id="openrouter-key" v-model="openRouterKey" type="password" autocomplete="off" :disabled="testing" :placeholder="t('Enter your text API key')" @focus="selectKey" />
        </div>
        <div class="space-y-2">
          <Label for="openrouter-model">{{ t('Text model') }}</Label>
          <Input id="openrouter-model" v-model="openRouterModel" required autocomplete="off" :disabled="testing" placeholder="provider/model-name" />
        </div>
        <div class="space-y-2">
          <Label for="image-base">{{ t('Image API base URL (OpenAI-compatible / Gemini relay)') }}</Label>
          <Input id="image-base" v-model="imageBaseUrl" autocomplete="off" :disabled="testing" placeholder="https://your-relay.example.com" />
        </div>
        <div class="space-y-2">
          <Label for="image-key">{{ t('Image API key') }}</Label>
          <Input id="image-key" v-model="imageKey" type="password" autocomplete="off" :disabled="testing" :placeholder="t('Enter your image relay API key')" @focus="selectKey" />
        </div>
        <div class="space-y-2">
          <Label for="image-model">{{ t('Default image model (gpt-image-2 or a gemini image model)') }}</Label>
          <Input id="image-model" v-model="imageModel" autocomplete="off" :disabled="testing" placeholder="gpt-image-2" />
        </div>
        <div class="space-y-2">
          <div class="flex items-center gap-3">
            <Label for="fal-key">{{ t('fal API key (optional)') }}</Label>
            <a href="https://fal.ai/login?returnTo=%2Fdashboard%2Fkeys" target="_blank" rel="noopener noreferrer" class="text-xs text-primary underline underline-offset-4 hover:opacity-80" :aria-label="t('Get fal API key (opens in a new tab)')">{{ t('Get API key ↗') }}</a>
          </div>
          <Input id="fal-key" v-model="falKey" type="password" autocomplete="off" :disabled="testing" :placeholder="t('Enter your fal API key')" @focus="selectKey" />
        </div>
        <p class="text-xs text-muted-foreground">
          {{ t('Clear a key to remove it when you test and save. Testing saves your settings, sends a short request to your text model, lists the image relay\'s models, and checks fal if a key is set. The model request may incur a small charge.') }}
        </p>
        <div v-if="results" class="space-y-2 rounded-md border p-3 text-sm" role="status" aria-live="polite">
          <p :class="results.openRouter.ok ? 'text-emerald-600' : 'text-red-600'">
            {{ results.openRouter.ok ? '✓' : '⚠' }} {{ results.openRouter.message }}
          </p>
          <p :class="results.image.ok ? 'text-emerald-600' : 'text-red-600'">
            {{ results.image.ok ? '✓' : '⚠' }} {{ results.image.message }}
          </p>
          <p :class="results.fal.ok ? 'text-emerald-600' : 'text-red-600'">
            {{ results.fal.ok ? '✓' : '⚠' }} {{ results.fal.message }}
          </p>
        </div>
        <p v-if="error" role="alert" class="text-sm text-red-600">
          {{ error }}
        </p>
        <DialogFooter>
          <Button type="submit" :disabled="testing || !openRouterModel.trim() || !openRouterBaseUrl.trim()">
            <LoaderCircle v-if="testing" class="mr-2 size-4 animate-spin" />
            {{ testing ? t('Testing connections…') : t('Test connection') }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
