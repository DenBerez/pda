import { NextRequest, NextResponse } from "next/server";
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');

        // Get the client ID and secret from environment variables
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            return NextResponse.json({ error: 'Google API credentials not configured' }, { status: 500 });
        }

        // Get the base URL from the request or environment variable
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
            (request.headers.get('host') ?
                `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}` :
                'http://localhost:3000');

        const redirectUri = `${baseUrl}/api/calendar/auth/callback`;

        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            redirectUri
        );

        // If no code is provided, redirect to Google's auth page
        if (!code) {
            const authUrl = oauth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: ['https://www.googleapis.com/auth/calendar.readonly'],
                prompt: 'consent'
            });

            return NextResponse.redirect(authUrl);
        }

        // Exchange the code for tokens
        const { tokens } = await oauth2Client.getToken(code);

        // Return the refresh token in a format that can be used by the parent window
        return new Response(`
      <html>
        <body>
          <script>
            window.opener.postMessage(
              { 
                type: 'GOOGLE_CALENDAR_AUTH_SUCCESS', 
                refreshToken: '${tokens.refresh_token}' 
              }, 
              '*'
            );
            window.close();
          </script>
          <p>Authentication successful! You can close this window.</p>
        </body>
      </html>
    `, {
            headers: {
                'Content-Type': 'text/html'
            }
        });
    } catch (error) {
        console.error('Error in Google Calendar auth:', error);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
} 