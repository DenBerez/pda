import React, { useState } from 'react';
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

    // Reset form when widget changes
    React.useEffect(() => {
        if (widget) {
            setTitle(widget.title);
        }
    }, [widget]);

    const handleSave = () => {
        if (widget) {
            onSave({
                ...widget,
                title
            });
        }
        onClose();
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


                <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                    {children}
                </Box>

                {/* <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                    >
                        Save Changes
                    </Button>
                </Box> */}
            </Box>
        </Drawer>
    );
};

export default WidgetEditPanel;