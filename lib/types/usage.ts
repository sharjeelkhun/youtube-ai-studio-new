export interface UsageLimit {
  used: number
  limit: number
  resetAt: string  // ISO string of next reset date
}

export interface UsageData {
  apiCalls: UsageLimit
  contentGeneration: UsageLimit
  billingCycle: {
    start: string
    end: string
    nextReset: string  // ISO string of next billing cycle
  }
  limitReached: boolean
  providerStatus?: {
    isConfigured: boolean
    isWorking: boolean
  }
}

export interface UsageResponse {
  error?: string
  data?: UsageData
}