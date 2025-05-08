import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        const clientId = process.env.SPOTIFY_CLIENT_ID;
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

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
            const scope = [
                'streaming',
                'user-read-email',
                'user-read-private',
                'user-read-currently-playing',
                'user-read-playback-state',
                'user-modify-playback-state',
                'user-read-recently-played'
            ].join(' ');

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
                <head>
                    <title>Spotify Authentication Complete</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 40px; }
                        .success { color: #4caf50; }
                        .container { max-width: 600px; margin: 0 auto; }
                        pre { background: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto; }
                        button { padding: 10px 15px; background: #1db954; color: white; border: none; border-radius: 4px; cursor: pointer; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1 class="success">Spotify Connected Successfully</h1>
                        <p>Your Spotify account has been connected to the dashboard.</p>
                        <p>If the window doesn't close automatically, you can close it and return to the dashboard.</p>
                        
                        <script>
                            // Try to send the token back to the opener window
                            (function() {
                                const token = '${data.refresh_token}';
                                
                                if (window.opener && !window.opener.closed) {
                                    // Send message to parent window
                                    window.opener.postMessage({ 
                                        type: 'SPOTIFY_AUTH_SUCCESS', 
                                        refreshToken: token 
                                    }, '*');
                                    
                                    // Close this window after a short delay
                                    setTimeout(() => window.close(), 2000);
                                    document.write('<p>Token sent to dashboard! This window will close automatically...</p>');
                                } else {
                                    // If no opener, show the token for manual copying
                                    document.write('<p>Please copy this refresh token and paste it in your widget settings:</p>');
                                    document.write('<pre>' + token + '</pre>');
                                    document.write('<button onclick="copyToClipboard()">Copy to Clipboard</button>');
                                }
                                
                                function copyToClipboard() {
                                    const token = '${data.refresh_token}';
                                    navigator.clipboard.writeText(token)
                                        .then(() => alert('Token copied to clipboard!'))
                                        .catch(err => console.error('Failed to copy: ', err));
                                }
                            })();
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
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
} 