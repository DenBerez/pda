import { NextRequest, NextResponse } from "next/server";
import { getSpotifyCredentials, refreshSpotifyToken } from "../utils";

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

        const tokenData = await refreshSpotifyToken(refreshToken, clientId, clientSecret);
        return NextResponse.json(tokenData);
    } catch (error) {
        console.error('Error in token API:', error);
        return NextResponse.json({
            error: 'Failed to refresh access token',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 