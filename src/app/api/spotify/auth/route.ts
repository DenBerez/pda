import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        const clientId = searchParams.get('clientId') || process.env.SPOTIFY_CLIENT_ID;
        const clientSecret = searchParams.get('clientSecret') || process.env.SPOTIFY_CLIENT_SECRET;
        const widgetId = searchParams.get('widgetId');
        const state = searchParams.get('state');

        if (!clientId || !clientSecret) {
            return NextResponse.json({ error: 'Missing client ID or secret' }, { status: 400 });
        }

        // Get the base URL from the request or environment variable
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
            (request.headers.get('host') ?
                `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}` :
                'http://localhost:3000');

        // Define the redirect URI
        const redirectUri = `${baseUrl}/api/spotify/auth`;

        // If no code is present, initiate the OAuth flow
        if (!code) {
            // Define required scopes
            const scope = [
                'streaming',
                'user-read-email',
                'user-read-private',
                'user-read-currently-playing',
                'user-read-playback-state',
                'user-modify-playback-state',
                'user-read-recently-played'
            ].join(' ');

            // Generate a random state value for security
            const stateValue = Buffer.from(JSON.stringify({
                clientId,
                clientSecret,
                widgetId,
                timestamp: Date.now()
            })).toString('base64');

            // Construct the Spotify authorization URL
            const authUrl = new URL('https://accounts.spotify.com/authorize');
            authUrl.searchParams.append('client_id', clientId);
            authUrl.searchParams.append('response_type', 'code');
            authUrl.searchParams.append('redirect_uri', redirectUri);
            authUrl.searchParams.append('scope', scope);
            authUrl.searchParams.append('show_dialog', 'true');
            authUrl.searchParams.append('state', stateValue);

            return NextResponse.redirect(authUrl.toString());
        }

        // Verify state parameter to prevent CSRF
        if (!state) {
            throw new Error('State parameter is missing');
        }

        let stateData;
        try {
            stateData = JSON.parse(Buffer.from(state, 'base64').toString());

            // Verify the timestamp is not too old (e.g., 1 hour)
            if (Date.now() - stateData.timestamp > 3600000) {
                throw new Error('State parameter has expired');
            }
        } catch (e) {
            console.error('Failed to parse state parameter:', e);
            throw new Error('Invalid state parameter');
        }

        // Exchange the authorization code for tokens
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${stateData.clientId}:${stateData.clientSecret}`).toString('base64')}`
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri
            })
        });

        const data = await tokenResponse.json();

        if (data.error) {
            throw new Error(data.error_description || 'Failed to exchange code for tokens');
        }

        // Return success page with the refresh token
        return new Response(`
            <html>
                <head>
                    <title>Spotify Authentication Complete</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 40px; }
                        .success { color: #4caf50; }
                        .container { max-width: 600px; margin: 0 auto; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1 class="success">Spotify Connected Successfully</h1>
                        <p>Your Spotify account has been connected to the dashboard.</p>
                        <p>This window will close automatically...</p>
                        
                        <script>
                            if (window.opener) {
                                window.opener.postMessage({ 
                                    type: 'SPOTIFY_AUTH_SUCCESS',
                                    refreshToken: '${data.refresh_token}',
                                    widgetId: '${stateData.widgetId}'
                                }, '*');
                                
                                setTimeout(() => window.close(), 2000);
                            }
                        </script>
                    </div>
                </body>
            </html>
        `, {
            headers: {
                'Content-Type': 'text/html'
            }
        });

    } catch (error) {
        console.error('Spotify Auth error:', error);
        return new Response(`
            <html>
                <head>
                    <title>Authentication Error</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 40px; }
                        .error { color: #f44336; }
                        .container { max-width: 600px; margin: 0 auto; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1 class="error">Authentication Failed</h1>
                        <p>${error instanceof Error ? error.message : 'An unknown error occurred'}</p>
                        <p>Please close this window and try again.</p>
                    </div>
                </body>
            </html>
        `, {
            headers: {
                'Content-Type': 'text/html'
            }
        });
    }
} 