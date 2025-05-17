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
            weekday: layoutOption === 'normal' ? 'short' : 'long',
            year: 'numeric',
            month: layoutOption === 'normal' ? 'short' : 'long',
            day: 'numeric',
            timeZone: timezone === 'auto' ? undefined : timezone
        };
        return currentDateTime.toLocaleDateString(undefined, options);
    };

    // Basic layout - clean and minimal
    const renderBasicLayout = () => (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            p: 3,
            textAlign: 'center'
        }}>
            <Typography
                variant="h2"
                sx={{
                    fontWeight: 'medium',
                    letterSpacing: '-0.02em',
                    mb: 1
                }}
            >
                {formatTime()}
            </Typography>
            <Typography
                variant="h6"
                color="text.secondary"
                sx={{ letterSpacing: '0.02em' }}
            >
                {formatDate()}
            </Typography>
        </Box>
    );

    // Normal layout - balanced and elegant
    const renderNormalLayout = () => (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            p: 3
        }}>
            <Box sx={{ mb: 2 }}>
                <AccessTimeIcon
                    sx={{
                        fontSize: 32,
                        color: 'primary.main'
                    }}
                />
            </Box>
            <Typography
                variant="h2"
                sx={{
                    fontWeight: 'medium',
                    letterSpacing: '-0.02em',
                    mb: 2
                }}
            >
                {formatTime()}
            </Typography>
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                mt: 'auto'
            }}>
                <CalendarTodayIcon
                    sx={{
                        mr: 1.5,
                        color: 'primary.main',
                        fontSize: 20
                    }}
                />
                <Typography variant="h6">
                    {formatDate()}
                </Typography>
            </Box>
        </Box>
    );

    // Detailed layout - rich and informative
    const renderDetailedLayout = () => (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            p: 3,
            gap: 2
        }}>
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 1
            }}>
                <AccessTimeIcon
                    sx={{
                        fontSize: 40,
                        color: 'primary.main'
                    }}
                />
                <Typography
                    variant="h6"
                    color="text.secondary"
                    sx={{ fontWeight: 'medium' }}
                >
                    Current Time
                </Typography>
            </Box>

            <Typography
                variant="h2"
                sx={{
                    fontWeight: 'medium',
                    letterSpacing: '-0.02em',
                    mb: 2
                }}
            >
                {formatTime()}
            </Typography>

            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                py: 1
            }}>
                <CalendarTodayIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h6">
                    {formatDate()}
                </Typography>
            </Box>

            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                color: 'text.secondary'
            }}>
                <PublicIcon />
                <Typography variant="body1">
                    {timezone === 'auto' ? 'Local Timezone' : timezone}
                </Typography>
            </Box>

            <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                    mt: 'auto',
                    pt: 1,
                    borderTop: '1px solid',
                    borderColor: 'divider'
                }}
            >
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
        case 'compact':
            return renderBasicLayout();
        case 'detailed':
            return renderDetailedLayout();
        default:
            return renderNormalLayout();
    }
};

export default DateTimeWidget; 