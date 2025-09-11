export const getAccessToken = async (provider: string, apiKey: string): Promise<string | null> => {
  // For now, just return the API key as the access token
  // This can be expanded later to handle different authentication methods per provider
  return apiKey || null
}
