import { useState, useEffect, useCallback } from 'react';
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

    // Initial fetch only
    useEffect(() => {
        let mounted = true;

        const fetchInitialState = async () => {
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

        fetchInitialState();

        return () => {
            mounted = false;
        };
    }, [client]);

    // Optimistic updates
    const optimisticTogglePlay = useCallback(() => {
        setState(prev => ({
            ...prev,
            isPlaying: !prev.isPlaying
        }));
    }, []);

    const optimisticNextTrack = () => {
        if (state.recentTracks.length > 0) {
            setState(prev => ({
                ...prev,
                currentTrack: prev.recentTracks[0],
                isPlaying: true
            }));
        }
    };

    const optimisticPreviousTrack = () => {
        if (state.recentTracks.length > 0) {
            setState(prev => ({
                ...prev,
                currentTrack: prev.recentTracks[0],
                isPlaying: true
            }));
        }
    };

    return {
        ...state,
        optimisticTogglePlay,
        optimisticNextTrack,
        optimisticPreviousTrack
    };
}
