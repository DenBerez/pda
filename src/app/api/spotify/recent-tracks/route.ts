import { NextRequest, NextResponse } from "next/server";
import { getSpotifyCredentials, callSpotifyApi } from "../utils";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { refreshToken } = body;
        const { clientId, clientSecret } = getSpotifyCredentials(body);

        if (!refreshToken) {
            return NextResponse.json({ error: 'Refresh token is required' }, { status: 400 });
        }

        if (!clientId || !clientSecret) {
            return NextResponse.json({ error: 'Spotify API credentials not configured' }, { status: 500 });
        }

        // Get recently played tracks
        const { response } = await callSpotifyApi(
            'https://api.spotify.com/v1/me/player/recently-played?limit=10',
            refreshToken,
            clientId,
            clientSecret,
            { method: 'GET' }
        );

        if (!response.ok) {
            const error = await response.json();
            console.error('Error fetching recent tracks:', error);
            return NextResponse.json({ error: 'Failed to fetch recent tracks' }, { status: 500 });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in recent-tracks API:', error);
        return NextResponse.json({
            error: 'Failed to fetch recent tracks',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 