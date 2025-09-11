import { ReactNode } from 'react';

export interface AIProviderModel {
  id: string;
  name: string;
}

export interface AIProvider {
  id: string;
  name: string;
  description: string;
  logo: () => ReactNode;
  models: AIProviderModel[];
  apiKeyPlaceholder: string;
  apiKeyHelpText: string;
  apiKeyUrl: string;
}

export interface AIUsageData {
  apiCalls: {
    total: number;
    remaining: number;
    limit: number;
  };
  features: {
    [key: string]: {
      used: number;
      remaining: number;
      limit: number;
    };
  };
  billingCycle: {
    start: string;
    end: string;
  };
  limitReached?: boolean;
}
