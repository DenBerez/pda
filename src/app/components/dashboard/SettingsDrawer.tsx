import React from 'react';
import {
    Box,
    Typography,
    IconButton,
    Divider,
    Switch,
    FormControlLabel,
    Button,
    Drawer
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { DarkMode, LightMode } from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';

interface SettingsDrawerProps {
    open: boolean;
    onClose: () => void;
    mode: 'light' | 'dark';
    toggleColorMode: () => void;
    editMode: boolean;
    toggleEditMode: () => void;
    onResetToDefault: () => void;
    onClearWidgets: () => void;
}

const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
    open,
    onClose,
    mode,
    toggleColorMode,
    editMode,
    toggleEditMode,
    onResetToDefault,
    onClearWidgets
}) => {
    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
        >
            <Box
                sx={{
                    width: 300,
                    p: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6">Dashboard Settings</Typography>
                    <IconButton onClick={onClose} edge="end" aria-label="close settings">
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Divider sx={{ mb: 3 }} />

                <Typography variant="subtitle1" gutterBottom>Appearance</Typography>
                <FormControlLabel
                    control={
                        <Switch
                            checked={mode === 'dark'}
                            onChange={toggleColorMode}
                            color="primary"
                        />
                    }
                    label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {mode === 'dark' ? (
                                <>
                                    <DarkMode fontSize="small" sx={{ mr: 1 }} />
                                    Dark Mode
                                </>
                            ) : (
                                <>
                                    <LightMode fontSize="small" sx={{ mr: 1 }} />
                                    Light Mode
                                </>
                            )}
                        </Box>
                    }
                    sx={{ mb: 2 }}
                />

                <Divider sx={{ my: 3 }} />

                <Typography variant="subtitle1" gutterBottom>Dashboard Mode</Typography>
                <FormControlLabel
                    control={
                        <Switch
                            checked={editMode}
                            onChange={toggleEditMode}
                            color="primary"
                        />
                    }
                    label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {editMode ? (
                                <>
                                    <EditIcon fontSize="small" sx={{ mr: 1 }} />
                                    Edit Mode
                                </>
                            ) : (
                                <>
                                    <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
                                    View Mode
                                </>
                            )}
                        </Box>
                    }
                    sx={{ mb: 2 }}
                />

                <Divider sx={{ my: 3 }} />

                <Typography variant="subtitle1" gutterBottom>Dashboard Actions</Typography>
                <Button
                    variant="outlined"
                    color="primary"
                    fullWidth
                    sx={{ mb: 2 }}
                    onClick={onResetToDefault}
                >
                    Reset to Default
                </Button>

                <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    onClick={onClearWidgets}
                >
                    Clear All Widgets
                </Button>

                <Box sx={{ flexGrow: 1 }} />

                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                    Dashboard v1.0.0
                </Typography>
            </Box>
        </Drawer>
    );
};

export default SettingsDrawer; 