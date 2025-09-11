import { aiProviders } from './ai-providers'

export const getAIProvider = (providerId: string) => {
  return aiProviders.find(provider => provider.id === providerId)
}
