# Quick Reference Card

## The Problem
```
❌ POST /api/youtube/auth/refresh         → 500 Error
❌ GET /api/youtube/videos/[videoId]      → 500 Error
❌ POST /api/youtube/auth-callback        → 500 Error
❌ POST /api/youtube/connect              → 500 Error
```

**Root Cause:** Missing `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`

## The Solution
```
1. Get credentials from: https://console.cloud.google.com/
2. Add to .env.local:
   GOOGLE_CLIENT_ID=xxxxx
   GOOGLE_CLIENT_SECRET=yyyyy
3. Restart dev server: npm run dev
```

## Verification
```bash
# Option 1: Check via endpoint
curl http://localhost:3000/api/debug/oauth-status

# Option 2: Run script
./check-oauth-setup.sh

# Expected output when fixed:
✅ GOOGLE_CLIENT_ID is set
✅ GOOGLE_CLIENT_SECRET is set
```

## Google OAuth Setup (Detailed)

| Step | Action | Time |
|------|--------|------|
| 1 | Go to console.cloud.google.com | 30s |
| 2 | Create new project | 30s |
| 3 | Enable YouTube Data API v3 | 30s |
| 4 | Create OAuth 2.0 credentials | 60s |
| 5 | Copy Client ID & Secret | 30s |
| 6 | Add to .env.local | 60s |
| 7 | Restart dev server | 60s |
| **Total** | | **~5 min** |

## .env.local Format

**Current (Broken):**
```dotenv
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_PAYPAL_CLIENT_ID=...
# ❌ Missing Google OAuth
```

**Fixed:**
```dotenv
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_PAYPAL_CLIENT_ID=...
# ✅ Added:
GOOGLE_CLIENT_ID=ABCDEFGHIJKLMNOPQRSTUVWxyz...
GOOGLE_CLIENT_SECRET=ABCDEFGHIJKLMNOPQRSTUVWXYZ...
```

## Files to Know

| File | Purpose | Status |
|------|---------|--------|
| `START_HERE.md` | Main overview | 📖 Read first |
| `ACTION_PLAN.md` | 5-minute fix | ⚡ Quick fix |
| `GOOGLE_OAUTH_SETUP.md` | Detailed guide | 📚 Detailed steps |
| `ERROR_CHAIN_EXPLANATION.md` | Technical details | 🔧 Deep dive |
| `VISUAL_ERROR_GUIDE.md` | Diagrams | 📊 Visual |

## Diagnostic Commands

```bash
# Check environment
./check-oauth-setup.sh

# Test OAuth endpoint
curl http://localhost:3000/api/debug/oauth-status | jq .

# Test connect endpoint (after credentials added)
curl -X POST http://localhost:3000/api/youtube/connect \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Still getting 500 | Verify vars are in .env.local with no extra spaces |
| Can't find Google Console | Go to console.cloud.google.com |
| "Redirect URI mismatch" | Add `http://localhost:3000/connect-channel/callback` to authorized URIs |
| Dev server not picking up vars | Restart with `npm run dev` |
| YouTube API not enabled | Go to APIs & Services → Library → enable YouTube Data API v3 |

## API Endpoints Status

### Before Fix
```
POST /api/youtube/connect              500 ❌
POST /api/youtube/auth-callback        500 ❌
POST /api/youtube/auth/refresh         500 ❌
GET  /api/youtube/videos/[videoId]     500 ❌
```

### After Fix
```
POST /api/youtube/connect              200 ✅
POST /api/youtube/auth-callback        200 ✅
POST /api/youtube/auth/refresh         200 ✅
GET  /api/youtube/videos/[videoId]     200 ✅
```

## Features Unlocked After Fix

- ✅ YouTube channel connection
- ✅ Video metadata fetching
- ✅ Real-time analytics
- ✅ Title optimization
- ✅ Description optimization
- ✅ Tags intelligence
- ✅ Thumbnail suggestions
- ✅ CTR predictions
- ✅ SEO recommendations
- ✅ Auto-sync videos
- ✅ Performance tracking

## Environment Variable Reference

```bash
# Required (MUST ADD)
GOOGLE_CLIENT_ID=<from Google Cloud>
GOOGLE_CLIENT_SECRET=<from Google Cloud>

# Already Set (OK)
NEXT_PUBLIC_SUPABASE_URL=<already in .env.local>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<already in .env.local>
NEXT_PUBLIC_PAYPAL_CLIENT_ID=<already in .env.local>
PAYPAL_CLIENT_SECRET=<already in .env.local>
```

## Testing Checklist

After adding credentials and restarting server:

- [ ] `./check-oauth-setup.sh` shows ✅ for both
- [ ] `/api/debug/oauth-status` returns SUCCESS
- [ ] Visit `/connect-channel` and see "Connect YouTube Channel" button
- [ ] Click button and get redirected to Google login (not 500 error)
- [ ] Log in and grant permissions
- [ ] Redirected back to `/connect-channel/callback`
- [ ] See success message (channel connected)
- [ ] Video pages now load with data
- [ ] Optimization features show recommendations

## Time Estimate

```
Google credentials:    2-3 minutes
Add to .env.local:     1 minute
Restart server:        1-2 minutes
Verify setup:          1 minute
─────────────────────────────
Total:                 ~5-7 minutes
```

## Success Criteria

```
✅ /api/debug/oauth-status returns 200 with SUCCESS status
✅ User can click "Connect YouTube Channel"
✅ OAuth redirect to Google works (no 500 error)
✅ YouTube login succeeds
✅ Tokens stored in database
✅ Video pages load with data
✅ Optimization features work
```

---

**Current Status:** ✅ Ready (awaiting credentials)
**Build Status:** ✅ Successful
**Next Action:** Get Google OAuth credentials
