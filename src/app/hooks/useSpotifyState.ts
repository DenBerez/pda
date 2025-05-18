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

    // Add actual control methods that call the client
    const togglePlay = useCallback(async () => {
        if (!client) {
            logSpotify('Cannot toggle play: client not available');
            throw new Error('Client not available');
        }

        logSpotify('Toggling playback state');
        try {
            await client.controlPlayback('pause');
            logSpotify('Playback toggled successfully');

            // Update state after successful toggle
            const currentState = await client.getCurrentTrack();
            if (currentState) {
                setState(prev => ({
                    ...prev,
                    isPlaying: !currentState.is_playing
                }));
            }
        } catch (error) {
            console.error('Error toggling playback:', error);
            logSpotify('Error toggling playback', error);

            if (error instanceof Error && error.message.includes('no list was loaded')) {
                logSpotify('No list loaded, attempting to transfer playback');
                await client.controlPlayback('play');
            } else {
                throw error; // Re-throw to allow handling in the component
            }
        }
    }, [client]);

    const nextTrack = useCallback(async () => {
        logSpotify('Skipping to next track');
        try {
            // Optimistic update
            optimisticNextTrack();

            // Actual API call
            await client.controlPlayback('next');
            logSpotify('Next track command sent successfully');
        } catch (error) {
            logSpotify('Error skipping to next track', error);
            // We could revert the optimistic update here, but it's tricky
            // since we don't know what the actual next track would be
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Failed to skip to next track'
            }));
        }
    }, [client, state.recentTracks]);

    const previousTrack = useCallback(async () => {
        logSpotify('Going to previous track');
        try {
            // Optimistic update
            optimisticPreviousTrack();

            // Actual API call
            await client.controlPlayback('previous');
            logSpotify('Previous track command sent successfully');
        } catch (error) {
            logSpotify('Error going to previous track', error);
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Failed to go to previous track'
            }));
        }
    }, [client, state.recentTracks]);

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

    // Add a method to refresh the current state
    const refreshState = useCallback(async () => {
        logSpotify('Refreshing Spotify state');
        try {
            const [current, recent] = await Promise.all([
                client.getCurrentTrack(),
                client.getRecentTracks()
            ]);

            setState(prev => ({
                ...prev,
                currentTrack: current?.item || prev.currentTrack,
                isPlaying: current?.is_playing || false,
                recentTracks: recent || prev.recentTracks,
                error: null
            }));

            logSpotify('State refreshed successfully');
        } catch (error) {
            logSpotify('Error refreshing state', error);
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Failed to refresh state'
            }));
        }
    }, [client]);

    return {
        ...state,
        togglePlay,
        nextTrack,
        previousTrack,
        refreshState,
        optimisticTogglePlay,
        optimisticNextTrack,
        optimisticPreviousTrack
    };
}
