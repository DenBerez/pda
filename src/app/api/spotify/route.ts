import { NextRequest, NextResponse } from "next/server";
import { getSpotifyCredentials, getBaseUrl, callSpotifyApi } from "./utils";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action') || 'status';
        const refreshToken = searchParams.get('refreshToken') || process.env.SPOTIFY_REFRESH_TOKEN;
        const { clientId, clientSecret } = getSpotifyCredentials({
            clientId: searchParams.get('clientId'),
            clientSecret: searchParams.get('clientSecret')
        });

        if (!clientId || !clientSecret) {
            return NextResponse.json({
                status: 'error',
                error: 'Spotify API credentials not configured'
            }, { status: 500 });
        }

        // No refresh token means we need to authenticate
        if (!refreshToken) {
            const baseUrl = getBaseUrl(request);
            return NextResponse.json({
                status: 'unauthenticated',
                error: 'Authentication required',
                authUrl: `${baseUrl}/api/spotify/auth?clientId=${encodeURIComponent(clientId)}&clientSecret=${encodeURIComponent(clientSecret)}`
            }, { status: 401 });
        }

        // Check if the token is valid by making a simple API call
        try {
            const { response } = await callSpotifyApi(
                'https://api.spotify.com/v1/me',
                refreshToken,
                clientId,
                clientSecret
            );

            if (response.ok) {
                const userData = await response.json();
                return NextResponse.json({
                    status: 'authenticated',
                    user: {
                        id: userData.id,
                        name: userData.display_name,
                        email: userData.email,
                        images: userData.images
                    }
                });
            } else {
                return NextResponse.json({
                    status: 'error',
                    error: 'Failed to validate Spotify credentials'
                }, { status: response.status });
            }
        } catch (error) {
            return NextResponse.json({
                status: 'error',
                error: 'Failed to validate Spotify credentials',
                details: error instanceof Error ? error.message : 'Unknown error'
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Spotify API error:', error);
        return NextResponse.json({
            status: 'error',
            error: 'Failed to fetch Spotify data'
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        return NextResponse.json({
            error: 'This endpoint has been deprecated. Please use the specialized endpoints instead.',
            message: 'For audio analysis, use /api/spotify/audio'
        }, { status: 410 });
    } catch (error) {
        console.error('Error in Spotify API:', error);
        return NextResponse.json({ error: 'Failed to process Spotify request' }, { status: 500 });
    }
} 