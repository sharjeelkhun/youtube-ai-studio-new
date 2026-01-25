import { NextResponse } from "next/server";
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';
import { UsageData } from '@/lib/types/usage';

function getDefaultResponse(
  provider: string,
  nextReset: Date,
  startOfMonth: Date,
  endOfMonth: Date,
  error?: string,
  status: number = 200
) {
  return NextResponse.json({
    error,
    provider,
    apiCalls: {
      used: 0,
      limit: provider === 'openai' ? 1000 : 500,
      resetAt: nextReset.toISOString()
    },
    contentGeneration: {
      used: 0,
      limit: provider === 'openai' ? 50 : 25,
      resetAt: nextReset.toISOString()
    },
    billingCycle: {
      start: startOfMonth.toISOString(),
      end: endOfMonth.toISOString(),
      nextReset: nextReset.toISOString()
    },
    limitReached: false,
    providerStatus: {
      isConfigured: false,
      isWorking: false
    },
    resetTimeRemaining: '15 days'
  }, { status });
}

export async function GET(req: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
  const searchParams = new URL(req.url).searchParams;
  const provider = searchParams.get('provider') || 'openai';

  // Common dates and response data
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // Add hours to ensure proper timezone handling
  startOfMonth.setUTCHours(0, 0, 0, 0);
  endOfMonth.setUTCHours(23, 59, 59, 999);
  nextReset.setUTCHours(0, 0, 0, 0);

  try {
    // Get the user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return getDefaultResponse(
        provider,
        nextReset,
        startOfMonth,
        endOfMonth,
        sessionError ? 'Session error' : 'Unauthorized',
        sessionError ? 500 : 401
      );
    }

    // Validate provider
    if (!provider || !['openai', 'gemini', 'anthropic', 'mistral'].includes(provider)) {
      return getDefaultResponse(provider, nextReset, startOfMonth, endOfMonth, 'Invalid provider', 400);
    }

    // Get or create user settings from profiles table
    const { data: settings, error: settingsError } = await supabase
      .from('profiles')
      .select('ai_settings')
      .eq('id', session.user.id)
      .maybeSingle();

    if (settingsError) {
      console.error('Settings error:', settingsError);
      return getDefaultResponse(
        provider,
        nextReset,
        startOfMonth,
        endOfMonth,
        'Failed to fetch user settings',
        500
      );
    }

    if (!settings || !(settings as any).ai_settings) {
      return getDefaultResponse(
        provider,
        nextReset,
        startOfMonth,
        endOfMonth,
        'API key not configured'
      );
    }

    // Check provider configuration
    const apiKeys = (settings as any).ai_settings?.apiKeys || {};
    const apiKey = apiKeys[provider];
    const providerConfigured = !!apiKey && (
      (provider === 'openai' && apiKey.startsWith('sk-')) ||
      (provider === 'gemini' && apiKey.startsWith('AIza')) ||
      (provider === 'anthropic' && apiKey.startsWith('sk-ant-')) ||
      (provider === 'mistral' && apiKey.length >= 32)
    );

    if (!providerConfigured) {
      return getDefaultResponse(
        provider,
        nextReset,
        startOfMonth,
        endOfMonth,
        'API key not configured or invalid'
      );
    }

    // Get usage data from database
    const { data: usageRecords, error: usageError } = await supabase
      .from('analytics_usage')
      .select('api_calls, content_generation')
      .eq('user_id', session.user.id)
      .eq('provider', provider)
      .gte('timestamp', startOfMonth.toISOString())
      .lte('timestamp', endOfMonth.toISOString());

    if (usageError) {
      console.error('[USAGE-API] Usage records query error:', usageError);
      // If table doesn't exist or there's an error, continue with zero usage instead of failing
      // This is better UX - show zero usage than error
    } else {
      console.log(`[USAGE-API] Found ${usageRecords?.length || 0} usage records for ${provider} user ${session.user.id}`);
    }

    // Calculate total usage (handle empty or null records)
    const totalUsage = {
      api_calls: (usageRecords as any[])?.reduce((sum, record) => sum + (record.api_calls || 0), 0) || 0,
      content_generation: (usageRecords as any[])?.reduce((sum, record) => sum + (record.content_generation || 0), 0) || 0
    };

    // Try to fetch provider-specific usage data
    try {
      if (provider === 'openai') {
        const startDate = startOfMonth.toISOString().split('T')[0];
        const endDate = endOfMonth.toISOString().split('T')[0];
        const response = await fetch(
          `https://api.openai.com/v1/usage?start_date=${startDate}&end_date=${endDate}`,
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          const apiUsage = {
            api_calls: data.data?.length || 0,
            content_generation: Math.ceil(
              data.data?.reduce((sum: number, item: any) =>
                sum + (item.n_context_tokens || 0) + (item.n_generated_tokens || 0), 0
              ) / 1000
            ) || 0
          };
          totalUsage.api_calls = Math.max(totalUsage.api_calls, apiUsage.api_calls);
          totalUsage.content_generation = Math.max(totalUsage.content_generation, apiUsage.content_generation);
        }
      }

      if (provider === 'mistral') {
        const response = await fetch('https://api.mistral.ai/v1/user/usage', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const apiUsage = {
            api_calls: data.requests_count || 0,
            content_generation: Math.ceil((data.total_tokens || 0) / 1000)
          };
          totalUsage.api_calls = Math.max(totalUsage.api_calls, apiUsage.api_calls);
          totalUsage.content_generation = Math.max(totalUsage.content_generation, apiUsage.content_generation);
        }
      }
    } catch (apiError) {
      console.warn(`Failed to fetch ${provider} API usage:`, apiError);
      // Continue with database values
    }

    // Calculate time until reset
    const timeUntilReset = nextReset.getTime() - now.getTime();
    const daysUntilReset = Math.ceil(timeUntilReset / (1000 * 60 * 60 * 24));

    // Prepare response
    const usageData: UsageData = {
      apiCalls: {
        used: totalUsage.api_calls,
        limit: provider === 'openai' ? 1000 : 500,
        resetAt: nextReset.toISOString()
      },
      contentGeneration: {
        used: totalUsage.content_generation,
        limit: provider === 'openai' ? 50 : 25,
        resetAt: nextReset.toISOString()
      },
      billingCycle: {
        start: startOfMonth.toISOString(),
        end: endOfMonth.toISOString(),
        nextReset: nextReset.toISOString()
      },
      providerStatus: {
        isConfigured: true,
        isWorking: true
      },
      limitReached: false
    };

    // Check if limits are reached
    usageData.limitReached = (
      totalUsage.api_calls >= usageData.apiCalls.limit ||
      totalUsage.content_generation >= usageData.contentGeneration.limit
    );

    return NextResponse.json({
      ...usageData,
      resetTimeRemaining: daysUntilReset === 1 ? '1 day' : `${daysUntilReset} days`
    });

  } catch (error) {
    console.error('Error in usage endpoint:', {
      provider,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return getDefaultResponse(
      provider,
      nextReset,
      startOfMonth,
      endOfMonth,
      'An unexpected error occurred',
      500
    );
  }
}