import { NextRequest, NextResponse } from "next/server";

export async function POST(
    request: NextRequest,
    { params }: { params: { action: string } }
) {
    try {
        const action = params.action;

        // Get authorization header which contains the refresh token
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Missing or invalid authorization' }, { status: 401 });
        }

        const refreshToken = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Get Spotify API credentials
        const clientId = process.env.SPOTIFY_CLIENT_ID;
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

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
        let body = null;

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
            body: body
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
            error: `Failed to ${params.action} Spotify playback`,
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}