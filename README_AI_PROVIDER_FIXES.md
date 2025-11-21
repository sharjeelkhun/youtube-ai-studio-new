# AI Provider Fixes Documentation

## Overview

This document explains the comprehensive fixes applied to the AI provider integration system, addressing critical bugs in OpenAI response parsing, Gemini rate limiting, and usage tracking across all providers.

## What Was Fixed

### 1. **OpenAI Response Parsing Issue** ✅

**Problem:** OpenAI's `handleOpenAI` function returned plain text in format `"TITLE: ... DESCRIPTION: ..."` instead of a structured JSON object, causing frontend parsing errors ("bursts the code").

**Solution:**
- Updated the prompt to explicitly request JSON format
- Added `response_format: { type: 'json_object' }` to the OpenAI completion request
- Changed prompt to include clear JSON structure requirements
- Added `parseJsonResponse()` call to ensure consistent output format
- Now returns: `{ title: string, description: string, tags: string[] }`

**Files Changed:**
- `app/api/ai/optimize/route.ts` - Updated `handleOpenAI` function

### 2. **Gemini Rate Limiting & Usage Display** ✅

**Problem:** 
- Provider usage endpoint made a test API call every time it was fetched, consuming rate limit quota
- 60 requests/minute limit was being hit by test calls + actual optimization calls
- UI showed "60 tokens used" when rate limited (incorrect - these are requests not tokens)
- Double API calls: one for status check, one for actual optimization

**Solution:**
- Removed test API calls from `/api/ai/provider-usage` endpoint
- Now queries `analytics_usage` database table for actual usage data
- Only validates API key if no usage recorded today (avoiding unnecessary calls)
- Removed pre-optimization provider status check that caused double API hits
- Updated UI to show "Requests" instead of "Tokens" for Gemini
- Display format: "X / 60 requests per minute" (accurate representation)

**Files Changed:**
- `app/api/ai/provider-usage/route.ts` - Updated `getGeminiUsage()` to use database
- `app/api/ai/optimize/route.ts` - Removed provider status check before optimization
- `components/settings/ai-settings.tsx` - Updated display to show "Requests" for Gemini
- `lib/track-usage.ts` - Added `getUsageForProvider()` helper function

### 3. **Standardized Provider Response Format** ✅

**Problem:** Different providers returned different response structures, causing inconsistent handling.

**Solution:**
- All provider handlers now return: `{ title: string, description: string, tags: string[] }`
- Added response validation before returning to frontend
- Provides defaults if any field is missing
- Logs warnings for incomplete responses

**Files Changed:**
- `app/api/ai/optimize/route.ts` - Added validation logic for all providers

### 4. **Enhanced Token Usage Tracking** ✅

**Problem:** Token usage wasn't being tracked consistently across providers, causing disconnection between database records and UI display.

**Solution:**
- Updated all provider handlers to track token usage with `trackUsage()` function
- OpenAI: Uses `completion.usage` for accurate token counts
- Anthropic: Uses `msg.usage` for input/output token counts
- Mistral: Uses `response.usage` or estimates based on text length
- Gemini: Estimates tokens based on response length (Gemini API doesn't provide counts)
- Added database columns: `input_tokens`, `output_tokens`, `total_tokens`, `updated_at`

**Files Changed:**
- `app/api/ai/optimize/route.ts` - Updated all handler functions
- `lib/track-usage.ts` - Enhanced to handle token tracking
- `migrations/add_token_columns_to_analytics_usage.sql` - Database migration

### 5. **AI Provider Configuration Updates** ✅

**Problem:** Model IDs didn't match actual available models, and no rate limit information was displayed.

**Solution:**
- Updated model IDs to match current provider APIs:
  - OpenAI: `gpt-4o`, `gpt-4-turbo-preview`, `gpt-4`, `gpt-3.5-turbo`
  - Gemini: `gemini-1.5-pro`, `gemini-pro`, `gemini-1.5-flash`
  - Anthropic: `claude-3-5-sonnet-20241022`, `claude-3-opus-20240229`, `claude-3-haiku-20240307`
  - Mistral: `mistral-large-latest`, `mistral-medium-latest`, `mistral-small-latest`
- Added rate limit information to each provider config
- Added billing tier and pricing URL information

**Files Changed:**
- `lib/ai-providers.ts` - Updated all provider configurations

## How Usage Tracking Works

### Database Tracking (`analytics_usage` table)

The system tracks AI provider usage in the `analytics_usage` table with these fields:

- `user_id` - User who made the request
- `provider` - AI provider name (openai, gemini, anthropic, mistral)
- `api_calls` - Number of API calls made
- `content_generation` - Number of content generation operations
- `input_tokens` - Total input tokens consumed
- `output_tokens` - Total output tokens consumed
- `total_tokens` - Total tokens consumed (input + output)
- `timestamp` - When the record was created (start of day UTC)
- `updated_at` - Last update timestamp

### Real-time Display (`/api/ai/provider-usage` endpoint)

The endpoint combines:
1. **Database records** - Aggregated usage from `analytics_usage` table
2. **Provider limits** - Known rate limits and quotas
3. **API validation** - Minimal validation only when necessary (e.g., no usage today)

### How They Work Together

1. **When AI optimization is requested:**
   - `trackUsage()` is called to log the API call
   - Token usage is tracked when available from provider
   - Database record is created/updated for the day

2. **When usage is displayed:**
   - `/api/ai/provider-usage` queries the database for today's usage
   - Calculates remaining quota based on known limits
   - Only validates API key if no usage recorded today (avoids consuming quota)

3. **UI updates:**
   - Settings page polls every 30 seconds for usage updates
   - Shows accurate usage bars and remaining quota
   - Displays provider-specific rate limit information

## Rate Limiting Behavior

### Gemini (60 requests/minute)
- **Limit:** 60 requests per minute
- **Tracking:** Counts API calls, not tokens
- **Reset:** Every 60 seconds (rolling window)
- **Display:** "X / 60 requests per minute"
- **Optimization:** No test calls, uses database for usage display

### OpenAI (Pay-as-you-go)
- **Limit:** Varies by plan (typically 500 req/min, 10K tokens/min)
- **Tracking:** Counts tokens (input + output)
- **Reset:** Per minute (rolling window)
- **Display:** Shows billing balance and monthly cost
- **Note:** Requires valid payment method

### Anthropic (Free trial)
- **Limit:** 5 requests/minute, 10K tokens/minute
- **Tracking:** Counts tokens from response metadata
- **Reset:** Per minute (rolling window)
- **Display:** Shows tokens used and reset time
- **Note:** Requires credit balance for API access

### Mistral (Free trial)
- **Limit:** 5 requests/minute, 50K tokens/month
- **Tracking:** Counts tokens from response metadata or estimates
- **Reset:** Monthly for token quota
- **Display:** Shows tokens used and reset date
- **Note:** Requires credit balance for API access

## Centralized Rate Limiter

The system uses a centralized token bucket rate limiter (`lib/rate-limiter.ts`) for proactive rate limiting:

- **Token Bucket Algorithm:** 60 requests/minute capacity for Gemini
- **Queue Management:** FIFO queue for requests when limit reached
- **Dynamic Scheduling:** Uses `setTimeout` with calculated delays
- **Monotonic Clock:** Uses `performance.now()` for accurate timing
- **Error Handling:** Custom `RateLimitTimeoutError` with user-friendly messages

## Troubleshooting Guide

### "OpenAI returns invalid format"
**Cause:** Response not in JSON format
**Solution:** Fixed by adding `response_format: { type: 'json_object' }` to API request

### "Gemini rate limited immediately"
**Cause:** Test API calls consuming quota before actual optimization
**Solution:** Removed test calls from provider-usage endpoint, use database instead

### "Usage display shows 0/0"
**Cause:** API key invalid or billing issue
**Solution:** 
1. Check API key validity in provider dashboard
2. Verify billing/credit balance
3. Check error message in settings page

### "Rate limit error but usage shows low"
**Cause:** Rate limits are per-minute, not daily
**Solution:** 
- Gemini: Wait 60 seconds for reset
- Others: Wait for rate limit window to reset (typically 1 minute)

### "Billing error on free tier providers"
**Cause:** Provider requires credit balance even for free tier
**Solution:**
- Anthropic: Add credit balance in console.anthropic.com
- Mistral: Add credit balance in console.mistral.ai
- Gemini: Should work without billing (truly free tier)

### "Usage tracking not updating"
**Cause:** Database columns missing or function not called
**Solution:**
1. Run migration: `migrations/add_token_columns_to_analytics_usage.sql`
2. Verify `trackUsage()` is called in provider handlers
3. Check database logs for errors

## Testing Instructions

### 1. Test Each Provider

**OpenAI:**
```bash
# Test optimization
curl -X POST http://localhost:3000/api/ai/optimize \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Video", "description": "Test description"}'

# Expected: JSON response with title, description, tags array
```

**Gemini:**
```bash
# Check usage without making optimization call
curl http://localhost:3000/api/ai/provider-usage?provider=gemini

# Expected: Shows requests used from database, not from test call
```

**Anthropic/Mistral:**
```bash
# Test similar to OpenAI
# Verify token tracking in database
```

### 2. Verify Usage Tracking

```sql
-- Check today's usage for a user
SELECT * FROM analytics_usage 
WHERE user_id = '<user_id>' 
  AND DATE(timestamp) = CURRENT_DATE 
ORDER BY provider, timestamp DESC;

-- Verify token columns exist
SELECT input_tokens, output_tokens, total_tokens 
FROM analytics_usage 
LIMIT 1;
```

### 3. Test Rate Limiting

**For Gemini (60 req/min):**
1. Make 61 requests rapidly
2. 61st request should hit rate limiter
3. Wait 60 seconds
4. Next request should succeed

**Verify centralized rate limiter:**
- Check for `RateLimitTimeoutError` in logs
- Verify 429 status code returned
- Confirm user-friendly error message displayed

### 4. Test UI Display

**Settings Page:**
1. Select each provider
2. Verify usage display shows correct format:
   - Gemini: "X / 60 requests per minute"
   - Others: "X / Y tokens"
3. Check rate limit reset time is accurate
4. Verify error messages for billing issues

**Video Optimization:**
1. Trigger AI optimization
2. Verify success/error handling
3. Check usage updates after operation
4. Test retry logic if rate limited

## Links to Provider Dashboards

- **OpenAI:** https://platform.openai.com/
  - API Keys: https://platform.openai.com/api-keys
  - Usage: https://platform.openai.com/usage
  - Billing: https://platform.openai.com/account/billing

- **Google Gemini:** https://aistudio.google.com/
  - API Keys: https://aistudio.google.com/app/apikey
  - Pricing: https://ai.google.dev/pricing

- **Anthropic:** https://console.anthropic.com/
  - API Keys: https://console.anthropic.com/settings/keys
  - Billing: https://console.anthropic.com/settings/billing

- **Mistral AI:** https://console.mistral.ai/
  - API Keys: https://console.mistral.ai/api-keys
  - Billing: https://console.mistral.ai/billing

## Migration Instructions

### Apply Database Migration

```sql
-- Run this in your Supabase SQL editor or psql
\i migrations/add_token_columns_to_analytics_usage.sql
```

Or via Supabase CLI:
```bash
supabase db push migrations/add_token_columns_to_analytics_usage.sql
```

### Verify Migration

```sql
-- Check columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'analytics_usage' 
  AND column_name IN ('input_tokens', 'output_tokens', 'total_tokens', 'updated_at');

-- Check index exists
SELECT indexname FROM pg_indexes 
WHERE tablename = 'analytics_usage' 
  AND indexname = 'analytics_usage_timestamp_idx';

-- Check function exists
SELECT proname FROM pg_proc WHERE proname = 'get_daily_usage';
```

## Summary of Changes

| Issue | Before | After |
|-------|--------|-------|
| OpenAI Response | Plain text format | Structured JSON |
| Gemini Test Calls | Every status check | Only when no usage today |
| Usage Display | Live API calls | Database + occasional validation |
| Token Tracking | Inconsistent | All providers track accurately |
| Rate Limiting | Reactive (429 errors) | Proactive (centralized limiter) |
| Model IDs | Outdated | Current API versions |
| Provider Config | Missing rate limits | Complete information |

## Best Practices

1. **Avoid Unnecessary API Calls:**
   - Don't check provider status before every optimization
   - Cache usage data for 30-60 seconds
   - Only validate API keys when necessary

2. **Track Usage Accurately:**
   - Use provider token counts when available
   - Estimate only when API doesn't provide counts
   - Update database after every API call

3. **Handle Rate Limits Gracefully:**
   - Use centralized rate limiter for proactive control
   - Show user-friendly error messages with reset times
   - Provide retry logic with exponential backoff

4. **Display Clear Information:**
   - Show requests vs tokens appropriately per provider
   - Display accurate rate limit information
   - Provide links to provider dashboards for billing issues

## Future Improvements

- [ ] Add Redis caching for provider status to reduce database queries
- [ ] Implement webhook-based usage updates from providers
- [ ] Add per-user rate limiting to prevent abuse
- [ ] Create admin dashboard for monitoring provider usage across all users
- [ ] Add cost estimation based on token usage and provider pricing
