# UI Display Guide - What Users Will See

## OpenAI Settings Tab

```
┌─────────────────────────────────────────────┐
│ Usage & Limits                              │
│ Real-time usage from your AI provider       │
├─────────────────────────────────────────────┤
│                                             │
│ 💳 BILLING INFORMATION                      │
│ ────────────────────────────────────────────│
│ Account Balance:        $15.50 USD          │
│ This Month's Usage:     $12.35              │
│                                             │
│ Last updated: 10:30:45 AM                   │
│ [Retry button]                              │
│                                             │
│ ℹ️ Your OpenAI API key is connected and     │
│    ready to use.                            │
└─────────────────────────────────────────────┘
```

**Key Points:**
- Shows exact balance remaining
- Shows how much already spent this month
- Updates every 5 minutes automatically
- Clear billing information to prevent surprise charges

---

## Google Gemini Settings Tab

```
┌─────────────────────────────────────────────┐
│ Usage & Limits                              │
│ Real-time usage from your AI provider       │
├─────────────────────────────────────────────┤
│                                             │
│ ⚡ RATE LIMITS                              │
│ ────────────────────────────────────────────│
│ Requests per Minute:    60                  │
│ Tokens per Minute:      1,000,000           │
│                                             │
│ 📊 FREE TIER QUOTA                          │
│ ────────────────────────────────────────────│
│ Tokens Used: 0 / 60                         │
│ ┌─────────────────────────────────────────┐ │
│ │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ │ (0%)
│ └─────────────────────────────────────────┘ │
│ Days Until Reset: 0                         │
│                                             │
│ Last updated: 10:30:45 AM                   │
│ [Retry button]                              │
│                                             │
│ ℹ️ Google Gemini offers a generous free     │
│    tier for its API.                        │
└─────────────────────────────────────────────┘
```

**Key Points:**
- Shows free tier rate limits
- Visual progress bar for quota usage
- Shows how many days/hours until reset
- Test call validates API key is working

---

## Anthropic Settings Tab

```
┌─────────────────────────────────────────────┐
│ Usage & Limits                              │
│ Real-time usage from your AI provider       │
├─────────────────────────────────────────────┤
│                                             │
│ ⚡ RATE LIMITS                              │
│ ────────────────────────────────────────────│
│ Requests per Minute:    5                   │
│ Tokens per Minute:      10,000              │
│                                             │
│ 📊 FREE TIER QUOTA                          │
│ ────────────────────────────────────────────│
│ Days Until Reset: 0                         │
│                                             │
│ Last updated: 10:30:45 AM                   │
│ [Retry button]                              │
│                                             │
│ ℹ️ Anthropic API is a paid service. Please  │
│    check your billing details.              │
└─────────────────────────────────────────────┘
```

**Key Points:**
- Conservative rate limits (5 req/min)
- Token limits for free tier
- Reset time indicator
- Links to provider documentation

---

## Mistral AI Settings Tab

```
┌─────────────────────────────────────────────┐
│ Usage & Limits                              │
│ Real-time usage from your AI provider       │
├─────────────────────────────────────────────┤
│                                             │
│ ⚡ RATE LIMITS                              │
│ ────────────────────────────────────────────│
│ Requests per Minute:    5                   │
│ Tokens per Minute:      50,000              │
│                                             │
│ 📊 FREE TIER QUOTA                          │
│ ────────────────────────────────────────────│
│ Days Until Reset: 1                         │
│                                             │
│ Last updated: 10:30:45 AM                   │
│ [Retry button]                              │
│                                             │
│ ℹ️ Mistral AI offers a free tier for its    │
│    API.                                     │
└─────────────────────────────────────────────┘
```

**Key Points:**
- Shows Mistral-specific rate limits
- More generous token limits than Anthropic
- 24-hour reset cycle
- Ready-to-use API information

---

## Error States

### No API Key Configured
```
┌─────────────────────────────────────────────┐
│ Usage & Limits                              │
├─────────────────────────────────────────────┤
│                                             │
│ ℹ️ Not Configured                           │
│                                             │
│ Please add your openai API key above to     │
│ see usage information.                      │
│                                             │
└─────────────────────────────────────────────┘
```

### Invalid API Key
```
┌─────────────────────────────────────────────┐
│ Usage & Limits                              │
├─────────────────────────────────────────────┤
│                                             │
│ ❌ Error                                    │
│                                             │
│ Invalid API key                             │
│                                             │
│ [Retry button]                              │
│                                             │
└─────────────────────────────────────────────┘
```

### Rate Limit Exceeded
```
┌─────────────────────────────────────────────┐
│ Usage & Limits                              │
├─────────────────────────────────────────────┤
│                                             │
│ ❌ Error                                    │
│                                             │
│ Rate limit exceeded. Free tier limits:      │
│ 60 requests per minute                      │
│                                             │
│ 📊 Days Until Reset: 0                      │
│                                             │
│ [Retry button]                              │
│                                             │
└─────────────────────────────────────────────┘
```

### Loading State
```
┌─────────────────────────────────────────────┐
│ Usage & Limits                              │
├─────────────────────────────────────────────┤
│                                             │
│              ⏳ Loading...                   │
│         (spinning animation)                │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Billing Alert (if balance insufficient)

```
┌─────────────────────────────────────────────┐
│                                             │
│ ⚠️  BILLING ISSUE DETECTED                  │
│                                             │
│ We encountered a billing-related error      │
│ with the AI provider: openai. Please        │
│ check your plan and billing details with    │
│ the provider to ensure uninterrupted        │
│ service.                                    │
│                                             │
│ [Dismiss button]                            │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Auto-Refresh Behavior

**Timeline:**
```
10:30:00 AM - User opens Settings
            ↓ Hook triggers
            ↓ API call starts (1-2 sec)
10:30:02 AM - Data displays with "Last updated: 10:30:02 AM"
            ↓ (auto-refresh set)
10:35:02 AM - Background refresh (no UI interruption)
            ↓ Timestamp updates to 10:35:02 AM
10:40:02 AM - Another background refresh
            ↓ (continues every 5 minutes)
```

**User Experience:**
- ✅ Data loads quickly (1-2 seconds)
- ✅ Timestamp shows when data was fetched
- ✅ Refreshes automatically every 5 minutes
- ✅ No page reload or loading spinner during refresh
- ✅ Manual [Retry] button available if needed

---

## Comparison: Before vs After

### BEFORE (Using Database)
```
API Calls
0 / 1000
Resets in 13 days

Content Generation
0 / 50
Resets in 13 days
```
❌ Always shows 0  
❌ Generic limits not based on actual provider  
❌ No billing info  
❌ No real data  

### AFTER (Using Real Provider APIs)

**OpenAI:**
```
💳 BILLING INFORMATION
Account Balance: $15.50 USD
This Month's Usage: $12.35
```
✅ Actual balance from OpenAI account  
✅ Real spending data  
✅ Prevents accidental overspending  

**Gemini:**
```
⚡ RATE LIMITS
Requests per Minute: 60
Tokens per Minute: 1,000,000

📊 FREE TIER QUOTA
Tokens Used: 0 / 60
[Progress bar showing 0%]
Days Until Reset: 0
```
✅ Real free tier limits  
✅ Accurate quota information  
✅ Reset countdown  

---

## What Happens When User Changes Provider

1. User clicks different provider radio button
2. Selected provider changes (instantly)
3. **Loading spinner appears** for ~1-2 seconds
4. New provider's real data loads
5. Billing/quota info updates for that provider
6. Timestamp shows new fetch time

**Smooth experience with no page reload!**
