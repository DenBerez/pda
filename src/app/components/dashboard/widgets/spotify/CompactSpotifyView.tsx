import { Box, Avatar, Typography, IconButton, List, ListItem, ListItemAvatar, ListItemText, Theme } from '@mui/material';
import { SpotifyTrack, SpotifyViewProps } from './types';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import LaunchIcon from '@mui/icons-material/Launch';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import { alpha } from '@mui/material/styles';

const CompactSpotifyView: React.FC<SpotifyViewProps> = ({
    currentTrack,
    recentTracks,
    showRecent,
    playPreview,
    openInSpotify,
    theme
}) => {
    return (
        <List sx={{ mt: 0, '& .MuiListItem-root': { py: 0.5 } }}>
            {recentTracks.length > 0 ? (
                recentTracks.map((track, index) => (
                    <ListItem
                        key={`${track.uri}-${index}`}
                        secondaryAction={
                            <Box>
                                {track.preview_url && (
                                    <IconButton
                                        edge="end"
                                        onClick={() => track.preview_url && playPreview(track.preview_url)}
                                        sx={{ mr: 1 }}
                                        size="small"
                                    >
                                        <PlayArrowIcon fontSize="small" />
                                    </IconButton>
                                )}
                                <IconButton
                                    edge="end"
                                    onClick={() => openInSpotify(track.uri)}
                                    size="small"
                                >
                                    <LaunchIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        }
                    >
                        <ListItemAvatar>
                            <Avatar
                                src={track.album.images?.[0]?.url}
                                alt={track.name}
                                variant="rounded"
                                sx={{ width: 32, height: 32 }}
                            >
                                <MusicNoteIcon />
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={track.name}
                            secondary={track.artists.map(artist => artist.name).join(', ')}
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
                ))
            ) : (
                <Typography variant="body2" sx={{ p: 2 }}>
                    No recent tracks found
                </Typography>
            )}
        </List>
    );
};

export default CompactSpotifyView; 