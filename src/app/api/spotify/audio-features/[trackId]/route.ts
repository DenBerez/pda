import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    request: NextRequest,
    { params }: { params: { trackId: string } }
) {
    try {
        // Get the track ID from the URL params
        const trackId = params.trackId;

        if (!trackId) {
            return NextResponse.json({ error: 'Track ID is required' }, { status: 400 });
        }

        // Get the request body
        const body = await request.json().catch(() => ({}));

        // Get the refresh token from body, cookies, or query params
        const refreshToken = body.refreshToken ||
            request.cookies.get('spotify_refresh_token')?.value ||
            new URL(request.url).searchParams.get('refreshToken');

        // Get client credentials from environment variables
        const clientId = process.env.SPOTIFY_CLIENT_ID;
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            return NextResponse.json({ error: 'Spotify credentials not configured' }, { status: 500 });
        }

        // No refresh token means we need to authenticate
        if (!refreshToken) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
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
            throw new Error('Failed to refresh Spotify access token');
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Fetch audio features for the track
        const featuresResponse = await fetch(`https://api.spotify.com/v1/audio-features/${trackId}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!featuresResponse.ok) {
            if (featuresResponse.status === 404) {
                return NextResponse.json({ error: 'Track not found' }, { status: 404 });
            }
            throw new Error(`Failed to fetch audio features: ${featuresResponse.statusText}`);
        }

        const audioFeatures = await featuresResponse.json();

        // Also fetch audio analysis for more detailed data
        const analysisResponse = await fetch(`https://api.spotify.com/v1/audio-analysis/${trackId}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        let audioAnalysis = null;
        if (analysisResponse.ok) {
            audioAnalysis = await analysisResponse.json();
        }

        // Return combined data
        return NextResponse.json({
            features: audioFeatures,
            analysis: audioAnalysis
        });

    } catch (error) {
        console.error('Error in audio features API:', error);
        return NextResponse.json({ error: 'Failed to fetch audio data' }, { status: 500 });
    }
}

// Keep the GET method for backward compatibility if needed
export async function GET(
    request: NextRequest,
    { params }: { params: { trackId: string } }
) {
    return NextResponse.json({ error: 'Please use POST method for this endpoint' }, { status: 405 });
} 