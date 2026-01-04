# Complete Error Chain Analysis

## What's Happening

When you try to open a video or connect your YouTube channel, here's the error chain:

```
User clicks "Connect YouTube Channel"
         ↓
POST /api/youtube/connect
         ↓
Checks: if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET)
         ↓
❌ Both are missing → Returns 500 "Google OAuth credentials not configured"
         ↓
User sees blank error page
```

## Detailed Flow (After You Fix It)

Once you add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env.local`:

### 1. Initial OAuth Flow
```
User clicks "Connect YouTube Channel"
         ↓
POST /api/youtube/connect ✅ (credentials exist now)
         ↓
Generates OAuth consent URL
         ↓
Redirects to: https://accounts.google.com/o/oauth2/v2/auth?...
         ↓
User logs in to Google
         ↓
Google redirects with authorization code
         ↓
POST /api/youtube/auth-callback
         ↓
Exchanges code for tokens:
  - access_token (temporary)
  - refresh_token (permanent)
  - expires_in (3600 seconds)
         ↓
Stores tokens in Supabase database
         ↓
User's YouTube channel is now connected ✅
```

### 2. Getting Video Details
```
User navigates to: /videos/dQw4w9WgXcQ
         ↓
GET /api/youtube/videos/[videoId]
         ↓
Fetches channel from database with access_token
         ↓
Calls YouTube API with Bearer token
         ↓
⏰ If token is expired (> 3600 seconds old):
         ↓
Calls POST /api/youtube/auth/refresh
         ↓
Sends refresh_token to Google
         ↓
Google returns new access_token ✅
         ↓
Updates database with new token
         ↓
Calls YouTube API with NEW access_token ✅
         ↓
Fetches video metadata
         ↓
Returns data to frontend
         ↓
Video details page loads ✅
```

## Current Status

```
❌ User can't connect YouTube (500 error)
❌ Video pages won't load (501 error)
❌ Token refresh won't work (500 error)
```

## After Fix

```
✅ User can connect YouTube
✅ Video pages load successfully
✅ Token refresh works automatically
✅ All optimization features work
```

## The Missing Piece

Your `.env.local` currently has:
- ✅ Supabase configuration
- ✅ PayPal configuration
- ❌ **MISSING: Google OAuth configuration**

## Files Involved in OAuth Flow

| File | Purpose | Status |
|------|---------|--------|
| `/app/api/youtube/connect/route.ts` | Generates OAuth URL | ❌ Returns 500 (missing env vars) |
| `/app/api/youtube/auth-callback/route.ts` | Exchanges code for tokens | ❌ Returns 500 (missing env vars) |
| `/app/api/youtube/auth/refresh/route.ts` | Refreshes expired tokens | ❌ Returns 500 (missing env vars) |
| `/contexts/youtube-channel-context.tsx` | Client-side token refresh | ✅ Code is correct |
| `/app/api/youtube/videos/[videoId]/route.ts` | Fetches video data | ❌ Can't work (refresh broken) |

## Environment Variables Needed

Add these to `.env.local`:

```dotenv
# Google OAuth Configuration
GOOGLE_CLIENT_ID=<your_client_id_from_google>
GOOGLE_CLIENT_SECRET=<your_client_secret_from_google>
```

That's literally all you need! No other changes required.

## How to Get Them

1. Visit: https://console.cloud.google.com/
2. Create/select project
3. Enable YouTube Data API v3
4. Create OAuth 2.0 Web Application credentials
5. Set authorized redirect URIs to: `http://localhost:3000/connect-channel/callback`
6. Copy Client ID and Client Secret
7. Paste into `.env.local`
8. Restart dev server
9. ✅ Everything works!

## Testing Commands

After adding credentials and restarting server:

```bash
# Check OAuth status
curl http://localhost:3000/api/debug/oauth-status | jq .

# Test connect endpoint
curl -X POST http://localhost:3000/api/youtube/connect \
  -H "Content-Type: application/json" \
  -d '{}' | jq .

# Should no longer return 500 errors
```

---

See `GOOGLE_OAUTH_SETUP.md` for complete step-by-step instructions.
