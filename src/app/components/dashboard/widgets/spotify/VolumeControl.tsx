import React from 'react';
import { Box, IconButton, Slider } from '@mui/material';
import { Theme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

interface VolumeControlProps {
    theme: Theme;
    volume: number;
    onVolumeChange: (volume: number) => void;
    onMute: () => void;
    getVolumeIcon: () => React.ReactElement;
    compact?: boolean;
}

export const VolumeControl: React.FC<VolumeControlProps> = ({
    theme,
    volume,
    onVolumeChange,
    onMute,
    getVolumeIcon,
    compact = false
}) => {
    const [showControls, setShowControls] = React.useState(false);

    const handleVolumeClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onMute();
    };

    const handleSliderChange = (event: Event, newValue: number | number[]) => {
        event.stopPropagation();
        onVolumeChange(Array.isArray(newValue) ? newValue[0] : newValue);
    };

    return (
        <Box
            sx={{
                position: 'relative',
                zIndex: 2
            }}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
        >
            <IconButton
                size={compact ? "small" : "medium"}
                onClick={handleVolumeClick}
                sx={{
                    position: 'relative',
                    zIndex: 2
                }}
            >
                {getVolumeIcon()}
            </IconButton>

            <Box
                sx={{
                    position: 'absolute',
                    right: 0,
                    bottom: 40,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background: alpha(theme.palette.background.paper, 0.95),
                    borderRadius: 2,
                    padding: 1,
                    boxShadow: theme.shadows[4],
                    opacity: showControls ? 1 : 0,
                    visibility: showControls ? 'visible' : 'hidden',
                    transition: 'all 0.2s ease-in-out',
                    zIndex: 10,
                    '&:hover': {
                        opacity: 1,
                        visibility: 'visible'
                    }
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <Slider
                    value={volume}
                    onChange={handleSliderChange}
                    orientation="vertical"
                    size="small"
                    sx={{
                        height: 100,
                        '& .MuiSlider-thumb': {
                            width: 12,
                            height: 12,
                            '&:hover': {
                                boxShadow: `0 0 0 8px ${alpha(theme.palette.primary.main, 0.16)}`
                            }
                        }
                    }}
                />
            </Box>
        </Box>
    );
};

export const VolumeButton: React.FC<{
    volume: number;
    showVolumeControls: boolean;
    setShowVolumeControls: (show: boolean) => void;
    getVolumeIcon: () => React.ReactElement;
    toggleMute: () => void;
    compact?: boolean;
}> = ({
    volume,
    showVolumeControls,
    setShowVolumeControls,
    getVolumeIcon,
    toggleMute,
    compact = false
}) => (
        <IconButton
            size={compact ? "small" : "medium"}
            onClick={toggleMute}
            onMouseEnter={() => setShowVolumeControls(true)}
            onMouseLeave={() => setShowVolumeControls(false)}
            sx={{
                position: 'relative',
                zIndex: 2
            }}
        >
            {getVolumeIcon()}
        </IconButton>
    ); 