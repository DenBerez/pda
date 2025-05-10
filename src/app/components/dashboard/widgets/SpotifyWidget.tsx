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

interface SpotifyWidgetProps {
    widget: Widget;
    editMode: boolean;
    onUpdateWidget: (widget: Widget) => void;
}

type LayoutOptionType = 'compact' | 'detailed' | 'normal';

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
        setVolume: setPlayerVolume
    } = useSpotifyWebPlayback({
        accessToken: accessToken || null,
        refreshToken,
        playerName: 'Dashboard Player'
    });

    // Get layout option from widget config or default to 'normal'
    const layoutOption = widget.config?.layoutOption || 'normal';

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
            setLoading(false);
            return;
        }

        // Use a delayed loading state to prevent flickering on quick loads
        if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
        }

        loadingTimeoutRef.current = setTimeout(() => {
            if (!initialLoadComplete) return;
            setLoading(true);
        }, 500); // Only show loading state if fetch takes more than 500ms

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
            setRecentTracks(data.recentTracks || []);
        } catch (err) {
            console.error('Error fetching recent tracks:', err);
            setError('Failed to load recent tracks');
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

            const intervalId = setInterval(fetchRecentTracks, 30000); // 30 seconds
            return () => clearInterval(intervalId);
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
            showStatus('Playback transferred to this device');
        } catch (err) {
            console.error('Error transferring playback:', err);
            showStatus('Failed to transfer playback');
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

    // Add this debugging section
    useEffect(() => {
        console.log('Spotify connection status:', {
            accessToken: !!accessToken,
            refreshToken: !!refreshToken,
            isConnected: isPlayerConnected,
            deviceId,
            currentTrack: !!currentTrack,
            error: sdkError
        });
    }, [accessToken, refreshToken, isPlayerConnected, deviceId, currentTrack, sdkError]);

    useEffect(() => {
        console.log('Spotify credentials check:', {
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
            hasRefreshToken: !!refreshToken,
            envClientId: process.env.SPOTIFY_CLIENT_ID,
            envClientSecret: process.env.SPOTIFY_CLIENT_SECRET
        });
    }, [process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET, refreshToken]);

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

    // Create a reusable header component within the SpotifyWidget component
    const SpotifyHeader = ({
        showRecent,
        username,
        toggleView,
        layoutOption,
        isPlayerConnected,
        handleTransferPlayback,
        isTransferringPlayback
    }: {
        showRecent: boolean;
        username: string | null;
        toggleView: () => void;
        layoutOption: LayoutOptionType;
        isPlayerConnected: boolean;
        handleTransferPlayback: () => void;
        isTransferringPlayback: boolean;
    }) => {
        // Base styles that apply to all layouts
        const baseStyles = {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
        };

        // Layout-specific styles
        const layoutStyles = {
            compact: {
                p: 1,
                bgcolor: 'primary.main',
                color: 'primary.contrastText'
            },
            detailed: {
                p: 2,
                bgcolor: 'primary.dark',
                color: 'primary.contrastText'
            },
            normal: {
                p: 2,
                bgcolor: 'background.paper',
                color: 'text.primary'
            }
        };

        // Title variants based on layout
        const titleVariants: Record<LayoutOptionType, 'subtitle1' | 'h6'> = {
            compact: 'subtitle1',
            detailed: 'h6',
            normal: 'h6'
        };

        // Title styles based on layout
        const titleStyles = {
            compact: { fontWeight: 'medium' },
            detailed: { fontWeight: 'bold' },
            normal: {}
        };

        // Icon button styles based on layout
        const iconButtonStyles = {
            compact: { color: 'primary.contrastText' },
            detailed: { color: 'primary.contrastText' },
            normal: {}
        };

        return (
            <Box sx={{
                ...baseStyles,
                ...layoutStyles[layoutOption],
                borderBottom: layoutOption === 'normal' ? 1 : 0,
                borderColor: 'divider'
            }}>
                <Typography
                    variant={titleVariants[layoutOption]}
                    sx={titleStyles[layoutOption]}
                >
                    {showRecent
                        ? (layoutOption === 'detailed' ? 'Spotify History' : 'Recently Played')
                        : (username ? `${username}` : 'Spotify')}
                </Typography>

                <Box>
                    <Tooltip title={showRecent ? "Show Player" : "Show History"}>
                        <IconButton
                            onClick={toggleView}
                            size={layoutOption === 'compact' ? 'small' : 'medium'}
                            sx={iconButtonStyles[layoutOption]}
                        >
                            {showRecent ? <MusicNoteIcon fontSize={layoutOption === 'compact' ? 'small' : 'medium'} /> : <AccessTimeIcon fontSize={layoutOption === 'compact' ? 'small' : 'medium'} />}
                        </IconButton>
                    </Tooltip>


                </Box>
            </Box>
        );
    };

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

    // Compact layout
    if (layoutOption === 'compact') {
        return (
            <Paper sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                bgcolor: 'background.paper',
                borderRadius: 2
            }}>
                {/* Header */}
                <SpotifyHeader
                    showRecent={showRecent}
                    username={username}
                    toggleView={toggleView}
                    layoutOption="compact"
                    isPlayerConnected={isPlayerConnected}
                    handleTransferPlayback={handleTransferPlayback}
                    isTransferringPlayback={isTransferringPlayback}
                />

                {/* Content */}
                <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
                    {showRecent ? (
                        <List dense sx={{ p: 0 }}>
                            {recentTracks.length > 0 ? (
                                recentTracks.slice(0, 5).map((item: any, index: number) => (
                                    <ListItem
                                        key={`${item.track.id}-${index}`}
                                        disablePadding
                                        sx={{ py: 0.5 }}
                                        secondaryAction={
                                            <IconButton
                                                edge="end"
                                                size="small"
                                                onClick={() => openInSpotify(item.track.uri)}
                                            >
                                                <LaunchIcon fontSize="small" />
                                            </IconButton>
                                        }
                                    >
                                        <ListItemAvatar sx={{ minWidth: 40 }}>
                                            <Avatar
                                                src={item.track.album.images?.[0]?.url}
                                                alt={item.track.name}
                                                sx={{ width: 30, height: 30 }}
                                            >
                                                <MusicNoteIcon fontSize="small" />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={item.track.name}
                                            secondary={item.track.artists.map((artist: any) => artist.name).join(', ')}
                                            primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                                            secondaryTypographyProps={{ variant: 'caption', noWrap: true }}
                                        />
                                    </ListItem>
                                ))
                            ) : (
                                <Typography variant="body2" sx={{ p: 1 }}>No recent tracks found</Typography>
                            )}
                        </List>
                    ) : (
                        <>
                            {currentTrack ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <Avatar
                                            src={currentTrack.album.images?.[0]?.url}
                                            alt={currentTrack.name}
                                            variant="rounded"
                                            sx={{ width: 50, height: 50, mr: 1 }}
                                        >
                                            <MusicNoteIcon />
                                        </Avatar>
                                        <Box sx={{ overflow: 'hidden' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 'medium' }} noWrap>
                                                {currentTrack.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" noWrap>
                                                {currentTrack.artists.map((artist: any) => artist.name).join(', ')}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box sx={{ mt: 'auto' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <IconButton size="small" onClick={previousTrack}>
                                                <SkipPreviousIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" onClick={togglePlay}>
                                                {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                                            </IconButton>
                                            <IconButton size="small" onClick={nextTrack}>
                                                <SkipNextIcon fontSize="small" />
                                            </IconButton>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, width: '100%' }}>
                                                <IconButton>
                                                    {getVolumeIcon()}
                                                </IconButton>
                                                <Slider
                                                    value={volume}
                                                    onChange={handleVolumeChange}
                                                    aria-labelledby="volume-slider"
                                                    sx={{ ml: 2, flexGrow: 1 }}
                                                />
                                            </Box>
                                        </Box>

                                        <LinearProgress
                                            variant="determinate"
                                            value={(position / duration) * 100}
                                            sx={{ mt: 1 }}
                                        />
                                    </Box>
                                </Box>
                            ) : (
                                <Box sx={{ p: 1, textAlign: 'center' }}>
                                    <Typography variant="body2">
                                        {isPlayerConnected ? 'No track playing' : 'Connect to start playing'}
                                    </Typography>
                                    {isPlayerConnected && (
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            sx={{ mt: 1 }}
                                            onClick={handleTransferPlayback}
                                        >
                                            Transfer Playback
                                        </Button>
                                    )}
                                </Box>
                            )}
                        </>
                    )}
                </Box>

                {statusMessage && <StatusMessage message={statusMessage} />}
            </Paper>
        );
    }

    // Detailed layout
    if (layoutOption === 'detailed') {
        return (
            <Paper sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                bgcolor: 'background.default',
                borderRadius: 2
            }}>
                {/* Header */}
                <SpotifyHeader
                    showRecent={showRecent}
                    username={username}
                    toggleView={toggleView}
                    layoutOption="detailed"
                    isPlayerConnected={isPlayerConnected}
                    handleTransferPlayback={handleTransferPlayback}
                    isTransferringPlayback={isTransferringPlayback}
                />

                {/* Content */}
                <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3, bgcolor: 'background.paper' }}>
                    {showRecent ? (
                        <>
                            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                                Your Listening History
                            </Typography>
                            <List>
                                {recentTracks.length > 0 ? (
                                    recentTracks.map((item: any, index: number) => (
                                        <ListItem
                                            key={`${item.track.id}-${index}`}
                                            sx={{
                                                px: 2,
                                                py: 2,
                                                mb: 2,
                                                borderRadius: 2,
                                                bgcolor: 'background.default',
                                                boxShadow: 1
                                            }}
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
                                            <ListItemAvatar sx={{ minWidth: 90 }}>
                                                <Avatar
                                                    src={item.track.album.images?.[0]?.url}
                                                    alt={item.track.name}
                                                    variant="rounded"
                                                    sx={{ width: 70, height: 70 }}
                                                >
                                                    <MusicNoteIcon />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                                        {item.track.name}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <>
                                                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                            {item.track.artists.map((artist: any) => artist.name).join(', ')}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {item.track.album.name}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                                            <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                                                            <Typography variant="caption" color="text.secondary">
                                                                {formatDuration(item.track.duration_ms)} • Played {new Date(item.played_at).toLocaleString()}
                                                            </Typography>
                                                        </Box>
                                                    </>
                                                }
                                            />
                                        </ListItem>
                                    ))
                                ) : (
                                    <Typography variant="body1" sx={{ p: 2 }}>No recent tracks found</Typography>
                                )}
                            </List>
                        </>
                    ) : (
                        <>
                            {currentTrack ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                                        <Avatar
                                            src={currentTrack.album.images?.[0]?.url}
                                            alt={currentTrack.name}
                                            variant="square"
                                            sx={{ width: 200, height: 200, mb: 2, boxShadow: 3 }}
                                        >
                                            <MusicNoteIcon sx={{ fontSize: 60 }} />
                                        </Avatar>
                                        <Box sx={{ textAlign: 'center', width: '100%' }}>
                                            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                                                {currentTrack.name}
                                            </Typography>
                                            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                                {currentTrack.artists.map((artist: any) => artist.name).join(', ')}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                {currentTrack.album.name}
                                            </Typography>
                                            <Chip
                                                label={isPlaying ? "Now Playing" : "Paused"}
                                                color={isPlaying ? "primary" : "default"}
                                                size="small"
                                                sx={{ mt: 1 }}
                                            />
                                        </Box>
                                    </Box>

                                    <Box sx={{ mt: 'auto' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2">
                                                {formatDuration(position)}
                                            </Typography>
                                            <Typography variant="body2">
                                                {formatDuration(duration)}
                                            </Typography>
                                        </Box>

                                        <Slider
                                            value={position}
                                            min={0}
                                            max={duration}
                                            onChange={handleSeekChange}
                                            aria-labelledby="continuous-slider"
                                            sx={{ color: 'primary.main' }}
                                        />

                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            justifyContent="center"
                                            alignItems="center"
                                            sx={{ mt: 2 }}
                                        >
                                            <Tooltip title="Shuffle">
                                                <IconButton onClick={() => setShuffle(true)}>
                                                    <ShuffleIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <IconButton onClick={previousTrack} size="large">
                                                <SkipPreviousIcon fontSize="large" />
                                            </IconButton>
                                            <IconButton
                                                onClick={togglePlay}
                                                sx={{
                                                    bgcolor: 'primary.main',
                                                    color: 'primary.contrastText',
                                                    '&:hover': {
                                                        bgcolor: 'primary.dark',
                                                    },
                                                    p: 2
                                                }}
                                                size="large"
                                            >
                                                {isPlaying ? <PauseIcon fontSize="large" /> : <PlayArrowIcon fontSize="large" />}
                                            </IconButton>
                                            <IconButton onClick={nextTrack} size="large">
                                                <SkipNextIcon fontSize="large" />
                                            </IconButton>
                                            <Tooltip title="Repeat">
                                                <IconButton onClick={() => setRepeatMode('track')}>
                                                    <RepeatIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>

                                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, width: '100%' }}>
                                            <IconButton>
                                                {getVolumeIcon()}
                                            </IconButton>
                                            <Slider
                                                value={volume}
                                                onChange={handleVolumeChange}
                                                aria-labelledby="volume-slider"
                                                sx={{ ml: 2, flexGrow: 1 }}
                                            />
                                        </Box>
                                    </Box>
                                </Box>
                            ) : (
                                <Box sx={{ p: 2, textAlign: 'center' }}>
                                    <MusicNoteIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                                    <Typography variant="h5" gutterBottom>
                                        {isPlayerConnected ? 'No track playing' : 'Connect to start playing'}
                                    </Typography>
                                    {isPlayerConnected ? (
                                        <Button
                                            variant="contained"
                                            onClick={handleTransferPlayback}
                                            disabled={isTransferringPlayback}
                                            sx={{ mt: 2 }}
                                            size="large"
                                        >
                                            Transfer Playback to This Device
                                        </Button>
                                    ) : (
                                        <Typography variant="body1" color="text.secondary">
                                            Waiting for Spotify connection...
                                        </Typography>
                                    )}
                                </Box>
                            )}
                        </>
                    )}
                </Box>

                {statusMessage && <StatusMessage message={statusMessage} />}
            </Paper>
        );
    }

    // Normal layout
    return (
        <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <SpotifyHeader
                showRecent={showRecent}
                username={username}
                toggleView={toggleView}
                layoutOption="normal"
                isPlayerConnected={isPlayerConnected}
                handleTransferPlayback={handleTransferPlayback}
                isTransferringPlayback={isTransferringPlayback}
            />

            <Divider />

            {/* Content */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                {showRecent ? (
                    <List>
                        {recentTracks.length > 0 ? (
                            recentTracks.map((item: any, index: number) => (
                                <ListItem
                                    key={`${item.track.id}-${index}`}
                                    sx={{ px: 1 }}
                                    secondaryAction={
                                        <IconButton
                                            edge="end"
                                            onClick={() => openInSpotify(item.track.uri)}
                                        >
                                            <LaunchIcon />
                                        </IconButton>
                                    }
                                >
                                    <ListItemAvatar>
                                        <Avatar
                                            src={item.track.album.images?.[0]?.url}
                                            alt={item.track.name}
                                            variant="rounded"
                                            sx={{ width: 56, height: 56 }}
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
                            <Typography variant="body1" sx={{ p: 2 }}>No recent tracks found</Typography>
                        )}
                    </List>
                ) : (
                    <>
                        {currentTrack ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <Box sx={{ display: 'flex', mb: 3 }}>
                                    <Avatar
                                        src={currentTrack.album.images?.[0]?.url}
                                        alt={currentTrack.name}
                                        variant="rounded"
                                        sx={{ width: 120, height: 120, mr: 3 }}
                                    >
                                        <MusicNoteIcon sx={{ fontSize: 40 }} />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6" gutterBottom>
                                            {currentTrack.name}
                                        </Typography>
                                        <Typography variant="body1">
                                            {currentTrack.artists.map((artist: any) => artist.name).join(', ')}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            {currentTrack.album.name}
                                        </Typography>
                                        <Chip
                                            label={isPlaying ? "Playing" : "Paused"}
                                            color={isPlaying ? "primary" : "default"}
                                            size="small"
                                        />
                                    </Box>
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
                                    />

                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, width: '100%' }}>
                                        <IconButton>
                                            {getVolumeIcon()}
                                        </IconButton>
                                        <Slider
                                            value={volume}
                                            onChange={handleVolumeChange}
                                            aria-labelledby="volume-slider"
                                            sx={{ ml: 2, flexGrow: 1 }}
                                        />
                                    </Box>

                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        justifyContent="center"
                                        alignItems="center"
                                        sx={{ mt: 2 }}
                                    >
                                        <Tooltip title="Shuffle">
                                            <IconButton onClick={() => setShuffle(true)}>
                                                <ShuffleIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <IconButton onClick={previousTrack}>
                                            <SkipPreviousIcon />
                                        </IconButton>
                                        <IconButton
                                            onClick={togglePlay}
                                            sx={{
                                                bgcolor: 'primary.main',
                                                color: 'primary.contrastText',
                                                '&:hover': {
                                                    bgcolor: 'primary.dark',
                                                }
                                            }}
                                        >
                                            {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                                        </IconButton>
                                        <IconButton onClick={nextTrack}>
                                            <SkipNextIcon />
                                        </IconButton>
                                        <Tooltip title="Repeat">
                                            <IconButton onClick={() => setRepeatMode('track')}>
                                                <RepeatIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </Box>
                            </Box>
                        ) : (
                            <Box sx={{ p: 2, textAlign: 'center' }}>
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
                    </>
                )}
            </Box>

            {statusMessage && <StatusMessage message={statusMessage} />}
        </Paper>
    );
};

export default SpotifyWidget; 