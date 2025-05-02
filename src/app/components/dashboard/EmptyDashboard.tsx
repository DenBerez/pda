import React from 'react';
import {
    Typography,
    Paper
} from '@mui/material';

const EmptyDashboard: React.FC = () => {
    return (
        <Paper sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 2,
        }}>
            <Typography variant="h6" gutterBottom>No widgets added yet</Typography>
            <Typography variant="body2">Click one of the buttons above to add widgets to your dashboard</Typography>
        </Paper>
    );
};

export default EmptyDashboard; 