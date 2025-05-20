import React from 'react';
import { Box, IconButton, Slider } from '@mui/material';
import { Theme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

interface VolumeControlProps {
    theme: Theme;
    volume: number;
    showVolumeControls: boolean;
    setShowVolumeControls: (show: boolean) => void;
    handleVolumeChange: (event: Event, newValue: number | number[]) => void;
    getVolumeIcon: () => React.ReactElement;
    toggleMute: () => void;
    compact?: boolean;
}

export const VolumeControl: React.FC<VolumeControlProps> = ({
    theme,
    volume,
    showVolumeControls,
    setShowVolumeControls,
    handleVolumeChange,
    getVolumeIcon,
    toggleMute,
    compact = false
}) => {
    return (
        <Box
            sx={{
                position: 'relative',
                zIndex: 2
            }}
            onMouseEnter={() => setShowVolumeControls(true)}
            onMouseLeave={() => setShowVolumeControls(false)}
        >
            {/* Volume Button */}
            <IconButton
                size={compact ? "small" : "medium"}
                onClick={toggleMute}
                sx={{
                    position: 'relative',
                    zIndex: 2
                }}
            >
                {getVolumeIcon()}
            </IconButton>

            {/* Volume Slider Popup */}
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
                    opacity: showVolumeControls ? 1 : 0,
                    visibility: showVolumeControls ? 'visible' : 'hidden',
                    transition: 'all 0.2s ease-in-out',
                    zIndex: 10,
                    '&:hover': {
                        opacity: 1,
                        visibility: 'visible'
                    }
                }}
            >
                <Slider
                    value={volume}
                    onChange={handleVolumeChange}
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
                <IconButton
                    size="small"
                    sx={{
                        mt: 1,
                        '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.08)
                        }
                    }}
                    onClick={toggleMute}
                >
                    {getVolumeIcon()}
                </IconButton>
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