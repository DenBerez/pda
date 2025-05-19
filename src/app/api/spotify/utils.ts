import { NextRequest } from "next/server";

// Get base URL from request or environment
export function getBaseUrl(request: NextRequest): string {
    return process.env.NEXT_PUBLIC_BASE_URL ||
        (request.headers.get('host') ?
            `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}` :
            'http://localhost:3000');
}

// Get Spotify credentials with fallbacks
export function getSpotifyCredentials(request: any) {
    const clientId = request.clientId || process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = request.clientSecret || process.env.SPOTIFY_CLIENT_SECRET;
    return { clientId, clientSecret };
}

// Refresh Spotify access token
export async function refreshSpotifyToken(refreshToken: string, clientId: string, clientSecret: string) {
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        })
    });

    if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Failed to refresh token: ${tokenResponse.status} ${errorText}`);
    }

    return tokenResponse.json();
}

// Call Spotify API with automatic token refresh
export async function callSpotifyApi(
    endpoint: string,
    refreshToken: string,
    clientId: string,
    clientSecret: string,
    options: RequestInit = {}
) {
    // Get a fresh access token
    const tokenData = await refreshSpotifyToken(refreshToken, clientId, clientSecret);
    const accessToken = tokenData.access_token;

    // Call the Spotify API
    const response = await fetch(endpoint, {
        ...options,
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            ...options.headers
        }
    });

    return { response, accessToken };
} 