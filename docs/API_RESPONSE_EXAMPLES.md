# Example API Responses

## OpenAI Response (Paid Service)
```json
{
  "provider": "openai",
  "configured": true,
  "billing": {
    "balance": 15.50,
    "costThisMonth": 12.35,
    "currency": "USD"
  },
  "lastChecked": "2025-10-18T10:30:00.000Z"
}
```

**What it shows to user:**
- 💳 Account Balance: $15.50 USD
- 💳 This Month's Usage: $12.35

---

## Google Gemini Response (Free Tier)
```json
{
  "provider": "gemini",
  "configured": true,
  "quota": {
    "remainingTokens": 60,
    "totalTokens": 60,
    "resetDate": "2025-10-18T11:30:00.000Z",
    "daysUntilReset": 0
  },
  "rateLimit": {
    "requestsPerMinute": 60,
    "tokensPerMinute": 1000000
  },
  "lastChecked": "2025-10-18T10:30:00.000Z"
}
```

**What it shows to user:**
- ⚡ Requests per Minute: 60
- ⚡ Tokens per Minute: 1,000,000
- 📊 Free Tier Quota: Shows progress bar (format: used/total)
- 📊 Days Until Reset: 0 (resets in ~1 hour)

---

## Anthropic Response (Free Tier)
```json
{
  "provider": "anthropic",
  "configured": true,
  "rateLimit": {
    "requestsPerMinute": 5,
    "tokensPerMinute": 10000,
    "requestsRemaining": 4
  },
  "quota": {
    "resetDate": "2025-10-18T10:31:00.000Z",
    "daysUntilReset": 0
  },
  "lastChecked": "2025-10-18T10:30:00.000Z"
}
```

**What it shows to user:**
- ⚡ Requests per Minute: 5
- ⚡ Tokens per Minute: 10,000
- 📊 Days Until Reset: 0

---

## Mistral Response (Free Tier)
```json
{
  "provider": "mistral",
  "configured": true,
  "rateLimit": {
    "requestsPerMinute": 5,
    "tokensPerMinute": 50000
  },
  "quota": {
    "resetDate": "2025-10-19T10:30:00.000Z",
    "daysUntilReset": 1
  },
  "lastChecked": "2025-10-18T10:30:00.000Z"
}
```

**What it shows to user:**
- ⚡ Requests per Minute: 5
- ⚡ Tokens per Minute: 50,000
- 📊 Days Until Reset: 1

---

## Error Response - Invalid API Key
```json
{
  "provider": "openai",
  "configured": false,
  "error": "Invalid API key"
}
```

**UI shows:**
- ❌ Error: Invalid API key
- [Retry button available]

---

## Error Response - Rate Limited
```json
{
  "provider": "gemini",
  "configured": true,
  "error": "Rate limit exceeded. Free tier limits: 60 requests per minute",
  "quota": {
    "resetDate": "2025-10-18T10:31:00.000Z",
    "daysUntilReset": 0
  }
}
```

**UI shows:**
- ❌ Error: Rate limit exceeded...
- 📊 Days Until Reset: 0

---

## Not Configured Response
```json
{
  "provider": "anthropic",
  "configured": false,
  "error": "API key not configured"
}
```

**UI shows:**
- ℹ️ Not Configured
- "Please add your anthropic API key above to see usage information."

---

## All Providers Response
When calling `/api/ai/provider-usage` without a provider parameter:

```json
{
  "openai": {
    "provider": "openai",
    "configured": true,
    "billing": { "balance": 15.50, "costThisMonth": 12.35, "currency": "USD" },
    "lastChecked": "2025-10-18T10:30:00.000Z"
  },
  "gemini": {
    "provider": "gemini",
    "configured": true,
    "rateLimit": { "requestsPerMinute": 60, "tokensPerMinute": 1000000 },
    "lastChecked": "2025-10-18T10:30:00.000Z"
  },
  "anthropic": {
    "provider": "anthropic",
    "configured": false,
    "error": "API key not configured"
  },
  "mistral": {
    "provider": "mistral",
    "configured": true,
    "rateLimit": { "requestsPerMinute": 5, "tokensPerMinute": 50000 },
    "lastChecked": "2025-10-18T10:30:00.000Z"
  }
}
```

---

## How Data Gets Updated

1. **User opens Settings → AI Provider**
2. `useProviderUsage()` hook triggers
3. Hook calls `/api/ai/provider-usage?provider=selected`
4. Backend queries the actual provider API:
   - OpenAI: Calls `https://api.openai.com/v1/billing/subscription`
   - Gemini: Makes test call to `generativelanguage.googleapis.com`
   - Anthropic: Makes test call to Claude API
   - Mistral: Makes test call to Mistral API
5. Response returned to frontend within 1-2 seconds
6. UI renders real data with last updated timestamp
7. **Auto-refresh every 5 minutes** in background

---

## Frontend Display Logic

```
IF provider not configured:
  → Show "Not Configured" message
ELSE IF error exists:
  → Show error message with retry button
ELSE IF OpenAI:
  → Show billing info (balance, monthly cost)
ELSE IF Gemini/Anthropic/Mistral:
  → Show rate limits
  → Show quota progress (if available)
  → Show days until reset
ELSE:
  → Show generic "API Key Configured" message

Show last checked time below all content
```
