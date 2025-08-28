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
}

const dummyUsageData: { [key: string]: AIUsageData } = {
  openai: {
    apiCalls: { used: 750, limit: 1000 },
    contentGeneration: { used: 42, limit: 50 },
    billingCycle: { start: 'Apr 1, 2025', end: 'Apr 30, 2025' },
  },
  gemini: {
    apiCalls: { used: 320, limit: 1000 },
    contentGeneration: { used: 15, limit: 50 },
    billingCycle: { start: 'Apr 1, 2025', end: 'Apr 30, 2025' },
  },
  anthropic: {
    apiCalls: { used: 980, limit: 1000 },
    contentGeneration: { used: 49, limit: 50 },
    billingCycle: { start: 'Apr 1, 2025', end: 'Apr 30, 2025' },
  },
  mistral: {
    apiCalls: { used: 120, limit: 1000 },
    contentGeneration: { used: 5, limit: 50 },
    billingCycle: { start: 'Apr 1, 2025', end: 'Apr 30, 2025' },
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
