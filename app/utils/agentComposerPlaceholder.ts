import type { AiModelConfig } from '~~/shared/types/aiModel'

/**
 * Returns the English placeholder text (an i18n key). Pass `t` from `useI18n()`
 * at the call site to get the localized string; without it the English key is returned.
 */
export function agentComposerPlaceholder(
  models: Pick<AiModelConfig, 'task'>[],
  t: (key: string) => string = key => key,
) {
  if (!models.length)
    return t('Type @ to choose a model, or share your idea and I’ll help you plan it.')
  return t('What do you want to create next?')
}
