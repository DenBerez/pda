export async function refreshSpotifyToken(refreshToken: string, clientId: string, clientSecret: string) {
    console.log('Refreshing Spotify token...');

    try {
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
            const errorData = await tokenResponse.text();
            console.error('Failed to refresh token:', tokenResponse.status, errorData);
            throw new Error(`Failed to refresh access token: ${tokenResponse.status} ${errorData}`);
        }

        const data = await tokenResponse.json();
        console.log('Token refreshed successfully');
        return data;
    } catch (error) {
        console.error('Error refreshing Spotify token:', error);
        throw error;
    }
}
