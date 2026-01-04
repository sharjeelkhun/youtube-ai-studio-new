# Google OAuth Setup Guide

## Problem
Your application is missing Google OAuth credentials (`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`), which causes all YouTube API operations to fail with 500 errors.

**Failing Endpoints:**
- `POST /api/youtube/auth/refresh` - Returns 500 (missing GOOGLE_CLIENT_SECRET)
- `POST /api/youtube/auth-callback/route.ts` - Returns 500 (missing credentials)
- `GET /api/youtube/videos/{videoId}` - Returns 500 (can't refresh expired tokens)

## Solution: Get Google OAuth Credentials

### Step 1: Create/Access Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "NEW PROJECT"
4. Name it: `YouTube AI Studio`
5. Click "CREATE"
6. Wait for the project to be created (about 1-2 minutes)

### Step 2: Enable Required APIs

1. In the left sidebar, go to "APIs & Services" → "Library"
2. Search for and enable these APIs:
   - **YouTube Data API v3**
   - **Google Analytics API** (if needed)
3. Click each one and press "ENABLE"

### Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "CREATE CREDENTIALS" → "OAuth client ID"
3. If prompted to create a consent screen first:
   - Click "Create consent screen"
   - Choose "External" user type
   - Click "CREATE"
   - Fill in the form:
     - App name: `YouTube AI Studio`
     - User support email: (your email)
     - Developer contact: (your email)
   - Click "SAVE AND CONTINUE"
   - Skip the scopes page (click "SAVE AND CONTINUE")
   - Review and click "BACK TO DASHBOARD"

4. Now create the OAuth client ID:
   - Go back to "Credentials"
   - Click "CREATE CREDENTIALS" → "OAuth client ID"
   - Application type: **Web application**
   - Name: `localhost development`
   - Authorized JavaScript origins:
     - `http://localhost:3000`
   - Authorized redirect URIs:
     - `http://localhost:3000/connect-channel/callback`
   - Click "CREATE"

5. A popup will show your credentials:
   - **Client ID**: Copy this
   - **Client Secret**: Copy this

### Step 4: Update Your Environment File

Add these to your `.env.local` file:

```dotenv
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

Replace `your_client_id_here` and `your_client_secret_here` with the actual values from Step 3.

### Step 5: Verify Setup

1. Save `.env.local`
2. Restart your development server:
   ```bash
   npm run dev
   ```
3. Test by visiting: `http://localhost:3000/connect-channel`
4. Click "Connect YouTube Channel"
5. You should see the Google OAuth login screen (no more 500 errors)

## For Production Deployment

When deploying to Vercel or another hosting service:

1. Add the authorized redirect URI to your Google OAuth app:
   - `https://your-domain.com/connect-channel/callback`

2. Add to Vercel environment variables:
   ```
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```

3. Redeploy

## Troubleshooting

### Still getting 500 errors?

Check these:
- ✅ Is `GOOGLE_CLIENT_ID` in `.env.local`?
- ✅ Is `GOOGLE_CLIENT_SECRET` in `.env.local`?
- ✅ Did you restart your dev server after adding the variables?
- ✅ Are the values correct (no extra spaces)?
- ✅ Did you enable YouTube Data API v3?

### Getting "Invalid client" error?

- Client ID and Secret don't match
- Check they're exactly as shown in Google Cloud Console
- Regenerate them if unsure

### Getting "Redirect URI mismatch" error?

- Make sure `http://localhost:3000/connect-channel/callback` is in the authorized redirect URIs
- For production, also add `https://your-domain.com/connect-channel/callback`

## Files That Need These Credentials

- `/app/api/youtube/auth/refresh/route.ts` - Refreshes access tokens
- `/app/api/youtube/auth-callback/route.ts` - Handles OAuth callback
- `/app/api/youtube/connect/route.ts` - Initiates OAuth flow
- `/app/dashboard/connect-channel/page.tsx` - Validates credentials exist

## After Setup

Once credentials are configured, your app will:
1. ✅ Allow users to connect their YouTube channels
2. ✅ Automatically refresh access tokens when they expire
3. ✅ Fetch video metadata and analytics
4. ✅ Apply optimizations to video titles, descriptions, tags
5. ✅ Load the video optimization dashboard
