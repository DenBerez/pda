import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action') || 'current'; // 'current' or 'recent'

        // Get Spotify API credentials from parameters or environment variables
        const clientId = searchParams.get('clientId') || process.env.SPOTIFY_CLIENT_ID;
        const clientSecret = searchParams.get('clientSecret') || process.env.SPOTIFY_CLIENT_SECRET;
        const refreshToken = searchParams.get('refreshToken') || process.env.SPOTIFY_REFRESH_TOKEN;

        if (!clientId || !clientSecret) {
            return NextResponse.json({ error: 'Spotify API credentials not configured' }, { status: 500 });
        }

        // For development or when no token is provided, return mock data
        if (process.env.NODE_ENV === 'development' || !refreshToken) {
            if (action === 'current') {
                return NextResponse.json({
                    isPlaying: true,
                    currentTrack: {
                        name: "Demo Track",
                        album: {
                            name: "Demo Album",
                            images: [{ url: "https://via.placeholder.com/300" }]
                        },
                        artists: [{ name: "Demo Artist" }],
                        duration_ms: 180000
                    }
                });
            } else {
                return NextResponse.json({
                    recentTracks: Array(5).fill(null).map((_, i) => ({
                        track: {
                            id: `demo-${i}`,
                            name: `Demo Track ${i + 1}`,
                            album: {
                                name: `Demo Album ${i + 1}`,
                                images: [{ url: "https://via.placeholder.com/300" }]
                            },
                            artists: [{ name: `Demo Artist ${i + 1}` }],
                            duration_ms: 180000
                        },
                        played_at: new Date(Date.now() - i * 3600000).toISOString()
                    }))
                });
            }
        }

        // Get the base URL from the request or environment variable
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
            (request.headers.get('host') ?
                `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}` :
                'http://localhost:3000');

        // No refresh token means we need to authenticate
        if (!refreshToken) {
            return NextResponse.json({
                error: 'Authentication required',
                authUrl: `${baseUrl}/api/spotify/auth?clientId=${encodeURIComponent(clientId)}&clientSecret=${encodeURIComponent(clientSecret)}`
            }, { status: 401 });
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

        // Fetch currently playing or recently played tracks based on action
        let endpoint = '';
        if (action === 'current') {
            endpoint = 'https://api.spotify.com/v1/me/player/currently-playing';
        } else {
            endpoint = 'https://api.spotify.com/v1/me/player/recently-played?limit=5';
        }

        const response = await fetch(endpoint, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        // If no content (204) for currently playing, fall back to recently played
        if (response.status === 204 && action === 'current') {
            const recentResponse = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!recentResponse.ok) {
                throw new Error('Failed to fetch recently played tracks');
            }

            const recentData = await recentResponse.json();
            return NextResponse.json({
                isPlaying: false,
                lastPlayed: recentData.items[0],
                recentTracks: [recentData.items[0]]
            });
        }

        if (!response.ok && response.status !== 204) {
            throw new Error(`Spotify API request failed with status: ${response.status}`);
        }

        // Parse the response based on the action
        if (action === 'current' && response.status !== 204) {
            const data = await response.json();
            return NextResponse.json({
                isPlaying: true,
                currentTrack: data,
            });
        } else if (action === 'recent') {
            const data = await response.json();
            return NextResponse.json({
                recentTracks: data.items
            });
        } else {
            return NextResponse.json({
                isPlaying: false,
                message: 'No track currently playing'
            });
        }
    } catch (error) {
        console.error('Spotify API error:', error);
        return NextResponse.json({ error: 'Failed to fetch Spotify data' }, { status: 500 });
    }
} 