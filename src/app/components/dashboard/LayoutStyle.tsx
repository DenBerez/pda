import React from 'react';
import {
    Box,
    FormHelperText,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip
} from '@mui/material';
// import ViewListIcon from '@mui/icons-material/ViewList';
// import ViewModuleIcon from '@mui/icons-material/ViewModule';
// import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';

// New Icons
import DensitySmallIcon from '@mui/icons-material/DensitySmall';
import DensityMediumIcon from '@mui/icons-material/DensityMedium';
import DensityLargeIcon from '@mui/icons-material/DensityLarge';

interface LayoutStyleSelectorProps {
    value: 'compact' | 'normal' | 'detailed';
    onChange: (value: 'compact' | 'normal' | 'detailed') => void;
    helperText?: string;
}

const LayoutStyleSelector: React.FC<LayoutStyleSelectorProps> = ({
    value,
    onChange,
    helperText = 'Select how much information to display'
}) => {
    return (
        <Box sx={{ mb: 2 }}>
            <ToggleButtonGroup
                value={value}
                exclusive
                onChange={(e, newValue) => {
                    if (newValue !== null) { // Prevent unselecting all options
                        onChange(newValue);
                    }
                }}
                aria-label="layout style"
                fullWidth
                size="small"
            >
                <ToggleButton value="compact" aria-label="compact layout">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DensityLargeIcon fontSize="small" sx={{ mr: 1 }} />
                        Compact
                    </Box>
                </ToggleButton>
                <ToggleButton value="normal" aria-label="normal layout">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DensityMediumIcon fontSize="small" sx={{ mr: 1 }} />
                        Normal
                    </Box>
                </ToggleButton>
                <ToggleButton value="detailed" aria-label="detailed layout">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DensitySmallIcon fontSize="small" sx={{ mr: 1 }} />

                        Detailed
                    </Box>
                </ToggleButton>
            </ToggleButtonGroup>
        </Box>
    );
};

export default LayoutStyleSelector;