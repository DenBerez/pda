import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { Widget } from '../types';
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

// Sample data for demonstration when not connected
const sampleSpotifyData = {
    isPlaying: true,
    currentTrack: {
        name: "Bohemian Rhapsody",
        album: {
            name: "A Night at the Opera",
            images: [{ url: "https://upload.wikimedia.org/wikipedia/en/4/4d/Queen_A_Night_At_The_Opera.png" }]
        },
        artists: [{ name: "Queen" }],
        duration_ms: 354947,
        preview_url: "https://p.scdn.co/mp3-preview/6d00d0aafe0a9b02a2b2c1156e9262d6cd39bd85?cid=774b29d4f13844c495f206cafdad9c86"
    },
    recentTracks: [
        {
            track: {
                id: "recent1",
                name: "Hotel California",
                album: {
                    name: "Hotel California",
                    images: [{ url: "https://upload.wikimedia.org/wikipedia/en/4/49/Hotelcalifornia.jpg" }]
                },
                artists: [{ name: "Eagles" }],
                duration_ms: 391375,
                preview_url: "https://p.scdn.co/mp3-preview/d9b4b8df6c6a4f65c3ab0931e1e7cb0c7f2d6b73?cid=774b29d4f13844c495f206cafdad9c86"
            },
            played_at: "2023-10-15T12:22:45Z"
        },
        {
            track: {
                id: "recent2",
                name: "Imagine",
                album: {
                    name: "Imagine",
                    images: [{ url: "https://upload.wikimedia.org/wikipedia/en/6/69/ImagineCover.jpg" }]
                },
                artists: [{ name: "John Lennon" }],
                duration_ms: 183000,
                preview_url: null
            },
            played_at: "2023-10-15T12:18:12Z"
        }
    ]
};

// Add this type at the top of the file
type LayoutOption = 'compact' | 'normal' | 'detailed';

interface SpotifyWidgetProps {
    widget: Widget & {
        config?: {
            layoutOption?: LayoutOption;
            refreshToken?: string;
        };
    };
    editMode: boolean;
    onUpdateWidget: (widget: Widget) => void;
}

const SpotifyWidget: React.FC<SpotifyWidgetProps> = ({ widget, editMode, onUpdateWidget }) => {
    const [recentTracks, setRecentTracks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showRecent, setShowRecent] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isTransferringPlayback, setIsTransferringPlayback] = useState(false);
    const [volume, setVolume] = useState<number>(20);
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [username, setUsername] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const theme = useTheme();

    // Use the OAuth2 hook for consistent auth handling
    const { refreshToken, isConnected, connect, disconnect } = useOAuth2Connection({
        widget,
        messageType: 'SPOTIFY_AUTH_SUCCESS',
        authEndpoint: '/api/spotify/auth',
        onUpdateWidget
    });

    // Use the Spotify Web Playback SDK hook with the refreshToken from OAuth2
    const {
        isConnected: isPlayerConnected,
        isPlaying,
        currentTrack,
        deviceId,
        error: sdkError,
        position,
        duration,
        play,
        pause,
        togglePlay,
        nextTrack,
        previousTrack,
        seek,
        setShuffle,
        setRepeatMode,
        transferPlayback,
        setVolume: setPlayerVolume,
        player
    } = useSpotifyWebPlayback({
        accessToken: accessToken || null,
        refreshToken,
        playerName: 'Dashboard Player'
    });

    // Get layout option from widget config or default to 'normal'
    const layoutOption = widget.config?.layoutOption || 'normal';

    // Add type guard function
    const isCompactLayout = (layout: string): layout is 'compact' => layout === 'compact';

    // Fetch initial access token
    useEffect(() => {
        const getInitialToken = async () => {
            if (!refreshToken) {
                setLoading(false);
                setInitialLoadComplete(true);
                return;
            }

            try {
                console.log('Attempting to get initial token...');
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
                    const errorData = await response.json();
                    console.error('Token response not OK:', response.status, errorData);
                    throw new Error(`Failed to get access token: ${response.status}`);
                }

                const data = await response.json();
                console.log('Got access token, expires in:', data.expires_in);
                setAccessToken(data.access_token);
            } catch (err) {
                console.error('Error getting initial token:', err);
                setError('Failed to authenticate with Spotify');
            } finally {
                setInitialLoadComplete(true);
            }
        };

        getInitialToken();
    }, [refreshToken]);

    // Fetch recent tracks with optimized loading
    const fetchRecentTracks = useCallback(async () => {
        if (!isConnected) {
            // Don't clear existing tracks, just skip the fetch
            setLoading(false);
            return;
        }

        if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
        }

        loadingTimeoutRef.current = setTimeout(() => {
            if (!initialLoadComplete) return;
            setLoading(true);
        }, 500);

        try {
            const params = new URLSearchParams({
                action: 'recent',
                refreshToken
            });

            const response = await fetch(`/api/spotify?${params.toString()}`);
            if (!response.ok) {
                throw new Error('Failed to fetch recent tracks');
            }

            const data = await response.json();
            if (data.recentTracks && data.recentTracks.length > 0) {
                setRecentTracks(data.recentTracks);
            }
            // Don't clear tracks if the response is empty
        } catch (err) {
            console.error('Error fetching recent tracks:', err);
            setError('Failed to load recent tracks');
            // Don't clear existing tracks on error
        } finally {
            if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
                loadingTimeoutRef.current = null;
            }
            setLoading(false);
        }
    }, [refreshToken, isConnected, initialLoadComplete]);

    // Fetch recent tracks on mount and when auth state changes
    useEffect(() => {
        if (initialLoadComplete && isConnected) {
            fetchRecentTracks();

            // Fetch less frequently to avoid race conditions
            const intervalId = setInterval(fetchRecentTracks, 60000); // 60 seconds

            // Add a small delay before first fetch to ensure stable connection
            const initialFetchTimeout = setTimeout(() => {
                fetchRecentTracks();
            }, 2000);

            return () => {
                clearInterval(intervalId);
                clearTimeout(initialFetchTimeout);
            };
        }
    }, [fetchRecentTracks, isConnected, initialLoadComplete]);

    // Clean up timeout on unmount
    useEffect(() => {
        return () => {
            if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
            }
        };
    }, []);

    // Handle transfer playback to this device
    const handleTransferPlayback = async () => {
        setIsTransferringPlayback(true);
        try {
            await transferPlayback();
            // showStatus('Playback transferred to this device');
        } catch (err) {
            console.error('Error transferring playback:', err);
            // showStatus('Failed to transfer playback');
        } finally {
            setIsTransferringPlayback(false);
        }
    };

    // Audio player functions for previews
    const playPreview = (previewUrl: string) => {
        if (!previewUrl) return;

        if (audioRef.current) {
            audioRef.current.pause();
        }

        audioRef.current = new Audio(previewUrl);
        audioRef.current.setAttribute('data-spotify-player', 'true');
        audioRef.current.play();
    };

    const stopPreview = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    };

    // Format milliseconds to mm:ss
    const formatDuration = (ms: number) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Toggle between current and recent views
    const toggleView = () => {
        setShowRecent(!showRecent);
    };

    // Add this function to open track in Spotify
    const openInSpotify = (uri: string) => {
        if (uri) {
            window.open(uri.replace('spotify:track:', 'https://open.spotify.com/track/'), '_blank');
        }
    };

    // Show messages when actions are performed
    const showStatus = useCallback((message: string) => {
        setStatusMessage(message);
        setTimeout(() => setStatusMessage(null), 3000);
    }, []);

    // Handle seek change
    const handleSeekChange = (_event: Event, newValue: number | number[]) => {
        if (typeof newValue === 'number') {
            seek(newValue);
        }
    };

    // Handle volume change
    const handleVolumeChange = useCallback((event: Event, newValue: number | number[]) => {
        if (typeof newValue === 'number') {
            setVolume(newValue);
            setPlayerVolume(newValue / 100);
        }
    }, [setPlayerVolume]);

    // Get volume icon based on volume level
    const getVolumeIcon = () => {
        if (volume === 0) return <VolumeMuteIcon />;
        if (volume < 50) return <VolumeDownIcon />;
        return <VolumeUpIcon />;
    };

    // Status message component
    const StatusMessage = ({ message }: { message: string }) => (
        <Box
            sx={{
                position: 'absolute',
                bottom: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                bgcolor: 'background.paper',
                px: 2,
                py: 1,
                borderRadius: 2,
                boxShadow: 1,
                zIndex: 10
            }}
        >
            <Typography variant="body2">{message}</Typography>
        </Box>
    );

    // Add this function to fetch user profile
    const fetchUserProfile = useCallback(async () => {
        if (!accessToken) return;

        try {
            const response = await fetch('https://api.spotify.com/v1/me', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user profile');
            }

            const data = await response.json();
            setUsername(data.display_name || data.id);
        } catch (err) {
            console.error('Error fetching user profile:', err);
        }
    }, [accessToken]);

    // Call this when we get an access token
    useEffect(() => {
        if (accessToken) {
            fetchUserProfile();
        }
    }, [accessToken, fetchUserProfile]);

    // Loading state
    if (loading) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress size={40} />
                <Typography sx={{ mt: 2 }}>Loading Spotify data...</Typography>
            </Box>
        );
    }

    // Error state
    if (error || sdkError) {
        return (
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography color="error">{error || sdkError}</Typography>
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
                    Edit this widget to connect your Spotify account and display your currently playing music and recently played tracks.
                </Typography>

            </Box>
        );
    }

    // Normal layout
    return (
        <Paper sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            bgcolor: 'transparent',
            boxShadow: 'none'
        }}>
            {/* Content */}
            <Box ref={containerRef} sx={{
                flexGrow: 1,
                overflow: 'auto',
                position: 'relative',
                // Apply different padding based on layout option
                p: isCompactLayout(layoutOption) ? 1 : 2
            }}>
                {/* Toggle button with styling based on layout option */}
                {layoutOption !== 'detailed' && (
                    <Box sx={{
                        position: 'absolute',
                        top: isCompactLayout(layoutOption) ? 4 : 8,
                        right: isCompactLayout(layoutOption) ? 4 : 8,
                        zIndex: 2
                    }}>
                        <Tooltip title={showRecent ? "Show Player" : "Show History"}>
                            <IconButton
                                onClick={toggleView}
                                size={isCompactLayout(layoutOption) ? 'small' : 'medium'}
                            >
                                {showRecent ?
                                    <MusicNoteIcon fontSize={isCompactLayout(layoutOption) ? 'small' : 'medium'} /> :
                                    <AccessTimeIcon fontSize={isCompactLayout(layoutOption) ? 'small' : 'medium'} />
                                }
                            </IconButton>
                        </Tooltip>
                    </Box>
                )}

                {/* Title based on layout option */}
                {layoutOption === 'detailed' && (
                    <Box sx={{
                        mb: 2,
                        pb: 1,
                        borderBottom: '1px solid',
                        borderColor: 'divider'
                    }}>
                        <Typography
                            variant="h6"
                            sx={{ fontWeight: 'bold' }}
                        >
                            {username ? `${username}'s Spotify` : 'Spotify'}
                        </Typography>
                    </Box>
                )}

                {layoutOption === 'detailed' ? (
                    // Detailed layout shows both player and recent tracks
                    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        {/* Player section */}
                        {currentTrack ? (
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                mb: 3,

                            }}>
                                <Box sx={{
                                    display: 'flex',
                                    mb: 3,
                                    alignItems: 'center',
                                    gap: 3
                                }}>
                                    <Avatar
                                        src={currentTrack.album.images?.[0]?.url}
                                        alt={currentTrack.name}
                                        variant="rounded"
                                        sx={{
                                            width: isCompactLayout(layoutOption) ? 48 : 120,
                                            height: isCompactLayout(layoutOption) ? 48 : 120,
                                            mr: isCompactLayout(layoutOption) ? 1 : 3,
                                            boxShadow: isCompactLayout(layoutOption) ? 1 : 3,
                                            borderRadius: 1
                                        }}
                                    >
                                        <MusicNoteIcon sx={{ fontSize: 40 }} />
                                    </Avatar>

                                    <Box sx={{ flex: 1 }}>
                                        <Typography
                                            variant={isCompactLayout(layoutOption) ? 'body1' : 'h6'}
                                            sx={{
                                                fontWeight: 'medium',
                                                mb: 0.5,
                                                lineHeight: isCompactLayout(layoutOption) ? 1.2 : 1.5,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {currentTrack.name}
                                        </Typography>

                                        <Typography
                                            variant={isCompactLayout(layoutOption) ? 'caption' : 'body1'}
                                            sx={{
                                                color: 'text.secondary',
                                                lineHeight: isCompactLayout(layoutOption) ? 1.2 : 1.5,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {currentTrack.artists.map((artist: { name: string }) => artist.name).join(', ')}
                                        </Typography>

                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ mb: 2 }}
                                        >
                                            {currentTrack.album.name}
                                        </Typography>

                                        <Chip
                                            label={isPlaying ? "Now Playing" : "Paused"}
                                            color={isPlaying ? "primary" : "default"}
                                            size="small"
                                            sx={{
                                                borderRadius: '6px',
                                                '& .MuiChip-label': {
                                                    px: 2
                                                }
                                            }}
                                        />
                                    </Box>
                                </Box>

                                <Box sx={{ mt: 2, mb: 3 }}>
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        mb: 1
                                    }}>
                                        <Typography variant="caption" color="text.secondary">
                                            {formatDuration(position)}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {formatDuration(duration)}
                                        </Typography>
                                    </Box>

                                    <Slider
                                        value={position}
                                        min={0}
                                        max={duration}
                                        onChange={handleSeekChange}
                                        aria-labelledby="continuous-slider"
                                        size={isCompactLayout(layoutOption) ? 'small' : 'medium'}
                                        sx={{
                                            '& .MuiSlider-track': {
                                                background: `linear-gradient(90deg, 
                                                    ${theme.palette.primary.main} 0%, 
                                                    ${theme.palette.primary.light} 100%)`
                                            },
                                            '& .MuiSlider-thumb': {
                                                width: isCompactLayout(layoutOption) ? 8 : 12,
                                                height: isCompactLayout(layoutOption) ? 8 : 12,
                                                '&:hover, &.Mui-active': {
                                                    boxShadow: `0 0 0 8px ${alpha(theme.palette.primary.main, 0.16)}`
                                                }
                                            }
                                        }}
                                    />
                                </Box>

                                <Stack
                                    direction="row"
                                    spacing={2}
                                    justifyContent="center"
                                    alignItems="center"
                                    sx={{ mt: 'auto' }}
                                >
                                    <IconButton
                                        onClick={previousTrack}
                                        sx={{
                                            color: alpha(theme.palette.text.primary, 0.7),
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                color: theme.palette.text.primary,
                                                transform: 'scale(1.1)'
                                            }
                                        }}
                                    >
                                        <SkipPreviousIcon />
                                    </IconButton>

                                    <IconButton
                                        onClick={togglePlay}
                                        sx={{
                                            bgcolor: theme.palette.primary.main,
                                            color: theme.palette.primary.contrastText,
                                            width: 56,
                                            height: 56,
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                bgcolor: theme.palette.primary.dark,
                                                transform: 'scale(1.1)'
                                            }
                                        }}
                                    >
                                        {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                                    </IconButton>

                                    <IconButton
                                        onClick={nextTrack}
                                        sx={{
                                            color: alpha(theme.palette.text.primary, 0.7),
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                color: theme.palette.text.primary,
                                                transform: 'scale(1.1)'
                                            }
                                        }}
                                    >
                                        <SkipNextIcon />
                                    </IconButton>
                                </Stack>

                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    mt: 2,
                                    width: '100%'
                                }}>
                                    <IconButton size="medium">
                                        {getVolumeIcon()}
                                    </IconButton>
                                    <Slider
                                        value={volume}
                                        onChange={handleVolumeChange}
                                        aria-labelledby="volume-slider"
                                        sx={{
                                            ml: 2,
                                            flexGrow: 1,
                                            '& .MuiSlider-track': {
                                                background: `linear-gradient(90deg, 
                                                    ${theme.palette.primary.main} 0%, 
                                                    ${theme.palette.primary.light} 100%)`
                                            }
                                        }}
                                    />
                                </Box>
                            </Box>
                        ) : (
                            <Box sx={{ p: 2, textAlign: 'center', mb: 3 }}>
                                <MusicNoteIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                                <Typography variant="h6" gutterBottom>
                                    {isPlayerConnected ? 'No track playing' : 'Connect to start playing'}
                                </Typography>
                                {isPlayerConnected ? (
                                    <Button
                                        variant="contained"
                                        onClick={handleTransferPlayback}
                                        disabled={isTransferringPlayback}
                                        sx={{ mt: 2 }}
                                    >
                                        Transfer Playback to This Device
                                    </Button>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        Waiting for Spotify connection...
                                    </Typography>
                                )}
                            </Box>
                        )}

                        {/* Divider between player and recent tracks */}
                        <Divider sx={{ my: 2 }}>
                            <Chip label="Recent Tracks" />
                        </Divider>

                        {/* Recent tracks section */}
                        <List sx={{ overflow: 'auto' }}>
                            {recentTracks.length > 0 ? (
                                recentTracks.map((item: any, index: number) => (
                                    <ListItem
                                        key={`${item.track.id}-${index}`}
                                        secondaryAction={
                                            <Box>
                                                {item.track.preview_url && (
                                                    <IconButton
                                                        edge="end"
                                                        onClick={() => playPreview(item.track.preview_url)}
                                                        sx={{ mr: 1 }}
                                                    >
                                                        <PlayArrowIcon />
                                                    </IconButton>
                                                )}
                                                <IconButton
                                                    edge="end"
                                                    onClick={() => openInSpotify(item.track.uri)}
                                                >
                                                    <LaunchIcon />
                                                </IconButton>
                                            </Box>
                                        }
                                    >
                                        <ListItemAvatar>
                                            <Avatar
                                                src={item.track.album.images?.[0]?.url}
                                                alt={item.track.name}
                                                variant="rounded"
                                            >
                                                <MusicNoteIcon />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={item.track.name}
                                            secondary={
                                                <>
                                                    {item.track.artists.map((artist: any) => artist.name).join(', ')}
                                                    <br />
                                                    {item.track.album.name}
                                                    <br />
                                                    <Typography variant="caption" color="text.secondary">
                                                        {new Date(item.played_at).toLocaleString()}
                                                    </Typography>
                                                </>
                                            }
                                        />
                                    </ListItem>
                                ))
                            ) : (
                                <Typography variant="body1" sx={{ p: 2 }}>
                                    No recent tracks found
                                </Typography>
                            )}
                        </List>
                    </Box>
                ) : (
                    // For compact and normal layouts, keep the toggle functionality
                    <>
                        {showRecent ? (
                            <List sx={{
                                mt: isCompactLayout(layoutOption) ? 0 : 2,
                                // Adjust spacing for compact layout
                                '& .MuiListItem-root': isCompactLayout(layoutOption) ? {
                                    py: 0.5
                                } : {}
                            }}>
                                {recentTracks.length > 0 ? (
                                    recentTracks.map((item: any, index: number) => (
                                        <ListItem
                                            key={`${item.track.id}-${index}`}
                                            secondaryAction={
                                                <Box>
                                                    {item.track.preview_url && (
                                                        <IconButton
                                                            edge="end"
                                                            onClick={() => playPreview(item.track.preview_url)}
                                                            sx={{ mr: 1 }}
                                                            size={isCompactLayout(layoutOption) ? 'small' : 'medium'}
                                                        >
                                                            <PlayArrowIcon fontSize={isCompactLayout(layoutOption) ? 'small' : 'medium'} />
                                                        </IconButton>
                                                    )}
                                                    <IconButton
                                                        edge="end"
                                                        onClick={() => openInSpotify(item.track.uri)}
                                                        size={isCompactLayout(layoutOption) ? 'small' : 'medium'}
                                                    >
                                                        <LaunchIcon fontSize={isCompactLayout(layoutOption) ? 'small' : 'medium'} />
                                                    </IconButton>
                                                </Box>
                                            }
                                        >
                                            <ListItemAvatar>
                                                <Avatar
                                                    src={item.track.album.images?.[0]?.url}
                                                    alt={item.track.name}
                                                    variant="rounded"
                                                    sx={isCompactLayout(layoutOption) ? { width: 32, height: 32 } : {}}
                                                >
                                                    <MusicNoteIcon />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={item.track.name}
                                                secondary={
                                                    <>
                                                        {item.track.artists.map((artist: any) => artist.name).join(', ')}
                                                        {layoutOption !== 'compact' && (
                                                            <>
                                                                <br />
                                                                {item.track.album.name}
                                                                <br />
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {new Date(item.played_at).toLocaleString()}
                                                                </Typography>
                                                            </>
                                                        )}
                                                    </>
                                                }
                                                primaryTypographyProps={{
                                                    variant: isCompactLayout(layoutOption) ? 'body2' : 'body1'
                                                }}
                                                secondaryTypographyProps={{
                                                    variant: isCompactLayout(layoutOption) ? 'caption' : 'body2'
                                                }}
                                            />
                                        </ListItem>
                                    ))
                                ) : (
                                    <Typography variant={isCompactLayout(layoutOption) ? 'body2' : 'body1'} sx={{ p: 2 }}>
                                        No recent tracks found
                                    </Typography>
                                )}
                            </List>
                        ) : (
                            <>
                                {currentTrack ? (
                                    <Box sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        height: '100%',
                                        pt: isCompactLayout(layoutOption) ? 1 : 2,
                                        px: isCompactLayout(layoutOption) ? 1 : 2,
                                        gap: isCompactLayout(layoutOption) ? 0.5 : 1
                                    }}>
                                        <Box sx={{
                                            display: 'flex',
                                            mb: isCompactLayout(layoutOption) ? 1 : 3,
                                            alignItems: 'center'
                                        }}>
                                            <Avatar
                                                src={currentTrack.album.images?.[0]?.url}
                                                alt={currentTrack.name}
                                                variant="rounded"
                                                sx={{
                                                    width: isCompactLayout(layoutOption) ? 48 : 120,
                                                    height: isCompactLayout(layoutOption) ? 48 : 120,
                                                    mr: isCompactLayout(layoutOption) ? 1 : 3,
                                                    boxShadow: isCompactLayout(layoutOption) ? 1 : 3,
                                                    borderRadius: 1
                                                }}
                                            >
                                                <MusicNoteIcon sx={{ fontSize: isCompactLayout(layoutOption) ? 24 : 40 }} />
                                            </Avatar>
                                            <Box>
                                                <Typography
                                                    variant={isCompactLayout(layoutOption) ? 'body1' : 'h6'}
                                                    sx={{
                                                        fontWeight: 'medium',
                                                        mb: 0.5,
                                                        lineHeight: isCompactLayout(layoutOption) ? 1.2 : 1.5,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {currentTrack.name}
                                                </Typography>
                                                <Typography
                                                    variant={isCompactLayout(layoutOption) ? 'caption' : 'body1'}
                                                    sx={{
                                                        color: 'text.secondary',
                                                        lineHeight: isCompactLayout(layoutOption) ? 1.2 : 1.5,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {currentTrack.artists.map((artist: { name: string }) => artist.name).join(', ')}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Box sx={{ mt: 2, mb: 2, width: '100%' }}>
                                            {/* Remove audio visualizer */}
                                        </Box>

                                        <Box sx={{ mt: 'auto' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="caption">
                                                    {formatDuration(position)}
                                                </Typography>
                                                <Typography variant="caption">
                                                    {formatDuration(duration)}
                                                </Typography>
                                            </Box>

                                            <Slider
                                                value={position}
                                                min={0}
                                                max={duration}
                                                onChange={handleSeekChange}
                                                aria-labelledby="continuous-slider"
                                                size={isCompactLayout(layoutOption) ? 'small' : 'medium'}
                                                sx={{
                                                    '& .MuiSlider-track': {
                                                        background: `linear-gradient(90deg, 
                                                            ${theme.palette.primary.main} 0%, 
                                                            ${theme.palette.primary.light} 100%)`
                                                    },
                                                    '& .MuiSlider-thumb': {
                                                        width: isCompactLayout(layoutOption) ? 8 : 12,
                                                        height: isCompactLayout(layoutOption) ? 8 : 12,
                                                        '&:hover, &.Mui-active': {
                                                            boxShadow: `0 0 0 8px ${alpha(theme.palette.primary.main, 0.16)}`
                                                        }
                                                    }
                                                }}
                                            />

                                            <Box sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                mt: 2,
                                                width: '100%',
                                                ...(isCompactLayout(layoutOption) ? {
                                                    mt: 1,
                                                    mb: 1
                                                } : {})
                                            }}>
                                                <IconButton size={isCompactLayout(layoutOption) ? 'small' : 'medium'}>
                                                    {getVolumeIcon()}
                                                </IconButton>
                                                <Slider
                                                    value={volume}
                                                    onChange={handleVolumeChange}
                                                    aria-labelledby="volume-slider"
                                                    sx={{ ml: 2, flexGrow: 1 }}
                                                    size={isCompactLayout(layoutOption) ? 'small' : 'medium'}
                                                />
                                            </Box>

                                            <Stack
                                                direction="row"
                                                spacing={1}
                                                justifyContent="center"
                                                alignItems="center"
                                                sx={{ mt: isCompactLayout(layoutOption) ? 1 : 2 }}
                                            >
                                                <IconButton
                                                    onClick={previousTrack}
                                                    size={isCompactLayout(layoutOption) ? 'small' : 'medium'}
                                                >
                                                    <SkipPreviousIcon fontSize={isCompactLayout(layoutOption) ? 'small' : 'medium'} />
                                                </IconButton>
                                                <IconButton
                                                    onClick={togglePlay}
                                                    size={isCompactLayout(layoutOption) ? 'small' : 'medium'}
                                                    sx={{
                                                        bgcolor: 'primary.main',
                                                        color: 'primary.contrastText',
                                                        '&:hover': {
                                                            bgcolor: 'primary.dark',
                                                        }
                                                    }}
                                                >
                                                    {isPlaying ?
                                                        <PauseIcon fontSize={isCompactLayout(layoutOption) ? 'small' : 'medium'} /> :
                                                        <PlayArrowIcon fontSize={isCompactLayout(layoutOption) ? 'small' : 'medium'} />
                                                    }
                                                </IconButton>
                                                <IconButton
                                                    onClick={nextTrack}
                                                    size={isCompactLayout(layoutOption) ? 'small' : 'medium'}
                                                >
                                                    <SkipNextIcon fontSize={isCompactLayout(layoutOption) ? 'small' : 'medium'} />
                                                </IconButton>
                                            </Stack>
                                        </Box>
                                    </Box>
                                ) : (
                                    <Box sx={{ p: 2, textAlign: 'center' }}>
                                        <MusicNoteIcon sx={{
                                            fontSize: isCompactLayout(layoutOption) ? 40 : 60,
                                            color: 'text.secondary',
                                            mb: 2
                                        }} />
                                        <Typography
                                            variant={isCompactLayout(layoutOption) ? 'subtitle1' : 'h6'}
                                            gutterBottom
                                        >
                                            {isPlayerConnected ? 'No track playing' : 'Connect to start playing'}
                                        </Typography>
                                        {isPlayerConnected ? (
                                            <Button
                                                variant="contained"
                                                onClick={handleTransferPlayback}
                                                disabled={isTransferringPlayback}
                                                sx={{ mt: 2 }}
                                                size={isCompactLayout(layoutOption) ? 'small' : 'medium'}
                                            >
                                                Transfer Playback to This Device
                                            </Button>
                                        ) : (
                                            <Typography
                                                variant={isCompactLayout(layoutOption) ? 'caption' : 'body2'}
                                                color="text.secondary"
                                            >
                                                Waiting for Spotify connection...
                                            </Typography>
                                        )}
                                    </Box>
                                )}
                            </>
                        )}
                    </>
                )}
            </Box>

            {statusMessage && <StatusMessage message={statusMessage} />}

            {/* Add this near line 764 where you display the current track */}
            {currentTrack && currentTrack.name === 'Up next' && (
                <Chip
                    label="DJ X Transition"
                    color="secondary"
                    size="small"
                    sx={{ mt: 1 }}
                />
            )}
        </Paper>
    );
};

export default SpotifyWidget; 