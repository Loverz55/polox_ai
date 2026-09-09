<script setup lang="ts">
import type { GenerationProjectPublic } from '~~/shared/types/project'

const props = withDefaults(defineProps<{
  project: GenerationProjectPublic
  showActions?: boolean
}>(), {
  showActions: false,
})

const emit = defineEmits<{
  edit: []
  delete: []
}>()

const { t } = useI18n()

const coverStyle = computed(() => {
  if (!props.project.coverUrl)
    return undefined
  return { backgroundImage: `url(${props.project.coverUrl})` }
})
</script>

<template>
  <article class="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-none transition-colors duration-150 hover:bg-accent">
    <NuxtLink
      :to="`/projects/${project.id}`"
      class="flex min-w-0 flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div
        class="aspect-4/3 bg-muted/35 bg-cover bg-center"
        :style="coverStyle"
      >
        <div
          v-if="!project.coverUrl"
          class="flex h-full items-center justify-center text-muted-foreground"
        >
          <Icon
            name="i-lucide-folder"
            class="size-8"
          />
        </div>
      </div>
      <div class="flex flex-col gap-1 p-4 pb-2">
        <h3 class="flex min-w-0 items-center gap-1.5 text-base font-medium text-foreground">
          <span class="truncate">{{ t(project.name) }}</span>
          <span
            v-if="project.activeJobCount > 0"
            class="inline-flex shrink-0"
            :title="t('Generating')"
          >
            <Spinner class="size-3.5 text-muted-foreground" />
          </span>
        </h3>
        <p
          v-if="project.description"
          class="line-clamp-2 text-sm text-muted-foreground"
        >
          {{ project.description }}
        </p>
      </div>
    </NuxtLink>
    <div class="flex min-h-8 items-center justify-between gap-2 px-4 pb-4">
      <p class="min-w-0 truncate text-sm text-muted-foreground">
        {{ project.assetCount === 1 ? t('{count} asset', { count: project.assetCount }) : t('{count} assets', { count: project.assetCount }) }}
      </p>
      <DropdownMenu
        v-if="showActions && !project.isDefault"
        :modal="false"
      >
        <DropdownMenuTrigger as-child>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            class="shrink-0 rounded-lg shadow-none"
            :aria-label="t('Actions for {name}', { name: project.name })"
          >
            <Icon
              name="i-lucide-ellipsis-vertical"
              class="size-4"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="min-w-36">
          <DropdownMenuItem @click="emit('edit')">
            {{ t('Edit') }}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            @click="emit('delete')"
          >
            {{ t('Delete') }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </article>
</template>
