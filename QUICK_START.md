# Quick Start Guide

## Prerequisites: Database Setup (Core Tables Only)

**IMPORTANT:** Before running the application, you must set up the core database tables. The application requires tables for profiles, YouTube channels, videos, analytics data, and content ideas.

### 3. Set Up Database Tables (Required)

The application requires several core database tables to function.

#### Method 1: Run the consolidated setup script (RECOMMENDED for new setups)

1. Open your Supabase project dashboard at `https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]`
2. Navigate to **SQL Editor** in the left sidebar
3. Click **"New Query"**
4. Copy and paste the entire contents of `setup-database.sql`
5. Click **"Run"** or press `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows/Linux)
6. Verify success by checking the **Tables** view in Supabase

**What this creates:**
- ✅ `profiles` - User profile information **(REQUIRED)**
- ✅ `youtube_channels` - Connected YouTube channel data **(REQUIRED)**
- ✅ `videos` - Video metadata and status **(REQUIRED)**
- ✅ `analytics_data` - YouTube analytics data **(REQUIRED)**
- ✅ `content_ideas` - AI-generated content ideas **(REQUIRED)**
- ⚠️ `analytics_usage` - AI provider usage tracking **(OPTIONAL - for historical analytics only)**

**Note:** The `analytics_usage` table is optional. The Settings page fetches usage directly from provider APIs and doesn't require this table. Only create it if you want to track historical usage for analytics purposes.

#### Method 2: Run individual migrations (for existing setups)

If you already have some tables, run only the missing migrations:

1. Open Supabase **SQL Editor**
2. Run each migration file as needed:
   - `setup-database.sql` (includes all tables)
   - `setup-tables.sql` (if needed)
   - `migrations/create_analytics_usage_final.sql` (OPTIONAL - only if you want historical analytics tracking)
3. Verify each table exists after running

#### Method 3: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link your project
supabase link --project-ref your-project-ref

# Run all migrations
supabase db push
```

This will apply all pending migrations from the `migrations/` directory.

#### Verification (Core Tables Only)

Run this query in Supabase SQL Editor to check required tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'youtube_channels', 'videos', 'analytics_data', 'content_ideas');
```

**Expected Result:** You should see all 5 core tables listed. The `analytics_usage` table is optional.

#### Common Issues During Setup

**Issue: "Table does not exist" errors in logs**
- **Fix**: Run the missing migration file via Supabase dashboard

**Issue: Application won't load or shows database errors**
- **Fix**: Ensure all 5 core tables are created (profiles, youtube_channels, videos, analytics_data, content_ideas)

**Issue: Migrations fail with permission errors**
- **Fix**: Ensure you have admin access to your Supabase project

**Note:** This is a **one-time setup step**. Once the tables are created, you don't need to run migrations again unless there are schema updates.

### Why Manual Migration is Required

- Next.js cannot execute DDL (Data Definition Language) statements directly
- Supabase's PostgREST API doesn't allow arbitrary SQL execution for security reasons
- The `/api/db-setup` endpoint can only **check** if tables exist, not create them
- This ensures database security and follows Supabase best practices

---

## What You Now Have

A real-time AI usage dashboard that fetches actual data directly from each provider:

```
✅ OpenAI     → Live billing balance + monthly spending (from API)
⚠️ Gemini     → Static rate limits (no usage API available - monitor in console)
⚠️ Anthropic  → Attempts API fetch, falls back to static limits
⚠️ Mistral    → Static limits (no usage API available - monitor in console)
```

For providers without usage APIs (Gemini, Mistral), the Settings page will show a message with a link to monitor usage in their respective consoles.

## To See It In Action

### Step 1: Go to Settings
- Click on your account/settings area
- Look for "AI Provider" card

### Step 2: Add Your API Key
Example for OpenAI:
```
1. Click on OpenAI provider option
2. Paste your API key in the field
   (Find keys at: https://platform.openai.com/api-keys)
3. Click "Save API Settings"
```

### Step 3: View Usage
- Look at the "Usage & Limits" section below
- You should see real data loading (1-2 seconds)
- For OpenAI: Your actual account balance
- For Gemini/Anthropic/Mistral: Your rate limits

### Step 4: Check Timestamp
- Look for "Last updated: 10:30:45 AM"
- This confirms data came from the provider
- Auto-refreshes every 5 minutes

---

## What You Should See

### If Using OpenAI:
```
💳 BILLING INFORMATION
┌─────────────────────────────────┐
│ Account Balance:   $15.50 USD   │
│ This Month's Usage: $12.35      │
└─────────────────────────────────┘
```

### If Using Gemini/Anthropic/Mistral:
```
⚡ RATE LIMITS
┌─────────────────────────────────┐
│ Requests per Minute: 60         │
│ Tokens per Minute: 1,000,000    │
└─────────────────────────────────┘

📊 FREE TIER QUOTA
┌─────────────────────────────────┐
│ Tokens Used: 0 / 60             │
│ [████░░░░░░░░░░░░░░] 0%        │
│ Days Until Reset: 0             │
└─────────────────────────────────┘
```

---

## Troubleshooting

### "Usage tracking not available" message for Gemini or Mistral

**This is expected behavior.**
- Gemini and Mistral APIs do not provide programmatic usage tracking
- You must monitor usage in their respective consoles:
  - **Gemini:** https://aistudio.google.com/
  - **Mistral:** https://console.mistral.ai/usage
- The Settings page shows static rate limits and links to the consoles

### Invalid API key errors

**Symptoms:**
- Settings page shows "Invalid API key" error
- Provider shows "Not Configured" status

**Solution:**
1. Verify your API key in the provider's console
2. Ensure the key has the correct permissions
3. Check you're using the correct key type (user vs organization)
4. For Anthropic: Verify you have sufficient credits

### Problem: Still Shows Loading
**Solution:** Wait 1-2 seconds, page may still be fetching data from provider APIs

### Problem: Shows Error Message
**Solution:** 
1. Check your API key is valid in the provider's console
2. Check you're logged in to the application
3. Click [Retry] button to refresh

### Problem: Shows "Not Configured"
**Solution:** 
1. Enter your API key in the field above
2. Click "Save API Settings"
3. Data should appear in 1-2 seconds

### Problem: Different Data Than Expected
**Solution:** 
- Provider APIs update in real-time (30-second cache)
- OpenAI: Billing data is live from OpenAI API
- Gemini/Mistral: Shows static limits (monitor in their consoles)
- Click [Retry] to refresh immediately

---

## Common Setup Errors

### Error: "relation 'profiles' does not exist" or other table errors
- **Cause:** Core database tables not created
- **Fix:** Run `setup-database.sql` in Supabase dashboard to create all required tables

### Error: RLS policy violations
- **Cause:** Row Level Security policies not set up
- **Fix:** Ensure `setup-database.sql` was run completely

### Error: uuid_generate_v4() function not found
- **Cause:** PostgreSQL UUID extension not enabled
- **Fix:** Run `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";` in SQL Editor
- **Note:** The `setup-database.sql` script automatically enables this extension

---

## Key Features

✅ **Real-Time Data** - Fetches from actual provider APIs  
✅ **Auto-Refresh** - Updates every 30 seconds (5 minutes for setup errors)  
✅ **Fast Loading** - Shows data in 1-2 seconds  
✅ **Error Handling** - Clear messages if something goes wrong  
✅ **Graceful Degradation** - Works even if database tables are missing (with warnings)  
✅ **No API Key Exposure** - Keys stay secure on backend  
✅ **Easy Switching** - Switch providers, data updates instantly  

---

## Provider-Specific Notes

### OpenAI ($)
- Shows your account balance
- Shows how much you've spent this month
- Helps you track billing
- **Best for:** Paid users who need cost tracking

### Gemini (Free)
- Shows free tier rate limits
- 60 requests per minute
- 1M tokens per minute
- Free tier has generous limits
- **Best for:** Free tier users

### Anthropic (Free)  
- Shows free tier rate limits
- 5 requests per minute (more limited)
- ~10K tokens per minute
- Good for testing
- **Best for:** Free tier testing

### Mistral (Free)
- Shows free tier rate limits
- 5 requests per minute
- 50K tokens per minute (best free tier)
- Good balance of limits
- **Best for:** Free tier users wanting good limits

---

## How It Works (Technical Overview)

```
1. You open Settings
        ↓
2. Frontend requests: GET /api/ai/provider-usage?provider=openai
        ↓
3. Backend (secure):
   - Checks you're logged in ✓
   - Gets your stored API key ✓
   - Calls the actual provider API ✓
   - Returns real data ✓
        ↓
4. Frontend displays:
   - Real billing info (OpenAI)
   - Real rate limits (all)
   - Timestamp of fetch
   - Auto-refresh timer (5 min)
        ↓
5. You see actual usage data!
```

**Security:** ✅ Your API keys never go to browser, only stored on backend

---

## Common Questions

**Q: Why does it take 1-2 seconds to load?**  
A: We're making a real API call to each provider to get live data. This is more accurate than database records.

**Q: Does it automatically refresh?**  
A: Yes! Every 5 minutes in the background. The "Last updated" timestamp will change.

**Q: Is my API key safe?**  
A: Yes, 100% safe. Keys are stored on our secure backend, never sent to your browser.

**Q: Can I see other users' data?**  
A: No. You only see data for your own API keys.

**Q: What if the provider is down?**  
A: You'll see a clear error message. Click [Retry] when the provider is back.

**Q: Can I manually refresh?**  
A: Yes, click the [Retry] button anytime.

---

## Next Steps

1. ✅ Add your API keys to each provider
2. ✅ Check Settings to see real usage
3. ✅ Set up notifications (optional future feature)
4. ✅ Monitor your quota/billing regularly

---

## Need Help?

- Check the error message (usually tells you what's wrong)
- Try clicking [Retry]
- Verify your API key is valid at the provider's website
- Check you're logged in to the app

---

## That's It! 🎉

You now have real-time AI provider usage tracking. No more fake numbers, just real data from your actual API keys!
