import { NextRequest, NextResponse } from "next/server";
import { getSpotifyCredentials, callSpotifyApi, refreshSpotifyToken } from "../utils";

export async function POST(request: NextRequest) {
    let action: string = 'unknown';  // Initialize with default value
    try {
        // Get the action and tokens from the request body
        const data = await request.json();
        action = data.action;
        const { refreshToken } = data;
        const { clientId, clientSecret } = getSpotifyCredentials(data);

        if (!action) {
            return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
        }

        if (!refreshToken) {
            return NextResponse.json({ error: 'Missing refresh token' }, { status: 401 });
        }

        if (!clientId || !clientSecret) {
            return NextResponse.json({ error: 'Spotify API credentials not configured' }, { status: 500 });
        }

        // Get a fresh access token
        const tokenData = await refreshSpotifyToken(refreshToken, clientId, clientSecret);
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
                // First get the current player state to check shuffle status
                const { response: playerStateResponse } = await callSpotifyApi(
                    'https://api.spotify.com/v1/me/player',
                    refreshToken,
                    clientId,
                    clientSecret
                );

                if (playerStateResponse.ok) {
                    const playerState = await playerStateResponse.json();
                    const currentShuffleState = playerState.shuffle_state;
                    // Toggle the shuffle state
                    endpoint = `https://api.spotify.com/v1/me/player/shuffle?state=${!currentShuffleState}`;
                } else {
                    // Default to enabling shuffle if we can't get the current state
                    endpoint = 'https://api.spotify.com/v1/me/player/shuffle?state=true';
                }
                break;
            case 'repeat':
                // First get the current player state to check repeat status
                const { response: repeatStateResponse } = await callSpotifyApi(
                    'https://api.spotify.com/v1/me/player',
                    refreshToken,
                    clientId,
                    clientSecret
                );

                if (repeatStateResponse.ok) {
                    const playerState = await repeatStateResponse.json();
                    const currentRepeatState = playerState.repeat_state;

                    // Cycle through repeat states: off → track → context → off
                    let nextRepeatState;
                    switch (currentRepeatState) {
                        case 'off': nextRepeatState = 'track'; break;
                        case 'track': nextRepeatState = 'context'; break;
                        case 'context': nextRepeatState = 'off'; break;
                        default: nextRepeatState = 'track'; break;
                    }

                    endpoint = `https://api.spotify.com/v1/me/player/repeat?state=${nextRepeatState}`;
                } else {
                    // Default to track repeat if we can't get the current state
                    endpoint = 'https://api.spotify.com/v1/me/player/repeat?state=track';
                }
                break;
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Call the Spotify API
        const { response } = await callSpotifyApi(
            endpoint,
            refreshToken,
            clientId,
            clientSecret,
            {
                method,
                ...(body ? { body: JSON.stringify(body) } : {})
            }
        );

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