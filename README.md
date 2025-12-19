# YourAI Studio

A Next.js application for managing YouTube content with AI-powered features.

## Database Setup & Migrations

This application requires a Supabase database with specific tables to function. **Migrations must be run manually** via Supabase dashboard or CLI, as Next.js cannot execute DDL (Data Definition Language) statements directly for security reasons.

### Required Tables

The application requires the following tables:
- `profiles` - User profile information
- `youtube_channels` - Connected YouTube channel data
- `videos` - Video metadata and status
- `analytics_data` - YouTube analytics data
- `content_ideas` - AI-generated and user-created content ideas
- `analytics_usage` - AI provider usage tracking (tokens, API calls) **[OPTIONAL - FOR HISTORICAL ANALYTICS ONLY]**

### Running Migrations

You have multiple options for setting up the database:

#### Option 1: Using Supabase Dashboard (Recommended for First-Time Setup)

1. Go to your Supabase project dashboard at `https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/sql`
2. Navigate to **SQL Editor** in the left sidebar
3. Click **"New Query"**
4. Run the following SQL files in order:
   - `setup-database.sql` - Creates all core tables including `analytics_usage`
   - `setup-tables.sql` - Additional table setup (if needed)
5. **Verify Success**: Run `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`
6. You should see all 6 required tables listed

**If `analytics_usage` table is missing and you want historical analytics:**
- Open SQL Editor
- Copy and paste the entire contents of `migrations/create_analytics_usage_final.sql`
- Click **"Run"** or press `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows/Linux)
- Verify by running: `SELECT * FROM public.analytics_usage LIMIT 1;`
- You should see "Success (no rows)" or the table structure

#### Option 2: Using Supabase CLI

1. Install Supabase CLI if you haven't already:
```bash
npm install -g supabase
```

2. Link your project:
```bash
supabase link --project-ref your-project-ref
```

3. Run all migrations:
```bash
supabase db push
```

This will apply all pending migrations from the `migrations/` directory.

#### Option 3: Using the API Endpoint (Diagnostic Only)

This application includes a database diagnostic endpoint:

```bash
# Check which tables exist
curl -X POST http://localhost:3000/api/db-setup
```

**Important:** This endpoint **cannot create tables** - it only checks if they exist and provides instructions for manual setup. Supabase's PostgREST API doesn't allow arbitrary SQL execution for security reasons.

### Verifying Database Setup

To verify that all tables are created correctly:

1. Go to your Supabase dashboard
2. Navigate to Table Editor
3. Confirm that all required tables exist:
   - `profiles`
   - `youtube_channels`
   - `videos`
   - `analytics_data`
   - `content_ideas`
   - `analytics_usage`

## AI Usage Display

This application displays real-time AI usage data fetched **directly from provider APIs**. The Settings page shows up-to-date usage information with a 30-second cache.

### Rate Limiting

The application implements **per-user rate limiting** to prevent abuse and ensure fair resource allocation:

- **Token Bucket Algorithm**: Each user has independent rate limit quotas (60 requests/minute)
- **Per-Provider Limits**: Rate limits are tracked separately for each AI provider (OpenAI, Gemini, Anthropic, Mistral)
- **Automatic Queuing**: Requests exceeding the rate limit are queued and processed when capacity becomes available
- **Graceful Degradation**: Rate limit errors display helpful messages with retry timing

**Default Limits:**
- **Capacity**: 60 tokens per user per provider
- **Refill Rate**: 1 token per second (60 tokens/minute)
- **Max Queued**: Up to 10 requests per user per provider

If you see "Rate Limit Reached" errors:
- Wait 60 seconds for your quota to fully refill
- The application automatically queues and retries requests
- Each user's quota is independent - other users don't affect your limits

### Provider Usage Support

**OpenAI** ✅ Full billing and usage data
- Fetches billing information via OpenAI API
- Shows account balance and monthly costs
- Real-time data updated every 30 seconds

**Anthropic** ⚠️ Partial API support
- Attempts to fetch from Anthropic Usage API (if available)
- Falls back to static free tier limits (10,000 tokens)
- Note: Usage API may require organization-level API keys
- Monitor detailed usage in [Anthropic Console](https://console.anthropic.com/settings/billing)

**Gemini** ❌ No usage API
- Google Gemini API does not provide programmatic usage tracking
- Shows static rate limits only (60 requests/minute, 1M tokens/minute)
- Monitor usage in [Google AI Studio](https://aistudio.google.com/)

**Mistral** ❌ No usage API
- Mistral API does not provide programmatic usage tracking
- Shows static free tier limits (50,000 tokens/month)
- Monitor usage in [Mistral Console](https://console.mistral.ai/usage)

### Viewing Usage Data

Access your usage statistics in the **Settings** page:
- **OpenAI**: Live billing data with balance and monthly costs
- **Anthropic**: Usage data (if API available) or static limits with console link
- **Gemini**: Static rate limits with link to Google AI Studio
- **Mistral**: Static limits with link to Mistral Console

The Settings page automatically refreshes every 30 seconds to show the latest data.

### Optional: Historical Analytics Tracking

The `analytics_usage` table is **OPTIONAL** and provides local historical tracking for analytics purposes only. The Settings page does NOT use this table - it fetches directly from provider APIs.

**Use the analytics_usage table if you want to:**
- Track historical usage trends over time
- Generate usage reports and analytics
- Monitor usage patterns across different time periods
- Analyze cost trends and optimization opportunities

**You can skip creating this table if:**
- You only need real-time usage display (Settings page works without it)
- You prefer monitoring usage in provider consoles
- You don't need historical analytics

If you choose to enable historical tracking, all AI routes will automatically log usage data to the `analytics_usage` table via the `trackUsage()` function. This data is separate from what's displayed in Settings.

### Provider Usage Monitoring

For providers without programmatic APIs, monitor usage in their respective consoles:

| Provider | Console URL | What's Available |
|----------|-------------|------------------|
| OpenAI | https://platform.openai.com/usage | Full usage and billing details |
| Anthropic | https://console.anthropic.com/settings/billing | Billing and usage information |
| Gemini | https://aistudio.google.com/ | Rate limits and quota information |
| Mistral | https://console.mistral.ai/usage | Usage statistics and limits |

### Implementation Details

Each tracked AI route follows this pattern:

```typescript
import { trackUsage } from '@/lib/track-usage'

// Before API call
await trackUsage('provider', 'api_calls')

// Make API call
const response = await provider.api.call()

// After API call - track tokens
if (response.usage) {
  await trackUsage('provider', 'content_generation', {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    totalTokens: response.usage.total_tokens
  })
}
```

### Database Schema

The `analytics_usage` table structure:
```sql
CREATE TABLE analytics_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  api_calls INTEGER NOT NULL DEFAULT 0,
  content_generation INTEGER NOT NULL DEFAULT 0,
  input_tokens BIGINT NOT NULL DEFAULT 0,
  output_tokens BIGINT NOT NULL DEFAULT 0,
  total_tokens BIGINT NOT NULL DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  date_utc DATE GENERATED ALWAYS AS (DATE(timestamp)) STORED,
  UNIQUE(user_id, provider, date_utc)
)
```

**Important:** The `date_utc` column is a **GENERATED column** that PostgreSQL automatically calculates from the `timestamp` column. Application code should **never** attempt to insert or update this column directly, as PostgreSQL will reject such operations with an error.

The `UNIQUE` constraint ensures that usage data is aggregated by day, preventing duplicate entries and enabling efficient daily rollups.

## Troubleshooting

### "Rate Limit Reached" Error

**Symptoms:**
- Error message: "Rate Limit Reached - Please wait before making another request"
- Appears when making multiple AI requests quickly
- May show "Attempt 0 of 5" if quota is exhausted

**Cause:**
The application implements per-user rate limiting to prevent abuse. Each user has an independent quota of 60 requests per minute per provider.

**Solutions:**
1. **Wait 60 seconds**: Your quota fully refills after 60 seconds
2. **Automatic retry**: The application queues requests and retries automatically
3. **Check quota**: The rate limiter refills at 1 token/second
4. **Per-user isolation**: Other users' requests don't affect your quota

**Understanding the rate limiter:**
- Each user has independent token buckets for each provider
- Capacity: 60 tokens (requests)
- Refill rate: 1 token per second
- Maximum queue: 10 pending requests per user per provider

### "Usage tracking not available" message for Gemini or Mistral

**This is expected behavior.**
- Gemini and Mistral APIs do not provide programmatic usage tracking
- You must monitor usage in their respective consoles:
  - Gemini: https://aistudio.google.com/
  - Mistral: https://console.mistral.ai/usage
- The Settings page will show static rate limits and a link to the console

### Invalid API key errors

**Symptoms:**
- Settings page shows "Invalid API key" error
- AI features return authentication errors

**Solutions:**
1. Verify your API key in the provider's console
2. Ensure the key has the correct permissions
3. Check that you're using the correct key type (some providers have different key types for different features)
4. For Anthropic: Verify you have sufficient credits in your account

### OpenAI shows $0.00 balance

**Possible causes:**
- No hard limit set in OpenAI account
- Billing not yet processed for current month
- API key doesn't have billing access permissions

**Solution:**
- Check your OpenAI billing settings at https://platform.openai.com/settings/organization/billing
- Ensure your API key has permission to access billing information
Run the migration manually via Supabase dashboard:

1. Open Supabase SQL Editor: `https://supabase.com/dashboard/project/[PROJECT_ID]/sql`
2. Click "New Query"
3. Copy and paste the contents of `migrations/create_analytics_usage_final.sql`
4. Click "Run" or press `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows/Linux)
5. Verify success: `SELECT * FROM public.analytics_usage LIMIT 1;`
6. You should see "Success (no rows)" or the table structure
7. Refresh the Settings page

### Problem: "Cannot insert into column 'date_utc'" errors in logs

**Symptoms:**
- Server logs show: `cannot insert into column 'date_utc'`
- PostgreSQL error code: 42601 or similar
- Usage data not being saved despite tracking calls

**Cause:**
The application code is trying to insert a value into the `date_utc` generated column. PostgreSQL automatically generates this value from the `timestamp` column and rejects any explicit inserts.

**Solution:**
This issue should be fixed in the current version of `lib/track-usage.ts`. If you see this error:
1. Ensure you're on the latest version of the code
2. Check `lib/track-usage.ts` line 59-70: the `upsertData` object should NOT include `date_utc`
3. The correct implementation removes the generated column from insert data:
   ```typescript
   const upsertData = {
     user_id: session.user.id,
     provider: provider,
     timestamp: today.toISOString(),
     // date_utc is NOT included - PostgreSQL generates it automatically
     api_calls: api_calls,
     // ... other fields
   };
   ```

### Stuck Loader on Settings Page

**Symptoms:**
- Settings page shows a spinning loader indefinitely
- Console errors about missing tables (specifically `analytics_usage`)
- Provider usage shows zeros or errors

**Cause:**
The `analytics_usage` table doesn't exist in the database. This table is required for tracking AI provider usage (tokens, API calls, etc.).

**Solution:**
Run the analytics_usage migration:

1. **Via Supabase Dashboard:**
   - Open SQL Editor in your Supabase dashboard
   - Copy and run the contents of `migrations/create_analytics_usage_final.sql`
   - Verify the table was created in Table Editor

2. **Via Supabase CLI:**
   ```bash
   supabase db push
   ```

3. **Via diagnostic endpoint:**
   ```bash
   curl -X POST http://localhost:3000/api/db-setup
   ```
   (This only checks if tables exist and provides setup instructions)

After running the migration, refresh the settings page. The loader should disappear and show your provider usage information.

### Verifying Migration Status

To check which migrations have been applied:

1. Go to Supabase Dashboard → Database → Migrations
2. Check the list of applied migrations
3. Ensure `analytics_usage` table exists in Table Editor

### Other Common Setup Issues

**Issue: RLS (Row Level Security) errors**
- Ensure all RLS policies are created by running the setup scripts
- Check that your user is authenticated when accessing the application

**Issue: Missing uuid_generate_v4() function**
- Run: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";` in SQL Editor
- This extension is automatically created by the `create_analytics_usage_final.sql` migration

**Issue: Cannot insert data into tables**
- Verify RLS policies are correctly set up
- Ensure you're authenticated with a valid user session

### Settings Page Shows "0 tokens remaining" for All Providers

**Symptoms:**
- All AI providers show "0 tokens remaining" instead of actual token limits
- Usage tracking appears broken despite valid API keys
- Console may show informational error messages like "does not provide usage tracking"

**Root Cause:**
- UI conditional logic not properly matching informational messages
- Fallback logic using `||` instead of `??` (nullish coalescing)
- Static providers (Gemini, Mistral) return informational errors with actual quota data

**Solution:**
This issue is fixed in the current version. The UI now:
1. Uses regex matching with case-insensitive flags to detect informational messages
2. Uses nullish coalescing (`??`) to show totalTokens when remainingTokens is undefined
3. Displays "(Static limits - actual usage not tracked)" suffix for static providers

**If you still see "0 tokens remaining":**
1. Check browser console for errors: Open DevTools → Console
2. Look for `[AI-SETTINGS] Provider usage data:` debug log entries
3. Verify the API response includes `quota.totalTokens` and `quota.remainingTokens`
4. Clear browser cache and hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
5. If issue persists, file a bug report with console logs

**Expected Display:**
- **Gemini**: "0 tokens remaining (Static limits - actual usage not tracked)"
  - Shows static rate limit: 1,000,000 tokens/minute
  - Monitor actual usage at https://aistudio.google.com/
- **Mistral**: "50,000 tokens remaining (Static limits - actual usage not tracked)"
  - Free tier: 50,000 tokens/month
  - Monitor usage at https://console.mistral.ai/usage
- **Anthropic**: "10,000 tokens remaining (Static limits - actual usage not tracked)"
  - Free trial tier
  - Monitor usage at https://console.anthropic.com/settings/billing
- **OpenAI**: Shows actual billing data and current balance (live data)

### Gemini Free Tier Not Working for Video Optimization

**Symptoms:**
- Video optimization fails with "Invalid model" errors
- Console shows "gemini-pro" or outdated model errors
- Rate limit errors even when not hitting limits
- "RESOURCE_EXHAUSTED" errors

**Root Causes:**
1. **Invalid Model**: Using deprecated model like `gemini-pro` instead of current models
2. **API Key Invalid**: Key too short, malformed, or lacks permissions
3. **Rate Limiting**: Free tier limited to 60 requests/minute

**Solutions:**

**1. Update Model Selection:**
- Go to Settings → AI Configuration → Google Gemini
- Select one of these valid models:
  - `gemini-1.5-pro` (Best quality, recommended)
  - `gemini-1.5-flash` (Fastest, most economical for free tier)
  - `gemini-pro` (Legacy - may be deprecated)
  - `gemini-1.0-pro` (Legacy - may be deprecated)
- Save settings and try again

**2. Verify API Key:**
- API key should start with `AIza` and be at least 30 characters long
- Get new key: https://aistudio.google.com/app/apikey
- Ensure key has "Generative Language API" enabled
- Copy full key including the `AIza` prefix

**3. Check Rate Limits:**
- Free tier: 60 requests per minute, 1,500 requests per day
- If you see `RESOURCE_EXHAUSTED` or `429` errors:
  - Wait 60 seconds before retrying
  - Space out requests (avoid batch operations)
  - Consider upgrading to paid tier for higher limits
- Rate limits reset every minute (sliding window)

**4. Model Fallback Behavior:**
The application automatically falls back to `gemini-1.5-flash` if:
- Selected model is invalid or deprecated
- Model returns initialization errors
- API returns model not found errors

**5. Common Gemini Errors:**

| Error Message | Cause | Solution |
|---------------|-------|----------|
| `Invalid Gemini API key format` | Key doesn't start with `AIza` | Get new key from AI Studio |
| `Invalid Gemini API key - key appears to be too short` | Key length < 30 chars | Verify you copied full key |
| `Gemini rate limit reached (60 requests/minute)` | Too many requests | Wait 60 seconds, space out requests |
| `Invalid or unauthorized Gemini API key` | Key lacks permissions or is revoked | Generate new key in AI Studio |
| Model `gemini-pro` not found | Using deprecated model | Switch to `gemini-1.5-flash` or `gemini-1.5-pro` |

**6. Testing Your Configuration:**
```bash
# Test Gemini API key manually
curl "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY"

# Should return list of available models including gemini-1.5-pro and gemini-1.5-flash
```

**7. Monitor Usage:**
- Dashboard: https://aistudio.google.com/
- Check quota usage and rate limits
- Verify API key is active and not revoked

### Anthropic Video Optimization Fails with Billing Errors

**Symptoms:**
- Video optimization fails with "billing error" or "credit" error
- Error message mentions "balance" or "insufficient credits"
- API calls work in Anthropic Workbench but not in app

**Root Cause:**
Previous version used overly broad error detection that matched false positives:
- Checked if error message included "credit", "balance", or "billing"
- Caught messages like "your credit card on file" (unrelated to insufficient credits)
- Blocked legitimate API calls with misleading error messages

**Solution (Fixed in Current Version):**
The error detection now uses specific checks:
1. HTTP status code `402` (Payment Required)
2. Error type `insufficient_quota` from Anthropic API
3. Only shows billing error for actual insufficient credits

**If You Still See Billing Errors:**

**1. Verify Actual Credit Balance:**
- Check console: https://console.anthropic.com/settings/billing
- Ensure you have available credits
- Free trial: $5 credit (expires after 3 months)
- Paid tier: Check current balance

**2. Check API Key Permissions:**
- Ensure API key has workspace-level permissions
- Some features require organization-level keys
- Regenerate key if needed: https://console.anthropic.com/settings/keys

**3. Model Configuration:**
Valid Anthropic models (as of October 2024):
- `claude-3-5-sonnet-20241022` (Latest, recommended)
- `claude-3-5-sonnet-20240620` (Previous version)
- `claude-3-opus-20240229` (Most capable, highest cost)
- `claude-3-sonnet-20240229` (Balanced)
- `claude-3-haiku-20240307` (Fastest, most economical)

**If using invalid model**, app automatically falls back to `claude-3-haiku-20240307`.

**4. Increased Token Limit:**
Current version uses `max_tokens: 2048` (previously 1024) to allow longer descriptions and avoid truncation errors.

**5. Common Anthropic Errors:**

| Error Code | Cause | Solution |
|------------|-------|----------|
| `402` or `insufficient_quota` | Actually out of credits | Add credits in console |
| `401` or `403` | Invalid API key or permissions | Regenerate key |
| `429` | Rate limit (5 requests/minute free tier) | Wait and retry |
| Model not found | Invalid model ID | Update to valid model from list above |

**6. Testing Anthropic API:**
```bash
# Test API key manually
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-3-haiku-20240307",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello"}]
  }'

# Should return a valid response, not a billing error
```

**7. Upgrade to Paid Tier:**
- Free trial credits are limited ($5)
- For production use, add payment method
- Pricing: https://www.anthropic.com/api

**8. Rate Limits:**
- Free tier: 5 requests/minute, 10,000 tokens/minute
- Paid tier: Higher limits based on usage tier
- Monitor usage at: https://console.anthropic.com/settings/limits

### API Key Format Reference

Quick reference for valid API key formats:

| Provider | Prefix | Typical Length | Example Format |
|----------|--------|----------------|----------------|
| OpenAI | `sk-` | 51+ chars | `sk-proj-...` or `sk-...` |
| Gemini | `AIza` | 39 chars | `AIzaSy...` |
| Anthropic | `sk-ant-` | 50+ chars | `sk-ant-api03-...` |
| Mistral | None | 32 chars | UUID format |

## Known Limitations

### Rate Limiting
- **Per-user quotas**: Each user has 60 requests/minute per provider
- **Refill rate**: Token buckets refill at 1 token/second
- **Queue limit**: Maximum 10 queued requests per user per provider
- **Timeout**: Queued requests timeout after 30 seconds

### Usage Tracking
- **Gemini**: No programmatic usage API - must monitor in Google AI Studio
- **Mistral**: No programmatic usage API - must monitor in Mistral Console
- **Anthropic**: Usage API may require organization-level keys; falls back to static limits
- **OpenAI**: Full billing data available but requires API key with billing permissions

### Static Limits Display
- Providers without usage tracking (Gemini, Mistral) show static limits
- Progress bars show 0% for static providers to avoid misleading usage indicators
- "(Static limits - actual usage not tracked)" suffix clarifies the limitation

### Debug Mode

To enable detailed logging for troubleshooting:

1. **Browser Console:**
   - Open DevTools (F12 or Cmd+Option+I)
   - Look for logs prefixed with `[AI-SETTINGS]`, `[GEMINI]`, `[ANTHROPIC]`, etc.
   - These show request/response details and error traces

2. **Server Logs:**
   - Run `npm run dev` in terminal
   - Server logs show API calls, rate limiting, and errors
   - Look for `[PROVIDER-USAGE]` logs for usage fetching
   - Look for `[GEMINI]`, `[ANTHROPIC]` logs for optimization requests

3. **Network Tab:**
   - Open DevTools → Network tab
   - Filter by `/api/ai/`
   - Check request/response payloads for errors

## Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations (see Database Setup section above)

# Start development server
npm run dev
```

## Environment Variables

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for API routes)

## Support

For more detailed setup instructions, see:
- `QUICK_START.md` - Quick start guide with step-by-step instructions
- `setup-database.sql` - Core database schema
- `setup-tables.sql` - Additional tables
- `migrations/create_analytics_usage_final.sql` - Analytics usage table migration

## Understanding API Validation

When you enter an API key and select a provider in Settings, the application validates it to ensure it will work for video optimization.

### How Validation Works

1. **Model Testing**: The validation tests your **exact configuration** - the specific model you've selected (e.g., `gemini-1.5-flash`, `claude-3-5-sonnet-20241022`)
2. **Rate Limiter Check**: Verifies that you have rate limiter tokens available (not exhausted from previous requests)
3. **Realistic Test**: Performs a minimal but realistic optimization test, similar to what happens during actual video optimization
4. **Configuration Match**: Uses your temperature settings and other preferences

### What "Successfully Connected" Means

When you see "Successfully connected to [Provider]":
- ✅ Your API key is valid and authenticated
- ✅ Your selected model is available and accessible
- ✅ Rate limiter has tokens available (can make requests immediately)
- ✅ A real API call was made and succeeded
- ✅ The exact configuration you'll use for video optimization works

This is **not** just a format check - it's a real test of your complete setup.

### Validation Details in Response

The success message shows:
- **Model**: The specific model that was tested (e.g., "gemini-1.5-flash")
- **Tokens Remaining**: How many requests you can make immediately (e.g., "45 requests remaining")
- **Provider**: Which AI provider was validated

Example: "Successfully validated Google Gemini with model 'gemini-1.5-flash'. 45 requests remaining."

## Why Validation Might Pass But Optimization Fails

In rare cases, validation can succeed but optimization still fails. Here's why:

### 1. Rate Limiter Exhausted Between Validation and Use

**Scenario**: You validated successfully (45 tokens available), but before you clicked "AI Generate All", other requests consumed those tokens.

**Solution**:
- Check rate limiter status in Settings (shows real-time availability)
- Wait 60 seconds for rate limit to reset (Gemini)
- Use the "Test Connection" button to re-check before optimization

### 2. Model Changed After Validation

**Scenario**: You validated with `gemini-1.5-flash`, then changed to `gemini-1.5-pro` without re-validating.

**Solution**:
- Always re-validate after changing models
- Click "Test Connection" to verify new model works
- Save settings after successful validation

### 3. Credits Depleted (Paid Providers)

**Scenario**: For Anthropic/OpenAI paid tiers, credits ran out between validation and use.

**Solution**:
- Check billing in provider console
- Add credits to your account
- Re-validate to confirm credits are available

### 4. Network or Provider Issues

**Scenario**: Transient network problems or provider API outage.

**Solution**:
- Wait a few minutes and retry
- Check provider status page
- Try a different provider temporarily

## Best Practices

### For API Key Validation

- ✅ **Always test after entering a new API key** - Click "Test Connection" before saving
- ✅ **Re-validate after changing models** - Different models may have different availability
- ✅ **Check rate limiter status before bulk operations** - Ensure you have enough tokens
- ✅ **Save settings after successful validation** - Lock in your working configuration
- ✅ **Monitor the detailed success message** - Note which model was tested and tokens remaining

### For Avoiding Rate Limits

- ✅ **Space out requests** - Wait 2-3 seconds between optimization requests
- ✅ **Don't spam "AI Generate All"** - Click once and wait for completion
- ✅ **Monitor rate limiter in Settings** - Real-time status shows available capacity
- ✅ **Use built-in retry logic** - The app auto-retries with exponential backoff
- ✅ **For bulk operations** - Process videos one at a time with delays

### For Model Selection

- ✅ **Start with the cheapest model** - Test with `gemini-1.5-flash` or `claude-3-haiku-20240307` first
- ✅ **Test on a single video** - Before bulk processing, verify on one video
- ✅ **Try fallback if model fails** - Error messages suggest alternative models
- ✅ **Check provider docs** - Confirm model availability for your account tier

## Rate Limiter

The application implements per-user rate limiting to prevent abuse and ensure fair resource allocation.

### How It Works

- **Per-User Isolation**: Each user has their own rate limit quota (not shared with others)
- **Per-Provider Tracking**: Rate limits are tracked separately for each AI provider
- **Token Bucket Algorithm**: Requests consume tokens; tokens refill over time
- **Automatic Queuing**: If exhausted, requests queue for up to 5 seconds
- **Smart Retry**: Client auto-retries with exponential backoff (2s, 4s, 8s, 16s)

### Rate Limits by Provider

| Provider | Capacity | Refill Rate | Notes |
|----------|----------|-------------|-------|
| **Gemini** | 60 tokens | 1 token/second | Free tier: 60 requests/minute |
| **OpenAI** | 60 tokens | 1 token/second | Adjust based on your tier |
| **Anthropic** | 5 tokens | 5 tokens/minute (~0.083/sec) | Free tier: very limited |
| **Mistral** | 60 tokens | 1 token/second | Adjust based on your tier |

### When Rate Limits Are Checked

1. **API Key Validation**: Checked before testing your API key
2. **Video Optimization**: Checked before each AI request
3. **Thumbnail Generation**: Checked before image generation
4. **Content Suggestions**: Checked before AI suggestions

### What Happens When Exhausted

1. **Queue Phase** (0-5 seconds):
   - Request is queued
   - Waits for tokens to refill
   - Processes automatically when available

2. **Timeout Phase** (after 5 seconds):
   - Returns 429 error
   - Client shows "Rate Limit Reached" toast
   - Auto-retry scheduled with backoff

3. **Retry Phase**:
   - First retry: 2 seconds
   - Second retry: 4 seconds
   - Third retry: 8 seconds
   - Fourth retry: 16 seconds
   - Fifth retry: Gives up

### Monitoring Rate Limiter

**In Settings UI**:
- Real-time status for each provider
- Available tokens and capacity
- Reset time countdown
- Visual progress indicators

**Via Debug Endpoint** (Development Only):
```bash
# Check status for all providers
curl http://localhost:3000/api/debug/rate-limiter-status

# Check specific provider
curl "http://localhost:3000/api/debug/rate-limiter-status?provider=gemini"
```

**Response Example**:
```json
{
  "providers": {
    "gemini": {
      "available": 45,
      "capacity": 60,
      "percentAvailable": 75,
      "queueLength": 0,
      "resetIn": 15,
      "status": "available"
    }
  }
}
```

## Troubleshooting

### Issue: "AI Generate All" Causes Infinite Retry Loop

**Symptoms:**
- Toast notification shows "Attempt 0 of 5. Retrying in 1 seconds..." (or similar)
- The retry continues indefinitely, never succeeding
- The message persists even after navigating away from the page
- Console shows repeated 429 errors from `/api/ai/optimize`

**Root Cause:**
The rate limiter's token bucket is exhausted from previous requests. Each request consumes 1 token, and tokens refill at 1 token/second. The retry logic waits only 2-5 seconds between attempts, but the rate limiter needs more time to refill tokens. This creates an infinite loop: retry → no tokens → fail → retry.

**Solutions:**

**Immediate Fix (Restart Dev Server):**
1. Stop your Next.js dev server (`Ctrl+C` or `Cmd+C`)
2. Wait 60 seconds (to let the rate limiter reset)
3. Restart the dev server: `npm run dev`
4. Try the AI generation again

**Quick Fix (Reset Rate Limiter via Debug Endpoint):**
1. Open browser console on your app
2. Run: `fetch('/api/debug/reset-rate-limiter', { method: 'POST' }).then(r => r.json()).then(console.log)`
3. You should see: `{ message: 'Rate limiter reset successfully', timestamp: '...' }`
4. Try the AI generation again

**Alternative (Using curl):**
```bash
curl -X POST http://localhost:3000/api/debug/reset-rate-limiter
```

**Check Rate Limiter Status:**
```bash
# Replace USER_ID with your actual user ID from Supabase auth
curl "http://localhost:3000/api/debug/reset-rate-limiter?provider=gemini&userId=USER_ID"
```

**Prevention Tips:**
- Don't click "AI Generate All" multiple times in quick succession
- Wait for the previous request to complete before trying again
- If you hit a rate limit, wait the full countdown before retrying
- During development, consider increasing the rate limiter capacity in `lib/rate-limiter.ts`

**Understanding the Rate Limiter:**
- Each provider has a token bucket (e.g., 60 tokens for Gemini)
- Each API request consumes 1 token
- Tokens refill at a fixed rate (e.g., 1 token/second for Gemini)
- If the bucket is empty, requests are queued
- If the queue times out (5 seconds), a 429 error is returned
- The client's retry logic handles the retry with exponential backoff (starting at 2 seconds)

**Why This Happens During Development:**
During development, you might refresh the page or click buttons multiple times. Each action consumes tokens from your personal bucket. The bucket can be exhausted quickly. In production, this is less likely because users don't refresh as often, and each user has their own isolated rate limit.

**Long-term Solutions:**
- Make the rate limiter configurable via environment variables
- Add a "development mode" that disables or relaxes rate limiting
- Add a UI indicator showing rate limiter status (tokens available, queue length)
- Add a "Clear Rate Limit" button in the settings page for development

**Note:** The debug endpoint (`/api/debug/reset-rate-limiter`) is only available in development mode and will return a 403 error in production for security.

### Issue: "Successfully connected" but optimization doesn't work

**Problem**: Settings page shows "Successfully connected to [Provider]" but video optimization fails with errors.

**Symptoms**:
- Green checkmark and success toast in Settings
- "AI Generate All" button fails with errors
- Error messages about rate limits, models, or API issues
- Confusion about why validation passed but usage fails

**Common Causes**:

1. **Rate Limiter Exhausted Between Validation and Use**
   - Validation passed (had tokens available)
   - Before optimization, tokens were consumed
   - Optimization finds empty token bucket
   
   **Solution**:
   - Check rate limiter status in Settings (real-time display)
   - Wait 60 seconds for Gemini rate limit to reset
   - Use "Test Connection" button to re-check before optimization
   - Monitor the "X requests remaining" counter

2. **Model Configuration Changed After Validation**
   - Validated with one model (e.g., `gemini-1.5-flash`)
   - Changed to different model without re-validating
   - New model may not work or may be unavailable
   
   **Solution**:
   - Always click "Test Connection" after changing models
   - Wait for success message confirming new model works
   - Save settings only after successful validation

3. **API Key Revoked or Credits Depleted**
   - For paid providers (Anthropic, OpenAI paid tier)
   - Credits ran out between validation and usage
   - API key was revoked or expired
   
   **Solution**:
   - Check billing in provider console:
     - Anthropic: https://console.anthropic.com/settings/billing
     - OpenAI: https://platform.openai.com/account/billing
   - Add credits to your account
   - Re-validate to confirm credits are available

4. **Network Issues or Provider Outage**
   - Transient network connectivity problems
   - Provider API experiencing downtime
   - Regional routing issues
   
   **Solution**:
   - Wait a few minutes and retry
   - Check provider status pages
   - Try from a different network
   - Use a different provider temporarily

**Verification Steps**:
1. Open Settings → AI Configuration
2. Note the "X requests remaining" counter
3. Click "Test Connection" button
4. Wait for detailed success message
5. Immediately try optimization (don't change settings)
6. If it fails, check error message for specific cause

### Issue: Usage shows "0 tokens remaining" but I have quota

**Problem**: Anthropic shows "0 / 10,000" or Mistral shows "0 / 50,000" tokens, looks like no quota left.

**Cause**: These providers don't offer programmatic usage tracking. The app can't fetch actual usage from their APIs. The "0" displayed means "usage not tracked", not "no quota remaining".

**Understanding the Display**:
- **"0 / 10,000"** = "Usage not tracked / Total available"
- **NOT** "0 remaining / 10,000 total"
- The denominator shows your static quota limit
- The numerator shows it's not tracked (appears as 0)

**This is Normal**:
- Anthropic API doesn't provide usage endpoints
- Mistral API doesn't provide usage endpoints
- Your API key still works fine
- You still have your full quota
- The app just can't display actual consumption

**Monitor Actual Usage**:
- **Anthropic**: https://console.anthropic.com/settings/billing
  - View detailed usage and billing
  - See current credit balance
  - Monitor costs in real-time
  
- **Mistral**: https://console.mistral.ai/usage
  - View API usage statistics
  - Check remaining credits
  - Monitor request counts

**Why Other Providers Differ**:
- **OpenAI**: Provides usage API, shows real balance
- **Gemini**: No usage API, shows rate limits only

### Issue: Gemini shows "0 requests" in usage

**Problem**: Gemini usage section shows "0 requests" even after making multiple API calls.

**Cause**: Gemini API doesn't provide usage tracking endpoints. The Google AI Studio API is focused on generation, not usage reporting.

**This is Normal**:
- Gemini free tier doesn't track request counts via API
- The app can't fetch actual usage programmatically
- "0 requests" means "usage not tracked"
- Your API key and quota still work fine

**What's Actually Shown**:
- **Rate Limit**: "60 requests/minute" (actual limit)
- **Requests Today**: "0 requests" (not tracked)
- **Tokens**: Not applicable for Gemini

**Monitor Actual Usage**:
Visit **Google AI Studio**: https://aistudio.google.com/
- View your API usage
- Check quota consumption
- Monitor request history
- See rate limit status

**Why This Happens**:
- Google AI Studio API is simpler than OpenAI's
- No `/v1/usage` or similar endpoint
- Focus is on content generation, not billing/usage
- Free tier users don't need detailed tracking

**Rate Limiter Still Works**:
- App tracks requests client-side (per-user)
- Rate limiter prevents exceeding 60 req/min
- You'll see "Rate Limit Reached" if exhausted
- This protects you from hitting Google's limits

