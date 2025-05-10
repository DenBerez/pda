import React, { useState, useMemo, useEffect } from 'react';
import {
    Typography,
    Button,
    Paper,
    Stack,
    Tabs,
    Tab,
    TextField,
    InputAdornment,
    IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import Thermostat from '@mui/icons-material/Thermostat';
import Email from '@mui/icons-material/Email';
import PublicIcon from '@mui/icons-material/Public';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import PhotoIcon from '@mui/icons-material/Photo';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import { WidgetType } from './types';
import { useThemeContext } from '../../providers/ThemeProvider';

interface AddWidgetsPanelProps {
    addWidget: (type: WidgetType) => void;
}

// Define widget data structure for easier management
interface WidgetInfo {
    type: 'weather' | 'email' | 'social' | 'custom' | 'text' | 'calendar' | 'news' | 'music' | 'photos' | 'slideshow' | 'spotify' | 'quote';
    label: string;
    icon: React.ReactNode;
    category: 'information' | 'productivity' | 'media';
}

const AddWidgetsPanel: React.FC<AddWidgetsPanelProps> = ({ addWidget }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const { fontFamily } = useThemeContext(); // Get current font family from context
    const [forceUpdate, setForceUpdate] = useState(0);

    // Add effect to listen for dashboard-refresh-theme event
    useEffect(() => {
        const handleThemeRefresh = () => {
            // Force component to re-render when theme changes
            setForceUpdate(prev => prev + 1);
        };

        window.addEventListener('dashboard-refresh-theme', handleThemeRefresh);

        return () => {
            window.removeEventListener('dashboard-refresh-theme', handleThemeRefresh);
        };
    }, []);

    // Define all available widgets with their metadata
    const allWidgets: WidgetInfo[] = [
        // Information widgets
        { type: 'weather', label: 'Weather', icon: <Thermostat />, category: 'information' },
        { type: 'quote', label: 'Quote', icon: <FormatQuoteIcon />, category: 'information' },
        // { type: 'news', label: 'News', icon: <PublicIcon />, category: 'information' },

        // Productivity widgets
        { type: 'email', label: 'Email', icon: <Email />, category: 'productivity' },
        { type: 'calendar', label: 'Calendar', icon: <CalendarMonthIcon />, category: 'productivity' },
        { type: 'text', label: 'Text', icon: <TextFieldsIcon />, category: 'productivity' },

        // Media widgets
        // { type: 'music', label: 'Music', icon: <MusicNoteIcon />, category: 'media' },
        // { type: 'photos', label: 'Photos', icon: <PhotoIcon />, category: 'media' },
        { type: 'slideshow', label: 'Slideshow', icon: <SlideshowIcon />, category: 'media' },
        { type: 'spotify', label: 'Spotify', icon: <MusicNoteIcon />, category: 'media' },
    ];

    // Filter widgets based on search query and active tab
    const filteredWidgets = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();

        // If there's a search query, filter across all categories
        if (query) {
            return allWidgets.filter(widget =>
                widget.label.toLowerCase().includes(query) ||
                widget.type.toLowerCase().includes(query)
            );
        }

        // Otherwise, filter by the selected tab
        // Tab index 0 = All, 1 = Information, 2 = Productivity, 3 = Media
        if (activeTab === 0) {
            return allWidgets;
        } else if (activeTab === 1) {
            return allWidgets.filter(widget => widget.category === 'information');
        } else if (activeTab === 2) {
            return allWidgets.filter(widget => widget.category === 'productivity');
        } else {
            return allWidgets.filter(widget => widget.category === 'media');
        }
    }, [searchQuery, activeTab, allWidgets]);

    // Widget button component to avoid duplication
    const WidgetButton = ({ widget }: { widget: WidgetInfo }) => (
        <Button
            variant="contained"
            startIcon={widget.icon}
            onClick={() => addWidget(widget.type)}
            color="primary"
            sx={{ fontFamily: fontFamily }} // Apply current font family
        >
            {widget.label}
        </Button>
    );

    return (
        <Paper
            elevation={1}
            sx={{
                p: 2,
                mb: 3,
                fontFamily: fontFamily // Apply font family to container
            }}
            className="add-widgets-panel"
        >
            <TextField
                fullWidth
                placeholder="Search widgets..."
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    ),
                    endAdornment: searchQuery ? (
                        <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setSearchQuery('')}>
                                <ClearIcon fontSize="small" />
                            </IconButton>
                        </InputAdornment>
                    ) : null,
                    sx: { fontFamily: fontFamily } // Apply font to input
                }}
                sx={{ mb: 2, fontFamily: fontFamily }}
            />

            <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{ mb: 2, fontFamily: fontFamily }}
            >
                <Tab label="All" sx={{ fontFamily: fontFamily }} />
                <Tab label="Information" sx={{ fontFamily: fontFamily }} />
                <Tab label="Productivity" sx={{ fontFamily: fontFamily }} />
                <Tab label="Media" sx={{ fontFamily: fontFamily }} />
            </Tabs>

            {filteredWidgets.length > 0 ? (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexWrap: 'wrap' }}>
                    {filteredWidgets.map((widget) => (
                        <WidgetButton key={widget.type} widget={widget} />
                    ))}
                </Stack>
            ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2, fontFamily: fontFamily }}>
                    No widgets found matching "{searchQuery}"
                </Typography>
            )}
        </Paper>
    );
};

export default AddWidgetsPanel; 