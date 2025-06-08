import { Box, IconButton } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';

interface PlaybackControlsProps {
    isPlaying: boolean;
    onPlayPause: () => void;
    onNext?: () => void;
    onPrevious?: () => void;
    compact?: boolean;
    disabled?: boolean;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
    isPlaying,
    onPlayPause,
    onNext,
    onPrevious,
    compact = false,
    disabled = false
}) => {
    const iconSize = compact ? "small" : "medium";
    const buttonSize = compact ? "small" : "medium";
    const buttonPadding = compact ? '4px' : '8px';

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: compact ? 0.5 : 1,
            '& .MuiIconButton-root': {
                padding: buttonPadding
            }
        }}>
            {onPrevious && (
                <IconButton
                    size={buttonSize}
                    onClick={onPrevious}
                    disabled={disabled}
                >
                    <SkipPreviousIcon fontSize={iconSize} />
                </IconButton>
            )}
            <IconButton
                size={buttonSize}
                onClick={onPlayPause}
                disabled={disabled}
            >
                {isPlaying ?
                    <PauseIcon fontSize={iconSize} /> :
                    <PlayArrowIcon fontSize={iconSize} />
                }
            </IconButton>
            {onNext && (
                <IconButton
                    size={buttonSize}
                    onClick={onNext}
                    disabled={disabled}
                >
                    <SkipNextIcon fontSize={iconSize} />
                </IconButton>
            )}
        </Box>
    );
}; 