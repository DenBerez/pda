import { Box, Avatar, Typography, IconButton, Slider, Stack, Chip, List, ListItem, ListItemAvatar, ListItemText, Button } from '@mui/material';
import { SpotifyViewProps } from './types';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import LaunchIcon from '@mui/icons-material/Launch';
import { alpha } from '@mui/material/styles';
import DevicesIcon from '@mui/icons-material/Devices';
import { VolumeControl } from './VolumeControl';
import { PlaybackControls } from './PlaybackControls';
import { useEffect, useRef, useState } from 'react';

const DetailedSpotifyView: React.FC<SpotifyViewProps> = ({
    currentTrack,
    isPlaying,
    position,
    duration,
    recentTracks,
    togglePlay,
    previousTrack,
    nextTrack,
    handleSeekChange,
    playPreview,
    openInSpotify,
    formatDuration,
    theme,
    isPlayerConnected,
    handleTransferPlayback,
    showTransferButton,
    volume,
    onVolumeChange,
    onMute,
    getVolumeIcon
}) => {
    // Add state and refs for smooth progress
    const [smoothPosition, setSmoothPosition] = useState(position);
    const lastUpdateRef = useRef(Date.now());
    const animationFrameRef = useRef<number | undefined>(undefined);

    // Update progress smoothly
    useEffect(() => {
        const updateProgress = () => {
            if (isPlaying && duration > 0) {
                const now = Date.now();
                const elapsed = now - lastUpdateRef.current;
                lastUpdateRef.current = now;

                setSmoothPosition(prev => {
                    const newPosition = Math.min(duration, prev + elapsed);
                    if (newPosition < duration) {
                        animationFrameRef.current = window.requestAnimationFrame(updateProgress);
                    }
                    return newPosition;
                });
            }
        };

        // Reset position when track changes or position is updated from parent
        setSmoothPosition(position);
        lastUpdateRef.current = Date.now();

        // Start animation if playing
        if (isPlaying && duration > 0) {
            animationFrameRef.current = window.requestAnimationFrame(updateProgress);
        }

        // Cleanup
        return () => {
            if (animationFrameRef.current) {
                window.cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isPlaying, position, duration]);

    if (showTransferButton) {
        return (
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                p: 2
            }}>
                <Typography variant="body1" color="text.secondary">
                    No track playing
                </Typography>
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

    if (!currentTrack) {
        return (
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <MusicNoteIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body1" color="text.secondary" gutterBottom>
                    No Active Playback
                </Typography>
                <Button
                    variant="contained"
                    size="small"
                    startIcon={<DevicesIcon />}
                    onClick={handleTransferPlayback}
                    sx={{ mt: 1 }}
                >
                    Transfer Playback
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            pt: 2,
            px: 2,
            gap: 1
        }}>
            <Box sx={{ display: 'flex', mb: 3, alignItems: 'center' }}>
                <Avatar
                    src={currentTrack?.album?.images?.[0]?.url}
                    alt={currentTrack?.name || 'Track'}
                    variant="rounded"
                    sx={{
                        width: 64,
                        height: 64,
                        mr: 2,
                        boxShadow: theme.shadows[8],
                        borderRadius: 2,
                        transform: 'translateZ(0)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                            transform: 'scale(1.05) translateZ(0)',
                            boxShadow: theme.shadows[12],
                        }
                    }}
                >
                    <MusicNoteIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 600,
                                lineHeight: 1.3,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                color: theme.palette.text.primary,
                                transition: 'color 0.2s ease',
                                flexGrow: 1
                            }}
                        >
                            {currentTrack?.name || 'Unknown Track'}
                        </Typography>
                        <IconButton
                            size="small"
                            onClick={() => openInSpotify(currentTrack.uri)}
                            sx={{ ml: 1 }}
                        >
                            <LaunchIcon fontSize="small" />
                        </IconButton>
                    </Box>
                    <Typography
                        variant="body2"
                        sx={{
                            color: alpha(theme.palette.text.primary, 0.7),
                            lineHeight: 1.4,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {currentTrack?.artists?.map(artist => artist.name).join(', ')}
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{
                            color: alpha(theme.palette.text.primary, 0.5),
                            display: 'block',
                            mt: 0.5
                        }}
                    >
                        {currentTrack?.album?.name}
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ mt: 'auto' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption">{formatDuration(smoothPosition)}</Typography>
                    <Typography variant="caption">{formatDuration(duration)}</Typography>
                </Box>

                <Slider
                    value={smoothPosition}
                    min={0}
                    max={duration}
                    onChange={handleSeekChange}
                    size="small"
                    sx={{
                        '& .MuiSlider-track': {
                            background: `linear-gradient(90deg, 
                                ${theme.palette.primary.main} 0%, 
                                ${theme.palette.primary.light} 100%)`,
                            border: 'none',
                            height: 3
                        },
                        '& .MuiSlider-thumb': {
                            width: 12,
                            height: 12,
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover, &.Mui-active': {
                                boxShadow: `0 0 0 8px ${alpha(theme.palette.primary.main, 0.16)}`,
                                width: 14,
                                height: 14
                            }
                        },
                        '& .MuiSlider-rail': {
                            opacity: 0.3
                        }
                    }}
                />

                <Stack
                    direction="row"
                    spacing={1}
                    justifyContent="center"
                    alignItems="center"
                    sx={{
                        mt: 1,
                        mb: 1,
                        background: alpha(theme.palette.background.paper, 0.5),
                        borderRadius: 2,
                        padding: 0.5,
                        backdropFilter: 'blur(5px)',
                        minHeight: 48
                    }}
                >
                    <PlaybackControls
                        isPlaying={isPlaying}
                        onPlayPause={togglePlay}
                        onNext={nextTrack}
                        onPrevious={previousTrack}
                        disabled={!isPlayerConnected}
                    />

                    <VolumeControl
                        theme={theme}
                        volume={volume}
                        onVolumeChange={onVolumeChange}
                        onMute={onMute}
                        getVolumeIcon={getVolumeIcon}
                    />
                </Stack>
            </Box>
        </Box>
    );
};

export default DetailedSpotifyView; 