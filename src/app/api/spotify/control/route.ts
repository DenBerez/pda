import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    let action: string = 'unknown';  // Initialize with default value
    try {
        // Get the action and tokens from the request body
        const data = await request.json();
        action = data.action;
        const refreshToken = data.refreshToken;
        const clientId = data.clientId || process.env.SPOTIFY_CLIENT_ID;
        const clientSecret = data.clientSecret || process.env.SPOTIFY_CLIENT_SECRET;

        if (!action) {
            return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
        }

        if (!refreshToken) {
            return NextResponse.json({ error: 'Missing refresh token' }, { status: 401 });
        }

        if (!clientId || !clientSecret) {
            return NextResponse.json({ error: 'Spotify API credentials not configured' }, { status: 500 });
        }

        // Exchange refresh token for access token
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
            throw new Error('Failed to refresh Spotify access token');
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Determine which Spotify API endpoint to call based on the action
        let endpoint = '';
        let method = 'PUT';
        let body = null; // Initialize body variable

        switch (action) {
            case 'play':
                endpoint = 'https://api.spotify.com/v1/me/player/play';
                break;
            case 'pause':
                endpoint = 'https://api.spotify.com/v1/me/player/pause';
                break;
            case 'next':
                endpoint = 'https://api.spotify.com/v1/me/player/next';
                method = 'POST';
                break;
            case 'previous':
                endpoint = 'https://api.spotify.com/v1/me/player/previous';
                method = 'POST';
                break;
            case 'shuffle':
                // Toggle shuffle state - you may want to get current state first
                endpoint = 'https://api.spotify.com/v1/me/player/shuffle?state=true';
                break;
            case 'repeat':
                // Cycle through repeat states - you may want to get current state first
                endpoint = 'https://api.spotify.com/v1/me/player/repeat?state=track';
                break;
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Call the Spotify API
        const response = await fetch(endpoint, {
            method: method,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            // Only include body if it's not null
            ...(body ? { body: JSON.stringify(body) } : {})
        });

        if (!response.ok) {
            // Special handling for common errors
            if (response.status === 404) {
                return NextResponse.json({
                    error: 'No active device found',
                    message: 'Please open Spotify on a device first'
                }, { status: 404 });
            }

            throw new Error(`Spotify API request failed with status: ${response.status}`);
        }

        return NextResponse.json({ success: true, action });

    } catch (error) {
        console.error('Spotify control API error:', error);
        return NextResponse.json({
            error: `Failed to ${action} Spotify playback`,
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}