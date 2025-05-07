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
    const [controlsDisabled, setControlsDisabled] = useState(false);
    const latestRequestRef = useRef<number>(0);
    const [lastActionTime, setLastActionTime] = useState<number>(0);

    // Get config from widget
    const refreshToken = widget.config?.refreshToken || '';
    const clientId = widget.config?.clientId || '';
    const clientSecret = widget.config?.clientSecret || '';
    const refreshInterval = widget.config?.refreshInterval || 30; // seconds

    // Get layout option from widget config or default to 'normal'
    const layoutOption = widget.config?.layoutOption || 'normal';

    // Fetch Spotify data
    const fetchSpotifyData = async () => {
        // if (editMode) return;

        const requestId = Date.now();
        latestRequestRef.current = requestId;

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

            console.log('Fetching Spotify data...');
            const response = await fetch(`/api/spotify?${params.toString()}`);

            if (!response.ok) {
                throw new Error('Failed to fetch Spotify data');
            }

            const data = await response.json();
            console.log('Spotify data received:', {
                isPlaying: data.isPlaying,
                hasCurrentTrack: !!data.currentTrack,
                trackId: data.currentTrack?.item?.id
            });

            if (data.error) {
                // If we need authentication, redirect to auth URL if provided
                if (data.authUrl && !refreshToken) {
                    window.open(data.authUrl, '_blank');
                    throw new Error('Please authenticate with Spotify');
                }
                throw new Error(data.error);
            }

            // Check if this is still the latest request
            if (latestRequestRef.current !== requestId) {
                console.log('Ignoring stale response');
                return;
            }

            setSpotifyData(data);

            // Update playing state based on data
            const newIsPlaying = data.isPlaying || false;
            console.log('Setting isPlaying to:', newIsPlaying);
            setIsPlaying(newIsPlaying);

            // Update progress if currently playing
            if (data.currentTrack) {
                // Always update progress to stay in sync with Spotify
                setProgress(data.currentTrack.progress_ms || 0);

                // If we were previously playing a different track, reset audio preview
                if (audioRef.current && spotifyData?.currentTrack?.item?.id !== data.currentTrack.item?.id) {
                    stopPreview();
                }
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
            if (latestRequestRef.current === requestId) {
                setLoading(false);
            }
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

    // Update the progress update effect to respond to isPlaying changes
    useEffect(() => {
        // Clear any existing interval when isPlaying changes
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }

        // Only set up the interval if the track is playing
        if (isPlaying && spotifyData?.currentTrack) {
            console.log('Setting up progress interval - isPlaying:', isPlaying);
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
        } else {
            console.log('Not setting up progress interval - isPlaying:', isPlaying);
        }

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

    // Update the controlSpotifyPlayback function to remove status messages
    const controlSpotifyPlayback = async (action: 'play' | 'pause' | 'next' | 'previous' | 'shuffle' | 'repeat') => {
        if (!refreshToken || controlsDisabled) return;

        const now = Date.now();
        if (now - lastActionTime < 500) {
            console.log('Ignoring rapid control request');
            return;
        }

        setLastActionTime(now);
        setControlsDisabled(true);
        setTimeout(() => setControlsDisabled(false), 500);

        try {
            // Immediately update local state for better UX
            if (action === 'play') {
                setIsPlaying(true);
            } else if (action === 'pause') {
                setIsPlaying(false);
            }

            const response = await fetch(`/api/spotify/control`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action,
                    refreshToken,
                    clientId,
                    clientSecret
                })
            });

            const data = await response.json();

            if (!response.ok) {
                // Revert state change if request failed
                if (action === 'play') {
                    setIsPlaying(false);
                } else if (action === 'pause') {
                    setIsPlaying(true);
                }

                // Don't show status messages for errors
                console.error(`Failed to ${action} Spotify playback:`, data.error || 'Unknown error');
                return;
            }

            // Log success for debugging
            console.log(`Spotify ${action} successful:`, data);

            // Refresh data after action with a slight delay to allow Spotify API to update
            setTimeout(fetchSpotifyData, 1000);

            // Remove status message
            // showStatus(`${action.charAt(0).toUpperCase() + action.slice(1)}ing...`);
        } catch (err) {
            console.error(`Error controlling Spotify playback (${action}):`, err);
            // Remove status message
            // showStatus(`Failed to ${action}`);
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

    // Now Playing render functions for different layouts
    const renderCompactNowPlaying = () => (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            py: 1,
            overflow: 'hidden' // Prevent overflow
        }}>
            {currentTrack ? (
                <>
                    <Avatar
                        src={currentTrack.album.images?.[0]?.url}
                        alt={currentTrack.name}
                        variant="rounded"
                        sx={{
                            width: { xs: 50, sm: 60 }, // Responsive width
                            height: { xs: 50, sm: 60 }, // Responsive height
                            minWidth: { xs: 50, sm: 60 }, // Prevent shrinking too much
                            mr: 2
                        }}
                    >
                        <MusicNoteIcon />
                    </Avatar>
                    <Box sx={{
                        flexGrow: 1,
                        overflow: 'hidden', // Prevent text overflow
                        minWidth: 0 // Allow shrinking below default min-width
                    }}>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }} noWrap>
                            {currentTrack.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                            {currentTrack.artists.map((artist: any) => artist.name).join(', ')}
                        </Typography>
                        {spotifyData.isPlaying ? (
                            <Chip size="small" label="Playing" color="primary" sx={{ mt: 0.5 }} />
                        ) : (
                            <Typography variant="caption" color="text.secondary">
                                Last played
                            </Typography>
                        )}
                    </Box>
                </>
            ) : (
                <Typography>No track data available</Typography>
            )}
        </Box>
    );

    const renderCompactRecent = () => (
        <List dense sx={{ p: 0 }}>
            {spotifyData?.recentTracks?.slice(0, 3).map((item: any, index: number) => (
                <ListItem key={`${item.track.id}-${index}`} disablePadding sx={{ py: 0.5 }}>
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
            ))}
        </List>
    );

    // Add a new function to render the detailed layout
    const renderDetailedLayout = () => (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden' // Prevent overflow
        }}>
            {/* Current track section - make it more compact and responsive */}
            <Box sx={{
                display: 'flex',
                mb: 1.5, // Reduced margin
                minHeight: 0 // Allow shrinking below default min-height
            }}>
                {/* Album art - fixed size */}
                <Paper
                    elevation={3}
                    sx={{
                        width: { xs: 70, sm: 90, md: 100 }, // More responsive sizing
                        height: { xs: 70, sm: 90, md: 100 }, // More responsive sizing
                        minWidth: { xs: 70, sm: 90, md: 100 }, // Prevent shrinking too much
                        overflow: 'hidden',
                        borderRadius: 2,
                        position: 'relative',
                        cursor: currentTrack?.external_urls?.spotify ? 'pointer' : 'default',
                        mr: 1.5 // Reduced margin
                    }}
                    onClick={() => currentTrack?.external_urls?.spotify &&
                        openInSpotify(currentTrack.external_urls.spotify)}
                >
                    <Box
                        component="img"
                        src={currentTrack?.album.images?.[0]?.url || ''}
                        alt={currentTrack?.name}
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
                                top: 5,
                                right: 5,
                                bgcolor: 'primary.main',
                                color: 'white',
                                borderRadius: '50%',
                                width: { xs: 20, sm: 25 }, // Responsive size
                                height: { xs: 20, sm: 25 }, // Responsive size
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <PlayArrowIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />
                        </Box>
                    )}
                </Paper>

                {/* Track info - make it more responsive */}
                <Box sx={{
                    flexGrow: 1,
                    overflow: 'hidden', // Prevent text overflow
                    minWidth: 0, // Allow shrinking below default min-width
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}>
                    <Box>
                        <Typography
                            variant="subtitle1" // Smaller variant
                            sx={{
                                fontWeight: 'bold',
                                cursor: currentTrack?.external_urls?.spotify ? 'pointer' : 'default',
                                lineHeight: 1.2, // Tighter line height
                                mb: 0.5, // Add some space below
                                fontSize: { xs: '0.9rem', sm: '1rem' } // Responsive font size
                            }}
                            noWrap
                            onClick={() => currentTrack?.external_urls?.spotify &&
                                openInSpotify(currentTrack.external_urls.spotify)}
                        >
                            {currentTrack?.name}
                        </Typography>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }} // Responsive font size
                        >
                            {currentTrack?.artists.map((artist: any) => artist.name).join(', ')}
                        </Typography>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                            sx={{ display: { xs: 'none', sm: 'block' } }} // Hide on very small screens
                        >
                            {currentTrack?.album.name}
                        </Typography>
                    </Box>

                    {/* Progress bar - always visible but simplified on small screens */}
                    <Box sx={{ width: '100%', mt: { xs: 0.5, sm: 1 } }}>
                        <Box
                            sx={{
                                width: '100%',
                                height: 3, // Slightly smaller
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
                                    width: `${(progress / (currentTrack?.duration_ms || 1)) * 100}%`,
                                    transition: 'width 1s linear'
                                }}
                            />
                        </Box>
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            mt: 0.5,
                            fontSize: { xs: '0.65rem', sm: '0.75rem' } // Smaller on xs screens
                        }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 'inherit' }}>
                                {formatDuration(progress)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 'inherit' }}>
                                {formatDuration(currentTrack?.duration_ms || 0)}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Playback controls - more compact */}
            <Stack direction="row" spacing={{ xs: 0.5, sm: 1 }} sx={{ mb: 1.5, justifyContent: 'center' }}>
                <IconButton
                    size="small"
                    sx={{
                        color: 'text.secondary',
                        width: { xs: 28, sm: 32 },  // Responsive width
                        height: { xs: 28, sm: 32 }, // Responsive height
                        borderRadius: '50%' // Ensure perfect circle
                    }}
                    onClick={() => controlSpotifyPlayback('shuffle')}
                >
                    <ShuffleIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />
                </IconButton>
                <IconButton
                    size="small"
                    sx={{
                        width: { xs: 28, sm: 32 },  // Responsive width
                        height: { xs: 28, sm: 32 }, // Responsive height
                    }}
                    onClick={() => controlSpotifyPlayback('previous')}
                >
                    <SkipPreviousIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />
                </IconButton>
                <IconButton
                    size="small"
                    disabled={controlsDisabled}
                    sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' },
                        width: { xs: 36, sm: 40 },
                        height: { xs: 36, sm: 40 },
                        borderRadius: '50%',
                        '&.Mui-disabled': {
                            bgcolor: 'action.disabledBackground',
                            color: 'action.disabled'
                        }
                    }}
                    onClick={() => isPlaying ? controlSpotifyPlayback('pause') : controlSpotifyPlayback('play')}
                >
                    {isPlaying ?
                        <PauseIcon sx={{ fontSize: { xs: 18, sm: 22 } }} /> :
                        <PlayArrowIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />
                    }
                </IconButton>
                <IconButton
                    size="small"
                    sx={{
                        width: { xs: 28, sm: 32 },  // Responsive width
                        height: { xs: 28, sm: 32 }, // Responsive height
                    }}
                    onClick={() => controlSpotifyPlayback('next')}
                >
                    <SkipNextIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />
                </IconButton>
                <IconButton
                    size="small"
                    sx={{
                        color: 'text.secondary',
                        width: { xs: 28, sm: 32 },  // Responsive width
                        height: { xs: 28, sm: 32 }, // Responsive height
                    }}
                    onClick={() => controlSpotifyPlayback('repeat')}
                >
                    <RepeatIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />
                </IconButton>
            </Stack>

            {/* Recent tracks section - make it scrollable with adaptive height */}
            <Typography variant="subtitle2" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Recently Played
            </Typography>
            <List dense sx={{
                flexGrow: 1,
                overflow: 'auto',
                bgcolor: 'background.paper',
                borderRadius: 1,
                minHeight: 0, // Allow shrinking below default min-height
                '& .MuiListItem-root': {
                    py: { xs: 0.25, sm: 0.5 } // Smaller padding on xs screens
                }
            }}>
                {spotifyData?.recentTracks?.slice(0, 5).map((item: any, index: number) => (
                    <ListItem
                        key={`${item.track.id}-${index}`}
                        disablePadding
                        sx={{
                            py: 0.25, // Smaller padding
                            px: 1,
                            borderRadius: 1,
                            mb: 0.25, // Smaller margin
                            '&:hover': { bgcolor: 'action.hover' },
                            cursor: item.track.external_urls?.spotify ? 'pointer' : 'default'
                        }}
                        onClick={() => item.track.external_urls?.spotify &&
                            openInSpotify(item.track.external_urls.spotify)}
                    >
                        <ListItemAvatar sx={{ minWidth: { xs: 32, sm: 40 } }}>
                            <Avatar
                                src={item.track.album.images?.[0]?.url}
                                alt={item.track.name}
                                sx={{ width: { xs: 24, sm: 30 }, height: { xs: 24, sm: 30 } }}
                            >
                                <MusicNoteIcon fontSize="small" />
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={item.track.name}
                            secondary={item.track.artists.map((artist: any) => artist.name).join(', ')}
                            primaryTypographyProps={{
                                variant: 'body2',
                                noWrap: true,
                                fontSize: { xs: '0.75rem', sm: '0.875rem' } // Responsive font size
                            }}
                            secondaryTypographyProps={{
                                variant: 'caption',
                                noWrap: true,
                                fontSize: { xs: '0.65rem', sm: '0.75rem' } // Responsive font size
                            }}
                        />
                        {item.track.preview_url && (
                            <IconButton
                                edge="end"
                                size="small"
                                sx={{
                                    width: { xs: 24, sm: 30 },
                                    height: { xs: 24, sm: 30 }
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    playPreview(item.track.preview_url);
                                }}
                            >
                                <PlayArrowIcon sx={{ fontSize: { xs: 14, sm: 18 } }} />
                            </IconButton>
                        )}
                    </ListItem>
                ))}
            </List>
        </Box>
    );

    return (
        <Box sx={{
            p: 2,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden' // Prevent overflow
        }}>
            {/* Header with toggle button */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1.5, // Slightly reduce margin
                flexShrink: 0 // Prevent header from shrinking
            }}>
                <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                    {showRecent ? 'Recently Played' : 'Now Playing'}
                </Typography>
                <Box>
                    {layoutOption !== 'detailed' && (
                        <Button
                            size="small"
                            onClick={toggleView}
                            variant="outlined"
                        >
                            {showRecent ? 'Current' : 'History'}
                        </Button>
                    )}
                    <IconButton size="small" onClick={fetchSpotifyData} sx={{ ml: 1 }}>
                        <RefreshIcon fontSize="small" />
                    </IconButton>
                </Box>
            </Box>

            {/* Content container - make it flexible */}
            <Box sx={{
                flexGrow: 1,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0 // Allow shrinking below default min-height
            }}>
                {/* Layout content (compact, normal, or detailed) */}
                {layoutOption === 'compact' ? (
                    showRecent ? renderCompactRecent() : renderCompactNowPlaying()
                ) : layoutOption === 'detailed' ? (
                    // For detailed layout, use the new combined view
                    renderDetailedLayout()
                ) : (
                    // For normal layout, use existing views with modifications
                    showRecent ? (
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
                                        position: 'relative',
                                        cursor: item.track.external_urls?.spotify ? 'pointer' : 'default'
                                    }}
                                    onClick={() => item.track.external_urls?.spotify &&
                                        openInSpotify(item.track.external_urls.spotify)}
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
                        // Now playing view with modifications
                        <>
                            {currentTrack ? (
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    flexGrow: 1,
                                    overflow: 'hidden', // Prevent overflow
                                    justifyContent: 'space-between' // Better space distribution
                                }}>
                                    {/* Album art - make it responsive */}
                                    <Paper
                                        elevation={3}
                                        sx={{
                                            width: { xs: 120, sm: 150 }, // Fixed width instead of 100%
                                            height: { xs: 120, sm: 150 }, // Matching height
                                            mb: 2,
                                            overflow: 'hidden',
                                            borderRadius: 2,
                                            position: 'relative',
                                            cursor: currentTrack.external_urls?.spotify ? 'pointer' : 'default'
                                        }}
                                        onClick={() => currentTrack.external_urls?.spotify &&
                                            openInSpotify(currentTrack.external_urls.spotify)}
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

                                    {/* Track info - make it more responsive */}
                                    <Box sx={{
                                        textAlign: 'center',
                                        mb: 1,
                                        width: '100%',
                                        overflow: 'hidden' // Prevent text overflow
                                    }}>
                                        <Typography
                                            variant="h6"
                                            noWrap
                                            sx={{
                                                fontWeight: 'bold',
                                                cursor: currentTrack.external_urls?.spotify ? 'pointer' : 'default'
                                            }}
                                            onClick={() => currentTrack.external_urls?.spotify &&
                                                openInSpotify(currentTrack.external_urls.spotify)}
                                        >
                                            {currentTrack.name}
                                        </Typography>
                                        <Typography variant="body1" color="text.secondary" noWrap>
                                            {currentTrack.artists.map((artist: any) => artist.name).join(', ')}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" noWrap>
                                            {currentTrack.album.name}
                                        </Typography>
                                    </Box>

                                    {/* Progress bar - make it responsive */}
                                    <Box sx={{ width: '100%', mb: 1 }}>
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

                                    {/* Playback controls - make them responsive */}
                                    <Stack
                                        direction="row"
                                        spacing={{ xs: 0.5, sm: 1 }} // Responsive spacing
                                        sx={{ mb: 1 }}
                                    >
                                        <IconButton
                                            size="small"
                                            sx={{
                                                color: 'text.secondary',
                                                width: 32,  // Fixed width
                                                height: 32, // Fixed height
                                                borderRadius: '50%' // Ensure perfect circle
                                            }}
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
                                            sx={{
                                                bgcolor: 'primary.main',
                                                color: 'white',
                                                '&:hover': { bgcolor: 'primary.dark' },
                                                width: 48,  // Slightly larger for "large" size
                                                height: 48, // Maintain perfect circle
                                                borderRadius: '50%' // Ensure perfect circle
                                            }}
                                            onClick={() => {
                                                if (isPlaying) {
                                                    controlSpotifyPlayback('pause');
                                                } else {
                                                    controlSpotifyPlayback('play');
                                                }
                                            }}
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
                                </Box>
                            ) : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                    <MusicNoteIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                                    <Typography variant="h6">No track data available</Typography>
                                </Box>
                            )}
                        </>
                    )
                )}
            </Box>

            {/* {statusMessage && <StatusMessage message={statusMessage} />} */}
        </Box>
    );
};

export default SpotifyWidget; 