import { useState, useEffect } from 'react';

export interface AIUsageData {
  apiCalls: {
    used: number;
    limit: number;
  };
  contentGeneration: {
    used: number;
    limit: number;
  };
  billingCycle: {
    start: string;
    end: string;
  };
  limitReached: boolean;
}

const dummyUsageData: { [key: string]: AIUsageData } = {
  openai: {
    apiCalls: { used: 750, limit: 1000 },
    contentGeneration: { used: 42, limit: 50 },
    billingCycle: { start: 'Apr 1, 2025', end: 'Apr 30, 2025' },
    limitReached: false,
  },
  gemini: {
    apiCalls: { used: 1000, limit: 1000 },
    contentGeneration: { used: 50, limit: 50 },
    billingCycle: { start: 'Apr 1, 2025', end: 'Apr 30, 2025' },
    limitReached: true,
  },
  anthropic: {
    apiCalls: { used: 980, limit: 1000 },
    contentGeneration: { used: 49, limit: 50 },
    billingCycle: { start: 'Apr 1, 2025', end: 'Apr 30, 2025' },
    limitReached: false,
  },
  mistral: {
    apiCalls: { used: 120, limit: 1000 },
    contentGeneration: { used: 5, limit: 50 },
    billingCycle: { start: 'Apr 1, 2025', end: 'Apr 30, 2025' },
    limitReached: false,
  },
};

export function useAIUsage(providerId: string) {
  const [usageData, setUsageData] = useState<AIUsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUsageData = async () => {
      setIsLoading(true);
      try {
        // Simulate an API call to fetch usage data
        await new Promise(resolve => setTimeout(resolve, 500));

        // In a real application, this data would come from your backend
        const data = dummyUsageData[providerId];
        if (!data) {
          throw new Error(`Usage data not found for provider: ${providerId}`);
        }

        setUsageData(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    if (providerId) {
      fetchUsageData();
    }
  }, [providerId]);

  return { usageData, isLoading, error };
}
