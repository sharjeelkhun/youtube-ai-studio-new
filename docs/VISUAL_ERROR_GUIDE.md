# Visual Guide: YouTube OAuth Flow

## Problem Visualization

```
┌─────────────────────────────────────────────────────────────────┐
│                    Current State (BROKEN)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User clicks "Connect YouTube Channel"                         │
│           ↓                                                     │
│  POST /api/youtube/connect                                     │
│           ↓                                                     │
│  Check: if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET)        │
│           ↓                                                     │
│  ❌ BOTH MISSING                                               │
│           ↓                                                     │
│  Return 500 "Google OAuth credentials not configured"          │
│           ↓                                                     │
│  ❌ User sees blank error                                      │
│  ❌ Video pages won't load                                     │
│  ❌ Optimization features disabled                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Solution Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              Step 1: Get Google Credentials                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Go to https://console.cloud.google.com/                   │
│  2. Create project: "YouTube AI Studio"                        │
│  3. Enable: YouTube Data API v3                                │
│  4. Create OAuth 2.0 Web Application credentials              │
│  5. Add authorized URI: http://localhost:3000/connect...       │
│  6. Get: Client ID + Client Secret                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│             Step 2: Add to .env.local (FIXED)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  GOOGLE_CLIENT_ID=your_client_id_here                          │
│  GOOGLE_CLIENT_SECRET=your_client_secret_here                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│             Step 3: Restart Dev Server                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  npm run dev                                                    │
│  (Server reads new env vars)                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                Result (FIXED)                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User clicks "Connect YouTube Channel"                         │
│           ↓                                                     │
│  POST /api/youtube/connect ✅                                  │
│           ↓                                                     │
│  Check: if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET)        │
│           ↓                                                     │
│  ✅ BOTH PRESENT                                               │
│           ↓                                                     │
│  Generate OAuth URL                                            │
│           ↓                                                     │
│  Redirect to Google Login                                      │
│           ↓                                                     │
│  User logs in ✅                                               │
│           ↓                                                     │
│  POST /api/youtube/auth-callback ✅                            │
│           ↓                                                     │
│  Exchange code for tokens ✅                                   │
│           ↓                                                     │
│  Store in Supabase ✅                                          │
│           ↓                                                     │
│  ✅ Channel connected!                                         │
│  ✅ Video pages load                                           │
│  ✅ Optimization features work                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## OAuth Token Flow (After Initial Connection)

```
┌─────────────────────────────────────────────────────────────────┐
│                  Token Refresh Flow                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  GET /api/youtube/videos/[videoId]                            │
│           ↓                                                     │
│  Get channel data from Supabase (includes access_token)        │
│           ↓                                                     │
│  Call YouTube API with Bearer access_token                     │
│           ↓                                                     │
│  ┌─ Check: Is token expired?                                   │
│  │                                                              │
│  ├─→ YES (> 3600 seconds old)                                 │
│  │        ↓                                                     │
│  │   POST /api/youtube/auth/refresh ✅ (NOW WORKS)            │
│  │        ↓                                                     │
│  │   Send: { refresh_token }                                   │
│  │        ↓                                                     │
│  │   Get: { access_token, expires_in, refresh_token }         │
│  │        ↓                                                     │
│  │   Update Supabase with new token                            │
│  │        ↓                                                     │
│  │   Retry YouTube API call ✅                                │
│  │                                                              │
│  └─→ NO (fresh token)                                          │
│           ↓                                                     │
│  Call YouTube API immediately ✅                               │
│           ↓                                                     │
│  Return video data to frontend ✅                              │
│           ↓                                                     │
│  Video page loads with all data ✅                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Environment Variables Status

### Current (❌ BROKEN)
```
.env.local
├── NEXT_PUBLIC_SUPABASE_URL        ✅
├── NEXT_PUBLIC_SUPABASE_ANON_KEY   ✅
├── SUPABASE_SERVICE_ROLE_KEY       ✅
├── NEXT_PUBLIC_PAYPAL_CLIENT_ID    ✅
├── PAYPAL_CLIENT_SECRET            ✅
├── GOOGLE_CLIENT_ID                ❌ MISSING ← THIS IS THE PROBLEM
└── GOOGLE_CLIENT_SECRET            ❌ MISSING ← THIS IS THE PROBLEM
```

### After Fix (✅ WORKING)
```
.env.local
├── NEXT_PUBLIC_SUPABASE_URL        ✅
├── NEXT_PUBLIC_SUPABASE_ANON_KEY   ✅
├── SUPABASE_SERVICE_ROLE_KEY       ✅
├── NEXT_PUBLIC_PAYPAL_CLIENT_ID    ✅
├── PAYPAL_CLIENT_SECRET            ✅
├── GOOGLE_CLIENT_ID                ✅ SET
└── GOOGLE_CLIENT_SECRET            ✅ SET
```

## Dependency Chain

```
connect-channel UI Button
        ↓
        └─→ /api/youtube/connect/route.ts
                ↓
                └─→ Needs: GOOGLE_CLIENT_ID ❌ (MISSING)
                └─→ Needs: GOOGLE_CLIENT_SECRET ❌ (MISSING)
                        ↓
                    Returns 500 Error
                        ↓
                    ❌ Can't generate OAuth URL
                    ❌ Can't redirect to Google
                    ❌ User can't log in

video-details page
        ↓
        └─→ /api/youtube/videos/[videoId]/route.ts
                ↓
                └─→ Token expired?
                        ↓ YES
                        └─→ /api/youtube/auth/refresh/route.ts
                                ↓
                                └─→ Needs: GOOGLE_CLIENT_ID ❌ (MISSING)
                                └─→ Needs: GOOGLE_CLIENT_SECRET ❌ (MISSING)
                                        ↓
                                    Returns 500 Error
                                        ↓
                                    ❌ Can't refresh token
                                    ❌ YouTube API returns 401
                                    ❌ Can't fetch video data
                                    ❌ Video page won't load
```

## The Fix (What You Need to Do)

```
1. Get credentials from Google Cloud Console
   ↓
2. Add to .env.local:
   GOOGLE_CLIENT_ID=xxxxx
   GOOGLE_CLIENT_SECRET=yyyyy
   ↓
3. Restart dev server
   ↓
4. ✅ All endpoints work!
```

That's literally it! 🎉

---

For detailed step-by-step guide, see: `GOOGLE_OAUTH_SETUP.md`
