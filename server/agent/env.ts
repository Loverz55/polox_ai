import { readServiceSettings } from '../utils/serviceSettings'

export const agentEnv = {
  get openRouterApiKey() { return readServiceSettings().openRouterKey },
  get openRouterBaseUrl() { return readServiceSettings().openRouterBaseUrl.replace(/\/+$/, '') },
  get imageRelayConfigured() { const s = readServiceSettings(); return Boolean(s.imageBaseUrl && s.imageKey) },
  get falApiKey() { return readServiceSettings().falKey },
  get model() { return readServiceSettings().openRouterModel },
}
export function assertAgentSecrets() {
  if (!agentEnv.openRouterApiKey || !(agentEnv.falApiKey || agentEnv.imageRelayConfigured))
    throw new Error('Configure the text model and an image provider (relay or fal) using Service connection in the top-right corner.')
}
