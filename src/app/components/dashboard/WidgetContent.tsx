import React, { useState, lazy, Suspense } from 'react';
import {
    Box,
    Typography,
    IconButton,
    Paper,
    Divider,
    TextField,
    CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Widget } from './types';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useTheme } from '@mui/material/styles';

interface WidgetContentProps {
    widget: Widget;
    editMode: boolean;
    onDelete: (widgetId: string) => void;
    onUpdateContent?: (widgetId: string, content: string) => void;
    onUpdateWidget?: (updatedWidget: Widget) => void;
    onEdit: (widget: Widget) => void;
}

const TextWidget = lazy(() => import('./widgets/TextWidget'));
const WeatherWidget = lazy(() => import('./widgets/WeatherWidget'));
const CalendarWidget = lazy(() => import('./widgets/CalendarWidget'));
const EmailWidget = lazy(() => import('./widgets/EmailWidget'));
const SlideShowWidget = lazy(() => import('./widgets/SlideShowWidget'));
const SpotifyWidget = lazy(() => import('./widgets/SpotifyWidget'));

const WidgetContent: React.FC<WidgetContentProps> = ({
    widget,
    editMode,
    onDelete,
    onUpdateContent,
    onUpdateWidget,
    onEdit
}) => {
    // Add state to track if the text widget's edit panel should be shown
    const [showTextEditPanel, setShowTextEditPanel] = useState(false);

    // Add this hook
    const { ref, inView } = useInView({
        triggerOnce: true,
        threshold: 0.1,
    });

    const theme = useTheme();

    // Render the appropriate widget based on type
    const renderWidgetContent = () => {
        switch (widget.type) {
            case 'text':
                return (
                    <TextWidget
                        widget={widget}
                        editMode={editMode}
                        onUpdateContent={onUpdateContent || (() => { })}
                        onUpdateWidget={onUpdateWidget}
                        // Pass the edit panel state
                        showEditPanel={showTextEditPanel}
                        setShowEditPanel={setShowTextEditPanel}
                    />
                );
            case 'weather':
                return (
                    <WeatherWidget
                        widget={widget}
                        editMode={editMode}
                    />
                );
            case 'calendar':
                return (
                    <CalendarWidget
                        widget={widget}
                        editMode={editMode}
                    />
                );
            case 'email':
                return (
                    <EmailWidget
                        widget={widget}
                        editMode={editMode}
                    />
                );
            case 'slideshow':
                return (
                    <SlideShowWidget
                        widget={widget}
                        editMode={editMode}
                    />
                );
            case 'spotify':
                return (
                    <SpotifyWidget
                        widget={widget}
                        editMode={editMode}
                    />
                );
            default:
                return (
                    <Box sx={{ p: 2 }}>
                        <Typography variant="body1">Unknown widget type: {widget.type}</Typography>
                    </Box>
                );
        }
    };

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ height: '100%', width: '100%' }}
        >
            <Paper
                elevation={2}
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    transition: 'box-shadow 0.3s ease',
                    '&:hover': {
                        boxShadow: 4,
                    },
                    position: 'relative',
                }}
            >
                {/* Only show the header in edit mode */}
                {editMode && (
                    <>
                        <Box
                            sx={{
                                p: 1,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderBottom: `1px solid ${theme.palette.divider}`,
                                bgcolor: theme.palette.background.default,
                                border: `1px solid ${theme.palette.divider}`,
                                borderTopLeftRadius: '6px',
                                borderTopRightRadius: '6px',
                            }}
                        >
                            <Box
                                className="widget-drag-handle"
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    flexGrow: 1,
                                    cursor: 'move'
                                }}
                            >
                                <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                                    {widget.title}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex' }}>
                                <IconButton
                                    size="small"
                                    className="widget-edit-button"
                                    onClick={() => onEdit(widget)}
                                    sx={{
                                        color: theme.palette.primary.main,
                                        '&:hover': {
                                            bgcolor: 'rgba(255,255,255,0.2)'
                                        },
                                        ml: 1
                                    }}
                                >
                                    <EditIcon fontSize="small" />
                                </IconButton>

                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(widget.id);
                                    }}
                                    sx={{
                                        color: theme.palette.primary.main,
                                        '&:hover': {
                                            bgcolor: 'rgba(255,255,255,0.2)'
                                        }
                                    }}
                                    aria-label="delete widget"
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </Box>
                        <Divider />
                    </>
                )}
                <Box sx={{
                    p: 2,
                    flexGrow: 1,
                    overflow: 'auto'
                }}>
                    <Box
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                // Handle activation
                            }
                            if (e.key === 'Delete' && editMode) {
                                onDelete(widget.id);
                            }
                        }}
                        sx={{
                            height: '100%',
                            outline: 'none',
                            '&:focus-visible': {
                                boxShadow: `0 0 0 2px ${theme.palette.primary.main}`,
                                borderRadius: 2
                            }
                        }}
                    >
                        <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress size={24} /></Box>}>
                            {renderWidgetContent()}
                        </Suspense>
                    </Box>
                </Box>
            </Paper>
        </motion.div>
    );
};

export default WidgetContent; 