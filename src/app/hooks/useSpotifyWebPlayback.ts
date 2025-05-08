import { useState, useEffect, useCallback, useRef } from 'react';

// Define types for the Spotify Web Playback SDK
interface SpotifyPlayer {
    _options: {
        getOAuthToken: (callback: (token: string) => void) => void;
        name: string;
    };
    connect: () => Promise<boolean>;
    disconnect: () => void;
    addListener: (event: string, callback: (...args: any[]) => void) => boolean;
    removeListener: (event: string, callback?: (...args: any[]) => void) => boolean;
    getCurrentState: () => Promise<Spotify.PlaybackState | null>;
    setName: (name: string) => Promise<void>;
    getVolume: () => Promise<number>;
    setVolume: (volume: number) => Promise<void>;
    pause: () => Promise<void>;
    resume: () => Promise<void>;
    togglePlay: () => Promise<void>;
    seek: (position_ms: number) => Promise<void>;
    previousTrack: () => Promise<void>;
    nextTrack: () => Promise<void>;
}

interface SpotifyWebPlaybackSDK {
    Player: new (options: any) => SpotifyPlayer;
}

declare global {
    interface Window {
        Spotify: SpotifyWebPlaybackSDK;
        onSpotifyWebPlaybackSDKReady: () => void;
    }
}

interface PlaybackState {
    isConnected: boolean;
    isPlaying: boolean;
    currentTrack: any | null;
    deviceId: string | null;
    error: string | null;
    position: number;
    duration: number;
}

interface UseSpotifyWebPlaybackProps {
    accessToken: string | null;
    refreshToken: string | null;
    clientId: string | null;
    clientSecret: string | null;
    playerName?: string;
}

declare namespace Spotify {
    interface PlaybackState {
        context: {
            uri: string;
            metadata: any;
        };
        track_window: {
            current_track: {
                album: any;
                artists: any[];
                duration_ms: number;
                id: string;
                is_playable: boolean;
                name: string;
                uri: string;
            };
        };
        paused: boolean;
        position: number;
        duration: number;
    }
}

const REQUIRED_SPOTIFY_SCOPES = [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-read-currently-playing',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-recently-played'
];

export const useSpotifyWebPlayback = ({
    accessToken: initialAccessToken,
    refreshToken,
    clientId,
    clientSecret,
    playerName = 'Web Dashboard Player'
}: UseSpotifyWebPlaybackProps) => {
    const [accessToken, setAccessToken] = useState<string | null>(initialAccessToken);
    const [state, setState] = useState<PlaybackState>({
        isConnected: false,
        isPlaying: false,
        currentTrack: null,
        deviceId: null,
        error: null,
        position: 0,
        duration: 0
    });
    const playerRef = useRef<SpotifyPlayer | null>(null);
    const tokenExpirationRef = useRef<number>(0);
    const positionIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Load the Spotify Web Playback SDK script
    useEffect(() => {
        if (!refreshToken || !clientId || !clientSecret) return;

        // Only load the script once
        if (document.getElementById('spotify-player')) return;

        const script = document.createElement('script');
        script.id = 'spotify-player';
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        document.body.appendChild(script);

        // Cleanup
        return () => {
            if (document.getElementById('spotify-player')) {
                document.getElementById('spotify-player')?.remove();
            }
        };
    }, [refreshToken, clientId, clientSecret]);

    // Refresh the access token
    const refreshAccessToken = useCallback(async () => {
        if (!refreshToken || !clientId || !clientSecret) return null;

        try {
            const response = await fetch('/api/spotify/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    refreshToken,
                    clientId,
                    clientSecret
                })
            });

            if (!response.ok) {
                throw new Error('Failed to refresh token');
            }

            const data = await response.json();
            setAccessToken(data.access_token);
            tokenExpirationRef.current = Date.now() + (data.expires_in * 1000) - 60000; // Expire 1 minute early
            return data.access_token;
        } catch (error) {
            console.error('Error refreshing token:', error);
            setState(prev => ({ ...prev, error: 'Failed to refresh access token' }));
            return null;
        }
    }, [refreshToken, clientId, clientSecret]);

    // Get a valid token, refreshing if necessary
    const getValidToken = useCallback(async () => {
        if (!accessToken || Date.now() > tokenExpirationRef.current) {
            return await refreshAccessToken();
        }
        return accessToken;
    }, [accessToken, refreshAccessToken]);

    // Initialize the player when the SDK is ready
    useEffect(() => {
        if (!refreshToken || !clientId || !clientSecret) return;

        window.onSpotifyWebPlaybackSDKReady = async () => {
            const token = await getValidToken();
            if (!token) return;

            const player = new window.Spotify.Player({
                name: playerName,
                getOAuthToken: async (cb: (token: string) => void) => {
                    const validToken = await getValidToken();
                    cb(validToken || '');
                },
                volume: 0.5
            });

            // Error handling
            player.addListener('initialization_error', ({ message }) => {
                console.error('Initialization error:', message);
                setState(prev => ({ ...prev, error: `Initialization error: ${message}` }));
            });

            player.addListener('authentication_error', ({ message }) => {
                console.error('Authentication error:', message);
                setState(prev => ({ ...prev, error: `Authentication error: ${message}` }));
                refreshAccessToken(); // Try to refresh the token
            });

            player.addListener('account_error', ({ message }) => {
                console.error('Account error:', message);
                setState(prev => ({ ...prev, error: `Account error: ${message}` }));
            });

            player.addListener('playback_error', ({ message }) => {
                console.error('Playback error:', message);
                setState(prev => ({ ...prev, error: `Playback error: ${message}` }));
            });

            // Playback status updates
            player.addListener('player_state_changed', (state) => {
                if (!state) return;

                const {
                    position,
                    duration,
                    paused,
                    track_window: { current_track }
                } = state;

                console.log('Player state changed:', {
                    position,
                    duration,
                    paused,
                    track: current_track.name
                });

                setState(prev => ({
                    ...prev,
                    isPlaying: !paused,
                    currentTrack: current_track,
                    position,
                    duration
                }));

                // Update position tracking
                if (positionIntervalRef.current) {
                    clearInterval(positionIntervalRef.current);
                    positionIntervalRef.current = null;
                }

                if (!paused) {
                    positionIntervalRef.current = setInterval(() => {
                        setState(prev => ({
                            ...prev,
                            position: prev.position + 1000
                        }));
                    }, 1000);
                }
            });

            // Ready
            player.addListener('ready', ({ device_id }) => {
                console.log('Ready with Device ID', device_id);
                setState(prev => ({
                    ...prev,
                    isConnected: true,
                    deviceId: device_id,
                    error: null
                }));
            });

            // Not Ready
            player.addListener('not_ready', ({ device_id }) => {
                console.log('Device ID has gone offline', device_id);
                setState(prev => ({
                    ...prev,
                    isConnected: false,
                    deviceId: null
                }));
            });

            // Connect to the player
            const connected = await player.connect();
            if (connected) {
                console.log('Connected to Spotify Web Playback SDK');
            } else {
                console.error('Failed to connect to Spotify Web Playback SDK');
                setState(prev => ({ ...prev, error: 'Failed to connect to Spotify player' }));
            }

            playerRef.current = player;
        };

        return () => {
            if (playerRef.current) {
                playerRef.current.disconnect();
                playerRef.current = null;
            }

            if (positionIntervalRef.current) {
                clearInterval(positionIntervalRef.current);
                positionIntervalRef.current = null;
            }
        };
    }, [refreshToken, clientId, clientSecret, getValidToken, playerName, refreshAccessToken]);

    // Player control functions
    const play = useCallback(async (uri?: string) => {
        if (!playerRef.current || !state.deviceId) return;

        const token = await getValidToken();
        if (!token) return;

        const body = uri ? { uris: [uri] } : undefined;

        try {
            await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${state.deviceId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: body ? JSON.stringify(body) : undefined
            });
        } catch (error) {
            console.error('Error playing track:', error);
        }
    }, [state.deviceId, getValidToken]);

    const pause = useCallback(async () => {
        if (!playerRef.current) return;
        try {
            await playerRef.current.pause();
        } catch (error) {
            console.error('Error pausing playback:', error);
        }
    }, []);

    const togglePlay = useCallback(async () => {
        if (!playerRef.current) return;
        try {
            await playerRef.current.togglePlay();
        } catch (error) {
            console.error('Error toggling playback:', error);
        }
    }, []);

    const nextTrack = useCallback(async () => {
        if (!playerRef.current) return;
        try {
            await playerRef.current.nextTrack();
        } catch (error) {
            console.error('Error skipping to next track:', error);
        }
    }, []);

    const previousTrack = useCallback(async () => {
        if (!playerRef.current) return;
        try {
            await playerRef.current.previousTrack();
        } catch (error) {
            console.error('Error going to previous track:', error);
        }
    }, []);

    const seek = useCallback(async (position: number) => {
        if (!playerRef.current) return;
        try {
            await playerRef.current.seek(position);
        } catch (error) {
            console.error('Error seeking:', error);
        }
    }, []);

    // Control shuffle and repeat through the API
    const setShuffle = useCallback(async (shuffleState: boolean) => {
        if (!playerRef.current || !state.deviceId) return;

        const token = await getValidToken();
        if (!token) return;

        try {
            await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=${shuffleState}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Error setting shuffle:', error);
        }
    }, [state.deviceId, getValidToken]);

    const setRepeatMode = useCallback(async (mode: 'off' | 'track' | 'context') => {
        if (!playerRef.current || !state.deviceId) return;

        const token = await getValidToken();
        if (!token) return;

        try {
            await fetch(`https://api.spotify.com/v1/me/player/repeat?state=${mode}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Error setting repeat mode:', error);
        }
    }, [state.deviceId, getValidToken]);

    // Transfer playback to this device
    const transferPlayback = useCallback(async () => {
        if (!state.deviceId) return;

        const token = await getValidToken();
        if (!token) return;

        try {
            await fetch('https://api.spotify.com/v1/me/player', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    device_ids: [state.deviceId],
                    play: true
                })
            });
        } catch (error) {
            console.error('Error transferring playback:', error);
        }
    }, [state.deviceId, getValidToken]);

    return {
        ...state,
        play,
        pause,
        togglePlay,
        nextTrack,
        previousTrack,
        seek,
        setShuffle,
        setRepeatMode,
        transferPlayback
    };
}; 