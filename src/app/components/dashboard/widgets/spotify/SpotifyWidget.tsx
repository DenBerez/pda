import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    Box,
    Typography,
    CircularProgress,
    Paper,
    IconButton,
    Avatar,
    Divider,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Chip,
    Stack,
    Button,
    Slider,
    LinearProgress,
    Tooltip
} from '@mui/material';
import { Widget } from '../../types';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import RepeatIcon from '@mui/icons-material/Repeat';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RefreshIcon from '@mui/icons-material/Refresh';
import LaunchIcon from '@mui/icons-material/Launch';
import DevicesIcon from '@mui/icons-material/Devices';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeDownIcon from '@mui/icons-material/VolumeDown';
import VolumeMuteIcon from '@mui/icons-material/VolumeMute';
import { useSpotifyWebPlayback } from '@/app/hooks/useSpotifyWebPlayback';
import { useOAuth2Connection } from '@/app/hooks/useOAuth2Connection';
import { alpha } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import { Theme } from '@mui/material/styles';
import { SpotifyWidgetProps } from './types';
import CompactSpotifyView from './CompactSpotifyView'
import NormalSpotifyView from './NormalSpotifyView'
import DetailedSpotifyView from './DetailedSpotifyView'
import { SpotifyClient } from '@/app/utils/spotifyClient';
import { useSpotifyState } from '@/app/hooks/useSpotifyState';
import { ConnectionState } from '@/app/hooks/useSpotifyWebPlayback';


// Add this type at the top of the file
type LayoutOption = 'compact' | 'normal' | 'detailed';


interface VolumeControlProps {
    theme: Theme;
    volume: number;
    showVolumeControls: boolean;
    handleVolumeChange: (event: Event, newValue: number | number[]) => void;
    getVolumeIcon: () => React.ReactElement;
    toggleMute: () => void;
}

const VolumeButton: React.FC<{
    volume: number;
    showVolumeControls: boolean;
    setShowVolumeControls: (show: boolean) => void;
    getVolumeIcon: () => React.ReactElement;
    toggleMute: () => void;
    compact?: boolean;
}> = ({
    volume,
    showVolumeControls,
    setShowVolumeControls,
    getVolumeIcon,
    toggleMute,
    compact = false
}) => (
        <IconButton
            size={compact ? "small" : "medium"}
            onClick={toggleMute}
            onMouseEnter={() => setShowVolumeControls(true)}
            onMouseLeave={() => setShowVolumeControls(false)}
            sx={{
                position: 'relative',
                zIndex: 2
            }}
        >
            {getVolumeIcon()}
        </IconButton>
    );

const SpotifyWidget: React.FC<SpotifyWidgetProps> = ({ widget, editMode, onUpdateWidget }) => {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [recentTracks, setRecentTracks] = useState<any[]>([]);
    const [showRecent, setShowRecent] = useState(false);
    const [volume, setVolume] = useState(50);
    const [showVolumeControls, setShowVolumeControls] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isTransferring, setIsTransferring] = useState(false);

    const refreshToken = widget.config?.refreshToken;
    const layoutOption = widget.config?.layoutOption || 'normal';

    const client = useMemo(() =>
        refreshToken ? new SpotifyClient(refreshToken) : null,
        [refreshToken]
    );

    const {
        currentTrack,
        isPlaying,
        recentTracks: spotifyRecentTracks,
        error: spotifyError,
        isLoading,
        optimisticTogglePlay,
        optimisticNextTrack,
        optimisticPreviousTrack
    } = useSpotifyState(client!);

    // Initialize Spotify Web Playback
    const {
        connectionState,
        isConnected: isPlayerConnected,
        position,
        duration,
        error: sdkError,
        togglePlay,
        previousTrack,
        nextTrack,
        seek,
        setVolume: setPlayerVolume,
        transferPlayback
    } = useSpotifyWebPlayback({
        accessToken: null,
        refreshToken: refreshToken || null,
        playerName: 'Dashboard Player'
    });

    // Add local state
    const [localPlaybackState, setLocalPlaybackState] = useState({
        isPlaying: false,
        position: 0
    });

    // Update local state when Spotify state changes
    useEffect(() => {
        // Only update if there's a significant change to avoid flickering
        const positionDiff = Math.abs(localPlaybackState.position - position);
        const isPlayingChanged = localPlaybackState.isPlaying !== isPlaying;

        if (isPlayingChanged || positionDiff > 1000) {
            setLocalPlaybackState({
                isPlaying,
                position
            });
        }
    }, [isPlaying, position]);

    // Add this effect to poll for updates
    useEffect(() => {
        if (!client || !isPlayerConnected) return;

        const pollInterval = setInterval(async () => {
            try {
                const currentData = await client.getCurrentTrack();
                if (currentData) {
                    setLocalPlaybackState({
                        isPlaying: currentData.is_playing || false,
                        position: currentData.progress_ms || 0
                    });
                }
            } catch (error) {
                console.error('Error polling Spotify state:', error);
            }
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(pollInterval);
    }, [client, isPlayerConnected]);

    // Modify the control handlers
    const handleTogglePlay = useCallback(async () => {
        try {
            // Update local state immediately for responsive UI
            setLocalPlaybackState(prev => ({
                ...prev,
                isPlaying: !prev.isPlaying
            }));

            // Call the actual Spotify Web Playback SDK method
            await togglePlay();

            // After successful toggle, update the state from Spotify if needed
            if (client) {
                setTimeout(async () => {
                    const currentData = await client.getCurrentTrack();
                    if (currentData) {
                        setLocalPlaybackState({
                            isPlaying: currentData.is_playing || false,
                            position: currentData.progress_ms || 0
                        });
                    }
                }, 500); // Small delay to allow Spotify to update
            }
        } catch (error) {
            console.error('Error toggling playback:', error);
            setStatusMessage('Failed to toggle playback');
            setTimeout(() => setStatusMessage(null), 3000);

            // Revert local state on error
            setLocalPlaybackState(prev => ({
                ...prev,
                isPlaying: !prev.isPlaying
            }));
        }
    }, [togglePlay, client]);

    const handleNextTrack = useCallback(async () => {
        try {
            await nextTrack();

            // After skipping, refresh the current track data
            if (client) {
                setTimeout(async () => {
                    const currentData = await client.getCurrentTrack();
                    if (currentData) {
                        setLocalPlaybackState({
                            isPlaying: currentData.is_playing || false,
                            position: 0 // Reset position for new track
                        });
                    }
                }, 500);
            }
        } catch (error) {
            console.error('Error skipping track:', error);
            setStatusMessage('Failed to skip to next track');
            setTimeout(() => setStatusMessage(null), 3000);
        }
    }, [nextTrack, client]);

    const handlePreviousTrack = useCallback(async () => {
        try {
            await previousTrack();

            // After going to previous track, refresh the current track data
            if (client) {
                setTimeout(async () => {
                    const currentData = await client.getCurrentTrack();
                    if (currentData) {
                        setLocalPlaybackState({
                            isPlaying: currentData.is_playing || false,
                            position: 0 // Reset position for new track
                        });
                    }
                }, 500);
            }
        } catch (error) {
            console.error('Error going to previous track:', error);
            setStatusMessage('Failed to go to previous track');
            setTimeout(() => setStatusMessage(null), 3000);
        }
    }, [previousTrack, client]);

    // Fetch recent tracks
    const fetchRecentTracks = useCallback(async () => {
        if (!refreshToken) return;

        try {
            const data = await client!.getRecentTracks(5);
            setRecentTracks(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    }, [refreshToken, client]);

    useEffect(() => {
        fetchRecentTracks();
    }, [fetchRecentTracks]);

    // Handle seek change
    const handleSeekChange = useCallback((event: Event, newValue: number | number[]) => {
        const newPosition = Array.isArray(newValue) ? newValue[0] : newValue;
        seek(newPosition);
    }, [seek]);

    // Handle volume change
    const handleVolumeChange = useCallback((event: Event, newValue: number | number[]) => {
        const newVolume = Array.isArray(newValue) ? newValue[0] : newValue;
        setVolume(newVolume);
        setPlayerVolume(newVolume / 100);
    }, [setPlayerVolume]);

    // Toggle mute
    const toggleMute = useCallback(() => {
        if (volume > 0) {
            setVolume(0);
            setPlayerVolume(0);
        } else {
            setVolume(50);
            setPlayerVolume(0.5);
        }
    }, [volume, setPlayerVolume]);

    // Get volume icon based on level
    const getVolumeIcon = useCallback(() => {
        if (volume === 0) return <VolumeMuteIcon />;
        if (volume < 50) return <VolumeDownIcon />;
        return <VolumeUpIcon />;
    }, [volume]);

    // Format duration
    const formatDuration = useCallback((ms: number) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, []);

    // Play preview
    const playPreview = useCallback((url: string) => {
        const audio = new Audio(url);
        audio.play();
    }, []);

    // Open in Spotify
    const openInSpotify = useCallback((uri: string) => {
        window.open(uri, '_blank');
    }, []);

    // Toggle view between current track and recent tracks
    const toggleView = useCallback(() => {
        setShowRecent(prev => !prev);
    }, []);

    // Update handleTransferPlayback
    const handleTransferPlayback = useCallback(async () => {
        try {
            setIsTransferring(true);
            setStatusMessage('Transferring playback to browser...');
            const success = await transferPlayback();

            if (success) {
                setStatusMessage('Playback transferred successfully!');
                // Force refresh current track data
                const currentData = await client?.getCurrentTrack();
                if (currentData) {
                    setLocalPlaybackState({
                        isPlaying: currentData.is_playing || false,
                        position: currentData.progress_ms || 0
                    });
                }
            } else {
                setStatusMessage('Failed to transfer playback. Try again.');
            }

            setTimeout(() => setStatusMessage(null), 3000);
        } catch (error) {
            console.error('Transfer error:', error);
            setStatusMessage('Error transferring playback');
            setTimeout(() => setStatusMessage(null), 3000);
        } finally {
            setIsTransferring(false);
        }
    }, [transferPlayback, client]);

    // Loading state
    if (connectionState === ConnectionState.DISCONNECTED ||
        connectionState === ConnectionState.CONNECTING) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress size={40} />
                <Typography sx={{ mt: 2 }}>
                    Connecting to Spotify...
                </Typography>
            </Box>
        );
    }

    if (connectionState === ConnectionState.CONNECTED && !currentTrack) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Button
                    variant="contained"
                    startIcon={<DevicesIcon />}
                    onClick={handleTransferPlayback}
                    sx={{ mt: 1 }}
                >
                    Transfer Playback to Browser
                </Button>
            </Box>
        );
    }

    // Error state
    if (error || spotifyError || sdkError) {
        return (
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography color="error">{error || spotifyError || sdkError}</Typography>
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={fetchRecentTracks}
                    sx={{ mt: 2 }}
                >
                    Retry
                </Button>
            </Box>
        );
    }

    // Not connected state
    if (!refreshToken) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <MusicNoteIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>Spotify Not Connected</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Edit this widget to connect your Spotify account.
                </Typography>
            </Box>
        );
    }

    // Common props for all views
    const commonProps = {
        currentTrack,
        isPlaying: localPlaybackState.isPlaying,
        position: localPlaybackState.position,
        duration,
        volume,
        recentTracks,
        showRecent,
        isPlayerConnected,
        isTransferringPlayback: isTransferring,
        handleTransferPlayback,
        togglePlay: handleTogglePlay,
        previousTrack: handlePreviousTrack,
        nextTrack: handleNextTrack,
        handleSeekChange,
        handleVolumeChange,
        showVolumeControls,
        setShowVolumeControls,
        getVolumeIcon,
        toggleMute,
        playPreview,
        openInSpotify,
        formatDuration,
        toggleView,
        theme,
        showTransferButton: !isPlayerConnected || (!isPlaying && !currentTrack)
    };

    return (
        <Box ref={containerRef} sx={{
            flexGrow: 1,
            overflow: 'auto',
            position: 'relative',
            p: layoutOption === 'compact' ? 1 : 2
        }}>
            {layoutOption === 'compact' && <CompactSpotifyView {...commonProps} />}
            {layoutOption === 'normal' && <NormalSpotifyView {...commonProps} />}
            {layoutOption === 'detailed' && <DetailedSpotifyView {...commonProps} />}

            <VolumeControl
                theme={theme}
                volume={volume}
                showVolumeControls={showVolumeControls}
                handleVolumeChange={handleVolumeChange}
                getVolumeIcon={getVolumeIcon}
                toggleMute={toggleMute}
            />

            {statusMessage && (
                <Typography
                    variant="caption"
                    sx={{
                        position: 'absolute',
                        bottom: 8,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        bgcolor: 'background.paper',
                        px: 2,
                        py: 0.5,
                        borderRadius: 1,
                        boxShadow: 1
                    }}
                >
                    {statusMessage}
                </Typography>
            )}
        </Box>
    );
};

export const HandleVolumeChange = (event: Event, newValue: number | number[], setVolume: (volume: number) => void, setPlayerVolume: (volume: number) => void) => {
    const newVolume = Array.isArray(newValue) ? newValue[0] : newValue;
    setVolume(newVolume);
    setPlayerVolume(newVolume / 100);
}

export const VolumeControl: React.FC<VolumeControlProps> = ({
    theme,
    volume,
    showVolumeControls,
    handleVolumeChange,
    getVolumeIcon,
    toggleMute
}) => (
    <Box
        sx={{
            position: 'absolute',
            right: 16,
            bottom: 72,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: alpha(theme.palette.background.paper, 0.95),
            borderRadius: 2,
            padding: 1,
            boxShadow: theme.shadows[4],
            opacity: showVolumeControls ? 1 : 0,
            visibility: showVolumeControls ? 'visible' : 'hidden',
            transition: 'all 0.2s ease-in-out',
            zIndex: 10,
        }}
    >
        <Slider
            value={volume}
            onChange={handleVolumeChange}
            orientation="vertical"
            size="small"
            sx={{
                height: 100,
                '& .MuiSlider-thumb': {
                    width: 12,
                    height: 12,
                    '&:hover': {
                        boxShadow: `0 0 0 8px ${alpha(theme.palette.primary.main, 0.16)}`
                    }
                }
            }}
        />
        <IconButton size="small" sx={{ mt: 1 }} onClick={toggleMute}>
            {getVolumeIcon()}
        </IconButton>
    </Box>
);

export default SpotifyWidget; 