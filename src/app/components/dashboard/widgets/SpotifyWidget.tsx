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

    // In SpotifyWidget.tsx, verify this code is executing
    useEffect(() => {
        if (audioRef.current) {
            console.log('Setting up Spotify player for visualizer', audioRef.current);
            // Mark this as a Spotify player for the visualizer to find
            audioRef.current.dataset.spotifyPlayer = 'true';

            // Dispatch an event to notify the visualizer
            const event = new CustomEvent('spotify-player-ready', {
                detail: { audioElement: audioRef.current }
            });
            window.dispatchEvent(event);
        }
    }, [audioRef.current]);

    // Add this after creating the audio element in playPreview function
    useEffect(() => {
        if (audioRef.current) {
            // Dispatch a custom event with the audio element
            const event = new CustomEvent('spotify-audio-element', {
                detail: { audioElement: audioRef.current }
            });
            window.dispatchEvent(event);

            // Also add a data attribute for detection
            audioRef.current.dataset.spotifyPlayer = 'true';
        }
    }, [audioRef.current]);

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
        <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Content */}
            <Box sx={{
                flexGrow: 1,
                overflow: 'auto',
                position: 'relative',
                // Apply different padding based on layout option
                p: layoutOption === 'compact' ? 1 : 2
            }}>
                {/* Toggle button with styling based on layout option */}
                {layoutOption !== 'detailed' && (
                    <Box sx={{
                        position: 'absolute',
                        top: layoutOption === 'compact' ? 4 : 8,
                        right: layoutOption === 'compact' ? 4 : 8,
                        zIndex: 2
                    }}>
                        <Tooltip title={showRecent ? "Show Player" : "Show History"}>
                            <IconButton
                                onClick={toggleView}
                                size={layoutOption === 'compact' ? 'small' : 'medium'}
                            >
                                {showRecent ?
                                    <MusicNoteIcon fontSize={layoutOption === 'compact' ? 'small' : 'medium'} /> :
                                    <AccessTimeIcon fontSize={layoutOption === 'compact' ? 'small' : 'medium'} />
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
                                mb: 3
                            }}>
                                <Box sx={{
                                    display: 'flex',
                                    mb: 3,
                                    alignItems: 'center'
                                }}>
                                    <Avatar
                                        src={currentTrack.album.images?.[0]?.url}
                                        alt={currentTrack.name}
                                        variant="rounded"
                                        sx={{
                                            width: 150,
                                            height: 150,
                                            mr: 3
                                        }}
                                    >
                                        <MusicNoteIcon sx={{ fontSize: 40 }} />
                                    </Avatar>
                                    <Box>
                                        <Typography
                                            variant="h6"
                                            gutterBottom
                                        >
                                            {currentTrack.name}
                                        </Typography>
                                        <Typography
                                            variant="body1"
                                        >
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
                                    </Stack>
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
                                mt: layoutOption === 'compact' ? 0 : 2,
                                // Adjust spacing for compact layout
                                '& .MuiListItem-root': layoutOption === 'compact' ? {
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
                                                            size={layoutOption === 'compact' ? 'small' : 'medium'}
                                                        >
                                                            <PlayArrowIcon fontSize={layoutOption === 'compact' ? 'small' : 'medium'} />
                                                        </IconButton>
                                                    )}
                                                    <IconButton
                                                        edge="end"
                                                        onClick={() => openInSpotify(item.track.uri)}
                                                        size={layoutOption === 'compact' ? 'small' : 'medium'}
                                                    >
                                                        <LaunchIcon fontSize={layoutOption === 'compact' ? 'small' : 'medium'} />
                                                    </IconButton>
                                                </Box>
                                            }
                                        >
                                            <ListItemAvatar>
                                                <Avatar
                                                    src={item.track.album.images?.[0]?.url}
                                                    alt={item.track.name}
                                                    variant="rounded"
                                                    sx={layoutOption === 'compact' ? { width: 32, height: 32 } : {}}
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
                                                    variant: layoutOption === 'compact' ? 'body2' : 'body1'
                                                }}
                                                secondaryTypographyProps={{
                                                    variant: layoutOption === 'compact' ? 'caption' : 'body2'
                                                }}
                                            />
                                        </ListItem>
                                    ))
                                ) : (
                                    <Typography variant={layoutOption === 'compact' ? 'body2' : 'body1'} sx={{ p: 2 }}>
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
                                        pt: layoutOption === 'compact' ? 0 : 2
                                    }}>
                                        <Box sx={{
                                            display: 'flex',
                                            mb: layoutOption === 'compact' ? 1 : 3,
                                            alignItems: 'center'
                                        }}>
                                            <Avatar
                                                src={currentTrack.album.images?.[0]?.url}
                                                alt={currentTrack.name}
                                                variant="rounded"
                                                sx={{
                                                    width: layoutOption === 'compact' ? 60 : 120,
                                                    height: layoutOption === 'compact' ? 60 : 120,
                                                    mr: layoutOption === 'compact' ? 1 : 3
                                                }}
                                            >
                                                <MusicNoteIcon sx={{ fontSize: layoutOption === 'compact' ? 24 : 40 }} />
                                            </Avatar>
                                            <Box>
                                                <Typography
                                                    variant={layoutOption === 'compact' ? 'subtitle1' : 'h6'}
                                                    gutterBottom
                                                >
                                                    {currentTrack.name}
                                                </Typography>
                                                <Typography
                                                    variant={layoutOption === 'compact' ? 'body2' : 'body1'}
                                                >
                                                    {currentTrack.artists.map((artist: any) => artist.name).join(', ')}
                                                </Typography>
                                                {layoutOption !== 'compact' && (
                                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                                        {currentTrack.album.name}
                                                    </Typography>
                                                )}
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
                                                size={layoutOption === 'compact' ? 'small' : 'medium'}
                                            />

                                            <Box sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                mt: 2,
                                                width: '100%',
                                                ...(layoutOption === 'compact' ? {
                                                    mt: 1,
                                                    mb: 1
                                                } : {})
                                            }}>
                                                <IconButton size={layoutOption === 'compact' ? 'small' : 'medium'}>
                                                    {getVolumeIcon()}
                                                </IconButton>
                                                <Slider
                                                    value={volume}
                                                    onChange={handleVolumeChange}
                                                    aria-labelledby="volume-slider"
                                                    sx={{ ml: 2, flexGrow: 1 }}
                                                    size={layoutOption === 'compact' ? 'small' : 'medium'}
                                                />
                                            </Box>

                                            <Stack
                                                direction="row"
                                                spacing={1}
                                                justifyContent="center"
                                                alignItems="center"
                                                sx={{ mt: layoutOption === 'compact' ? 1 : 2 }}
                                            >
                                                <IconButton
                                                    onClick={previousTrack}
                                                    size={layoutOption === 'compact' ? 'small' : 'medium'}
                                                >
                                                    <SkipPreviousIcon fontSize={layoutOption === 'compact' ? 'small' : 'medium'} />
                                                </IconButton>
                                                <IconButton
                                                    onClick={togglePlay}
                                                    size={layoutOption === 'compact' ? 'small' : 'medium'}
                                                    sx={{
                                                        bgcolor: 'primary.main',
                                                        color: 'primary.contrastText',
                                                        '&:hover': {
                                                            bgcolor: 'primary.dark',
                                                        }
                                                    }}
                                                >
                                                    {isPlaying ?
                                                        <PauseIcon fontSize={layoutOption === 'compact' ? 'small' : 'medium'} /> :
                                                        <PlayArrowIcon fontSize={layoutOption === 'compact' ? 'small' : 'medium'} />
                                                    }
                                                </IconButton>
                                                <IconButton
                                                    onClick={nextTrack}
                                                    size={layoutOption === 'compact' ? 'small' : 'medium'}
                                                >
                                                    <SkipNextIcon fontSize={layoutOption === 'compact' ? 'small' : 'medium'} />
                                                </IconButton>
                                            </Stack>
                                        </Box>
                                    </Box>
                                ) : (
                                    <Box sx={{ p: 2, textAlign: 'center' }}>
                                        <MusicNoteIcon sx={{
                                            fontSize: layoutOption === 'compact' ? 40 : 60,
                                            color: 'text.secondary',
                                            mb: 2
                                        }} />
                                        <Typography
                                            variant={layoutOption === 'compact' ? 'subtitle1' : 'h6'}
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
                                                size={layoutOption === 'compact' ? 'small' : 'medium'}
                                            >
                                                Transfer Playback to This Device
                                            </Button>
                                        ) : (
                                            <Typography
                                                variant={layoutOption === 'compact' ? 'caption' : 'body2'}
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