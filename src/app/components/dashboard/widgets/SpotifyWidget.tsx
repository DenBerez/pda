import React, { useState, useEffect, useRef } from 'react';
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
    Button
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

// Sample data for demonstration when not connected
const sampleSpotifyData = {
    isPlaying: true,
    currentTrack: {
        item: {
            id: "sample123",
            name: "Bohemian Rhapsody",
            album: {
                name: "A Night at the Opera",
                images: [{ url: "https://upload.wikimedia.org/wikipedia/en/4/4d/Queen_A_Night_At_The_Opera.png" }]
            },
            artists: [{ name: "Queen" }],
            duration_ms: 354947,
            preview_url: "https://p.scdn.co/mp3-preview/6d00d0aafe0a9b02a2b2c1156e9262d6cd39bd85?cid=774b29d4f13844c495f206cafdad9c86"
        },
        progress_ms: 180000,
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
}

const SpotifyWidget: React.FC<SpotifyWidgetProps> = ({ widget, editMode }) => {
    const [spotifyData, setSpotifyData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [showRecent, setShowRecent] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    // Get config from widget
    const refreshToken = widget.config?.refreshToken || '';
    const clientId = widget.config?.clientId || '';
    const clientSecret = widget.config?.clientSecret || '';
    const refreshInterval = widget.config?.refreshInterval || 30; // seconds

    // Fetch Spotify data
    const fetchSpotifyData = async () => {
        // if (editMode) return;

        setLoading(true);
        setError(null);

        try {
            const action = showRecent ? 'recent' : 'current';
            const params = new URLSearchParams({
                action,
                refreshToken,
                clientId,
                clientSecret
            });

            const response = await fetch(`/api/spotify?${params.toString()}`);


            console.log('response', response);

            if (!response.ok) {
                throw new Error('Failed to fetch Spotify data');
            }

            const data = await response.json();

            console.log('data', data);

            if (data.error) {
                // If we need authentication, redirect to auth URL if provided
                if (data.authUrl && !refreshToken) {
                    window.open(data.authUrl, '_blank');
                    throw new Error('Please authenticate with Spotify');
                }
                throw new Error(data.error);
            }

            setSpotifyData(data);

            // Update playing state based on data
            setIsPlaying(data.isPlaying || false);

            // Update progress if currently playing
            if (data.isPlaying && data.currentTrack) {
                setProgress(data.currentTrack.progress_ms || 0);
            }
        } catch (err) {
            console.error('Error fetching Spotify data:', err);
            setError('Failed to load Spotify data. Check your connection.');

            // Use sample data in development/error cases
            if (process.env.NODE_ENV === 'development') {
                setSpotifyData(sampleSpotifyData);
                setIsPlaying(sampleSpotifyData.isPlaying);
                setProgress(sampleSpotifyData.currentTrack.progress_ms);
            }
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch and refresh interval
    useEffect(() => {
        fetchSpotifyData();

        const intervalId = setInterval(fetchSpotifyData, refreshInterval * 1000);

        return () => {
            clearInterval(intervalId);
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, [refreshInterval, showRecent, refreshToken, editMode]);

    // Progress update interval for currently playing track
    useEffect(() => {
        if (!isPlaying || !spotifyData?.currentTrack) {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
            }
            return;
        }

        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
        }

        progressIntervalRef.current = setInterval(() => {
            setProgress(prev => {
                // Reset progress when it exceeds duration
                const duration = spotifyData?.currentTrack?.item?.duration_ms || 0;
                if (prev >= duration) {
                    fetchSpotifyData();
                    return 0;
                }
                return prev + 1000;
            });
        }, 1000);

        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
        };
    }, [isPlaying, spotifyData]);

    // Audio player functions
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

    // Get track info
    const getCurrentTrack = () => {
        if (!spotifyData) return null;

        // For currently playing track
        if (spotifyData.isPlaying &&
            spotifyData.currentTrack?.item &&
            typeof spotifyData.currentTrack.item === 'object') {
            return spotifyData.currentTrack.item;
        }
        // For last played track
        else if (spotifyData.lastPlayed?.track &&
            typeof spotifyData.lastPlayed.track === 'object') {
            return spotifyData.lastPlayed.track;
        }
        // For recent tracks
        else if (spotifyData.recentTracks &&
            Array.isArray(spotifyData.recentTracks) &&
            spotifyData.recentTracks.length > 0 &&
            spotifyData.recentTracks[0].track) {
            return spotifyData.recentTracks[0].track;
        }

        return null;
    };

    // Toggle between current and recent views
    const toggleView = () => {
        setShowRecent(!showRecent);
        fetchSpotifyData();
    };

    // Add this function to open track in Spotify
    const openInSpotify = (url: string) => {
        if (url) {
            window.open(url, '_blank');
        }
    };

    // Add this function to control Spotify playback
    const controlSpotifyPlayback = async (action: 'play' | 'pause' | 'next' | 'previous' | 'shuffle' | 'repeat') => {
        if (!refreshToken) return;

        try {
            const response = await fetch(`/api/spotify/control`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${refreshToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action })
            });

            if (!response.ok) {
                throw new Error(`Failed to ${action} Spotify playback`);
            }

            // Refresh data after action
            setTimeout(fetchSpotifyData, 500);
            showStatus(`${action.charAt(0).toUpperCase() + action.slice(1)}ing...`);
        } catch (err) {
            console.error(`Error controlling Spotify playback (${action}):`, err);
            showStatus(`Failed to ${action}`);
        }
    };

    // Add status message component
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

    // Show messages when actions are performed
    const showStatus = (message: string) => {
        setStatusMessage(message);
        setTimeout(() => setStatusMessage(null), 3000);
    };

    // Loading state
    if (loading && !spotifyData) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
                <CircularProgress size={40} sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                    Loading Spotify data...
                </Typography>
            </Box>
        );
    }

    // Error state
    if (error && !spotifyData) {
        return (
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography color="error">{error}</Typography>
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={fetchSpotifyData}
                    sx={{ mt: 2 }}
                >
                    Retry
                </Button>
            </Box>
        );
    }

    // Not connected state
    if (!refreshToken && !spotifyData) {
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
                        href={`/api/spotify/auth?clientId=${encodeURIComponent(clientId)}&clientSecret=${encodeURIComponent(clientSecret)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Connect Spotify Account
                    </Button>
                )}
            </Box>
        );
    }

    const currentTrack = getCurrentTrack();

    return (
        <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header with toggle button */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                    {showRecent ? 'Recently Played' : 'Now Playing'}
                </Typography>
                <Box>
                    <Button
                        size="small"
                        onClick={toggleView}
                        variant="outlined"
                    >
                        {showRecent ? 'Current' : 'History'}
                    </Button>
                    <IconButton size="small" onClick={fetchSpotifyData} sx={{ ml: 1 }}>
                        <RefreshIcon fontSize="small" />
                    </IconButton>
                </Box>
            </Box>

            {showRecent ? (
                // Recent tracks list
                <List sx={{ p: 0, overflowY: 'auto', flexGrow: 1 }}>
                    {spotifyData && spotifyData.recentTracks && spotifyData.recentTracks.map((item: any, index: number) => (
                        <ListItem
                            key={`${item.track.id}-${index}`}
                            secondaryAction={
                                item.track.preview_url && (
                                    <IconButton
                                        edge="end"
                                        onClick={() => playPreview(item.track.preview_url)}
                                    >
                                        <PlayArrowIcon />
                                    </IconButton>
                                )
                            }
                            sx={{
                                borderRadius: 1,
                                '&:hover': { bgcolor: 'action.hover' },
                                bgcolor: spotifyData.isPlaying &&
                                    spotifyData.currentTrack?.item?.id === item.track.id
                                    ? 'action.selected' : 'transparent',
                                position: 'relative'
                            }}
                        >
                            {/* Add indicator for currently playing */}
                            {spotifyData.isPlaying &&
                                spotifyData.currentTrack?.item?.id === item.track.id && (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            left: 0,
                                            top: 0,
                                            bottom: 0,
                                            width: 4,
                                            bgcolor: 'primary.main',
                                            borderTopLeftRadius: 4,
                                            borderBottomLeftRadius: 4
                                        }}
                                    />
                                )}
                            <ListItemAvatar>
                                <Avatar
                                    alt={item.track.name}
                                    src={item.track.album.images?.[0]?.url}
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
                                        <Box component="span" sx={{ display: 'block', fontSize: '0.75rem', color: 'text.secondary' }}>
                                            <AccessTimeIcon fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                            {new Date(item.played_at).toLocaleString()}
                                        </Box>
                                    </>
                                }
                                primaryTypographyProps={{ noWrap: true }}
                                secondaryTypographyProps={{ noWrap: true }}
                            />
                        </ListItem>
                    ))}
                </List>
            ) : (
                // Now playing view
                <>
                    {currentTrack ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexGrow: 1 }}>
                            {/* Album art */}
                            <Paper
                                elevation={3}
                                sx={{
                                    width: '100%',
                                    maxWidth: 280,
                                    height: 280,
                                    mb: 3,
                                    overflow: 'hidden',
                                    borderRadius: 2,
                                    position: 'relative'
                                }}
                            >
                                <Box
                                    component="img"
                                    src={currentTrack.album.images?.[0]?.url || ''}
                                    alt={currentTrack.name}
                                    sx={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        display: 'block'
                                    }}
                                />
                                {spotifyData.isPlaying && (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 12,
                                            right: 12,
                                            bgcolor: 'primary.main',
                                            color: 'white',
                                            borderRadius: '50%',
                                            width: 40,
                                            height: 40,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <PlayArrowIcon />
                                    </Box>
                                )}
                            </Paper>

                            {/* Track info */}
                            <Box sx={{ textAlign: 'center', mb: 2, width: '100%' }}>
                                <Typography variant="h6" noWrap sx={{ fontWeight: 'bold' }}>
                                    {currentTrack.name}
                                </Typography>
                                <Typography variant="body1" color="text.secondary" noWrap>
                                    {currentTrack.artists.map((artist: any) => artist.name).join(', ')}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" noWrap>
                                    {currentTrack.album.name}
                                </Typography>
                            </Box>

                            {/* Progress bar */}
                            <Box sx={{ width: '100%', mb: 2 }}>
                                <Box
                                    sx={{
                                        width: '100%',
                                        height: 4,
                                        bgcolor: 'grey.200',
                                        borderRadius: 2,
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            height: '100%',
                                            bgcolor: 'primary.main',
                                            width: `${(progress / currentTrack.duration_ms) * 100}%`,
                                            transition: 'width 1s linear'
                                        }}
                                    />
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        {formatDuration(progress)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {formatDuration(currentTrack.duration_ms)}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Playback controls */}
                            <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                                <IconButton
                                    size="small"
                                    sx={{ color: 'text.secondary' }}
                                    onClick={() => controlSpotifyPlayback('shuffle')}
                                >
                                    <ShuffleIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                    size="small"
                                    onClick={() => controlSpotifyPlayback('previous')}
                                >
                                    <SkipPreviousIcon />
                                </IconButton>
                                <IconButton
                                    size="large"
                                    sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
                                    onClick={() => isPlaying ? controlSpotifyPlayback('pause') : controlSpotifyPlayback('play')}
                                >
                                    {isPlaying ? <PauseIcon fontSize="medium" /> : <PlayArrowIcon fontSize="medium" />}
                                </IconButton>
                                <IconButton
                                    size="small"
                                    onClick={() => controlSpotifyPlayback('next')}
                                >
                                    <SkipNextIcon />
                                </IconButton>
                                <IconButton
                                    size="small"
                                    sx={{ color: 'text.secondary' }}
                                    onClick={() => controlSpotifyPlayback('repeat')}
                                >
                                    <RepeatIcon fontSize="small" />
                                </IconButton>
                            </Stack>

                            {!currentTrack.preview_url && (
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
                                    Preview not available
                                </Typography>
                            )}

                            {!spotifyData.isPlaying && (
                                <Chip
                                    label="Last played track"
                                    size="small"
                                    color="default"
                                    variant="outlined"
                                    icon={<AccessTimeIcon fontSize="small" />}
                                />
                            )}

                            {/* Add Open in Spotify button */}
                            {currentTrack.external_urls?.spotify && (
                                <Button
                                    size="small"
                                    startIcon={<LaunchIcon fontSize="small" />}
                                    onClick={() => openInSpotify(currentTrack.external_urls.spotify)}
                                    sx={{ mt: 1, mb: 2 }}
                                >
                                    Open in Spotify
                                </Button>
                            )}
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <MusicNoteIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="h6">No track data available</Typography>
                        </Box>
                    )}
                </>
            )}
            {statusMessage && <StatusMessage message={statusMessage} />}
        </Box>
    );
};

export default SpotifyWidget; 