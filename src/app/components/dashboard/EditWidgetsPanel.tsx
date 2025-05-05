import React, { useState, useEffect } from 'react';
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
    Switch
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import { Widget } from './types';

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

    // Reset form when widget changes
    useEffect(() => {
        if (widget) {
            setTitle(widget.title);
            setTempWidget({ ...widget });
        }
    }, [widget]);

    const handleSave = () => {
        if (tempWidget) {
            // Update the title from the state
            const updatedWidget = {
                ...tempWidget,
                title
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

    if (!widget) return null;

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
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