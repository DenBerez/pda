import { useState, useEffect, useCallback } from 'react';
import { SpotifyClient } from '@/app/utils/spotifyClient';

// Add a simple logger function similar to the one in useSpotifyWebPlayback
const logSpotify = (message: string, data?: any) => {
    console.log(`[Spotify State] ${message}`, data ? data : '');
};

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

    // Initial fetch only
    useEffect(() => {
        let mounted = true;

        const fetchInitialState = async () => {
            logSpotify('Fetching initial Spotify state');
            try {
                const [current, recent] = await Promise.all([
                    client.getCurrentTrack(),
                    client.getRecentTracks()
                ]);

                logSpotify('Initial state fetched', {
                    hasCurrentTrack: !!current?.item,
                    isPlaying: current?.is_playing,
                    recentTracksCount: recent?.length
                });

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
                logSpotify('Error fetching initial state', error);
                if (mounted) {
                    setState(prev => ({
                        ...prev,
                        error: error instanceof Error ? error.message : 'An error occurred',
                        isLoading: false
                    }));
                }
            }
        };

        fetchInitialState();

        return () => {
            mounted = false;
        };
    }, [client]);

    // Optimistic updates
    const optimisticTogglePlay = useCallback(() => {
        logSpotify('Optimistically toggling play state');
        setState(prev => ({
            ...prev,
            isPlaying: !prev.isPlaying
        }));
    }, []);

    const optimisticNextTrack = useCallback(() => {
        if (state.recentTracks.length > 0) {
            logSpotify('Optimistically updating to next track');
            setState(prev => ({
                ...prev,
                currentTrack: prev.recentTracks[0],
                isPlaying: true
            }));
        } else {
            logSpotify('No recent tracks available for next track');
        }
    }, [state.recentTracks]);

    const optimisticPreviousTrack = useCallback(() => {
        // This should be different from next track
        // For a simple implementation, we could use the second recent track if available
        if (state.recentTracks.length > 1) {
            logSpotify('Optimistically updating to previous track');
            setState(prev => ({
                ...prev,
                currentTrack: prev.recentTracks[1], // Use the second recent track
                isPlaying: true
            }));
        } else if (state.recentTracks.length === 1) {
            // If only one recent track is available, use that
            logSpotify('Only one recent track available for previous track');
            setState(prev => ({
                ...prev,
                currentTrack: prev.recentTracks[0],
                isPlaying: true
            }));
        } else {
            logSpotify('No recent tracks available for previous track');
        }
    }, [state.recentTracks]);

    return {
        ...state,
        optimisticTogglePlay,
        optimisticNextTrack,
        optimisticPreviousTrack
    };
}
