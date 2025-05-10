import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { refreshToken } = body;
        const clientId = process.env.SPOTIFY_CLIENT_ID;
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

        if (!refreshToken) {
            return NextResponse.json({ error: 'Refresh token is required' }, { status: 400 });
        }

        if (!clientId || !clientSecret) {
            return NextResponse.json({ error: 'Spotify API credentials not configured' }, { status: 500 });
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
        return NextResponse.json(tokenData);
    } catch (error) {
        console.error('Error in token API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 