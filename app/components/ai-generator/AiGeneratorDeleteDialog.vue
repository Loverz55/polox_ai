<script setup lang="ts">
const props = defineProps<{
  count?: number
  open: boolean
  pending?: boolean
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  'confirm': []
}>()

const { t } = useI18n()

function onOpenChange(open: boolean) {
  if (props.pending && !open)
    return
  emit('update:open', open)
}
</script>

<template>
  <AlertDialog :open="open" @update:open="onOpenChange">
    <AlertDialogContent class="rounded-2xl border-border bg-card shadow-none sm:max-w-md">
      <AlertDialogHeader class="gap-2">
        <AlertDialogTitle>
          {{ count && count > 1 ? t('Delete {count} results?', { count }) : t('Delete this result?') }}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {{ t('This cannot be undone. The result will be removed from your library and cannot be recovered.') }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel class="rounded-lg shadow-none" :disabled="pending">
          {{ t('Cancel') }}
        </AlertDialogCancel>
        <Button
          class="rounded-lg bg-destructive text-white shadow-none hover:bg-destructive/90"
          :disabled="pending"
          @click="emit('confirm')"
        >
          <Spinner v-if="pending" class="size-4" />
          {{ t('Delete') }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
