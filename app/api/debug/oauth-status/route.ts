import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const credentials = {
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  };

  const allConfigured = credentials.hasGoogleClientId && credentials.hasGoogleClientSecret;

  if (allConfigured) {
    return NextResponse.json({
      status: '✅ SUCCESS',
      message: 'All Google OAuth credentials are properly configured',
      credentials,
      nextSteps: [
        'Restart your development server if you just added these variables',
        'Visit http://localhost:3000/connect-channel',
        'Click "Connect YouTube Channel"',
        'You should see the Google OAuth login screen'
      ]
    });
  } else {
    return NextResponse.json({
      status: '❌ MISSING CONFIGURATION',
      message: 'Some Google OAuth credentials are missing',
      credentials,
      missingVariables: [
        !credentials.hasGoogleClientId && 'GOOGLE_CLIENT_ID',
        !credentials.hasGoogleClientSecret && 'GOOGLE_CLIENT_SECRET',
      ].filter(Boolean),
      instructions: 'Add these to your .env.local file. See GOOGLE_OAUTH_SETUP.md for detailed instructions',
    }, { status: 500 });
  }
}
