import React, { useState, useCallback } from 'react';
import {
    Box,
    Typography,
    IconButton,
    Button,
    CircularProgress
} from '@mui/material';
import { Widget } from '../../types';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeDownIcon from '@mui/icons-material/VolumeDown';
import VolumeMuteIcon from '@mui/icons-material/VolumeMute';
import { useTheme } from '@mui/material/styles';
import { SpotifyWidgetProps } from './types';
import CompactSpotifyView from './CompactSpotifyView';
import NormalSpotifyView from './NormalSpotifyView';
import DetailedSpotifyView from './DetailedSpotifyView';
import { useSpotifyPlayer } from '@/app/hooks/useSpotifyPlayer';

// Add this type at the top of the file
type LayoutOption = 'compact' | 'normal' | 'detailed';

const SpotifyWidget: React.FC<SpotifyWidgetProps> = ({ widget, editMode, onUpdateWidget }) => {
    const theme = useTheme();
    const [showRecent, setShowRecent] = useState(false);
    const [showVolumeControls, setShowVolumeControls] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const refreshToken = widget.config?.refreshToken;
    const layoutOption = widget.config?.layoutOption || 'normal';

    const {
        isReady,
        isPlayerConnected,
        isTransferring,
        state,
        volume,
        recentTracks,
        error,
        controls,
        utils
    } = useSpotifyPlayer(refreshToken);

    // Get volume icon based on level
    const getVolumeIcon = useCallback(() => {
        if (volume === 0) return <VolumeMuteIcon />;
        if (volume < 50) return <VolumeDownIcon />;
        return <VolumeUpIcon />;
    }, [volume]);

    // Toggle view between current track and recent tracks
    const toggleView = useCallback(() => {
        setShowRecent(prev => !prev);
    }, []);

    // Show status message temporarily
    const showTemporaryStatus = useCallback((message: string) => {
        setStatusMessage(message);
        setTimeout(() => setStatusMessage(null), 3000);
    }, []);

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

    // Loading state
    if (!isReady && !error) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress size={40} />
            </Box>
        );
    }

    // Error state
    if (error) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="error" gutterBottom>
                    Error connecting to Spotify
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {error}
                </Typography>
                <Button
                    variant="outlined"
                    sx={{ mt: 2 }}
                    onClick={() => window.location.reload()}
                >
                    Retry
                </Button>
            </Box>
        );
    }

    const currentTrack = state?.track ? {
        name: state.track.name,
        artists: state.track.artists,
        album: state.track.album,
        duration_ms: state.track.duration_ms || state.duration,
        uri: state.track.uri || '',
        preview_url: state.track.preview_url
    } : null;

    const commonProps = {
        currentTrack,
        isPlaying: state ? !state.isPaused : false,
        position: state?.position || 0,
        duration: state?.duration || 0,
        volume,
        recentTracks,
        showRecent,
        isPlayerConnected,
        isTransferringPlayback: isTransferring,
        handleTransferPlayback: controls.transferPlayback,
        togglePlay: controls.togglePlay,
        previousTrack: controls.previous,
        nextTrack: controls.next,
        handleSeekChange: controls.handleSeekChange,
        handleVolumeChange: controls.handleVolumeChange,
        showVolumeControls,
        setShowVolumeControls,
        getVolumeIcon,
        toggleMute: controls.toggleMute,
        playPreview: controls.playPreview,
        openInSpotify: controls.openInSpotify,
        formatDuration: utils.formatDuration,
        toggleView,
        theme,
        showTransferButton: !isPlayerConnected || (!state || (state.isPaused && !currentTrack))
    };

    return (
        <Box sx={{
            flexGrow: 1,
            overflow: 'auto',
            position: 'relative',
            p: layoutOption === 'compact' ? 1 : 2
        }}>
            {layoutOption === 'compact' && <CompactSpotifyView {...commonProps} />}
            {layoutOption === 'normal' && <NormalSpotifyView {...commonProps} />}
            {layoutOption === 'detailed' && <DetailedSpotifyView {...commonProps} />}

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

export default SpotifyWidget; 