/**
 * AI Usage Tracking Library
 * 
 * This module provides OPTIONAL local tracking and analytics for AI provider usage.
 * 
 * IMPORTANT: The Settings page usage display fetches data directly from provider APIs
 * in real-time, NOT from this database tracking. This tracking is purely for:
 * - Historical usage analytics (trends over time)
 * - Usage reports and dashboards
 * - Internal monitoring and cost analysis
 * 
 * The analytics_usage table is OPTIONAL and not required for the Settings page to work.
 * The trackUsage() function can continue to be called from AI routes for historical
 * tracking purposes, while the Settings page shows real-time data from provider APIs.
 * 
 * This dual-tracking approach gives you:
 * - Real-time usage data from provider APIs (displayed in Settings)
 * - Historical usage data in the database (for analytics/reporting)
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export type UsageType = 'api_calls' | 'content_generation';

interface TokenUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export interface DailyUsage {
  api_calls: number;
  content_generation: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
}

export async function trackUsage(provider: string, usageType: UsageType, tokenUsage?: TokenUsage) {
  try {
    const supabase = createRouteHandlerClient({ cookies: () => cookies() });
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('[TRACK-USAGE] Session error while tracking usage:', sessionError);
      return;
    }
    
    if (!session) {
      console.log('[TRACK-USAGE] No session found - skipping usage tracking (unauthenticated request)');
      return;
    }
    
    console.log(`[TRACK-USAGE] Tracking ${usageType} for ${provider} (user: ${session.user.id})`);

    // Calculate increment values
    const api_calls_inc = usageType === 'api_calls' ? 1 : 0;
    const content_generation_inc = usageType === 'content_generation' ? 1 : 0;
    const input_inc = tokenUsage?.inputTokens || 0;
    const output_inc = tokenUsage?.outputTokens || 0;
    const total_inc = tokenUsage?.totalTokens || 0;

    // Use atomic RPC function to increment usage (prevents race conditions)
    const { error: rpcError } = await supabase.rpc('increment_analytics_usage', {
      p_user_id: session.user.id,
      p_provider: provider,
      api_calls_inc,
      content_generation_inc,
      input_inc,
      output_inc,
      total_inc
    });

    if (rpcError) {
      console.error('[TRACK-USAGE] Error incrementing usage record:', { 
        code: rpcError.code, 
        message: rpcError.message, 
        details: rpcError.details, 
        provider 
      });
    } else {
      console.log('[TRACK-USAGE] Successfully incremented usage for:', provider);
    }
  } catch (error) {
    console.error('[TRACK-USAGE] Error in trackUsage:', error);
  }
}

/**
 * Get usage data for a specific user and provider from the database
 * @param userId - User ID to query usage for
 * @param provider - Provider name (openai, gemini, anthropic, mistral)
 * @param interval - Time interval to aggregate over ('daily', 'weekly', 'monthly')
 * @param date - Date to query (defaults to today)
 * @returns Aggregated usage data for the specified interval and a setupIncomplete flag
 */
export async function getUsageForProvider(
  userId: string, 
  provider: string, 
  interval: 'daily' | 'weekly' | 'monthly' = 'daily',
  date: Date = new Date()
): Promise<DailyUsage & { setupIncomplete?: boolean }> {
  try {
    const supabase = createRouteHandlerClient({ cookies: () => cookies() });
    
    // Calculate start and end dates based on interval
    let startOfPeriod: Date;
    let endOfPeriod: Date;
    
    if (interval === 'daily') {
      // Set date to start of day UTC
      startOfPeriod = new Date(date);
      startOfPeriod.setUTCHours(0, 0, 0, 0);
      endOfPeriod = new Date(startOfPeriod.getTime() + 24 * 60 * 60 * 1000);
    } else if (interval === 'weekly') {
      // Start of week (Sunday)
      startOfPeriod = new Date(date);
      const dayOfWeek = startOfPeriod.getUTCDay();
      startOfPeriod.setUTCDate(startOfPeriod.getUTCDate() - dayOfWeek);
      startOfPeriod.setUTCHours(0, 0, 0, 0);
      endOfPeriod = new Date(startOfPeriod.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (interval === 'monthly') {
      // Start of month
      startOfPeriod = new Date(date);
      startOfPeriod.setUTCDate(1);
      startOfPeriod.setUTCHours(0, 0, 0, 0);
      endOfPeriod = new Date(startOfPeriod);
      endOfPeriod.setUTCMonth(endOfPeriod.getUTCMonth() + 1);
    } else {
      throw new Error(`Unsupported interval: ${interval}`);
    }

    console.log(`[GET-USAGE] Fetching ${interval} usage for ${provider} from ${startOfPeriod.toISOString()} to ${endOfPeriod.toISOString()}`);

    const { data, error } = await supabase
      .from('analytics_usage')
      .select('api_calls, content_generation, input_tokens, output_tokens, total_tokens')
      .eq('user_id', userId)
      .eq('provider', provider)
      .gte('timestamp', startOfPeriod.toISOString())
      .lt('timestamp', endOfPeriod.toISOString());

    if (error) {
      // Check if this is a "table does not exist" error (PostgreSQL error code 42P01)
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.error('[GET-USAGE] Database setup incomplete - analytics_usage table does not exist. Please run migrations/create_analytics_usage_final.sql');
        // Gracefully degrade when table is missing, allowing the application to continue functioning
        return {
          api_calls: 0,
          content_generation: 0,
          input_tokens: 0,
          output_tokens: 0,
          total_tokens: 0,
          setupIncomplete: true
        };
      }
      
      console.error('[GET-USAGE] Error querying usage:', error);
      return {
        api_calls: 0,
        content_generation: 0,
        input_tokens: 0,
        output_tokens: 0,
        total_tokens: 0
      };
    }

    // Aggregate all records for the period
    const aggregated = (data || []).reduce((acc, record) => ({
      api_calls: acc.api_calls + (record.api_calls || 0),
      content_generation: acc.content_generation + (record.content_generation || 0),
      input_tokens: acc.input_tokens + (record.input_tokens || 0),
      output_tokens: acc.output_tokens + (record.output_tokens || 0),
      total_tokens: acc.total_tokens + (record.total_tokens || 0)
    }), {
      api_calls: 0,
      content_generation: 0,
      input_tokens: 0,
      output_tokens: 0,
      total_tokens: 0
    });

    console.log(`[GET-USAGE] Aggregated ${interval} usage for ${provider}:`, aggregated);
    return aggregated;
  } catch (error) {
    console.error('[GET-USAGE] Error in getUsageForProvider:', error);
    return {
      api_calls: 0,
      content_generation: 0,
      input_tokens: 0,
      output_tokens: 0,
      total_tokens: 0
    };
  }
}