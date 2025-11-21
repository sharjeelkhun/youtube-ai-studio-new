import { useState, useEffect } from 'react';

export interface AIUsageData {
  apiCalls?: {
    used: number;
    limit: number;
    resetAt: string;  // ISO string of next reset date
  };
  contentGeneration?: {
    used: number;
    limit: number;
    resetAt: string;  // ISO string of next reset date
  };
  billingCycle?: {
    start: string;
    end: string;
    nextReset: string;  // ISO string of next billing cycle
  };
  limitReached?: boolean;
  resetTimeRemaining?: string;  // Human-readable time until next reset
  // From provider-usage endpoint
  configured?: boolean;
  error?: string;
  quota?: {
    usedTokens?: number;
    remainingTokens?: number;
    totalTokens?: number;
    resetDate?: string;
    daysUntilReset?: number;
  };
  rateLimit?: {
    requestsPerMinute?: number;
    tokensPerMinute?: number;
    requestsRemaining?: number;
  };
  billing?: {
    balance?: number;
    costThisMonth?: number;
    currency?: string;
  };
}

export function useAIUsage(providerId: string) {
  const [usageData, setUsageData] = useState<AIUsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUsageData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log(`[${providerId.toUpperCase()}] Fetching usage data...`);
        // Use the provider-usage endpoint which returns REAL data from live APIs
        const response = await fetch(`/api/ai/provider-usage?provider=${providerId}`);
        const data = await response.json();
        
        console.log(`[${providerId.toUpperCase()}] Raw API response:`, JSON.stringify(data, null, 2));

        // Return the raw data as-is - it contains real provider information
        // Including errors, rate limits, and actual usage
        setUsageData(data);
        
        if (!response.ok && data.error) {
          console.error(`[${providerId.toUpperCase()}] API Error:`, {
            status: response.status,
            error: data.error
          });
          // Don't throw - let the UI display the error
        }
      } catch (err) {
        console.error('Error fetching usage data:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    if (providerId) {
      fetchUsageData();
      
      // Set up polling for real-time updates every 60 seconds
      const interval = setInterval(fetchUsageData, 60000);
      
      return () => clearInterval(interval);
    }
  }, [providerId]);

  return { usageData, isLoading, error };
}