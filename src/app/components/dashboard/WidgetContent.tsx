import React, { useState } from 'react';
import {
    Box,
    Typography,
    IconButton,
    Paper,
    Divider,
    TextField,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Widget } from './types';
import TextWidget from './widgets/TextWidget';
import WeatherWidget from './widgets/WeatherWidget';

interface WidgetContentProps {
    widget: Widget;
    editMode: boolean;
    onDelete: (widgetId: string) => void;
    onUpdateContent?: (widgetId: string, content: string) => void;
    onUpdateWidget?: (updatedWidget: Widget) => void;
    onEdit: (widget: Widget) => void;
}

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

    // Render the appropriate widget based on type
    const renderWidget = () => {
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
            // ... other widget types
            default:
                return <Typography>Unknown widget type</Typography>;
        }
    };

    return (
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
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        p: 2,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                    }}>
                        {/* Drag handle as a separate element */}
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

                        {/* Edit button for text widget */}
                        {widget.type === 'text' ? (
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowTextEditPanel(true);
                                }}
                                sx={{
                                    color: 'primary.contrastText',
                                    '&:hover': {
                                        bgcolor: 'rgba(255,255,255,0.2)'
                                    },
                                    mr: 1
                                }}
                                aria-label="edit widget"
                            >
                                <EditIcon fontSize="small" />
                            </IconButton>
                        ) : (
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(widget);
                                }}
                                sx={{
                                    color: 'primary.contrastText',
                                    '&:hover': {
                                        bgcolor: 'rgba(255,255,255,0.2)'
                                    },
                                    mr: 1
                                }}
                                aria-label="edit widget"
                            >
                                <EditIcon fontSize="small" />
                            </IconButton>
                        )}

                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(widget.id);
                            }}
                            sx={{
                                color: 'primary.contrastText',
                                '&:hover': {
                                    bgcolor: 'rgba(255,255,255,0.2)'
                                }
                            }}
                            aria-label="delete widget"
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Box>
                    <Divider />
                </>
            )}
            <Box sx={{
                p: 2,
                flexGrow: 1,
                overflow: 'auto'
            }}>

                {renderWidget()}
            </Box>
        </Paper>
    );
};

export default WidgetContent; 
