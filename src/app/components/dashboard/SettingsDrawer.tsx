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
    Chip,
    FormHelperText,
    Popover
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
import ColorLensIcon from '@mui/icons-material/ColorLens';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import EmailIcon from '@mui/icons-material/Email';
import ArticleIcon from '@mui/icons-material/Article';
import ConfirmationDialog from './DeleteConfirmationDialog';

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
    primaryColor?: string;
    onChangePrimaryColor?: (color: string) => void;
    fontFamily?: string;
    onChangeFontFamily?: (font: string) => void;
    backgroundImage?: string;
    onChangeBackgroundImage?: (image: string) => void;
    backgroundOpacity?: number;
    onChangeBackgroundOpacity?: (opacity: number) => void;
    audioVisualization?: boolean;
    onToggleAudioVisualization?: () => void;
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
    restartTour,
    primaryColor = '#1976d2',
    onChangePrimaryColor = () => { },
    fontFamily = 'Geist Sans',
    onChangeFontFamily = () => { },
    backgroundImage = '',
    onChangeBackgroundImage = () => { },
    backgroundOpacity = 0.15,
    onChangeBackgroundOpacity = () => { },
    audioVisualization = false,
    onToggleAudioVisualization = () => { }
}) => {
    // Add state for template selection
    const [selectedTemplate, setSelectedTemplate] = useState<string>('default');

    // Add state for custom color picker
    const [showCustomColorPicker, setShowCustomColorPicker] = useState(false);
    const [customColor, setCustomColor] = useState(primaryColor);

    // Add state for the popover
    const [infoAnchorEl, setInfoAnchorEl] = useState<null | HTMLElement>(null);

    // Add these state variables inside the component
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{
        title: string;
        message: string;
        onConfirm: () => void;
    } | null>(null);

    // Available templates
    const templates = [
        { id: 'default', name: 'Default', description: 'Standard dashboard layout' },
        { id: 'minimal', name: 'Minimal', description: 'Clean, minimalist layout' },
        { id: 'productivity', name: 'Productivity', description: 'Focus on productivity tools' },
        { id: 'media', name: 'Media', description: 'Media-focused dashboard' }
    ];

    // Predefined color themes
    const colorThemes = [
        { name: 'Blue', color: '#1976d2' },
        { name: 'Purple', color: '#9c27b0' },
        { name: 'Green', color: '#2e7d32' },
        { name: 'Orange', color: '#ed6c02' },
        { name: 'Red', color: '#d32f2f' },
        { name: 'Teal', color: '#009688' }
    ];

    // Available fonts
    const fontOptions = [
        { name: 'Geist Sans', value: 'var(--font-geist-sans), system-ui, sans-serif' },
        { name: 'Geist Mono', value: 'var(--font-geist-mono), monospace' },
        { name: 'System UI', value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
        { name: 'Serif', value: 'Georgia, "Times New Roman", serif' },
        { name: 'Monospace', value: 'SFMono-Regular, Menlo, Monaco, Consolas, monospace' },
        { name: 'Inter', value: 'var(--font-inter), sans-serif' },
        { name: 'Roboto', value: 'var(--font-roboto), sans-serif' },
        { name: 'Poppins', value: 'var(--font-poppins), sans-serif' },
        { name: 'Lato', value: 'var(--font-lato), sans-serif' },
        { name: 'Open Sans', value: 'var(--font-open-sans), sans-serif' },
        { name: 'Montserrat', value: 'var(--font-montserrat), sans-serif' },
    ];

    // Handle template application
    const handleApplyTemplate = () => {
        onApplyTemplate(selectedTemplate);
        onClose();
    };

    // Handle color theme change
    const handleColorChange = (color: string) => {
        onChangePrimaryColor(color);
    };

    // Handle font family change
    const handleFontChange = (font: string) => {
        // Call the parent's onChangeFontFamily function
        onChangeFontFamily(font);

        // Apply the font to the document immediately for instant feedback
        document.documentElement.style.setProperty('--font-current', font);

        // Apply font directly to all elements that might be using MUI typography
        const elements = document.querySelectorAll('body, h1, h2, h3, h4, h5, h6, p, span, div, button, input, textarea, select, option, label, table, th, td, tr, form, input, textarea, select, option, label, table, th, td, tr, form, iconbutton');
        elements.forEach(el => {
            (el as HTMLElement).style.fontFamily = font;
        });

        // Force a refresh of the entire app by triggering a custom event
        const refreshEvent = new CustomEvent('dashboard-refresh-theme');
        window.dispatchEvent(refreshEvent);

        // Force a reflow by accessing offsetHeight
        document.body.offsetHeight;
    };

    // Add this helper function inside the component
    const showConfirmDialog = (title: string, message: string, onConfirm: () => void) => {
        setConfirmAction({ title, message, onConfirm });
        setConfirmDialogOpen(true);
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            variant="temporary"
            disableScrollLock={true}
            PaperProps={{
                sx: {
                    width: { xs: '100%', sm: 360 },
                    maxWidth: '100%'
                }
            }}
            ModalProps={{
                keepMounted: true, // Better performance on mobile
            }}
            sx={{
                '& .MuiDrawer-paper': {
                    boxSizing: 'border-box',
                },
                '& .MuiBackdrop-root': {
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                },
                position: 'fixed', // Ensures the drawer is absolutely positioned
                zIndex: (theme) => theme.zIndex.drawer,
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

                    {/* Dashboard Modes Section */}
                    <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'background.default' }}>
                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                            Display
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
                    </Paper>

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



                        {/* Color Theme Selection */}
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" gutterBottom>
                                Theme Color
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                                {colorThemes.map((theme) => (
                                    <Tooltip key={theme.color} title={theme.name}>
                                        <Box
                                            onClick={() => handleColorChange(theme.color)}
                                            sx={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: '50%',
                                                bgcolor: theme.color,
                                                cursor: 'pointer',
                                                border: primaryColor === theme.color ? '2px solid' : '1px solid',
                                                borderColor: primaryColor === theme.color ? 'primary.main' : 'divider',
                                                transition: 'transform 0.2s',
                                                '&:hover': {
                                                    transform: 'scale(1.1)',
                                                }
                                            }}
                                        />
                                    </Tooltip>
                                ))}
                                <Tooltip title="Custom Color">
                                    <Box
                                        onClick={() => setShowCustomColorPicker(!showCustomColorPicker)}
                                        sx={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            transition: 'transform 0.2s',
                                            '&:hover': {
                                                transform: 'scale(1.1)',
                                            }
                                        }}
                                    >
                                        <ColorLensIcon fontSize="small" />
                                    </Box>
                                </Tooltip>
                            </Box>

                            {showCustomColorPicker && (
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="caption" gutterBottom>
                                        Custom Color
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box
                                            sx={{
                                                width: 24,
                                                height: 24,
                                                borderRadius: '50%',
                                                bgcolor: customColor,
                                                border: '1px solid',
                                                borderColor: 'divider'
                                            }}
                                        />
                                        <input
                                            type="color"
                                            value={customColor}
                                            onChange={(e) => {
                                                setCustomColor(e.target.value);
                                                handleColorChange(e.target.value);
                                            }}
                                            style={{ width: '100%' }}
                                        />
                                    </Box>
                                </Box>
                            )}
                        </Box>

                        {/* Font Selection */}
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="body2" gutterBottom>
                                Font Family
                            </Typography>
                            <FormControl fullWidth size="small">
                                <Select
                                    value={fontFamily}
                                    onChange={(e) => handleFontChange(e.target.value)}
                                    displayEmpty
                                    sx={{
                                        fontFamily: fontFamily
                                    }}
                                >
                                    {fontOptions.map((font) => (
                                        <MenuItem
                                            key={font.value}
                                            value={font.value}
                                            sx={{
                                                fontFamily: font.value,
                                                '&.Mui-selected': {
                                                    backgroundColor: 'action.selected'
                                                }
                                            }}
                                        >
                                            {font.name}
                                        </MenuItem>
                                    ))}
                                </Select>

                            </FormControl>


                        </Box>
                    </Paper>

                    {/* Background Image Section */}
                    <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'background.default' }}>
                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                            Background Image
                        </Typography>

                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" gutterBottom>
                                Enter image URL or choose preset
                            </Typography>

                            {/* Custom URL input */}
                            <Box sx={{ mb: 2 }}>
                                <input
                                    type="url"
                                    value={backgroundImage}
                                    onChange={(e) => onChangeBackgroundImage(e.target.value)}
                                    placeholder="Enter image URL"
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        marginBottom: '8px'
                                    }}
                                />
                            </Box>

                            {/* Preset backgrounds */}
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {[
                                    { url: '', name: 'None' },
                                    { url: 'https://images.unsplash.com/photo-1493514789931-586cb221d7a7?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', name: 'City' },
                                    { url: 'https://images.unsplash.com/photo-1619441207978-3d326c46e2c9?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', name: 'Trees' },
                                    { url: 'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', name: 'Mountains' }
                                ].map((bg) => (
                                    <Tooltip key={bg.name} title={bg.name}>
                                        <Box
                                            onClick={() => onChangeBackgroundImage(bg.url)}
                                            sx={{
                                                width: 60,
                                                height: 40,
                                                borderRadius: 1,
                                                cursor: 'pointer',
                                                border: '2px solid',
                                                borderColor: backgroundImage === bg.url ? 'primary.main' : 'divider',
                                                bgcolor: !bg.url ? 'background.default' : undefined,
                                                backgroundImage: bg.url ? `url(${bg.url})` : 'none',
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                                transition: 'transform 0.2s',
                                                '&:hover': {
                                                    transform: 'scale(1.05)'
                                                }
                                            }}
                                        />
                                    </Tooltip>
                                ))}
                            </Box>

                            <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" gutterBottom>
                                    Background Opacity
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={Math.round(backgroundOpacity * 100)}
                                        onChange={(e) => {
                                            const newOpacity = parseInt(e.target.value) / 100;
                                            onChangeBackgroundOpacity(newOpacity);
                                        }}
                                        style={{
                                            width: '100%',
                                            height: '8px',
                                            borderRadius: '4px',
                                        }}
                                    />
                                    <Typography variant="caption" sx={{ minWidth: 36, textAlign: 'right' }}>
                                        {Math.round(backgroundOpacity * 100)}%
                                    </Typography>
                                </Box>
                            </Box>


                        </Box>
                    </Paper>

                    {/* Feedback Section */}
                    <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'background.default' }}>
                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                            Help Shape the Future
                        </Typography>

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                I'd love to hear your feedback and ideas for new features! Some upcoming premium features include:
                            </Typography>

                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                {['AI Assistant', 'Data Analytics', 'Import/Export', 'Custom Widgets'].map((feature) => (
                                    <Chip
                                        key={feature}
                                        label={feature}
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                            borderColor: 'primary.main',
                                            color: 'primary.main'
                                        }}
                                    />
                                ))}
                            </Box>

                            <Typography variant="body2" color="text.secondary">
                                Reach out with suggestions or feedback:
                            </Typography>

                            <Button
                                variant="outlined"
                                color="primary"
                                fullWidth
                                sx={{
                                    mt: 1.5,
                                    mb: 1,
                                    textTransform: 'none',
                                    justifyContent: 'flex-start',
                                    fontFamily: 'monospace',
                                    fontSize: '0.875rem'
                                }}
                                startIcon={<EmailIcon />}
                                onClick={() => window.location.href = 'mailto:dennis.m.berezin@gmail.com'}
                            >
                                dennis.m.berezin@gmail.com
                            </Button>

                            <Button
                                variant="text"
                                color="primary"
                                fullWidth
                                sx={{
                                    textTransform: 'none',
                                    justifyContent: 'flex-start',
                                    fontSize: '0.875rem',
                                    '&:hover': {
                                        backgroundColor: 'action.hover'
                                    }
                                }}
                                startIcon={<ArticleIcon />}
                                href="/privacy"
                            >
                                Privacy Policy
                            </Button>
                        </Box>
                    </Paper>

                    {/* Dashboard Actions Section */}
                    <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'background.default' }}>
                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                            Actions
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid container>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    fullWidth
                                    startIcon={<RestoreIcon />}
                                    onClick={() => showConfirmDialog(
                                        'Reset to Default?',
                                        'This will restore the default dashboard layout and widgets. This action cannot be undone.',
                                        () => {
                                            onResetToDefault();
                                            onClose();
                                            setConfirmDialogOpen(false);
                                        }
                                    )}
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
                                    onClick={() => showConfirmDialog(
                                        'Clear All Widgets?',
                                        'Are you sure you want to remove all widgets? This action cannot be undone.',
                                        () => {
                                            onClearWidgets();
                                            onClose();
                                            setConfirmDialogOpen(false);
                                        }
                                    )}
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
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1
                }}>
                    <Typography variant="caption" color="text.secondary">
                        Dashboard v1.0.0
                    </Typography>
                    <Tooltip title="About & Feedback">
                        <IconButton
                            size="small"
                            onClick={(e) => setInfoAnchorEl(e.currentTarget)}
                            sx={{
                                opacity: 0.7,
                                '&:hover': { opacity: 1 }
                            }}
                        >
                            <HelpOutlineIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            <Popover
                open={Boolean(infoAnchorEl)}
                anchorEl={infoAnchorEl}
                onClose={() => setInfoAnchorEl(null)}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                PaperProps={{
                    sx: {
                        mt: -1,
                        width: 320,
                        p: 2,
                        '& .MuiTypography-root': {
                            fontFamily: 'inherit'
                        }
                    }
                }}
            >
                <Typography variant="h6" fontWeight="medium" gutterBottom>
                    Help Shape the Future
                </Typography>

                <Typography variant="body2" color="text.secondary" paragraph>
                    I'd love to hear your feedback and ideas for new features! Some upcoming premium features include:
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {['AI Assistant', 'Data Analytics', 'Import/Export', 'Custom Widgets'].map((feature) => (
                        <Chip
                            key={feature}
                            label={feature}
                            size="small"
                            variant="outlined"
                            sx={{
                                borderColor: 'primary.main',
                                color: 'primary.main'
                            }}
                        />
                    ))}
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Reach out with suggestions or feedback:
                </Typography>

                <Button
                    variant="outlined"
                    color="primary"
                    fullWidth
                    sx={{
                        mt: 1.5,
                        mb: 1,
                        textTransform: 'none',
                        justifyContent: 'flex-start',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem'
                    }}
                    startIcon={<EmailIcon />}
                    onClick={() => window.location.href = 'mailto:dennis.m.berezin@gmail.com'}
                >
                    dennis.m.berezin@gmail.com
                </Button>

                <Button
                    variant="text"
                    color="primary"
                    fullWidth
                    sx={{
                        textTransform: 'none',
                        justifyContent: 'flex-start',
                        fontSize: '0.875rem',
                        '&:hover': {
                            backgroundColor: 'action.hover'
                        }
                    }}
                    startIcon={<ArticleIcon />}
                    href="/privacy"
                >
                    Privacy Policy
                </Button>
            </Popover>

            {confirmAction && (
                <ConfirmationDialog
                    open={confirmDialogOpen}
                    onClose={() => setConfirmDialogOpen(false)}
                    onConfirm={confirmAction.onConfirm}
                    title={confirmAction.title}
                    message={confirmAction.message}
                />
            )}
        </Drawer>
    );
};

export default SettingsDrawer; 