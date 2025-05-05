import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        const clientId = searchParams.get('clientId') || process.env.SPOTIFY_CLIENT_ID;
        const clientSecret = searchParams.get('clientSecret') || process.env.SPOTIFY_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            return NextResponse.json({ error: 'Missing client ID or secret' }, { status: 400 });
        }

        // Get the base URL from the request or environment variable
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
            (request.headers.get('host') ?
                `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}` :
                'http://localhost:3000');

        const redirectUri = `${baseUrl}/api/spotify/auth`;

        if (!code) {
            // Redirect to Spotify authorization
            const scope = 'user-read-currently-playing user-read-recently-played';

            const authUrl = new URL('https://accounts.spotify.com/authorize');
            authUrl.searchParams.append('client_id', clientId);
            authUrl.searchParams.append('response_type', 'code');
            authUrl.searchParams.append('redirect_uri', redirectUri);
            authUrl.searchParams.append('scope', scope);

            // Pass client ID and secret back in the state param as a base64 encoded JSON string
            const state = Buffer.from(JSON.stringify({ clientId, clientSecret })).toString('base64');
            authUrl.searchParams.append('state', state);

            return NextResponse.redirect(authUrl.toString());
        }

        // Get state parameter which contains our client ID and secret
        const state = searchParams.get('state');
        let stateData = { clientId, clientSecret };

        if (state) {
            try {
                stateData = JSON.parse(Buffer.from(state, 'base64').toString());
            } catch (e) {
                console.error('Failed to parse state parameter:', e);
            }
        }

        // Exchange code for tokens
        const response = await fetch('https://accounts.spotify.com/api/token', {
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
                    <p>Add this token to your widget configuration.</p>
                    <button onclick="copyToClipboard()">Copy to Clipboard</button>
                    <script>
                        function copyToClipboard() {
                            const token = '${data.refresh_token}';
                            navigator.clipboard.writeText(token)
                                .then(() => alert('Token copied to clipboard!'))
                                .catch(err => console.error('Failed to copy: ', err));
                        }
                    </script>
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