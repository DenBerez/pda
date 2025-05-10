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
    LinearProgress
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

const SpotifyWidget: React.FC<SpotifyWidgetProps> = ({ widget, editMode, onUpdateWidget }) => {
    const [recentTracks, setRecentTracks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showRecent, setShowRecent] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isTransferringPlayback, setIsTransferringPlayback] = useState(false);

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
        transferPlayback
    } = useSpotifyWebPlayback({
        accessToken: accessToken || null,
        refreshToken,
        clientId: process.env.SPOTIFY_CLIENT_ID || '',
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
        playerName: 'Dashboard Player'
    });

    // Get config from widget
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const refreshInterval = widget.config?.refreshInterval || 30; // seconds

    // Get layout option from widget config or default to 'normal'
    const layoutOption = widget.config?.layoutOption || 'normal';

    // Fetch initial access token
    useEffect(() => {
        const getInitialToken = async () => {
            if (!refreshToken || !clientId || !clientSecret) {
                console.log('Missing credentials:', {
                    hasRefreshToken: !!refreshToken,
                    hasClientId: !!clientId,
                    hasClientSecret: !!clientSecret
                });
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
                        refreshToken,
                        clientId,
                        clientSecret
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
            }
        };

        getInitialToken();
    }, [refreshToken, clientId, clientSecret]);

    // Fetch recent tracks
    const fetchRecentTracks = useCallback(async () => {
        if (!isConnected) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
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
            setLoading(false);
        }
    }, [refreshToken, isConnected]);

    // Fetch recent tracks on mount and when auth state changes
    useEffect(() => {
        fetchRecentTracks();

        if (isConnected) {
            const intervalId = setInterval(fetchRecentTracks, 30000); // 30 seconds
            return () => clearInterval(intervalId);
        }
    }, [fetchRecentTracks, isConnected]);

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
            clientId,
            clientSecret,
            hasRefreshToken: !!refreshToken,
            envClientId: process.env.SPOTIFY_CLIENT_ID,
            envClientSecret: process.env.SPOTIFY_CLIENT_SECRET
        });
    }, [clientId, clientSecret, refreshToken]);

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
                <Typography variant="h6" gutterBottom>Connect to Spotify</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Please configure your Spotify account in widget settings or connect directly.
                </Typography>
                {!clientId || !clientSecret ? (
                    <Typography variant="body2" color="error" sx={{ mb: 2 }}>
                        Please add your Spotify Client ID and Secret in widget settings first
                    </Typography>
                ) : (
                    <Button
                        variant="contained"
                        color="primary"
                        href="/api/spotify/auth"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Connect Spotify Account
                    </Button>
                )}
            </Box>
        );
    }

    // Compact layout
    if (layoutOption === 'compact') {
        return (
            <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Header */}
                <Box sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                        {showRecent ? 'Recently Played' : 'Spotify'}
                    </Typography>
                    <Box>
                        <IconButton size="small" onClick={toggleView}>
                            {showRecent ? <MusicNoteIcon fontSize="small" /> : <AccessTimeIcon fontSize="small" />}
                        </IconButton>
                        {isPlayerConnected && (
                            <IconButton
                                size="small"
                                color="primary"
                                onClick={handleTransferPlayback}
                                disabled={isTransferringPlayback}
                            >
                                <DevicesIcon fontSize="small" />
                            </IconButton>
                        )}
                    </Box>
                </Box>

                <Divider />

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

                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
                                        <IconButton size="small" onClick={previousTrack}>
                                            <SkipPreviousIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" onClick={togglePlay}>
                                            {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                                        </IconButton>
                                        <IconButton size="small" onClick={nextTrack}>
                                            <SkipNextIcon fontSize="small" />
                                        </IconButton>
                                    </Box>

                                    <LinearProgress
                                        variant="determinate"
                                        value={(position / duration) * 100}
                                        sx={{ mt: 1 }}
                                    />
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

    // Normal layout
    return (
        <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6">
                    {showRecent ? 'Recently Played' : 'Spotify'}
                </Typography>
                <Box>
                    <IconButton onClick={toggleView}>
                        {showRecent ? <MusicNoteIcon /> : <AccessTimeIcon />}
                    </IconButton>
                    {isPlayerConnected && (
                        <IconButton
                            color="primary"
                            onClick={handleTransferPlayback}
                            disabled={isTransferringPlayback}
                        >
                            <DevicesIcon />
                        </IconButton>
                    )}
                </Box>
            </Box>

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
                                        sx={{ width: 120, height: 120, mr: 2 }}
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

                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        justifyContent="center"
                                        alignItems="center"
                                        sx={{ mt: 2 }}
                                    >
                                        <IconButton onClick={() => setShuffle(true)}>
                                            <ShuffleIcon />
                                        </IconButton>
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
                                        <IconButton onClick={() => setRepeatMode('track')}>
                                            <RepeatIcon />
                                        </IconButton>
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