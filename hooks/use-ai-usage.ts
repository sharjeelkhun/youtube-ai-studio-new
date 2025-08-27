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

export function useAIUsage() {
  const [usageData, setUsageData] = useState<AIUsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUsageData = async () => {
      setIsLoading(true);
      try {
        // Simulate an API call to fetch usage data
        await new Promise(resolve => setTimeout(resolve, 1000));

        // In a real application, this data would come from your backend
        const data: AIUsageData = {
          apiCalls: {
            used: 245,
            limit: 1000,
          },
          contentGeneration: {
            used: 18,
            limit: 50,
          },
          billingCycle: {
            start: 'Apr 1, 2025',
            end: 'Apr 30, 2025',
          },
        };

        setUsageData(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsageData();
  }, []);

  return { usageData, isLoading, error };
}
