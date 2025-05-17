import { useState, useEffect } from 'react';
import { SpotifyClient } from '../utils/spotifyClient';

interface SpotifyState {
    currentTrack: any | null;
    isPlaying: boolean;
    recentTracks: any[];
    error: string | null;
    isLoading: boolean;
}

export function useSpotifyState(client: SpotifyClient) {
    const [state, setState] = useState<SpotifyState>({
        currentTrack: null,
        isPlaying: false,
        recentTracks: [],
        error: null,
        isLoading: true
    });

    useEffect(() => {
        let mounted = true;
        const pollState = async () => {
            try {
                const [current, recent] = await Promise.all([
                    client.getCurrentTrack(),
                    client.getRecentTracks()
                ]);

                if (mounted) {
                    setState(prev => ({
                        ...prev,
                        currentTrack: current?.item || null,
                        isPlaying: current?.is_playing || false,
                        recentTracks: recent,
                        error: null,
                        isLoading: false
                    }));
                }
            } catch (error) {
                if (mounted) {
                    setState(prev => ({
                        ...prev,
                        error: error instanceof Error ? error.message : 'An error occurred',
                        isLoading: false
                    }));
                }
            }
        };

        const interval = setInterval(pollState, 1000);
        pollState(); // Initial call

        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, [client]);

    return state;
}
