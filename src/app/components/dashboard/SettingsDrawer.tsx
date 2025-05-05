import React, { useState } from 'react';
import {
    Box,
    Typography,
    IconButton,
    Divider,
    Switch,
    FormControlLabel,
    Button,
    Drawer,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Paper,
    Grid,
    Tooltip,
    Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { DarkMode, LightMode } from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import TemplateIcon from '@mui/icons-material/Dashboard';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import RestoreIcon from '@mui/icons-material/RestoreOutlined';

interface SettingsDrawerProps {
    open: boolean;
    onClose: () => void;
    mode: 'light' | 'dark';
    toggleColorMode: () => void;
    editMode: boolean;
    toggleEditMode: () => void;
    onResetToDefault: () => void;
    onClearWidgets: () => void;
    fullscreen: boolean;
    toggleFullscreen: () => void;
    gridSnap: number;
    setGridSnap: (snap: number) => void;
    onApplyTemplate: (template: string) => void;
    restartTour: () => void;
}

const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
    open,
    onClose,
    mode,
    toggleColorMode,
    editMode,
    toggleEditMode,
    onResetToDefault,
    onClearWidgets,
    fullscreen,
    toggleFullscreen,
    gridSnap,
    setGridSnap,
    onApplyTemplate,
    restartTour
}) => {
    // Add state for template selection
    const [selectedTemplate, setSelectedTemplate] = useState<string>('default');

    // Available templates
    const templates = [
        { id: 'default', name: 'Default', description: 'Standard dashboard layout' },
        { id: 'minimal', name: 'Minimal', description: 'Clean, minimalist layout' },
        { id: 'productivity', name: 'Productivity', description: 'Focus on productivity tools' },
        { id: 'media', name: 'Media', description: 'Media-focused dashboard' }
    ];

    // Handle template application
    const handleApplyTemplate = () => {
        onApplyTemplate(selectedTemplate);
        onClose();
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: { xs: '100%', sm: 360 },
                    maxWidth: '100%'
                }
            }}
        >
            <Box
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'auto'
                }}
            >
                {/* Header */}
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    position: 'sticky',
                    top: 0,
                    bgcolor: 'background.paper',
                    zIndex: 10,
                    borderBottom: 1,
                    borderColor: 'divider'
                }}>
                    <Typography variant="h6" fontWeight="medium">Dashboard Settings</Typography>
                    <IconButton onClick={onClose} edge="end" aria-label="close settings">
                        <CloseIcon />
                    </IconButton>
                </Box>

                {/* Settings Content */}
                <Box sx={{ p: 2, flexGrow: 1 }}>
                    {/* Appearance Section */}
                    <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'background.default' }}>
                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                            Appearance
                        </Typography>
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
                        />
                    </Paper>

                    {/* Dashboard Mode Section */}
                    <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'background.default' }}>
                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                            Dashboard Mode
                        </Typography>
                        <FormControlLabel
                            className="edit-mode-toggle"
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
                        />
                    </Paper>

                    {/* Display Options Section */}
                    <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'background.default' }}>
                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                            Display Options
                        </Typography>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={fullscreen}
                                    onChange={toggleFullscreen}
                                    color="primary"
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    {fullscreen ? (
                                        <>
                                            <FullscreenExitIcon fontSize="small" sx={{ mr: 1 }} />
                                            Exit Fullscreen
                                        </>
                                    ) : (
                                        <>
                                            <FullscreenIcon fontSize="small" sx={{ mr: 1 }} />
                                            Fullscreen Mode
                                        </>
                                    )}
                                </Box>
                            }
                        />

                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" gutterBottom>
                                Grid Snap
                            </Typography>
                            <FormControl fullWidth size="small">
                                <Select
                                    value={gridSnap}
                                    onChange={(e) => setGridSnap(Number(e.target.value))}
                                    displayEmpty
                                >
                                    <MenuItem value={5}>Fine (5px)</MenuItem>
                                    <MenuItem value={10}>Medium (10px)</MenuItem>
                                    <MenuItem value={20}>Coarse (20px)</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </Paper>



                    {/* Dashboard Actions Section */}
                    <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'background.default' }}>
                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                            Dashboard Actions
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid container>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    fullWidth
                                    startIcon={<RestoreIcon />}
                                    onClick={onResetToDefault}
                                >
                                    Reset to Default
                                </Button>
                            </Grid>

                            <Grid container>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    startIcon={<HelpOutlineIcon />}
                                    onClick={() => {
                                        restartTour();
                                        onClose();
                                    }}
                                    fullWidth
                                >
                                    Restart Dashboard Tour
                                </Button>
                            </Grid>

                            <Grid container>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    startIcon={<DeleteIcon />}
                                    fullWidth
                                    onClick={onClearWidgets}
                                >
                                    Clear All Widgets
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>
                </Box>

                {/* Footer */}
                <Box sx={{
                    p: 2,
                    borderTop: 1,
                    borderColor: 'divider',
                    textAlign: 'center'
                }}>
                    <Typography variant="caption" color="text.secondary">
                        Dashboard v1.0.0
                    </Typography>
                </Box>
            </Box>
        </Drawer>
    );
};

export default SettingsDrawer; 