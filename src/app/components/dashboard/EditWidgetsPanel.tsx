import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    TextField,
    Drawer,
    IconButton,
    Divider,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Paper,
    FormControlLabel,
    Switch,
    Tooltip,
    Link,
    FormHelperText,
    ToggleButtonGroup,
    ToggleButton,
    Chip,
    RadioGroup,
    FormControlLabel as MuiFormControlLabel,
    Radio
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import { Widget } from './types';
import {
    Editor,
    EditorState,
    RichUtils,
    convertToRaw,
    convertFromRaw,
    ContentBlock
} from 'draft-js';
import 'draft-js/dist/Draft.css';
import { stateToHTML } from 'draft-js-export-html';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import CodeIcon from '@mui/icons-material/Code';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';
import LayoutStyleSelector from './LayoutStyle';
import AccountConnectionBox from './AccountConnectionBox';
import { quoteCategories } from '../../data/quotes';
import { SelectChangeEvent } from '@mui/material';

interface WidgetEditPanelProps {
    open: boolean;
    widget: Widget | null;
    onClose: () => void;
    onSave: (updatedWidget: Widget) => void;
    children?: React.ReactNode;
}

const WidgetEditPanel: React.FC<WidgetEditPanelProps> = ({
    open,
    widget,
    onClose,
    onSave,
    children
}) => {
    const [title, setTitle] = useState(widget?.title || '');
    const [tempWidget, setTempWidget] = useState<Widget | null>(null);
    const [newImageUrl, setNewImageUrl] = useState('');
    const [newImageCaption, setNewImageCaption] = useState('');

    // Only initialize these if editing a text widget
    const [editorState, setEditorState] = useState(() => {
        if (widget?.type === 'text' && widget.content) {
            try {
                const contentState = convertFromRaw(JSON.parse(widget.content));
                return EditorState.createWithContent(contentState);
            } catch {
                return EditorState.createEmpty();
            }
        }
        return EditorState.createEmpty();
    });
    const [fontSize, setFontSize] = useState("medium");

    // Custom style map (copy from your TextWidget)
    const styleMap = {
        'COLOR-FF0000': { color: '#FF0000' },
        'COLOR-00FF00': { color: '#00FF00' },
        'COLOR-0000FF': { color: '#0000FF' },
        'COLOR-FFFF00': { color: '#FFFF00' },
        'COLOR-FF00FF': { color: '#FF00FF' },
        'COLOR-00FFFF': { color: '#00FFFF' },
        'COLOR-000000': { color: '#000000' },
        'COLOR-FFFFFF': { color: '#FFFFFF' },
        'COLOR-808080': { color: '#808080' },
        'BGCOLOR-FF0000': { backgroundColor: '#FF0000' },
        'BGCOLOR-00FF00': { backgroundColor: '#00FF00' },
        'BGCOLOR-0000FF': { backgroundColor: '#0000FF' },
        'BGCOLOR-FFFF00': { backgroundColor: '#FFFF00' },
        'BGCOLOR-FF00FF': { backgroundColor: '#FF00FF' },
        'BGCOLOR-00FFFF': { backgroundColor: '#00FFFF' },
        'BGCOLOR-000000': { backgroundColor: '#000000' },
        'BGCOLOR-FFFFFF': { backgroundColor: '#FFFFFF' },
        'BGCOLOR-transparent': { backgroundColor: 'transparent' },
    };

    const handleEditorChange = useCallback((newState: EditorState) => {
        setEditorState(newState);

        if (tempWidget) {
            const contentRaw = convertToRaw(newState.getCurrentContent());
            const updatedWidget = {
                ...tempWidget,
                content: JSON.stringify(contentRaw),
                config: {
                    ...tempWidget.config,
                    fontSize
                }
            };
            setTempWidget(updatedWidget);
            onSave(updatedWidget);
        }
    }, [tempWidget, fontSize, onSave]);

    const handleKeyCommand = useCallback((command: string) => {
        const newState = RichUtils.handleKeyCommand(editorState, command);
        if (newState) {
            handleEditorChange(newState);
            return 'handled';
        }
        return 'not-handled';
    }, [editorState, handleEditorChange]);

    const toggleInlineStyle = useCallback((style: string) => {
        handleEditorChange(RichUtils.toggleInlineStyle(editorState, style));
    }, [editorState, handleEditorChange]);

    const toggleBlockType = useCallback((blockType: string) => {
        handleEditorChange(RichUtils.toggleBlockType(editorState, blockType));
    }, [editorState, handleEditorChange]);

    const hasInlineStyle = (style: string) => editorState.getCurrentInlineStyle().has(style);
    const hasBlockType = (blockType: string) => {
        const selection = editorState.getSelection();
        const blockKey = selection.getStartKey();
        const block = editorState.getCurrentContent().getBlockForKey(blockKey);
        return block.getType() === blockType;
    };

    const getBlockStyle = (block: ContentBlock) => {
        const type = block.getType();
        if (type.startsWith('align-')) {
            return `text-align-${type.split('-')[1]}`;
        }
        return '';
    };

    // Toolbar component (simplified)
    const TextFormattingToolbar = () => (
        <Paper elevation={0} sx={{ mb: 1, p: 0.5, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
            <Tooltip title="Bold">
                <IconButton size="small" onClick={() => toggleInlineStyle('BOLD')} color={hasInlineStyle('BOLD') ? "primary" : "default"}>
                    <FormatBoldIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <Tooltip title="Italic">
                <IconButton size="small" onClick={() => toggleInlineStyle('ITALIC')} color={hasInlineStyle('ITALIC') ? "primary" : "default"}>
                    <FormatItalicIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <Tooltip title="Underline">
                <IconButton size="small" onClick={() => toggleInlineStyle('UNDERLINE')} color={hasInlineStyle('UNDERLINE') ? "primary" : "default"}>
                    <FormatUnderlinedIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            <Tooltip title="Bulleted List">
                <IconButton size="small" onClick={() => toggleBlockType('unordered-list-item')} color={hasBlockType('unordered-list-item') ? "primary" : "default"}>
                    <FormatListBulletedIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <Tooltip title="Numbered List">
                <IconButton size="small" onClick={() => toggleBlockType('ordered-list-item')} color={hasBlockType('ordered-list-item') ? "primary" : "default"}>
                    <FormatListNumberedIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <Tooltip title="Quote">
                <IconButton size="small" onClick={() => toggleBlockType('blockquote')} color={hasBlockType('blockquote') ? "primary" : "default"}>
                    <FormatQuoteIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <Tooltip title="Code Block">
                <IconButton size="small" onClick={() => toggleBlockType('code-block')} color={hasBlockType('code-block') ? "primary" : "default"}>
                    <CodeIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            {/* Add more formatting as needed */}
            <FormControl size="small" sx={{ minWidth: 120, ml: 1 }}>
                <InputLabel id="font-size-select-label">Size</InputLabel>
                <Select
                    labelId="font-size-select-label"
                    id="font-size-select"
                    value={fontSize}
                    label="Size"
                    onChange={(e: SelectChangeEvent<string>) => handleFontSizeChange(e.target.value)}
                    size="small"
                >
                    <MenuItem value="x-small">X-Small</MenuItem>
                    <MenuItem value="small">Small</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="large">Large</MenuItem>
                    <MenuItem value="x-large">X-Large</MenuItem>
                </Select>
            </FormControl>
        </Paper>
    );

    // Reset form when widget changes
    useEffect(() => {
        if (widget) {
            setTitle(widget.title);
            setTempWidget({ ...widget });
        }
    }, [widget]);

    const handleSave = useCallback(() => {
        if (tempWidget) {
            // Update the title and ensure fontSize is included in config
            const updatedWidget = {
                ...tempWidget,
                title,
                config: {
                    ...tempWidget.config,
                    fontSize  // Include fontSize in config
                }
            };
            onSave(updatedWidget);
        }
    }, [tempWidget, title, fontSize, onSave]);

    const updateAndSave = useCallback((updates: Partial<Widget>) => {
        if (tempWidget) {
            const updatedWidget = {
                ...tempWidget,
                ...updates,
                title: updates.title !== undefined ? updates.title : title,
                config: {
                    ...tempWidget.config,
                    ...(updates.config || {}),
                    fontSize // Always include fontSize
                }
            };
            setTempWidget(updatedWidget);
            onSave(updatedWidget);
        }
    }, [tempWidget, title, fontSize, onSave]);

    const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        setTitle(newTitle);
        updateAndSave({ title: newTitle });
    }, [updateAndSave]);

    const handleConfigChange = useCallback((config: any) => {
        if (tempWidget) {
            const updatedWidget = {
                ...tempWidget,
                config: {
                    ...tempWidget.config,
                    ...config,
                    fontSize // Ensure fontSize is included
                }
            };
            setTempWidget(updatedWidget);
            onSave(updatedWidget);
        }
    }, [tempWidget, fontSize, onSave]);

    const handleWeatherConfigChange = useCallback((config: any) => {
        handleConfigChange(config);
    }, [handleConfigChange]);

    const handleEmailConfigChange = useCallback((config: any) => {
        handleConfigChange(config);
    }, [handleConfigChange]);

    const handleFontSizeChange = useCallback((newFontSize: string) => {
        setFontSize(newFontSize);
        handleConfigChange({ fontSize: newFontSize });
    }, [handleConfigChange]);

    useEffect(() => {
        // Listen for messages from the auth windows
        const handleMessage = (event: MessageEvent) => {
            // Handle Spotify auth
            if (event.data?.type === 'SPOTIFY_AUTH_SUCCESS' && event.data?.refreshToken) {
                // Update the widget config with the received token
                if (tempWidget && tempWidget.type === 'spotify') {
                    handleConfigChange({ refreshToken: event.data.refreshToken });
                    console.log('Spotify connected successfully!');
                }
            }

            // Handle Google Calendar auth
            if (event.data?.type === 'GOOGLE_CALENDAR_AUTH_SUCCESS' && event.data?.refreshToken) {
                // Update the widget config with the received token
                if (tempWidget && tempWidget.type === 'calendar') {
                    handleConfigChange({ calendarRefreshToken: event.data.refreshToken });
                    console.log('Google Calendar connected successfully!');
                }
            }

            // Handle Gmail auth
            if (event.data?.type === 'GMAIL_AUTH_SUCCESS' && event.data?.refreshToken) {
                // Update the widget config with the received token
                if (tempWidget && tempWidget.type === 'email') {
                    handleEmailConfigChange({ refreshToken: event.data.refreshToken });
                    console.log('Gmail connected successfully!');
                }
            }
        };

        // Add event listener
        window.addEventListener('message', handleMessage);

        // Clean up
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [tempWidget, handleConfigChange, handleEmailConfigChange]);

    useEffect(() => {
        // When widget content changes externally, reinitialize the editor state
        if (widget?.content) {
            try {
                const contentState = convertFromRaw(JSON.parse(widget.content));
                setEditorState(EditorState.createWithContent(contentState));
            } catch (e) {
                console.error("Error parsing widget content:", e);
                // Don't reset to empty if there's an error to avoid losing current edits
            }
        }
    }, [widget?.content]); // Only re-run when widget.content changes

    useEffect(() => {
        // Sync fontSize with widget config if present
        if (widget?.config?.fontSize) {
            setFontSize(widget.config.fontSize);
        }
    }, [widget?.config?.fontSize]);

    const openAuthPopup = (url: string, windowName: string) => {
        // Calculate center position for the popup
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        // Open the auth window as a popup
        window.open(
            url,
            windowName,
            `width=${width},height=${height},left=${left},top=${top}`
        );
    };

    if (!widget) return null;

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            variant="temporary"
            disableScrollLock={true}
            PaperProps={{
                sx: {
                    width: { xs: '100%', sm: 400 },
                    maxWidth: '100%'
                }
            }}
        >
            <Box
                sx={{
                    width: 400,
                    p: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6">
                        Edit {widget.type.charAt(0).toUpperCase() + widget.type.slice(1)} Widget
                    </Typography>
                    <IconButton onClick={onClose} edge="end" aria-label="close edit panel">
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Divider sx={{ mb: 3 }} />

                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Widget Title
                    </Typography>
                    <TextField
                        fullWidth
                        label="Title"
                        variant="outlined"
                        value={title}
                        onChange={handleTitleChange}
                        size="small"
                        margin="normal"
                    />
                </Box>


                <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                    {children}

                    {widget?.type === 'spotify' && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Spotify Configuration
                            </Typography>

                            <AccountConnectionBox
                                isConnected={!!tempWidget?.config?.refreshToken}
                                serviceName="Spotify"
                                onConnect={() => openAuthPopup('/api/spotify/auth', 'spotify-auth-window')}
                                onDisconnect={() => handleConfigChange({ refreshToken: '' })}
                                disconnectedMessage="Connect your Spotify account to display your currently playing music and recently played tracks."
                                helperText={!tempWidget?.config?.refreshToken ?
                                    "For demo purposes, you'll see mock data if no account is connected." : undefined}
                            />

                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Layout Style
                                </Typography>
                                <LayoutStyleSelector
                                    value={tempWidget?.config?.layoutOption || 'normal'}
                                    onChange={(newValue) => handleConfigChange({ layoutOption: newValue })}
                                    helperText="Select how to display the Spotify player"
                                />
                            </Box>


                        </Box>
                    )}

                    {widget?.type === 'weather' && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Weather Configuration
                            </Typography>
                            <TextField
                                fullWidth
                                label="City"
                                variant="outlined"
                                value={tempWidget?.config?.city || ''}
                                onChange={(e) => handleWeatherConfigChange({ city: e.target.value })}
                                helperText="Enter a city name for weather information"
                                size="small"
                                margin="normal"
                            />
                            <FormControl fullWidth margin="normal" size="small">
                                <InputLabel id="units-label">Temperature Units</InputLabel>
                                <Select
                                    labelId="units-label"
                                    value={tempWidget?.config?.units || 'celsius'}
                                    label="Temperature Units"
                                    onChange={(e) => handleWeatherConfigChange({ units: e.target.value })}
                                >
                                    <MenuItem value="celsius">Celsius (°C)</MenuItem>
                                    <MenuItem value="fahrenheit">Fahrenheit (°F)</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl fullWidth margin="normal" size="small">
                                <InputLabel id="refresh-rate-label">Refresh Rate</InputLabel>
                                <Select
                                    labelId="refresh-rate-label"
                                    value={tempWidget?.config?.refreshRate || 30}
                                    label="Refresh Rate"
                                    onChange={(e) => handleWeatherConfigChange({ refreshRate: e.target.value })}
                                >
                                    <MenuItem value={15}>Every 15 minutes</MenuItem>
                                    <MenuItem value={30}>Every 30 minutes</MenuItem>
                                    <MenuItem value={60}>Every hour</MenuItem>
                                </Select>
                            </FormControl>

                            <Typography variant="subtitle2" sx={{ my: 2 }}>
                                Layout Style
                            </Typography>
                            <LayoutStyleSelector
                                value={tempWidget?.config?.layoutOption || 'normal'}
                                onChange={(newValue) => handleWeatherConfigChange({ layoutOption: newValue })}
                                helperText="Select how much weather information to display"
                            />


                        </Box>
                    )}

                    {widget?.type === 'email' && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Email Configuration
                            </Typography>
                            <FormControl fullWidth margin="normal" size="small">
                                <InputLabel id="email-provider-label">Provider</InputLabel>
                                <Select
                                    labelId="email-provider-label"
                                    value={tempWidget?.config?.provider || 'gmail'}
                                    label="Provider"
                                    onChange={(e) => handleEmailConfigChange({ provider: e.target.value })}
                                >
                                    <MenuItem value="gmail">Gmail</MenuItem>
                                </Select>
                            </FormControl>

                            <AccountConnectionBox
                                isConnected={!!tempWidget?.config?.refreshToken}
                                serviceName="Gmail"
                                onConnect={() => openAuthPopup('/api/email/auth', 'gmail-auth-window')}
                                onDisconnect={() => handleEmailConfigChange({ refreshToken: '' })}
                                disconnectedMessage="Connect your Gmail account to display your emails."
                                helperText={!tempWidget?.config?.refreshToken ?
                                    "For demo purposes, you'll see mock email data if no account is connected." : undefined}
                            />

                            <FormControl fullWidth margin="normal" size="small">
                                <InputLabel id="refresh-interval-label">Refresh Interval</InputLabel>
                                <Select
                                    labelId="refresh-interval-label"
                                    value={tempWidget?.config?.refreshInterval || 5}
                                    label="Refresh Interval"
                                    onChange={(e) => handleEmailConfigChange({ refreshInterval: Number(e.target.value) })}
                                >
                                    <MenuItem value={1}>Every minute</MenuItem>
                                    <MenuItem value={5}>Every 5 minutes</MenuItem>
                                    <MenuItem value={15}>Every 15 minutes</MenuItem>
                                    <MenuItem value={30}>Every 30 minutes</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    )}

                    {widget?.type === 'slideshow' && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Slideshow Configuration
                            </Typography>

                            <FormControl fullWidth margin="normal" size="small">
                                <InputLabel id="interval-label">Slide Interval</InputLabel>
                                <Select
                                    labelId="interval-label"
                                    value={tempWidget?.config?.interval || 5000}
                                    label="Slide Interval"
                                    onChange={(e) => handleConfigChange({ interval: e.target.value })}
                                >
                                    <MenuItem value={3000}>3 seconds</MenuItem>
                                    <MenuItem value={5000}>5 seconds</MenuItem>
                                    <MenuItem value={8000}>8 seconds</MenuItem>
                                    <MenuItem value={10000}>10 seconds</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl fullWidth margin="normal" size="small">
                                <InputLabel id="transition-label">Transition Effect</InputLabel>
                                <Select
                                    labelId="transition-label"
                                    value={tempWidget?.config?.transition || 'fade'}
                                    label="Transition Effect"
                                    onChange={(e) => handleConfigChange({ transition: e.target.value })}
                                >
                                    <MenuItem value="fade">Fade</MenuItem>
                                    <MenuItem value="slide">Slide</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={tempWidget?.config?.showCaptions !== false}
                                        onChange={(e) => handleConfigChange({ showCaptions: e.target.checked })}
                                    />
                                }
                                label="Show Captions"
                                sx={{ ml: 0.5 }}
                            />

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={tempWidget?.config?.showControls !== false}
                                        onChange={(e) => handleConfigChange({ showControls: e.target.checked })}
                                    />
                                }
                                label="Show Controls"
                                sx={{ ml: 0.5 }}
                            />

                            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                                Images
                            </Typography>

                            <Box sx={{ mb: 2 }}>
                                {(tempWidget?.config?.images || []).map((img, index) => (
                                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <Box
                                            component="img"
                                            src={img.url}
                                            alt={img.caption || `Image ${index + 1}`}
                                            sx={{ width: 60, height: 40, objectFit: 'cover', mr: 1, borderRadius: 1 }}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/60x40?text=Error';
                                            }}
                                        />
                                        <TextField
                                            size="small"
                                            placeholder="Caption"
                                            value={img.caption || ''}
                                            onChange={(e) => {
                                                const newImages = [...(tempWidget?.config?.images || [])];
                                                newImages[index] = { ...newImages[index], caption: e.target.value };
                                                handleConfigChange({ images: newImages });
                                            }}
                                            sx={{ flexGrow: 1, mr: 1 }}
                                        />
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => {
                                                const newImages = [...(tempWidget?.config?.images || [])];
                                                newImages.splice(index, 1);
                                                handleConfigChange({ images: newImages });
                                            }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                                <TextField
                                    size="small"
                                    label="Image URL"
                                    fullWidth
                                    value={newImageUrl || ''}
                                    onChange={(e) => setNewImageUrl(e.target.value)}
                                    sx={{ mr: 1 }}
                                />
                                <TextField
                                    size="small"
                                    label="Caption (optional)"
                                    fullWidth
                                    value={newImageCaption || ''}
                                    onChange={(e) => setNewImageCaption(e.target.value)}
                                    sx={{ mr: 1 }}
                                />
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => {
                                        if (newImageUrl) {
                                            const newImages = [...(tempWidget?.config?.images || []), {
                                                url: newImageUrl,
                                                caption: newImageCaption
                                            }];
                                            handleConfigChange({ images: newImages });
                                            setNewImageUrl('');
                                            setNewImageCaption('');
                                        }
                                    }}
                                >
                                    Add
                                </Button>
                            </Box>
                        </Box>
                    )}

                    {widget?.type === 'text' && (
                        <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Text Content
                            </Typography>
                            <TextFormattingToolbar />
                            <Box sx={{
                                flexGrow: 1,
                                padding: 1,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                bgcolor: 'background.paper',
                                overflow: 'auto',
                                '& .DraftEditor-root': { height: '100%' },
                                '& .public-DraftEditor-content': {
                                    minHeight: '100px',
                                    fontSize: fontSize === "x-small" ? "0.75rem" :
                                        fontSize === "small" ? "0.875rem" :
                                            fontSize === "large" ? "1.25rem" :
                                                fontSize === "x-large" ? "1.5rem" : "1rem",
                                }
                            }}>
                                <Editor
                                    editorState={editorState}
                                    onChange={handleEditorChange}
                                    handleKeyCommand={handleKeyCommand}
                                    placeholder="Start typing here..."
                                    customStyleMap={styleMap}
                                    blockStyleFn={getBlockStyle}
                                />
                            </Box>
                        </Box>
                    )}

                    {widget?.type === 'calendar' && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Calendar Configuration
                            </Typography>

                            <AccountConnectionBox
                                isConnected={!!tempWidget?.config?.calendarRefreshToken}
                                serviceName="Google Calendar"
                                onConnect={() => openAuthPopup('/api/calendar/auth', 'google-calendar-auth-window')}
                                onDisconnect={() => handleConfigChange({ calendarRefreshToken: '' })}
                                disconnectedMessage="Connect your Google Calendar account to display your events."
                                helperText={!tempWidget?.config?.calendarRefreshToken ?
                                    "For demo purposes, you'll see mock calendar data if no account is connected." : undefined}
                            />

                            <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
                                Display Options
                            </Typography>

                            <FormControlLabel
                                sx={{ display: 'block', mt: 1, ml: 0.5 }}
                                control={
                                    <Switch
                                        checked={tempWidget?.config?.showCalendarGrid !== false}
                                        onChange={(e) => handleConfigChange({ showCalendarGrid: e.target.checked })}
                                    />
                                }
                                label="Show Calendar Grid"
                            />

                            <FormControlLabel
                                sx={{ display: 'block', mt: 1, ml: 0.5 }}
                                control={
                                    <Switch
                                        checked={tempWidget?.config?.showEvents !== false}
                                        onChange={(e) => handleConfigChange({ showEvents: e.target.checked })}
                                    />
                                }
                                label="Show Events"
                            />

                            {tempWidget?.config?.showCalendarGrid !== false && (
                                <>
                                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
                                        Calendar Grid Options
                                    </Typography>

                                    <FormControl fullWidth margin="normal" size="small">
                                        <InputLabel id="first-day-label">First Day of Week</InputLabel>
                                        <Select
                                            labelId="first-day-label"
                                            value={tempWidget?.config?.firstDayOfWeek || 0}
                                            label="First Day of Week"
                                            onChange={(e) => handleConfigChange({ firstDayOfWeek: e.target.value })}
                                        >
                                            <MenuItem value={0}>Sunday</MenuItem>
                                            <MenuItem value={1}>Monday</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <FormControl fullWidth margin="normal" size="small">
                                        <InputLabel id="date-format-label">Date Format</InputLabel>
                                        <Select
                                            labelId="date-format-label"
                                            value={tempWidget?.config?.dateFormat || 'long'}
                                            label="Date Format"
                                            onChange={(e) => handleConfigChange({ dateFormat: e.target.value })}
                                        >
                                            <MenuItem value="short">Short (e.g., 1/1/2023)</MenuItem>
                                            <MenuItem value="medium">Medium (e.g., Jan 1, 2023)</MenuItem>
                                            <MenuItem value="long">Long (e.g., January 1, 2023)</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <FormControlLabel
                                        sx={{ display: 'block', mt: 1, ml: 0.5 }}
                                        control={
                                            <Switch
                                                checked={tempWidget?.config?.showWeekends !== false}
                                                onChange={(e) => handleConfigChange({ showWeekends: e.target.checked })}
                                            />
                                        }
                                        label="Highlight Weekends"
                                    />
                                </>
                            )}

                            {tempWidget?.config?.showEvents !== false && (
                                <>
                                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
                                        Events Options
                                    </Typography>

                                    <FormControl fullWidth margin="normal" size="small">
                                        <InputLabel id="max-events-label">Max Events</InputLabel>
                                        <Select
                                            labelId="max-events-label"
                                            value={tempWidget?.config?.maxEvents || 5}
                                            label="Max Events"
                                            onChange={(e) => handleConfigChange({ maxEvents: e.target.value })}
                                        >
                                            <MenuItem value={5}>5 events</MenuItem>
                                            <MenuItem value={10}>10 events</MenuItem>
                                            <MenuItem value={20}>20 events</MenuItem>
                                        </Select>
                                    </FormControl>
                                </>
                            )}
                        </Box>
                    )}

                    {widget?.type === 'quote' && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Quote Configuration
                            </Typography>

                            <Typography variant="body2" sx={{ mb: 1 }}>
                                Categories
                            </Typography>

                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                <Chip
                                    label="All Categories"
                                    onClick={() => {
                                        // If not all categories are selected, select all
                                        // If all are selected, do nothing (prevent deselecting all)
                                        const allCategoryValues = quoteCategories
                                            .filter(cat => cat.value !== 'all')
                                            .map(cat => cat.value);

                                        const currentCategories = tempWidget?.config?.categories || ['all'];
                                        const hasAllExceptAll = allCategoryValues.every(cat =>
                                            currentCategories.includes(cat)
                                        );

                                        if (!hasAllExceptAll) {
                                            handleConfigChange({ categories: allCategoryValues });
                                        }
                                    }}
                                    color={quoteCategories
                                        .filter(cat => cat.value !== 'all')
                                        .every(cat => tempWidget?.config?.categories?.includes(cat.value))
                                        ? "primary"
                                        : "default"
                                    }
                                    sx={{ mb: 1 }}
                                />
                                {quoteCategories.filter(cat => cat.value !== 'all').map((category) => (
                                    <Chip
                                        key={category.value}
                                        label={category.label}
                                        onClick={() => {
                                            const currentCategories = tempWidget?.config?.categories || [];
                                            const newCategories = currentCategories.includes(category.value)
                                                ? currentCategories.filter((cat: string) => cat !== category.value)
                                                : [...currentCategories, category.value];

                                            // Ensure at least one category is selected
                                            if (newCategories.length > 0) {
                                                handleConfigChange({ categories: newCategories });
                                            }
                                        }}
                                        color={tempWidget?.config?.categories?.includes(category.value)
                                            ? "primary"
                                            : "default"
                                        }
                                    />
                                ))}
                            </Box>

                            <FormControl fullWidth margin="normal" size="small">
                                <InputLabel id="quote-refresh-rate-label">Refresh Rate</InputLabel>
                                <Select
                                    labelId="quote-refresh-rate-label"
                                    value={tempWidget?.config?.refreshInterval || 3600}
                                    label="Refresh Rate"
                                    onChange={(e) => handleConfigChange({ refreshInterval: e.target.value })}
                                >
                                    <MenuItem value={300}>Every 5 minutes</MenuItem>
                                    <MenuItem value={900}>Every 15 minutes</MenuItem>
                                    <MenuItem value={1800}>Every 30 minutes</MenuItem>
                                    <MenuItem value={3600}>Every hour</MenuItem>
                                    <MenuItem value={86400}>Every day</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    )}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                    {/* Save button removed - changes are applied immediately */}
                </Box>
            </Box>
        </Drawer>
    );
};

export default WidgetEditPanel;