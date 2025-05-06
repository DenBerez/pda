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
    FormHelperText
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
        // Save to tempWidget so it can be saved on panel save
        if (tempWidget) {
            const contentRaw = convertToRaw(newState.getCurrentContent());
            setTempWidget({
                ...tempWidget,
                content: JSON.stringify(contentRaw)
            });
        }
    }, [tempWidget, setTempWidget]);

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
                    onChange={e => setFontSize(e.target.value)}
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

    const handleSave = () => {
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
        onClose();
    };

    const handleCityChange = (city: string) => {
        if (tempWidget) {
            setTempWidget({
                ...tempWidget,
                config: {
                    ...tempWidget.config,
                    city
                }
            });
        }
    };

    const handleWeatherConfigChange = (config: any) => {
        if (tempWidget) {
            setTempWidget({
                ...tempWidget,
                config: {
                    ...tempWidget.config,
                    ...config
                }
            });
        }
    };

    const handleEmailConfigChange = (config: any) => {
        if (tempWidget) {
            setTempWidget({
                ...tempWidget,
                config: {
                    ...tempWidget.config,
                    ...config
                }
            });
        }
    };

    const handleConfigChange = (config: any) => {
        if (tempWidget) {
            setTempWidget({
                ...tempWidget,
                config: {
                    ...tempWidget.config,
                    ...config
                }
            });
        }
    };

    useEffect(() => {
        // Listen for messages from the Spotify auth window
        const handleMessage = (event: MessageEvent) => {
            // Make sure the message is the one we're looking for
            if (event.data?.type === 'SPOTIFY_AUTH_SUCCESS' && event.data?.refreshToken) {
                // Update the widget config with the received token
                if (tempWidget && tempWidget.type === 'spotify') {
                    handleConfigChange({ refreshToken: event.data.refreshToken });

                    // Show a success notification (you might need to add a notification system)
                    // or you could use a simple alert or console log for testing
                    console.log('Spotify connected successfully!');
                }
            }
        };

        // Add event listener
        window.addEventListener('message', handleMessage);

        // Clean up
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [tempWidget, handleConfigChange]);

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

                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Widget Title
                    </Typography>
                    <TextField
                        fullWidth
                        label="Title"
                        variant="outlined"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
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

                            <Box sx={{ textAlign: 'center', py: 2 }}>
                                {tempWidget?.config?.refreshToken ? (
                                    <>
                                        <Typography variant="body2" color="success.main" sx={{ mb: 2 }}>
                                            ✅ Your Spotify account is connected
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            size="small"
                                            onClick={() => handleConfigChange({ refreshToken: '' })}
                                        >
                                            Disconnect Account
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Typography variant="body2" sx={{ mb: 2 }}>
                                            Connect your Spotify account to display your currently playing music and recently played tracks.
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={() => {
                                                // Calculate center position for the popup
                                                const width = 600;
                                                const height = 700;
                                                const left = window.screenX + (window.outerWidth - width) / 2;
                                                const top = window.screenY + (window.outerHeight - height) / 2;

                                                // Open the auth window as a popup
                                                window.open(
                                                    `/api/spotify/auth`,
                                                    'spotify-auth-window',
                                                    `width=${width},height=${height},left=${left},top=${top}`
                                                );
                                            }}
                                        >
                                            Connect Spotify Account
                                        </Button>
                                    </>
                                )}
                            </Box>

                            <FormControl fullWidth margin="normal" size="small">
                                <InputLabel id="spotify-refresh-rate-label">Refresh Rate</InputLabel>
                                <Select
                                    labelId="spotify-refresh-rate-label"
                                    value={tempWidget?.config?.refreshInterval || 30}
                                    label="Refresh Rate"
                                    onChange={(e) => handleConfigChange({ refreshInterval: e.target.value })}
                                >
                                    <MenuItem value={10}>Every 10 seconds</MenuItem>
                                    <MenuItem value={30}>Every 30 seconds</MenuItem>
                                    <MenuItem value={60}>Every minute</MenuItem>
                                    <MenuItem value={300}>Every 5 minutes</MenuItem>
                                </Select>
                            </FormControl>

                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                After connecting your Spotify account, you'll need to copy the refresh token from the new window back into your widget settings.
                            </Typography>
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
                                value={tempWidget?.config?.city || 'London'}
                                onChange={(e) => handleCityChange(e.target.value)}
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
                                <InputLabel id="layout-option-label">Layout Style</InputLabel>
                                <Select
                                    labelId="layout-option-label"
                                    value={tempWidget?.config?.layoutOption || 'normal'}
                                    label="Layout Style"
                                    onChange={(e) => handleWeatherConfigChange({ layoutOption: e.target.value })}
                                >
                                    <MenuItem value="compact">Compact</MenuItem>
                                    <MenuItem value="normal">Normal</MenuItem>
                                    <MenuItem value="detailed">Detailed</MenuItem>
                                </Select>
                                <FormHelperText>
                                    Compact: Basic info only | Normal: Standard view | Detailed: All weather data
                                </FormHelperText>
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
                                    <MenuItem value="aol">AOL</MenuItem>
                                </Select>
                            </FormControl>

                            {tempWidget?.config?.provider === 'gmail' ? (
                                <TextField
                                    fullWidth
                                    margin="normal"
                                    label="OAuth Refresh Token"
                                    type="password"
                                    size="small"
                                    value={tempWidget?.config?.refreshToken || ''}
                                    onChange={(e) => handleEmailConfigChange({ refreshToken: e.target.value })}
                                    helperText="For demo purposes, leave empty to use mock data"
                                />
                            ) : (
                                <>
                                    <TextField
                                        fullWidth
                                        margin="normal"
                                        label="Email Address"
                                        size="small"
                                        value={tempWidget?.config?.email || ''}
                                        onChange={(e) => handleEmailConfigChange({ email: e.target.value })}
                                    />
                                    <TextField
                                        fullWidth
                                        margin="normal"
                                        label="Password"
                                        type="password"
                                        size="small"
                                        value={tempWidget?.config?.password || ''}
                                        onChange={(e) => handleEmailConfigChange({ password: e.target.value })}
                                        helperText="For demo purposes, leave empty to use mock data"
                                    />
                                </>
                            )}
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
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                    >
                        Save Changes
                    </Button>
                </Box>
            </Box>
        </Drawer>
    );
};

export default WidgetEditPanel;