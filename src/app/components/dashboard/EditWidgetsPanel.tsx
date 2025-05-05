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
    Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
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

    const handleCityChange = (city: string, additionalConfig?: any) => {
        if (tempWidget) {
            setTempWidget({
                ...tempWidget,
                config: {
                    ...tempWidget.config,
                    city,
                    ...additionalConfig
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
                    />
                </Box>

                <Box sx={{ mb: 3, mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Widget Preview
                    </Typography>
                    <Paper
                        elevation={1}
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            border: '1px dashed',
                            borderColor: 'divider',
                            bgcolor: 'background.default'
                        }}
                    >
                        <Typography variant="body2" align="center">
                            {title || widget?.title}
                        </Typography>
                    </Paper>
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
                                defaultValue={tempWidget?.config?.city || 'London'}
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
                                    onChange={(e) => handleCityChange(tempWidget?.config?.city || 'London', { units: e.target.value })}
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
                                    onChange={(e) => handleCityChange(tempWidget?.config?.city || 'London', { refreshRate: e.target.value })}
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
                                    defaultValue={tempWidget?.config?.refreshToken || ''}
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
                                        defaultValue={tempWidget?.config?.email || ''}
                                        onChange={(e) => handleEmailConfigChange({ email: e.target.value })}
                                    />
                                    <TextField
                                        fullWidth
                                        margin="normal"
                                        label="Password"
                                        type="password"
                                        size="small"
                                        defaultValue={tempWidget?.config?.password || ''}
                                        onChange={(e) => handleEmailConfigChange({ password: e.target.value })}
                                        helperText="For demo purposes, leave empty to use mock data"
                                    />
                                </>
                            )}
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