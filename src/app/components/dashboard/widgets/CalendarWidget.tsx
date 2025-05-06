import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    List,
    ListItem,
    ListItemText,
    Divider,
    Chip,
    CircularProgress
} from '@mui/material';
import { Widget } from '../types';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import TodayIcon from '@mui/icons-material/Today';
import EventIcon from '@mui/icons-material/Event';
import { useTheme, alpha } from '@mui/material/styles';

interface CalendarWidgetProps {
    widget: Widget;
    editMode: boolean;
}

interface CalendarEvent {
    id: string;
    summary: string;
    description?: string;
    start: {
        dateTime?: string;
        date?: string;
        timeZone?: string;
    };
    end: {
        dateTime?: string;
        date?: string;
        timeZone?: string;
    };
    location?: string;
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ widget, editMode }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const muiTheme = useTheme();

    // Get configuration from widget or use defaults
    const firstDayOfWeek = widget.config?.firstDayOfWeek || 0; // 0 = Sunday, 1 = Monday
    const showWeekends = widget.config?.showWeekends !== false; // Default: true
    const dateFormat = widget.config?.dateFormat || 'long'; // 'short', 'medium', 'long'
    const colorTheme = widget.config?.colorTheme || 'default'; // 'default', 'blue', 'green', etc.
    const refreshToken = widget.config?.calendarRefreshToken || '';
    const showEvents = widget.config?.showEvents !== false; // Default: true
    const maxEvents = widget.config?.maxEvents || 5;

    // Get current month and year
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Get days in month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Month names
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Day names - reorder based on firstDayOfWeek
    const allDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayNames = [...allDayNames.slice(firstDayOfWeek), ...allDayNames.slice(0, firstDayOfWeek)];

    // Fetch calendar events
    const fetchEvents = async () => {
        if (editMode) return;

        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                maxResults: maxEvents.toString(),
                month: currentMonth.toString(),
                year: currentYear.toString()
            });

            if (refreshToken) {
                params.append('refreshToken', refreshToken);
            }

            const response = await fetch(`/api/calendar?${params.toString()}`);

            if (!response.ok) {
                throw new Error('Failed to fetch calendar events');
            }

            const data = await response.json();
            setEvents(data.events || []);
        } catch (err) {
            console.error('Error fetching calendar events:', err);
            setError('Failed to load calendar events');
        } finally {
            setLoading(false);
        }
    };

    // Fetch events when month changes or on initial load
    useEffect(() => {
        fetchEvents();
    }, [currentMonth, currentYear, refreshToken, maxEvents]);

    // Navigate to previous month
    const prevMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    };

    // Navigate to next month
    const nextMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    };

    // Navigate to today
    const goToToday = () => {
        setCurrentDate(new Date());
        setSelectedDate(new Date());
    };

    // Select a date
    const handleDateSelect = (day: number) => {
        setSelectedDate(new Date(currentYear, currentMonth, day));
    };

    // Check if a date is today
    const isToday = (day: number) => {
        const today = new Date();
        return day === today.getDate() &&
            currentMonth === today.getMonth() &&
            currentYear === today.getFullYear();
    };

    // Check if a date is selected
    const isSelected = (day: number) => {
        if (!selectedDate) return false;
        return day === selectedDate.getDate() &&
            currentMonth === selectedDate.getMonth() &&
            currentYear === selectedDate.getFullYear();
    };

    // Check if a day is a weekend
    const isWeekend = (dayIndex: number) => {
        // Adjust for firstDayOfWeek
        const adjustedIndex = (dayIndex + firstDayOfWeek) % 7;
        return adjustedIndex === 0 || adjustedIndex === 6; // Sunday or Saturday
    };

    // Check if a date has events
    const hasEvents = (day: number) => {
        const date = new Date(currentYear, currentMonth, day);
        return events.some(event => {
            const eventStart = event.start.dateTime
                ? new Date(event.start.dateTime)
                : event.start.date
                    ? new Date(event.start.date)
                    : null;

            if (!eventStart) return false;

            return eventStart.getDate() === day &&
                eventStart.getMonth() === currentMonth &&
                eventStart.getFullYear() === currentYear;
        });
    };

    // Get events for a specific date
    const getEventsForDate = (date: Date) => {
        return events.filter(event => {
            const eventStart = event.start.dateTime
                ? new Date(event.start.dateTime)
                : event.start.date
                    ? new Date(event.start.date)
                    : null;

            if (!eventStart) return false;

            return eventStart.getDate() === date.getDate() &&
                eventStart.getMonth() === date.getMonth() &&
                eventStart.getFullYear() === date.getFullYear();
        });
    };

    // Format the selected date according to the dateFormat setting
    const formatSelectedDate = (date: Date) => {
        const options: Intl.DateTimeFormatOptions = {
            weekday: dateFormat === 'short' ? 'short' : 'long',
            year: 'numeric',
            month: dateFormat === 'short' ? 'numeric' : dateFormat === 'medium' ? 'short' : 'long',
            day: 'numeric'
        };

        return date.toLocaleDateString('en-US', options);
    };

    // Format event time
    const formatEventTime = (dateTimeStr: string) => {
        const date = new Date(dateTimeStr);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    // Generate calendar grid with firstDayOfWeek support
    const generateCalendarGrid = () => {
        // Adjust first day of month based on firstDayOfWeek setting
        let adjustedFirstDay = new Date(currentYear, currentMonth, 1).getDay() - firstDayOfWeek;
        if (adjustedFirstDay < 0) adjustedFirstDay += 7;

        const totalDays = adjustedFirstDay + daysInMonth;
        const totalWeeks = Math.ceil(totalDays / 7);
        const calendarGrid = [];

        let dayCounter = 1;

        for (let week = 0; week < totalWeeks; week++) {
            const weekRow = [];

            for (let day = 0; day < 7; day++) {
                if ((week === 0 && day < adjustedFirstDay) || dayCounter > daysInMonth) {
                    weekRow.push(null);
                } else {
                    weekRow.push(dayCounter);
                    dayCounter++;
                }
            }

            calendarGrid.push(weekRow);
        }

        return calendarGrid;
    };

    const calendarGrid = generateCalendarGrid();

    // Define color themes with MUI theme integration
    const getColorTheme = () => {
        // Get primary color from MUI theme
        const primaryColor = muiTheme.palette.primary.main;
        const primaryLight = alpha(primaryColor, 0.2);
        const primaryLighter = alpha(primaryColor, 0.1);
        const primaryText = muiTheme.palette.primary.contrastText;

        switch (colorTheme) {
            case 'blue':
                return {
                    primary: '#1976d2',
                    secondary: '#bbdefb',
                    today: '#e3f2fd',
                    selected: '#1976d2',
                    selectedText: '#ffffff',
                    weekend: showWeekends ? '#f5f5f5' : 'inherit',
                    event: '#1976d2'
                };
            case 'green':
                return {
                    primary: '#2e7d32',
                    secondary: '#c8e6c9',
                    today: '#e8f5e9',
                    selected: '#2e7d32',
                    selectedText: '#ffffff',
                    weekend: showWeekends ? '#f5f5f5' : 'inherit',
                    event: '#2e7d32'
                };
            case 'purple':
                return {
                    primary: '#7b1fa2',
                    secondary: '#e1bee7',
                    today: '#f3e5f5',
                    selected: '#7b1fa2',
                    selectedText: '#ffffff',
                    weekend: showWeekends ? '#f5f5f5' : 'inherit',
                    event: '#7b1fa2'
                };
            default:
                // Use the MUI theme's primary color
                return {
                    primary: primaryColor,
                    secondary: primaryLight,
                    today: primaryLighter,
                    selected: primaryColor,
                    selectedText: primaryText,
                    weekend: showWeekends ? (muiTheme.palette.mode === 'dark' ? alpha('#000000', 0.2) : '#f5f5f5') : 'inherit',
                    event: primaryColor
                };
        }
    };

    const theme = getColorTheme();

    return (
        <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Calendar Header */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2
            }}>
                <IconButton onClick={prevMonth} size="small">
                    <ArrowBackIosNewIcon fontSize="small" />
                </IconButton>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                        {monthNames[currentMonth]} {currentYear}
                    </Typography>
                    <IconButton onClick={goToToday} size="small" sx={{ ml: 1 }}>
                        <TodayIcon fontSize="small" />
                    </IconButton>
                </Box>

                <IconButton onClick={nextMonth} size="small">
                    <ArrowForwardIosIcon fontSize="small" />
                </IconButton>
            </Box>

            {/* Calendar Grid */}
            <TableContainer component={Paper} elevation={0} sx={{
                flexGrow: 0,
                bgcolor: 'background.default',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1
            }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            {dayNames.map(day => (
                                <TableCell key={day} align="center" sx={{ py: 1 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                                        {day}
                                    </Typography>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {calendarGrid.map((week, weekIndex) => (
                            <TableRow key={weekIndex}>
                                {week.map((day, dayIndex) => (
                                    <TableCell
                                        key={dayIndex}
                                        align="center"
                                        onClick={() => day && handleDateSelect(day)}
                                        sx={{
                                            cursor: day ? 'pointer' : 'default',
                                            position: 'relative',
                                            bgcolor: day && isSelected(day)
                                                ? theme.selected
                                                : day && isToday(day)
                                                    ? theme.today
                                                    : isWeekend(dayIndex) && showWeekends
                                                        ? theme.weekend
                                                        : 'inherit',
                                            color: day && isSelected(day)
                                                ? theme.selectedText
                                                : 'inherit',
                                            borderRadius: '4px',
                                            '&:hover': {
                                                bgcolor: day && !isSelected(day) && !isToday(day)
                                                    ? 'action.hover'
                                                    : undefined
                                            }
                                        }}
                                    >
                                        {day && (
                                            <>
                                                <Typography variant="body2">
                                                    {day}
                                                </Typography>
                                                {hasEvents(day) && (
                                                    <Box
                                                        sx={{
                                                            position: 'absolute',
                                                            bottom: 2,
                                                            left: '50%',
                                                            transform: 'translateX(-50%)',
                                                            width: '4px',
                                                            height: '4px',
                                                            borderRadius: '50%',
                                                            bgcolor: isSelected(day) ? theme.selectedText : theme.event
                                                        }}
                                                    />
                                                )}
                                            </>
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Events List */}
            {showEvents && (
                <Box sx={{
                    mt: 2,
                    flexGrow: 1,
                    overflow: 'auto',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1
                }}>
                    <Typography
                        variant="subtitle2"
                        sx={{
                            p: 1,
                            bgcolor: 'background.paper',
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <EventIcon fontSize="small" sx={{ mr: 1 }} />
                        {selectedDate ? `Events for ${formatSelectedDate(selectedDate)}` : 'Upcoming Events'}
                    </Typography>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : error ? (
                        <Typography variant="body2" color="error" sx={{ p: 2 }}>
                            {error}
                        </Typography>
                    ) : selectedDate ? (
                        <List disablePadding>
                            {getEventsForDate(selectedDate).length > 0 ? (
                                getEventsForDate(selectedDate).map((event, index) => (
                                    <React.Fragment key={event.id}>
                                        {index > 0 && <Divider />}
                                        <ListItem sx={{ py: 1 }}>
                                            <ListItemText
                                                primary={event.summary}
                                                secondary={
                                                    <Box>
                                                        {event.start.dateTime && (
                                                            <Typography variant="caption" display="block">
                                                                {formatEventTime(event.start.dateTime)} - {formatEventTime(event.end.dateTime!)}
                                                            </Typography>
                                                        )}
                                                        {event.location && (
                                                            <Typography variant="caption" display="block">
                                                                {event.location}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                    </React.Fragment>
                                ))
                            ) : (
                                <ListItem>
                                    <ListItemText primary="No events for this date" />
                                </ListItem>
                            )}
                        </List>
                    ) : (
                        <List disablePadding>
                            {events.length > 0 ? (
                                events.map((event, index) => (
                                    <React.Fragment key={event.id}>
                                        {index > 0 && <Divider />}
                                        <ListItem sx={{ py: 1 }}>
                                            <ListItemText
                                                primary={event.summary}
                                                secondary={
                                                    <Box>
                                                        {event.start.dateTime ? (
                                                            <Typography variant="caption" display="block">
                                                                {new Date(event.start.dateTime).toLocaleDateString()} {formatEventTime(event.start.dateTime)}
                                                            </Typography>
                                                        ) : event.start.date && (
                                                            <Typography variant="caption" display="block">
                                                                {new Date(event.start.date).toLocaleDateString()}
                                                            </Typography>
                                                        )}
                                                        {event.location && (
                                                            <Typography variant="caption" display="block">
                                                                {event.location}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                    </React.Fragment>
                                ))
                            ) : (
                                <ListItem>
                                    <ListItemText primary="No upcoming events" />
                                </ListItem>
                            )}
                        </List>
                    )}
                </Box>
            )}

            {/* Selected Date Info (only show if events are not displayed) */}
            {!showEvents && selectedDate && (
                <Box sx={{
                    mt: 2,
                    p: 1,
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider'
                }}>
                    <Typography variant="subtitle2">
                        Selected: {formatSelectedDate(selectedDate)}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default CalendarWidget;