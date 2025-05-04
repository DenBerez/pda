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
    TableRow
} from '@mui/material';
import { Widget } from '../types';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import TodayIcon from '@mui/icons-material/Today';

interface CalendarWidgetProps {
    widget: Widget;
    editMode: boolean;
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ widget, editMode }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // Get current month and year
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Get days in month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Get first day of month (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    // Month names
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Day names
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

    // Generate calendar grid
    const generateCalendarGrid = () => {
        const totalDays = firstDayOfMonth + daysInMonth;
        const totalWeeks = Math.ceil(totalDays / 7);
        const calendarGrid = [];

        let dayCounter = 1;

        for (let week = 0; week < totalWeeks; week++) {
            const weekRow = [];

            for (let day = 0; day < 7; day++) {
                if ((week === 0 && day < firstDayOfMonth) || dayCounter > daysInMonth) {
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
            <TableContainer component={Paper} elevation={0} sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
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
                                            bgcolor: day && isSelected(day)
                                                ? 'primary.main'
                                                : day && isToday(day)
                                                    ? 'primary.light'
                                                    : 'inherit',
                                            color: day && (isSelected(day) || isToday(day))
                                                ? 'primary.contrastText'
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
                                            <Typography variant="body2">
                                                {day}
                                            </Typography>
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Selected Date Info */}
            {selectedDate && (
                <Box sx={{ mt: 2, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="subtitle2">
                        Selected: {selectedDate.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default CalendarWidget;