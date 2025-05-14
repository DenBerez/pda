import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PublicIcon from '@mui/icons-material/Public';
import { Widget } from '../types';
import { useTheme } from '@mui/material/styles';

interface DateTimeWidgetProps {
    widget: Widget;
    editMode: boolean;
}

const DateTimeWidget: React.FC<DateTimeWidgetProps> = ({ widget, editMode }) => {
    const [currentDateTime, setCurrentDateTime] = useState(new Date());
    const theme = useTheme();

    const layoutOption = widget.config?.layoutOption || 'normal';
    const timeFormat = widget.config?.timeFormat || '24h';
    const showSeconds = widget.config?.showSeconds !== false;
    const timezone = widget.config?.timezone || 'auto';

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentDateTime(new Date());
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    const formatTime = () => {
        const options: Intl.DateTimeFormatOptions = {
            hour: 'numeric',
            minute: '2-digit',
            second: showSeconds ? '2-digit' : undefined,
            hour12: timeFormat === '12h',
            timeZone: timezone === 'auto' ? undefined : timezone
        };
        return currentDateTime.toLocaleTimeString(undefined, options);
    };

    const formatDate = () => {
        const options: Intl.DateTimeFormatOptions = {
            weekday: layoutOption === 'basic' ? 'short' : 'long',
            year: 'numeric',
            month: layoutOption === 'basic' ? 'short' : 'long',
            day: 'numeric',
            timeZone: timezone === 'auto' ? undefined : timezone
        };
        return currentDateTime.toLocaleDateString(undefined, options);
    };

    // Basic layout - just time and date
    const renderBasicLayout = () => (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            p: 2
        }}>
            <Typography variant="h3" sx={{ fontWeight: 'medium' }}>
                {formatTime()}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
                {formatDate()}
            </Typography>
        </Box>
    );

    // Normal layout - includes icons and more spacing
    const renderNormalLayout = () => (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            p: 3
        }}>

            <AccessTimeIcon sx={{ fontSize: 40, mb: 2, color: theme.palette.primary.main }} />
            <Typography variant="h2" sx={{ fontWeight: 'medium', mb: 1 }}>
                {formatTime()}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <CalendarTodayIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography variant="h6">
                    {formatDate()}
                </Typography>
            </Box>
        </Box>
    );

    // Detailed layout - includes timezone and additional information
    const renderDetailedLayout = () => (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            p: 3,
            gap: 2
        }}>

            <AccessTimeIcon sx={{ fontSize: 40, mb: 2, color: theme.palette.primary.main }} />
            <Typography variant="h2" sx={{ fontWeight: 'medium', mb: 1 }}>
                {formatTime()}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <CalendarTodayIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography variant="h6">
                    {formatDate()}
                </Typography>
            </Box>
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                mt: 2,
                color: theme.palette.text.secondary
            }}>
                <PublicIcon sx={{ mr: 1 }} />
                <Typography variant="body1">
                    {timezone}
                </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Week {getWeekNumber(currentDateTime)} of {currentDateTime.getFullYear()}
            </Typography>
        </Box>
    );

    // Helper function to get week number
    const getWeekNumber = (date: Date) => {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    };

    // Render the appropriate layout
    switch (layoutOption) {
        case 'basic':
            return renderBasicLayout();
        case 'detailed':
            return renderDetailedLayout();
        default:
            return renderNormalLayout();
    }
};

export default DateTimeWidget; 