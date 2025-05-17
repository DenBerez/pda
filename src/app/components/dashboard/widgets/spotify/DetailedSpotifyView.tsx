import { Box, Avatar, Typography, IconButton, Slider, Stack, Chip, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material';
import { SpotifyViewProps } from './types';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import LaunchIcon from '@mui/icons-material/Launch';
import { alpha } from '@mui/material/styles';

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
    theme
}) => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Player section */}
            <Box sx={{ mb: 3 }}>
                <Box sx={{
                    display: 'flex',
                    mb: 3,
                    alignItems: 'center',
                    gap: 3
                }}>
                    <Avatar
                        src={currentTrack?.album.images?.[0]?.url}
                        alt={currentTrack?.name}
                        variant="rounded"
                        sx={{
                            width: 120,
                            height: 120,
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
                        <MusicNoteIcon sx={{ fontSize: 40 }} />
                    </Avatar>

                    <Box sx={{
                        flex: 1,
                        minWidth: 0 // Ensures text truncation works
                    }}>
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 600,
                                mb: 0.5,
                                lineHeight: 1.3,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                color: theme.palette.text.primary,
                                transition: 'color 0.2s ease'
                            }}
                        >
                            {currentTrack?.name || 'No track playing'}
                        </Typography>

                        {currentTrack && (
                            <>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: alpha(theme.palette.text.primary, 0.7),
                                        lineHeight: 1.4,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        mb: 1
                                    }}
                                >
                                    {currentTrack.artists.map(artist => artist.name).join(', ')}
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mb: 2 }}
                                >
                                    {currentTrack.album.name}
                                </Typography>

                                <Chip
                                    label={isPlaying ? "Now Playing" : "Paused"}
                                    color={isPlaying ? "primary" : "default"}
                                    size="small"
                                    sx={{
                                        borderRadius: '6px',
                                        '& .MuiChip-label': {
                                            px: 2
                                        }
                                    }}
                                />
                            </>
                        )}
                    </Box>
                </Box>

                {currentTrack && (
                    <>
                        <Box sx={{ mt: 2, mb: 3 }}>
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                mb: 1
                            }}>
                                <Typography variant="caption" color="text.secondary">
                                    {formatDuration(position)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {formatDuration(duration)}
                                </Typography>
                            </Box>

                            <Slider
                                value={position}
                                min={0}
                                max={duration}
                                onChange={handleSeekChange}
                                sx={{
                                    '& .MuiSlider-track': {
                                        background: `linear-gradient(90deg, 
                                            ${theme.palette.primary.main} 0%, 
                                            ${theme.palette.primary.light} 100%)`,
                                        border: 'none',
                                        height: 4
                                    },
                                    '& .MuiSlider-thumb': {
                                        width: 14,
                                        height: 14,
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        '&:hover, &.Mui-active': {
                                            boxShadow: `0 0 0 8px ${alpha(theme.palette.primary.main, 0.16)}`,
                                            width: 16,
                                            height: 16
                                        }
                                    }
                                }}
                            />

                            <Stack
                                direction="row"
                                spacing={2}
                                justifyContent="center"
                                alignItems="center"
                                sx={{
                                    mt: 2,
                                    background: alpha(theme.palette.background.paper, 0.5),
                                    borderRadius: 2,
                                    padding: 1,
                                    backdropFilter: 'blur(5px)'
                                }}
                            >
                                <IconButton onClick={previousTrack}>
                                    <SkipPreviousIcon />
                                </IconButton>
                                <IconButton
                                    onClick={togglePlay}
                                    sx={{
                                        color: theme.palette.primary.main,
                                        background: alpha(theme.palette.primary.main, 0.1),
                                        '&:hover': {
                                            background: alpha(theme.palette.primary.main, 0.2)
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
                    </>
                )}
            </Box>

            {/* Recent tracks section */}
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                Recently Played
            </Typography>
            <List sx={{ overflow: 'auto' }}>
                {recentTracks.map((track, index) => (
                    <ListItem
                        key={`${track.uri}-${index}`}
                        secondaryAction={
                            <Box>
                                {track.preview_url && (
                                    <IconButton
                                        edge="end"
                                        onClick={() => track.preview_url && playPreview(track.preview_url)}
                                        sx={{ mr: 1 }}
                                    >
                                        <PlayArrowIcon />
                                    </IconButton>
                                )}
                                <IconButton
                                    edge="end"
                                    onClick={() => openInSpotify(track.uri)}
                                >
                                    <LaunchIcon />
                                </IconButton>
                            </Box>
                        }
                    >
                        <ListItemAvatar>
                            <Avatar
                                src={track.album.images?.[0]?.url}
                                alt={track.name}
                                variant="rounded"
                            >
                                <MusicNoteIcon />
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={track.name}
                            secondary={
                                <>
                                    {track.artists.map(artist => artist.name).join(', ')}
                                    <br />
                                    {track.album.name}
                                </>
                            }
                        />
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};

export default DetailedSpotifyView; 