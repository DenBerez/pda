import React from 'react';
import {
    Typography,
    Button,
    Paper,
    Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

interface AddWidgetsPanelProps {
    addWidget: (type: 'weather' | 'email' | 'social' | 'custom' | 'text' | 'calendar') => void;
}

const AddWidgetsPanel: React.FC<AddWidgetsPanelProps> = ({ addWidget }) => {
    return (
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
                Add Widgets
            </Typography>
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ flexWrap: 'wrap' }}
            >
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => addWidget('weather')}
                    color="primary"
                >
                    Weather
                </Button>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => addWidget('email')}
                    color="primary"
                >
                    Email
                </Button>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => addWidget('social')}
                    color="primary"
                >
                    Social
                </Button>
                <Button
                    variant="contained"
                    startIcon={<TextFieldsIcon />}
                    onClick={() => addWidget('text')}
                    color="primary"
                >
                    Text
                </Button>
                <Button
                    variant="contained"
                    startIcon={<CalendarMonthIcon />}
                    onClick={() => addWidget('calendar')}
                    color="primary"
                >
                    Calendar
                </Button>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => addWidget('custom')}
                    color="primary"
                >
                    Custom
                </Button>
            </Stack>
        </Paper>
    );
};

export default AddWidgetsPanel; 