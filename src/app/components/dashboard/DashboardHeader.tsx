import React from 'react';
import {
    Box,
    Typography
} from '@mui/material';

interface DashboardHeaderProps {
    // We can remove the onOpenSettings prop since we'll use a FAB instead
}

const DashboardHeader: React.FC<DashboardHeaderProps> = () => {
    return (
        <Box sx={{
            mb: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap'
        }}>
            <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
                Dashboard Widgets
            </Typography>
        </Box>
    );
};

export default DashboardHeader; 