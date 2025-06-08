import { Box, Avatar, Typography, IconButton, List, ListItem, ListItemAvatar, ListItemText, Theme, Button } from '@mui/material';
import { SpotifyTrack, SpotifyViewProps } from './types';
import LaunchIcon from '@mui/icons-material/Launch';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import { alpha } from '@mui/material/styles';
import DevicesIcon from '@mui/icons-material/Devices';
import { VolumeControl } from './VolumeControl';
import { PlaybackControls } from './PlaybackControls';

const CompactSpotifyView: React.FC<SpotifyViewProps> = ({
    currentTrack,
    isPlaying,
    togglePlay,
    theme,
    isPlayerConnected,
    handleTransferPlayback,
    showTransferButton,
    playPreview,
    openInSpotify,
    volume,
    onVolumeChange,
    onMute,
    getVolumeIcon
}) => {
    if (showTransferButton) {
        return (
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                p: 1
            }}>
                <Button
                    size="small"
                    variant="contained"
                    startIcon={<DevicesIcon sx={{ fontSize: 16 }} />}
                    onClick={handleTransferPlayback}
                    sx={{
                        fontSize: '0.75rem',
                        py: 0.5
                    }}
                >
                    Transfer Playback
                </Button>
            </Box>
        );
    }

    if (!currentTrack) {
        return (
            <ListItem>
                <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'background.paper' }}>
                        <MusicNoteIcon color="primary" />
                    </Avatar>
                </ListItemAvatar>
                <ListItemText
                    primary="No Active Playback"
                    secondary={
                        <Button
                            variant="text"
                            size="small"
                            startIcon={<DevicesIcon />}
                            onClick={handleTransferPlayback}
                        >
                            Transfer
                        </Button>
                    }
                />
            </ListItem>
        );
    }

    return (
        <List sx={{ mt: 0, '& .MuiListItem-root': { py: 0.5 } }}>
            <ListItem
                secondaryAction={
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                    }}>
                        <PlaybackControls
                            isPlaying={isPlaying}
                            onPlayPause={togglePlay}
                            onNext={() => {/* TODO: Add skip next handler */ }}
                            onPrevious={() => {/* TODO: Add skip previous handler */ }}
                            compact={true}
                            disabled={!isPlayerConnected}
                        />
                        <Box sx={{
                            width: 100,
                            mx: 1
                        }}>
                            <VolumeControl
                                theme={theme}
                                volume={volume}
                                onVolumeChange={onVolumeChange}
                                onMute={onMute}
                                getVolumeIcon={getVolumeIcon}
                                compact={true}
                            />
                        </Box>
                        <IconButton
                            size="small"
                            onClick={() => openInSpotify(currentTrack.uri)}
                        >
                            <LaunchIcon fontSize="small" />
                        </IconButton>
                    </Box>
                }
            >
                <ListItemAvatar>
                    <Avatar
                        src={currentTrack?.album?.images?.[0]?.url}
                        alt={currentTrack?.name || 'Track'}
                        variant="rounded"
                        sx={{ width: 32, height: 32 }}
                    >
                        <MusicNoteIcon />
                    </Avatar>
                </ListItemAvatar>
                <ListItemText
                    primary={currentTrack.name}
                    secondary={currentTrack?.artists?.map(artist => artist.name).join(', ')}
                    primaryTypographyProps={{
                        variant: 'body2',
                        sx: {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }
                    }}
                    secondaryTypographyProps={{
                        variant: 'caption',
                        sx: {
                            color: alpha(theme.palette.text.primary, 0.7)
                        }
                    }}
                />
            </ListItem>
        </List>
    );
};

export default CompactSpotifyView; 