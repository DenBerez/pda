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

        // Get the current player state
        const { response } = await callSpotifyApi(
            'https://api.spotify.com/v1/me/player',
            refreshToken,
            clientId,
            clientSecret,
            { method: 'GET' }
        );

        // If no content is returned (204), it means no active player
        if (response.status === 204) {
            // Get available devices as fallback
            const { response: devicesResponse } = await callSpotifyApi(
                'https://api.spotify.com/v1/me/player/devices',
                refreshToken,
                clientId,
                clientSecret,
                { method: 'GET' }
            );

            let devices = [];
            if (devicesResponse.ok) {
                const devicesData = await devicesResponse.json();
                devices = devicesData.devices || [];
            }

            return NextResponse.json({
                is_playing: false,
                devices,
                active_device: null,
                current_track: null,
                position_ms: 0,
                shuffle_state: false,
                repeat_state: 'off'
            });
        }

        if (!response.ok) {
            const playerError = await response.json();
            console.error('Error fetching player state:', playerError);
            return NextResponse.json({ error: 'Failed to fetch player state' }, { status: 500 });
        }

        const playerData = await response.json();

        // Return comprehensive player state
        return NextResponse.json({
            is_playing: playerData.is_playing,
            devices: [playerData.device].filter(Boolean),
            active_device: playerData.device || null,
            current_track: playerData.item || null,
            position_ms: playerData.progress_ms || 0,
            shuffle_state: playerData.shuffle_state || false,
            repeat_state: playerData.repeat_state || 'off',
            context: playerData.context || null
        });
    } catch (error) {
        console.error('Error in player-state API:', error);
        return NextResponse.json({
            error: 'Failed to fetch player state',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 