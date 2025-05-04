import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Drawer,
    IconButton,
    Divider,
    Button
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

                <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                    {children}

                    {widget?.type === 'weather' && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Weather Location
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