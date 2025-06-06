import { Box, Avatar, Typography, IconButton, List, ListItem, ListItemAvatar, ListItemText, Theme, Button } from '@mui/material';
import { SpotifyTrack, SpotifyViewProps } from './types';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import LaunchIcon from '@mui/icons-material/Launch';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import { alpha } from '@mui/material/styles';
import DevicesIcon from '@mui/icons-material/Devices';
import { VolumeControl } from './VolumeControl';

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
                    <Box>
                        {currentTrack.preview_url && (
                            <IconButton
                                edge="end"
                                onClick={() => currentTrack.preview_url && playPreview(currentTrack.preview_url)}
                                sx={{ mr: 1 }}
                                size="small"
                            >
                                <PlayArrowIcon fontSize="small" />
                            </IconButton>
                        )}
                        <VolumeControl
                            theme={theme}
                            volume={volume}
                            onVolumeChange={onVolumeChange}
                            onMute={onMute}
                            getVolumeIcon={getVolumeIcon}
                            compact={true}
                        />
                        <IconButton
                            edge="end"
                            onClick={() => openInSpotify(currentTrack.uri)}
                            size="small"
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