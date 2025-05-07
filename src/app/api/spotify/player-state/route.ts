import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { refreshToken, clientId, clientSecret } = body;

        if (!refreshToken) {
            return NextResponse.json({ error: 'Refresh token is required' }, { status: 400 });
        }

        // Get a new access token using the refresh token
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
            const tokenError = await tokenResponse.json();
            console.error('Error refreshing token:', tokenError);
            return NextResponse.json({ error: 'Failed to refresh access token' }, { status: 401 });
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Get the current player state
        const playerResponse = await fetch('https://api.spotify.com/v1/me/player', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        // If no content is returned (204), it means no active player
        if (playerResponse.status === 204) {
            return NextResponse.json({ is_playing: false });
        }

        if (!playerResponse.ok) {
            const playerError = await playerResponse.json();
            console.error('Error fetching player state:', playerError);
            return NextResponse.json({ error: 'Failed to fetch player state' }, { status: 500 });
        }

        const playerData = await playerResponse.json();

        // Return just the playing state
        return NextResponse.json({
            is_playing: playerData.is_playing,
            device: playerData.device?.name || 'Unknown device'
        });
    } catch (error) {
        console.error('Error in player-state API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 