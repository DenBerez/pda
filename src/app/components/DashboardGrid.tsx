'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    useTheme,
    useMediaQuery,
    Fab,
    Tooltip,
    Typography
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useThemeContext } from '../providers/ThemeProvider';
import WidgetContent from './dashboard/WidgetContent';
import SettingsDrawer from './dashboard/SettingsDrawer';
import AddWidgetsPanel from './dashboard/AddWidgetsPanel';
import EmptyDashboard from './dashboard/EmptyDashboard';
import DeleteConfirmationDialog from './dashboard/DeleteConfirmationDialog';
import WidgetOptionsMenu from './dashboard/WidgetOptionsMenu';
import DashboardHeader from './dashboard/DashboardHeader';
import GridLayout from './dashboard/GridLayout';
import { Widget } from './dashboard/types';
import WidgetEditPanel from './dashboard/EditWidgetsPanel';
import EditIcon from '@mui/icons-material/Edit';

// Default widgets for initial setup
const defaultWidgets: Widget[] = [
    {
        id: 'weather-1',
        type: 'weather',
        title: 'Weather',
        x: 0,
        y: 0,
        w: 2,
        h: 2,
        minW: 2,
        minH: 2,
    },
    {
        id: 'email-1',
        type: 'email',
        title: 'Email',
        x: 2,
        y: 0,
        w: 2,
        h: 3,
        minW: 2,
        minH: 2,
    },
    {
        id: 'social-1',
        type: 'social',
        title: 'Social Media',
        x: 0,
        y: 2,
        w: 2,
        h: 2,
        minW: 2,
        minH: 2,
    },
];

// Dashboard grid component
const DashboardGrid: React.FC = () => {
    const [widgets, setWidgets] = useState<Widget[]>([]);
    const [layouts, setLayouts] = useState<any>({});
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [widgetToDelete, setWidgetToDelete] = useState<string | null>(null);
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [editMode, setEditMode] = useState(true);
    const { toggleColorMode, mode } = useThemeContext();
    const [editPanelOpen, setEditPanelOpen] = useState(false);
    const [activeWidget, setActiveWidget] = useState<Widget | null>(null);

    // Load saved layout from localStorage on component mount
    useEffect(() => {
        // Only run in browser environment
        if (typeof window !== 'undefined') {
            try {
                const savedWidgets = localStorage.getItem('dashboardWidgets');
                let widgetsToSet;

                if (savedWidgets) {
                    widgetsToSet = JSON.parse(savedWidgets);
                } else {
                    widgetsToSet = defaultWidgets;
                }

                setWidgets(widgetsToSet);

                // Initialize layouts based on the loaded widgets
                const initialLayouts = {
                    lg: widgetsToSet.map(widget => ({
                        i: widget.id,
                        x: widget.x,
                        y: widget.y,
                        w: widget.w,
                        h: widget.h,
                        minW: widget.minW || 2,
                        minH: widget.minH || 2,
                    })),
                };

                setLayouts(initialLayouts);
            } catch (e) {
                console.error('Failed to load widgets from localStorage:', e);
                setWidgets(defaultWidgets);
            }
        }
    }, []);

    // Save widgets to localStorage when they change
    useEffect(() => {
        if (typeof window !== 'undefined' && widgets.length >= 0) {
            localStorage.setItem('dashboardWidgets', JSON.stringify(widgets));
        }
    }, [widgets]);

    // Remove a widget
    const removeWidget = useCallback((idToRemove: string) => {
        setWidgets(prevWidgets => {
            const newWidgets = prevWidgets.filter(widget => widget.id !== idToRemove);

            // If we're in a browser environment, update localStorage immediately
            if (typeof window !== 'undefined') {
                localStorage.setItem('dashboardWidgets', JSON.stringify(newWidgets));
            }

            return newWidgets;
        });

        // Also update layouts to remove the widget from all breakpoints
        setLayouts(prevLayouts => {
            const newLayouts = { ...prevLayouts };

            // Remove the widget from all breakpoint layouts
            Object.keys(newLayouts).forEach(breakpoint => {
                if (newLayouts[breakpoint]) {
                    newLayouts[breakpoint] = newLayouts[breakpoint].filter(
                        (item: any) => item.i !== idToRemove
                    );
                }
            });

            return newLayouts;
        });

        // Close the dialog after deletion
        setDeleteDialogOpen(false);
        setWidgetToDelete(null);
    }, []);

    // Add these handler functions
    const handleOpenDeleteDialog = (widgetId: string) => {
        setWidgetToDelete(widgetId);
        setDeleteDialogOpen(true);
        setMenuAnchorEl(null); // Close the menu if open
    };

    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setWidgetToDelete(null);
    };

    const handleConfirmDelete = () => {
        if (widgetToDelete) {
            removeWidget(widgetToDelete);
        }
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, widgetId: string) => {
        setMenuAnchorEl(event.currentTarget);
        setActiveWidgetId(widgetId);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
        setActiveWidgetId(null);
    };

    // Handle layout change
    const handleLayoutChange = (currentLayout: any, allLayouts: any) => {
        // Only update if we have a valid layout
        if (!currentLayout || currentLayout.length === 0) return;

        setLayouts(allLayouts);

        // Update widget positions based on the new layout
        setWidgets(prevWidgets => {
            // Create a map of layout items by ID for quick lookup
            const layoutMap = new Map(
                currentLayout.map((item: any) => [item.i, item])
            );

            // Update each widget with its new position from the layout
            return prevWidgets.map(widget => {
                const layoutItem = layoutMap.get(widget.id);
                if (layoutItem) {
                    return {
                        ...widget,
                        x: layoutItem.x,
                        y: layoutItem.y,
                        w: layoutItem.w,
                        h: layoutItem.h
                    };
                }
                return widget;
            });
        });
    };

    // Add a new widget
    const addWidget = useCallback((type: Widget['type']) => {
        const newId = `${type}-${Date.now()}`;
        const newWidget: Widget = {
            id: newId,
            type,
            title: type.charAt(0).toUpperCase() + type.slice(1),
            x: 0,
            y: Infinity, // Place at the bottom
            w: 2,
            h: 2,
            minW: 2,
            minH: 2,
        };

        setWidgets(prevWidgets => [...prevWidgets, newWidget]);
    }, []);

    const toggleSettings = () => {
        setSettingsOpen(!settingsOpen);
    };

    const toggleEditMode = () => {
        setEditMode(!editMode);
    };

    // Add this function to update text content
    const updateWidgetContent = useCallback((widgetId: string, content: string) => {
        setWidgets(prevWidgets =>
            prevWidgets.map(widget =>
                widget.id === widgetId
                    ? { ...widget, content }
                    : widget
            )
        );
    }, []);

    // Add this function to update widget properties
    const updateWidget = useCallback((updatedWidget: Widget) => {
        setWidgets(prevWidgets =>
            prevWidgets.map(widget =>
                widget.id === updatedWidget.id
                    ? updatedWidget
                    : widget
            )
        );
    }, []);

    // Add this function to handle opening the edit panel
    const handleOpenEditPanel = (widget: Widget) => {
        setActiveWidget(widget);
        setEditPanelOpen(true);
    };

    // Add this function to handle closing the edit panel
    const handleCloseEditPanel = () => {
        setEditPanelOpen(false);
        setActiveWidget(null);
    };

    return (
        <Box sx={{ width: '100%', p: 2, position: 'relative' }}>
            {/* <DashboardHeader /> */}

            {editMode && (
                <AddWidgetsPanel addWidget={addWidget} />
            )}

            {widgets.length === 0 ? (
                <EmptyDashboard />
            ) : (
                <>
                    <GridLayout
                        widgets={widgets}
                        editMode={editMode}
                        isMobile={isMobile}
                        onLayoutChange={handleLayoutChange}
                    >
                        {widgets.map(widget => (
                            <div key={widget.id}>
                                <WidgetContent
                                    widget={widget}
                                    editMode={editMode}
                                    onDelete={handleOpenDeleteDialog}
                                    onUpdateContent={updateWidgetContent}
                                    onUpdateWidget={updateWidget}
                                    onEdit={handleOpenEditPanel}
                                />
                            </div>
                        ))}
                    </GridLayout>
                </>
            )}

            {/* Floating Action Button for Settings */}
            <Tooltip title="Dashboard Settings">
                <Fab
                    color="primary"
                    aria-label="settings"
                    onClick={toggleSettings}
                    sx={{
                        position: 'fixed',
                        bottom: 24,
                        right: 24,
                        zIndex: 1000,
                    }}
                >
                    <SettingsIcon />
                </Fab>
            </Tooltip>

            {/* Widget Options Menu */}
            <WidgetOptionsMenu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleMenuClose}
                activeWidgetId={activeWidgetId}
                onDeleteWidget={handleOpenDeleteDialog}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onClose={handleCloseDeleteDialog}
                onConfirm={handleConfirmDelete}
            />

            {/* Settings Drawer */}
            <SettingsDrawer
                open={settingsOpen}
                onClose={toggleSettings}
                mode={mode}
                toggleColorMode={toggleColorMode}
                editMode={editMode}
                toggleEditMode={toggleEditMode}
                onResetToDefault={() => {
                    if (window.confirm('Reset dashboard to default widgets?')) {
                        setWidgets(defaultWidgets);
                        setSettingsOpen(false);
                    }
                }}
                onClearWidgets={() => {
                    if (window.confirm('Clear all widgets? This cannot be undone.')) {
                        setWidgets([]);
                        setSettingsOpen(false);
                    }
                }}
            />

            {/* Widget Edit Panel */}
            <WidgetEditPanel
                open={editPanelOpen}
                widget={activeWidget}
                onClose={handleCloseEditPanel}
                onSave={updateWidget}
            >
                {activeWidget?.type === 'text' && (
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>
                            Text Content
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            You can edit the text content directly in the widget.
                        </Typography>
                    </Box>
                )}
                {/* Add more widget-specific edit content here */}
            </WidgetEditPanel>
        </Box>
    );
};

export default DashboardGrid;
