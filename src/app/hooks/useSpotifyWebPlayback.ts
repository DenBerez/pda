import { useState, useEffect, useCallback, useRef } from 'react';

// Add a simple logger function
const logSpotify = (message: string, data?: any) => {
    console.log(`[Spotify Player] ${message}`, data ? data : '');
};

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

// Add a connection state enum
export enum ConnectionState {
    DISCONNECTED = 'disconnected',
    CONNECTING = 'connecting',
    CONNECTED = 'connected',
    TRANSFERRING = 'transferring',
    READY = 'ready',
    ERROR = 'error'
}

// Update the PlaybackState interface
interface PlaybackState {
    connectionState: ConnectionState;
    isConnected: boolean;
    isPlaying: boolean;
    currentTrack: any | null;
    deviceId: string | null;
    error: string | null;
    position: number;
    duration: number;
    isTransferringPlayback: boolean;
}

interface UseSpotifyWebPlaybackProps {
    accessToken: string | null;
    refreshToken: string | null;
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

// Add this at the top of the file, outside the hook
let isInitializing = false;
let isInitialized = false;

export const useSpotifyWebPlayback = ({
    accessToken: initialAccessToken,
    refreshToken,
    playerName = 'Web Dashboard Player'
}: UseSpotifyWebPlaybackProps) => {
    logSpotify('Initializing Spotify Web Playback hook', { hasRefreshToken: !!refreshToken });

    const [accessToken, setAccessToken] = useState<string | null>(initialAccessToken);
    const [state, setState] = useState<PlaybackState>({
        connectionState: ConnectionState.DISCONNECTED,
        isConnected: false,
        isPlaying: false,
        currentTrack: null,
        deviceId: null,
        error: null,
        position: 0,
        duration: 0,
        isTransferringPlayback: false
    });
    const playerRef = useRef<SpotifyPlayer | null>(null);
    const tokenExpirationRef = useRef<number>(0);
    const positionIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Load the Spotify Web Playback SDK script
    useEffect(() => {
        if (!refreshToken) {
            logSpotify('No refresh token provided, skipping SDK initialization');
            return;
        }

        // Prevent multiple initializations
        if (isInitializing || isInitialized) {
            logSpotify('SDK initialization already in progress or completed');
            return;
        }

        // Only load the script once
        if (document.getElementById('spotify-player')) {
            logSpotify('Spotify player script already loaded');
            return;
        }

        isInitializing = true;
        logSpotify('Loading Spotify Web Playback SDK script');
        const script = document.createElement('script');
        script.id = 'spotify-player';
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        document.body.appendChild(script);

        // Cleanup
        return () => {
            if (document.getElementById('spotify-player')) {
                logSpotify('Removing Spotify player script');
                document.getElementById('spotify-player')?.remove();
                isInitialized = false;
                isInitializing = false;
            }
        };
    }, [refreshToken]);

    // Refresh the access token
    const refreshAccessToken = useCallback(async () => {
        if (!refreshToken) {
            logSpotify('No refresh token available for token refresh');
            return null;
        }

        logSpotify('Refreshing access token');
        try {
            const response = await fetch('/api/spotify/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    refreshToken
                })
            });

            if (!response.ok) {
                throw new Error('Failed to refresh token');
            }

            const data = await response.json();
            logSpotify('Token refreshed successfully', { expiresIn: data.expires_in });
            setAccessToken(data.access_token);
            tokenExpirationRef.current = Date.now() + (data.expires_in * 1000) - 60000; // Expire 1 minute early
            return data.access_token;
        } catch (error) {
            console.error('Error refreshing token:', error);
            logSpotify('Token refresh failed', error);
            setState(prev => ({ ...prev, error: 'Failed to refresh access token' }));
            return null;
        }
    }, [refreshToken]);

    // Get a valid token, refreshing if necessary
    const getValidToken = useCallback(async () => {
        if (!accessToken || Date.now() > tokenExpirationRef.current) {
            logSpotify('Token expired or not available, refreshing');
            return await refreshAccessToken();
        }
        logSpotify('Using existing valid token');
        return accessToken;
    }, [accessToken, refreshAccessToken]);

    // Initialize the player when the SDK is ready
    useEffect(() => {
        if (!refreshToken) {
            logSpotify('No refresh token, skipping player initialization');
            return;
        }

        window.onSpotifyWebPlaybackSDKReady = async () => {
            logSpotify('Spotify Web Playback SDK ready');
            const token = await getValidToken();
            if (!token) {
                logSpotify('Failed to get valid token for player initialization');
                return;
            }

            logSpotify('Creating Spotify player instance', { playerName });
            const player = new window.Spotify.Player({
                name: playerName,
                getOAuthToken: async (cb: (token: string) => void) => {
                    logSpotify('Token requested by player');
                    const validToken = await getValidToken();
                    cb(validToken || '');
                },
                volume: 0.5
            });

            // Error handling
            player.addListener('initialization_error', ({ message }) => {
                console.error('Initialization error:', message);
                logSpotify('Initialization error', message);
                setState(prev => ({ ...prev, error: `Initialization error: ${message}` }));
            });

            player.addListener('authentication_error', ({ message }) => {
                console.error('Authentication error:', message);
                logSpotify('Authentication error', message);
                setState(prev => ({ ...prev, error: `Authentication error: ${message}` }));
                refreshAccessToken(); // Try to refresh the token
            });

            player.addListener('account_error', ({ message }) => {
                console.error('Account error:', message);
                logSpotify('Account error', message);
                setState(prev => ({ ...prev, error: `Account error: ${message}` }));
            });

            player.addListener('playback_error', ({ message }) => {
                console.error('Playback error:', message);
                logSpotify('Playback error', message);
                setState(prev => ({ ...prev, error: `Playback error: ${message}` }));
            });

            // Playback status updates
            const handlePlayerStateChanged = (state: Spotify.PlaybackState) => {
                if (!state) {
                    logSpotify('Received empty player state');
                    return;
                }

                logSpotify('Player state changed', {
                    track: state.track_window.current_track.name,
                    artist: state.track_window.current_track.artists[0]?.name,
                    isPlaying: !state.paused,
                    position: state.position,
                    duration: state.duration
                });

                setState(prev => ({
                    ...prev,
                    isPlaying: !state.paused,
                    position: state.position,
                    duration: state.duration,
                    currentTrack: state.track_window.current_track
                }));
            };

            player.addListener('player_state_changed', handlePlayerStateChanged);

            // Ready
            player.addListener('ready', ({ device_id }) => {
                logSpotify('Player ready', { device_id });
                console.log('Ready with Device ID', device_id);
                setState(prev => ({
                    ...prev,
                    connectionState: ConnectionState.CONNECTED,
                    isConnected: true,
                    deviceId: device_id,
                    error: null
                }));
            });

            // Not Ready
            player.addListener('not_ready', ({ device_id }) => {
                logSpotify('Player not ready', { device_id });
                console.log('Device ID has gone offline', device_id);
                setState(prev => ({
                    ...prev,
                    connectionState: ConnectionState.DISCONNECTED,
                    isConnected: false,
                    deviceId: null
                }));
            });

            // Connect to the player
            logSpotify('Connecting to Spotify player');
            const connected = await player.connect();
            if (connected) {
                logSpotify('Connected to Spotify Web Playback SDK successfully');
                console.log('Connected to Spotify Web Playback SDK');
            } else {
                logSpotify('Failed to connect to Spotify Web Playback SDK');
                console.error('Failed to connect to Spotify Web Playback SDK');
                setState(prev => ({ ...prev, error: 'Failed to connect to Spotify player' }));
            }

            playerRef.current = player;
        };

        return () => {
            if (playerRef.current) {
                logSpotify('Disconnecting Spotify player');
                playerRef.current.disconnect();
                playerRef.current = null;
            }

            if (positionIntervalRef.current) {
                logSpotify('Clearing position tracking interval');
                clearInterval(positionIntervalRef.current);
                positionIntervalRef.current = null;
            }
        };
    }, [refreshToken, getValidToken, playerName, refreshAccessToken]);

    // Player control functions
    const play = useCallback(async (uri?: string) => {
        if (!playerRef.current || !state.deviceId) {
            logSpotify('Cannot play: player or device ID not available');
            return;
        }

        const token = await getValidToken();
        if (!token) {
            logSpotify('Cannot play: failed to get valid token');
            return;
        }

        const body = uri ? { uris: [uri] } : undefined;
        logSpotify('Playing track', { uri, deviceId: state.deviceId });

        try {
            await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${state.deviceId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: body ? JSON.stringify(body) : undefined
            });
            logSpotify('Play command sent successfully');
        } catch (error) {
            console.error('Error playing track:', error);
            logSpotify('Error playing track', error);
        }
    }, [state.deviceId, getValidToken]);

    const pause = useCallback(async () => {
        if (!playerRef.current) {
            logSpotify('Cannot pause: player not available');
            return;
        }
        logSpotify('Pausing playback');
        try {
            await playerRef.current.pause();
            logSpotify('Playback paused successfully');
        } catch (error) {
            console.error('Error pausing playback:', error);
            logSpotify('Error pausing playback', error);
        }
    }, []);

    // Add this before togglePlay
    const transferPlayback = useCallback(async () => {
        if (!state.deviceId) {
            logSpotify('Cannot transfer playback: device ID not available');
            return false;
        }

        const token = await getValidToken();
        if (!token) {
            logSpotify('Cannot transfer playback: failed to get valid token');
            return false;
        }

        logSpotify('Transferring playback to device', { deviceId: state.deviceId });
        try {
            setState(prev => ({
                ...prev,
                connectionState: ConnectionState.TRANSFERRING,
                error: null,
                isTransferringPlayback: true
            }));

            const response = await fetch('https://api.spotify.com/v1/me/player', {
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

            if (!response.ok) {
                throw new Error(`Transfer failed with status: ${response.status}`);
            }

            logSpotify('Transfer request successful, waiting for confirmation');
            // Wait a moment for Spotify to process the transfer
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Get the current playback state to confirm transfer
            const currentState = await playerRef.current?.getCurrentState();
            logSpotify('Current state after transfer', {
                hasState: !!currentState,
                isPlaying: currentState ? !currentState.paused : null
            });

            setState(prev => ({
                ...prev,
                connectionState: currentState ? ConnectionState.READY : ConnectionState.CONNECTED,
                isTransferringPlayback: false,
                isConnected: true,
                isPlaying: currentState ? !currentState.paused : true
            }));

            logSpotify('Playback transferred successfully');
            return true;
        } catch (error) {
            console.error('Error transferring playback:', error);
            logSpotify('Error transferring playback', error);
            setState(prev => ({
                ...prev,
                connectionState: ConnectionState.ERROR,
                isTransferringPlayback: false,
                error: `Transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            }));
            return false;
        }
    }, [state.deviceId, getValidToken]);

    const togglePlay = useCallback(async () => {
        if (!playerRef.current) {
            logSpotify('Cannot toggle play: player not available');
            return;
        }
        logSpotify('Toggling playback state');
        try {
            await playerRef.current.togglePlay();
            logSpotify('Playback toggled successfully');
        } catch (error) {
            console.error('Error toggling playback:', error);
            logSpotify('Error toggling playback', error);
            if (error instanceof Error && error.message.includes('no list was loaded')) {
                logSpotify('No list loaded, attempting to transfer playback');
                await transferPlayback();
            }
        }
    }, [transferPlayback]);

    const nextTrack = useCallback(async () => {
        if (!playerRef.current) {
            logSpotify('Cannot skip to next track: player not available');
            return;
        }
        logSpotify('Skipping to next track');
        try {
            await playerRef.current.nextTrack();
            logSpotify('Skipped to next track successfully');
        } catch (error) {
            console.error('Error skipping to next track:', error);
            logSpotify('Error skipping to next track', error);
            if (error instanceof Error && error.message.includes('no list was loaded')) {
                logSpotify('No playlist loaded for next track');
                setState(prev => ({
                    ...prev,
                    error: 'No playlist loaded. Try transferring playback first.'
                }));
            }
        }
    }, []);

    const previousTrack = useCallback(async () => {
        if (!playerRef.current) {
            logSpotify('Cannot go to previous track: player not available');
            return;
        }
        logSpotify('Going to previous track');
        try {
            await playerRef.current.previousTrack();
            logSpotify('Went to previous track successfully');
        } catch (error) {
            console.error('Error going to previous track:', error);
            logSpotify('Error going to previous track', error);
            if (error instanceof Error && error.message.includes('no list was loaded')) {
                logSpotify('No playlist loaded for previous track');
                setState(prev => ({
                    ...prev,
                    error: 'No playlist loaded. Try transferring playback first.'
                }));
            }
        }
    }, []);

    const seek = useCallback(async (position: number) => {
        if (!playerRef.current) {
            logSpotify('Cannot seek: player not available');
            return;
        }
        logSpotify('Seeking to position', { position });
        try {
            await playerRef.current.seek(position);
            logSpotify('Seek successful');
        } catch (error) {
            console.error('Error seeking:', error);
            logSpotify('Error seeking', error);
        }
    }, []);

    // Control shuffle and repeat through the API
    const setShuffle = useCallback(async (shuffleState: boolean) => {
        if (!playerRef.current || !state.deviceId) {
            logSpotify('Cannot set shuffle: player or device ID not available');
            return;
        }

        const token = await getValidToken();
        if (!token) {
            logSpotify('Cannot set shuffle: failed to get valid token');
            return;
        }

        logSpotify('Setting shuffle state', { shuffleState });
        try {
            await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=${shuffleState}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            logSpotify('Shuffle state set successfully');
        } catch (error) {
            console.error('Error setting shuffle:', error);
            logSpotify('Error setting shuffle', error);
        }
    }, [state.deviceId, getValidToken]);

    const setRepeatMode = useCallback(async (mode: 'off' | 'track' | 'context') => {
        if (!playerRef.current || !state.deviceId) {
            logSpotify('Cannot set repeat mode: player or device ID not available');
            return;
        }

        const token = await getValidToken();
        if (!token) {
            logSpotify('Cannot set repeat mode: failed to get valid token');
            return;
        }

        logSpotify('Setting repeat mode', { mode });
        try {
            await fetch(`https://api.spotify.com/v1/me/player/repeat?state=${mode}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            logSpotify('Repeat mode set successfully');
        } catch (error) {
            console.error('Error setting repeat mode:', error);
            logSpotify('Error setting repeat mode', error);
        }
    }, [state.deviceId, getValidToken]);

    // Add setVolume function
    const setVolume = useCallback(async (volumePercent: number) => {
        if (!playerRef.current) {
            logSpotify('Cannot set volume: player not available');
            return;
        }

        logSpotify('Setting volume', { volumePercent });
        try {
            await playerRef.current.setVolume(volumePercent);
            logSpotify('Volume set successfully');
        } catch (error) {
            console.error('Error setting volume:', error);
            logSpotify('Error setting volume', error);
        }
    }, []);

    return {
        ...state,
        player: playerRef.current,
        play,
        pause,
        togglePlay,
        nextTrack,
        previousTrack,
        seek,
        setShuffle,
        setRepeatMode,
        transferPlayback,
        setVolume
    };
}; 