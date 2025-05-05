import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');

        if (!code) {
            // Redirect to Spotify authorization
            const clientId = process.env.SPOTIFY_CLIENT_ID;
            const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/spotify/auth`;
            const scope = 'user-read-currently-playing user-read-recently-played';

            const authUrl = new URL('https://accounts.spotify.com/authorize');
            authUrl.searchParams.append('client_id', clientId || '');
            authUrl.searchParams.append('response_type', 'code');
            authUrl.searchParams.append('redirect_uri', redirectUri);
            authUrl.searchParams.append('scope', scope);

            return NextResponse.redirect(authUrl.toString());
        }

        // Exchange code for tokens
        const clientId = process.env.SPOTIFY_CLIENT_ID;
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
        const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/spotify/auth`;

        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error_description || 'Failed to exchange code for tokens');
        }

        // Display the tokens (in a real app, you would store these securely)
        return new Response(`
            <html>
                <body>
                    <h1>Spotify Authentication Complete</h1>
                    <p>Here is your refresh token (store it securely):</p>
                    <pre>${data.refresh_token}</pre>
                    <p>Add this token to your widget configuration or .env file.</p>
                </body>
            </html>
        `, {
            headers: {
                'Content-Type': 'text/html'
            }
        });

    } catch (error) {
        console.error('Spotify Auth error:', error);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
} 