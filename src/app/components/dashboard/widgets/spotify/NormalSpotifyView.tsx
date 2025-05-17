import { Box, Avatar, Typography, IconButton, Slider, Stack } from '@mui/material';
import { SpotifyViewProps } from './types';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import { alpha } from '@mui/material/styles';

const NormalSpotifyView: React.FC<SpotifyViewProps> = ({
    currentTrack,
    isPlaying,
    position,
    duration,
    togglePlay,
    previousTrack,
    nextTrack,
    handleSeekChange,
    formatDuration,
    theme
}) => {
    if (!currentTrack) {
        return (
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <MusicNoteIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                    No track playing
                </Typography>
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
                    src={currentTrack.album.images?.[0]?.url}
                    alt={currentTrack.name}
                    variant="rounded"
                    sx={{
                        width: 48,
                        height: 48,
                        mr: 1,
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
                    <MusicNoteIcon sx={{ fontSize: 24 }} />
                </Avatar>
                <Box>
                    <Typography
                        variant="body1"
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
                        {currentTrack.name}
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{
                            color: alpha(theme.palette.text.primary, 0.7),
                            lineHeight: 1.4,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {currentTrack.artists.map(artist => artist.name).join(', ')}
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ mt: 'auto' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption">{formatDuration(position)}</Typography>
                    <Typography variant="caption">{formatDuration(duration)}</Typography>
                </Box>

                <Slider
                    value={position}
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
                            width: 10,
                            height: 10,
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover, &.Mui-active': {
                                boxShadow: `0 0 0 8px ${alpha(theme.palette.primary.main, 0.16)}`,
                                width: 12,
                                height: 12
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
                        minHeight: 40
                    }}
                >
                    <IconButton
                        onClick={previousTrack}
                        size="small"
                        sx={{
                            color: alpha(theme.palette.text.primary, 0.7),
                            padding: 0.5
                        }}
                    >
                        <SkipPreviousIcon fontSize="small" />
                    </IconButton>

                    <IconButton
                        onClick={togglePlay}
                        size="small"
                        sx={{
                            color: theme.palette.primary.main,
                            background: alpha(theme.palette.primary.main, 0.1),
                            padding: 1,
                            '&:hover': {
                                background: alpha(theme.palette.primary.main, 0.2)
                            }
                        }}
                    >
                        {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                    </IconButton>

                    <IconButton
                        onClick={nextTrack}
                        size="small"
                        sx={{
                            color: alpha(theme.palette.text.primary, 0.7),
                            padding: 0.5
                        }}
                    >
                        <SkipNextIcon fontSize="small" />
                    </IconButton>
                </Stack>
            </Box>
        </Box>
    );
};

export default NormalSpotifyView; 