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
        throw new Error('Failed to refresh access token');
    }

    return tokenResponse.json();
}
