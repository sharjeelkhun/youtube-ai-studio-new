import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(request: Request) {
  try {
    const { refresh_token } = await request.json();

    if (!refresh_token) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Validate environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = "https://youtube-ai-studio-new.vercel.app/connect-channel";

    if (!clientId || !clientSecret) {
      console.error('Missing required environment variables:', {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret
      });
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    try {
      // Set credentials and refresh token
      oauth2Client.setCredentials({
        refresh_token,
      });

      // Attempt to refresh the access token
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      if (!credentials.access_token) {
        console.error('No access token received from refresh');
        return NextResponse.json(
          { error: 'Failed to refresh access token' },
          { status: 500 }
        );
      }

      // Calculate token expiry
      const expiresIn = credentials.expiry_date 
        ? Math.floor((credentials.expiry_date - Date.now()) / 1000)
        : 3600;

      return NextResponse.json({
        access_token: credentials.access_token,
        expires_in: expiresIn,
        refresh_token: credentials.refresh_token || refresh_token, // Keep existing refresh token if not provided
      });
    } catch (refreshError: any) {
      console.error('OAuth2 refresh error:', {
        message: refreshError.message,
        code: refreshError.code,
        stack: refreshError.stack
      });

      // Handle specific OAuth2 errors
      if (refreshError.code === 'invalid_grant') {
        return NextResponse.json(
          { error: 'Invalid refresh token' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to refresh token' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in token refresh endpoint:', {
      message: error.message,
      stack: error.stack
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 