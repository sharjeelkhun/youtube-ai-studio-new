import { createElement } from "react"

const OpenAILogo = () =>
  createElement(
    "svg",
    { viewBox: "0 0 24 24", className: "h-6 w-6", fill: "currentColor" },
    createElement("path", {
      d: "M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z",
    })
  )

const GeminiLogo = () =>
  createElement(
    "svg",
    { viewBox: "0 0 24 24", className: "h-6 w-6", fill: "currentColor" },
    createElement("path", {
      d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-3.5l6-4.5-6-4.5v9z",
    })
  )

const AnthropicLogo = () =>
  createElement(
    "svg",
    { viewBox: "0 0 24 24", className: "h-6 w-6", fill: "currentColor" },
    createElement("path", { d: "M12 2L2 12l10 10 10-10L12 2zm0 15.5L6.5 12 12 6.5l5.5 5.5-5.5 5.5z" })
  )

const MistralLogo = () =>
  createElement(
    "svg",
    { viewBox: "0 0 24 24", className: "h-6 w-6", fill: "currentColor" },
    createElement("path", {
      d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2v-6h2v6zm1-9.5c0 .83-.67 1.5-1.5 1.5S13 8.33 13 7.5 13.67 6 14.5 6s1.5.67 1.5 1.5zM9.5 6C10.33 6 11 6.67 11 7.5S10.33 9 9.5 9 8 8.33 8 7.5 8.67 6 9.5 6z",
    })
  )

export const aiProviders = [
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT-4o and GPT-3.5 Turbo models",
    logo: OpenAILogo,
    models: [
      { id: "gpt-4o", name: "GPT-4o (Recommended)" },
      { id: "gpt-4-turbo-preview", name: "GPT-4 Turbo" },
      { id: "gpt-4", name: "GPT-4" },
      { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
    ],
    fallbackModel: "gpt-3.5-turbo",
    apiKeyPlaceholder: "sk-...",
    apiKeyHelpText: "Your API key is stored securely and never shared with third parties.",
    apiKeyUrl: "https://platform.openai.com/api-keys",
    rateLimit: {
      requestsPerMinute: 500,
      tokensPerMinute: 10000
    },
    billing: {
      tier: "pay-as-you-go",
      pricingUrl: "https://openai.com/api/pricing/"
    }
  },
  {
    id: "gemini",
    name: "Google Gemini",
    description: "Gemini 2.5 and 2.0 models",
    logo: GeminiLogo,
    models: [
      { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro (Recommended)" },
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash (Fastest)" },
      { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite (Most Efficient)" },
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
      { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash Lite" },
    ],
    fallbackModel: "gemini-2.5-flash",
    apiKeyPlaceholder: "AIza...",
    apiKeyHelpText: "Get your API key from the Google AI Studio.",
    apiKeyUrl: "https://aistudio.google.com/app/apikey",
    rateLimit: {
      requestsPerMinute: 60,
      tokensPerMinute: 1000000
    },
    billing: {
      tier: "free",
      pricingUrl: "https://ai.google.dev/pricing"
    }
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude 3.5 Sonnet and Claude 3 models",
    logo: AnthropicLogo,
    models: [
      { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet (Latest)" },
      { id: "claude-3-5-sonnet-20240620", name: "Claude 3.5 Sonnet (June 2024)" },
      { id: "claude-3-opus-20240229", name: "Claude 3 Opus" },
      { id: "claude-3-sonnet-20240229", name: "Claude 3 Sonnet" },
      { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku (Fastest)" },
    ],
    fallbackModel: "claude-3-haiku-20240307",
    apiKeyPlaceholder: "sk-ant-...",
    apiKeyHelpText: "Get your API key from the Anthropic Console.",
    apiKeyUrl: "https://console.anthropic.com/settings/keys",
    rateLimit: {
      requestsPerMinute: 5,
      tokensPerMinute: 10000
    },
    billing: {
      tier: "free-trial",
      pricingUrl: "https://www.anthropic.com/api"
    }
  },
  {
    id: "mistral",
    name: "Mistral AI",
    description: "Mistral Large and Medium models",
    logo: MistralLogo,
    models: [
      { id: "mistral-large-latest", name: "Mistral Large (Recommended)" },
      { id: "mistral-medium-latest", name: "Mistral Medium" },
      { id: "mistral-small-latest", name: "Mistral Small" },
    ],
    fallbackModel: "mistral-small-latest",
    apiKeyPlaceholder: "...",
    apiKeyHelpText: "Get your API key from the Mistral AI Platform.",
    apiKeyUrl: "https://console.mistral.ai/api-keys",
    rateLimit: {
      requestsPerMinute: 5,
      tokensPerMinute: 50000
    },
    billing: {
      tier: "free-trial",
      pricingUrl: "https://mistral.ai/technology/#pricing"
    }
  },
]

// Helper function to validate if a model is valid for a provider
export function isValidModel(providerId: string, modelId: string): boolean {
  const provider = aiProviders.find(p => p.id === providerId)
  if (!provider) return false
  
  return provider.models.some(m => m.id === modelId)
}

// Helper function to get fallback model for a provider
export function getFallbackModel(providerId: string): string | null {
  const provider = aiProviders.find(p => p.id === providerId)
  return provider?.fallbackModel || null
}
