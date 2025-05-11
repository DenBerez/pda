'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box,
    useTheme,
    useMediaQuery,
    Fab,
    Tooltip,
    Typography,
    Button
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
import DashboardHeader from './dashboard/DashboardHeader';
import GridLayout from './dashboard/GridLayout';
import { Widget, WidgetType } from './dashboard/types';
import WidgetEditPanel from './dashboard/EditWidgetsPanel';
import EditIcon from '@mui/icons-material/Edit';
import Tour from './dashboard/Tour';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AudioVisualizer, LiveAudioVisualizer } from 'react-audio-visualize';

// Add at the top of the file
declare global {
    interface Window {
        webkitAudioContext: typeof AudioContext;
    }
}

// Default widgets for initial setup
const defaultWidgets: Widget[] = [

    {
        id: 'quote-1',
        type: 'quote',
        title: 'Quote',
        x: 4,
        y: 0,
        w: 4,
        h: 3,
        minW: 2,
        minH: 2,
        config: {
            categories: ['all'],
            refreshInterval: 3600
        }
    }

];

// Add proper type for layout items
interface LayoutItem {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
}

// Add this interface for dashboard settings
interface DashboardSettings {
    editMode: boolean;
    darkMode: boolean;
    layout: Layouts;
    widgets: Widget[];
    // Add other settings you want to persist
}

// Update the layouts type
interface Layouts {
    [breakpoint: string]: LayoutItem[];
}

// Add a type for the particles array and its elements
interface Particle {
    element: HTMLDivElement;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    startTime: number;
    duration: number;
    update: () => boolean;
}

// Beat detection variables
let beatCutOff = 0;
let beatThreshold = 0.15;
let beatHoldTime = 100;
let beatDecayRate = 0.97;
let lastBeatTime = 0;



// Dashboard grid component
const DashboardGrid: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [widgets, setWidgets] = useLocalStorage<Widget[]>('dashboardWidgets', defaultWidgets);
    const [layouts, setLayouts] = useState<Layouts>({});
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [widgetToDelete, setWidgetToDelete] = useState<string | null>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [editMode, setEditMode] = useLocalStorage<boolean>('dashboardEditMode', true);
    const { toggleColorMode, mode, fontFamily, setFontFamily, backgroundImage, setBackgroundImage, backgroundOpacity, setBackgroundOpacity } = useThemeContext();
    const [editPanelOpen, setEditPanelOpen] = useState(false);
    const [activeWidget, setActiveWidget] = useState<Widget | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [tourShownThisSession, setTourShownThisSession] = useState(false);
    const [showTour, setShowTour] = useState(false);
    const [gridSnap, setGridSnap] = useState(10);
    const [onApplyTemplate, setOnApplyTemplate] = useState<(template: string) => void>(() => (template: string) => { });
    const [isTourActive, setIsTourActive] = useState(false);
    const [showSettingsButton, setShowSettingsButton] = useState(false);
    const [primaryColor, setPrimaryColor] = useLocalStorage<string>('dashboardPrimaryColor', '#1976d2');
    // const settingsButtonRef = useRef<HTMLDivElement>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const [forceRefresh, setForceRefresh] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [audioVisualization, setAudioVisualization] = useLocalStorage<boolean>('dashboardAudioVisualization', false);
    // Use a separate loading check
    const isLocalStorageLoading = false; // Remove or handle loading differently

    // Initialize layouts based on widgets
    useEffect(() => {
        if (!isLocalStorageLoading && widgets) {
            const initialLayouts = {
                lg: widgets.map((widget: Widget) => ({
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

            // Check for tour status
            if (typeof window !== 'undefined') {
                const hasSeenTour = localStorage.getItem('dashboard-tour-completed');
                if (!hasSeenTour && !tourShownThisSession && !isTourActive) {
                    setShowTour(true);
                    setIsTourActive(true);
                    setTourShownThisSession(true);
                }
            }

            // Set loading to false after a short delay for smooth transition
            setTimeout(() => {
                setIsLoading(false);
                setInitialLoadComplete(true);
            }, 300);
        }
    }, [widgets, tourShownThisSession, isTourActive, isLocalStorageLoading]);

    // Remove a widget
    const removeWidget = useCallback((idToRemove: string) => {
        (setWidgets as (val: Widget[] | ((prev: Widget[]) => Widget[])) => void)(
            (prevWidgets: Widget[]) => prevWidgets.filter(widget => widget.id !== idToRemove)
        );
    }, [setWidgets]);

    // Simplified handler functions
    const handleOpenDeleteDialog = (widgetId: string) => {
        setWidgetToDelete(widgetId);
        setDeleteDialogOpen(true);
    };

    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setWidgetToDelete(null);
    };

    const handleConfirmDelete = () => {
        if (widgetToDelete) {
            removeWidget(widgetToDelete);
            setDeleteDialogOpen(false);
            setWidgetToDelete(null);
        }
    };

    // Update the handleLayoutChange function
    const handleLayoutChange = (currentLayout: LayoutItem[], allLayouts: { [key: string]: LayoutItem[] }) => {
        // Only update if we have a valid layout
        if (!currentLayout || currentLayout.length === 0) return;

        setLayouts(allLayouts);

        // Update widget positions based on the new layout
        setWidgets((prevWidgets: Widget[]) => {
            // Create a map of layout items by ID for quick lookup
            const layoutMap = new Map(
                currentLayout.map((item: LayoutItem) => [item.i, item])
            );

            // Update each widget with its new position from the layout
            const updatedWidgets = prevWidgets.map(widget => {
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

            return updatedWidgets;
        });
    };

    // Add a new widget
    const addWidget = (type: WidgetType) => {
        const id = `${type}-${Date.now()}`;
        const newWidget: Widget = {
            id,
            type,
            title: type.charAt(0).toUpperCase() + type.slice(1),
            x: 0,
            y: Infinity, // Place at the bottom
            w: 3,
            h: 3,
            minW: 2,
            minH: 2,
        };

        // Add specific configurations based on widget type
        if (type === 'weather') {
            newWidget.config = { city: 'London' };
        } else if (type === 'calendar') {
            newWidget.config = {
                showWeekends: true,
                firstDayOfWeek: 0,
                dateFormat: 'long',
                colorTheme: 'default',
                showEvents: true,
                maxEvents: 5,
                showCalendarGrid: true
            };
        } else if (type === 'quote') {
            newWidget.config = {
                categories: ['all'],
                refreshInterval: 3600
            };
        }
        // Add the new widget to the state
        setWidgets((prevWidgets: Widget[]) => [...prevWidgets, newWidget]);
    };

    const toggleSettings = () => {
        setSettingsOpen(!settingsOpen);
    };

    // Update the toggleEditMode function
    const toggleEditMode = useCallback(() => {
        setEditMode(!editMode);
    }, [editMode, setEditMode]);

    // Add this function to update text content
    const updateWidgetContent = useCallback((widgetId: string, content: string) => {
        setWidgets((prevWidgets: Widget[]) =>
            prevWidgets.map(widget =>
                widget.id === widgetId
                    ? { ...widget, content }
                    : widget
            )
        );
    }, []);

    // Add this function to update widget properties
    const updateWidget = useCallback((updatedWidget: Widget) => {
        setWidgets((prevWidgets: Widget[]) => {
            const newWidgets = prevWidgets.map(widget =>
                widget.id === updatedWidget.id
                    ? updatedWidget
                    : widget
            );
            return newWidgets;
        });
    }, [setWidgets]);

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

    // Add this function to toggle fullscreen
    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            // Enter fullscreen
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
            setIsFullscreen(true);
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    }, []);

    // Add an effect to handle fullscreen change events
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    // Modify the handleTourClose function
    const handleTourClose = useCallback(() => {
        // Ensure any existing tour is properly closed
        const shepherdElements = document.querySelectorAll('.shepherd-element, .shepherd-modal-overlay');
        if (shepherdElements.length > 0) {
            shepherdElements.forEach(el => el.remove());
        }

        setShowTour(false);
        setIsTourActive(false);
        localStorage.setItem('dashboard-tour-completed', 'true');
    }, []);

    // Modify the restartTour function
    const restartTour = useCallback(() => {
        // Only start the tour if it's not already active
        if (!isTourActive) {
            // Clean up any existing tour elements first
            const shepherdElements = document.querySelectorAll('.shepherd-element, .shepherd-modal-overlay');
            if (shepherdElements.length > 0) {
                shepherdElements.forEach(el => el.remove());
            }

            setShowTour(true);
            setIsTourActive(true);
        }
    }, [isTourActive]);

    // Add this effect to clean up tour elements when component unmounts
    useEffect(() => {
        return () => {
            // Clean up any tour elements when component unmounts
            const shepherdElements = document.querySelectorAll('.shepherd-element, .shepherd-modal-overlay');
            if (shepherdElements.length > 0) {
                shepherdElements.forEach(el => el.remove());
            }
        };
    }, []);

    // Add this effect to handle mouse movement
    useEffect(() => {
        let timeout: NodeJS.Timeout;

        const handleMouseMove = () => {
            setShowSettingsButton(true);

            // Clear any existing timeout
            if (timeout) clearTimeout(timeout);

            // Set a new timeout to hide the button after 3 seconds of inactivity
            timeout = setTimeout(() => {
                setShowSettingsButton(false);
            }, 3000);
        };

        // Add event listener for mouse movement
        window.addEventListener('mousemove', handleMouseMove);

        // Clean up
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (timeout) clearTimeout(timeout);
        };
    }, []);

    // Add this function to handle primary color changes
    const handleChangePrimaryColor = useCallback((color: string) => {
        setPrimaryColor(color);
    }, [setPrimaryColor]);

    // Create a custom theme with the primary color
    const customTheme = React.useMemo(() =>
        createTheme({
            palette: {
                mode: mode,
                primary: {
                    main: primaryColor,
                },
            },
            // Inherit typography settings from the main theme
            typography: theme.typography,
        }),
        [mode, primaryColor]);

    // Add this effect to listen for theme refresh events
    useEffect(() => {
        const handleThemeRefresh = () => {
            setIsRefreshing(true);

            // Small delay to allow the loading state to render
            setTimeout(() => {
                setForceRefresh(prev => !prev);
                setIsRefreshing(false);
            }, 50);
        };

        window.addEventListener('dashboard-refresh-theme', handleThemeRefresh);

        return () => {
            window.removeEventListener('dashboard-refresh-theme', handleThemeRefresh);
        };
    }, []);

    const toggleAudioVisualization = useCallback(() => {
        setAudioVisualization(prev => !prev);
        // Force a refresh to ensure the visualization effect is applied/removed
        setForceRefresh(prev => !prev);
    }, [setAudioVisualization]);

    // Add this effect to handle the audio visualization setup
    useEffect(() => {
        if (audioVisualization) {
            // Create visualization container and elements
            const visualizerContainer = document.createElement('div');
            const root = document.createElement('div');
            const topVisualizer = document.createElement('div');
            const centerVisualizer = document.createElement('div');
            const bottomVisualizer = document.createElement('div');

            // Set up container styles
            visualizerContainer.id = 'audio-visualizer-container';
            visualizerContainer.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 9999;
            `;

            // Set up visualizer styles and append to container
            topVisualizer.style.cssText = `width: 100%; height: 100px;`;
            centerVisualizer.style.cssText = `width: 300px; height: 300px;`;
            bottomVisualizer.style.cssText = `width: 100%; height: 100px;`;

            root.appendChild(topVisualizer);
            root.appendChild(centerVisualizer);
            root.appendChild(bottomVisualizer);
            visualizerContainer.appendChild(root);
            document.body.appendChild(visualizerContainer);

            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const audioCtx = new AudioContext();
            const analyzer = audioCtx.createAnalyser();
            analyzer.fftSize = 2048;

            const connectToAudioElement = (audioEl: HTMLAudioElement) => {
                try {
                    const source = audioCtx.createMediaElementSource(audioEl);
                    source.connect(analyzer);
                    source.connect(audioCtx.destination);
                    showAudioNotification('Connected to audio element');

                    // Add data attribute to mark this element as connected
                    audioEl.dataset.visualizerConnected = 'true';

                    // Add event listener to play/pause visualization based on audio state
                    audioEl.addEventListener('play', () => {
                        console.log('Audio element started playing');
                    });

                    audioEl.addEventListener('pause', () => {
                        console.log('Audio element paused');
                    });

                    return true;
                } catch (err) {
                    if (err instanceof Error && err.message.includes('already connected')) {
                        console.log('Audio element already connected');
                        return true;
                    } else {
                        console.error('Error connecting audio element:', err);
                        return false;
                    }
                }
            };

            // Function to connect to microphone
            const connectToMicrophone = () => {
                navigator.mediaDevices.getUserMedia({ audio: true })
                    .then(stream => {
                        const micSource = audioCtx.createMediaStreamSource(stream);
                        micSource.connect(analyzer);
                        console.log('Connected to microphone input');
                        showAudioNotification('Using microphone for audio visualization');
                    })
                    .catch(err => {
                        console.error('Error accessing microphone:', err);
                    });
            };

            // Function to try system audio capture
            const trySystemAudioCapture = async () => {
                if (navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices) {
                    showAudioNotification('Please select "Share system audio" in the next dialog');

                    try {
                        const stream = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: false });
                        const systemSource = audioCtx.createMediaStreamSource(stream);
                        systemSource.connect(analyzer);
                        console.log('Connected to system audio');
                    } catch (err) {
                        console.error('Error accessing system audio:', err);
                        connectToAudioSource();
                    }
                } else {
                    console.log('System audio capture not supported');
                    connectToAudioSource();
                }
            };

            // Function to show audio notification
            const showAudioNotification = (message: string) => {
                const notification = document.createElement('div');
                notification.style.cssText = `
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background-color: rgba(0, 0, 0, 0.7);
                    color: white;
                    padding: 10px 20px;
                    border-radius: 4px;
                    z-index: 10000;
                `;
                notification.textContent = message;
                document.body.appendChild(notification);
                setTimeout(() => notification.remove(), 3000);
            };

            // Function to find and connect to audio sources
            const connectToAudioSource = () => {
                let connected = false;

                // Look for Spotify audio elements first
                const spotifyAudioElements = document.querySelectorAll('audio[data-spotify-player="true"]:not([data-visualizer-connected="true"])');
                if (spotifyAudioElements.length > 0) {
                    console.log('Found Spotify audio elements:', spotifyAudioElements.length);
                    spotifyAudioElements.forEach((el) => {
                        if (connectToAudioElement(el as HTMLAudioElement)) {
                            connected = true;
                        }
                    });
                }

                // Then look for any audio elements
                const audioElements = document.querySelectorAll('audio:not([data-visualizer-connected="true"])');
                if (audioElements.length > 0) {
                    console.log('Found audio elements:', audioElements.length);
                    audioElements.forEach(audio => {
                        if (connectToAudioElement(audio as HTMLAudioElement)) {
                            connected = true;
                        }
                    });
                }

                // If no audio elements were connected, try microphone
                if (!connected) {
                    console.log('No audio elements found or connected, trying microphone');
                    connectToMicrophone();
                }

                return connected;
            };

            // Add a button to request system audio access
            const systemAudioButton = document.createElement('button');
            systemAudioButton.id = 'system-audio-button';
            systemAudioButton.textContent = 'Enable System Audio';
            systemAudioButton.style.cssText = `
                position: fixed;
                bottom: 80px;
                right: 20px;
                z-index: 10000;
                padding: 8px 16px;
                background-color: ${primaryColor};
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-family: sans-serif;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            `;
            systemAudioButton.onclick = () => {
                trySystemAudioCapture();
                systemAudioButton.remove();
            };
            document.body.appendChild(systemAudioButton);

            // First try to find existing audio elements
            connectToAudioSource();

            // Start observing the document
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.addedNodes.length > 0) {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeName === 'AUDIO') {
                                console.log('MutationObserver: Found new audio element');
                                connectToAudioElement(node as HTMLAudioElement);
                            } else if (node instanceof Element) {
                                // Look for audio elements within the added node
                                const audioElements = node.querySelectorAll('audio');
                                if (audioElements.length > 0) {
                                    console.log('MutationObserver: Found new audio elements');
                                    audioElements.forEach(audio => connectToAudioElement(audio as HTMLAudioElement));
                                }
                            }
                        });
                    }
                });
            });

            // Start observing the document
            observer.observe(document.body, { childList: true, subtree: true });

            // Initialize the visualizers
            const renderVisualizers = () => {
                // Create the visualizers
                const topVisualizerElement = document.createElement('canvas');
                topVisualizerElement.width = window.innerWidth;
                topVisualizerElement.height = 100;
                topVisualizerElement.style.cssText = `
                    width: 100%;
                    height: 100px;
                    opacity: 0.7;
                `;
                topVisualizer.appendChild(topVisualizerElement);

                const centerVisualizerElement = document.createElement('canvas');
                centerVisualizerElement.width = 300;
                centerVisualizerElement.height = 300;
                centerVisualizerElement.style.cssText = `
                    width: 300px;
                    height: 300px;
                    opacity: 0.7;
                `;
                centerVisualizer.appendChild(centerVisualizerElement);

                const bottomVisualizerElement = document.createElement('canvas');
                bottomVisualizerElement.width = window.innerWidth;
                bottomVisualizerElement.height = 100;
                bottomVisualizerElement.style.cssText = `
                    width: 100%;
                    height: 100px;
                    opacity: 0.7;
                `;
                bottomVisualizer.appendChild(bottomVisualizerElement);

                // Draw functions for each visualizer
                const drawTopVisualizer = () => {
                    const canvas = topVisualizerElement;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;

                    const bufferLength = analyzer.frequencyBinCount;
                    const dataArray = new Uint8Array(bufferLength);
                    analyzer.getByteFrequencyData(dataArray);

                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = `${primaryColor}`;

                    const barWidth = (canvas.width / bufferLength) * 2.5;
                    let x = 0;

                    for (let i = 0; i < bufferLength; i++) {
                        const barHeight = dataArray[i] / 2;
                        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                        x += barWidth + 1;
                    }

                    requestAnimationFrame(drawTopVisualizer);
                };

                const drawCenterVisualizer = () => {
                    const canvas = centerVisualizerElement;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;

                    const bufferLength = analyzer.frequencyBinCount;
                    const dataArray = new Uint8Array(bufferLength);
                    analyzer.getByteFrequencyData(dataArray);

                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    // Calculate average volume for pulse effect
                    let sum = 0;
                    for (let i = 0; i < bufferLength; i++) {
                        sum += dataArray[i];
                    }
                    const average = sum / bufferLength;
                    const scale = 0.5 + (average / 255) * 0.5;

                    // Draw circular visualizer
                    const centerX = canvas.width / 2;
                    const centerY = canvas.height / 2;
                    const radius = Math.min(centerX, centerY) * scale;

                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                    ctx.fillStyle = `${primaryColor}${Math.floor((average / 255) * 255).toString(16).padStart(2, '0')}`;
                    ctx.fill();

                    // Draw frequency bars in a circle
                    const barCount = 64;
                    const angleStep = (2 * Math.PI) / barCount;

                    for (let i = 0; i < barCount; i++) {
                        const index = Math.floor(i * bufferLength / barCount);
                        const value = dataArray[index];
                        const barHeight = (value / 255) * radius * 0.5;

                        const angle = i * angleStep;
                        const x1 = centerX + Math.cos(angle) * radius;
                        const y1 = centerY + Math.sin(angle) * radius;
                        const x2 = centerX + Math.cos(angle) * (radius + barHeight);
                        const y2 = centerY + Math.sin(angle) * (radius + barHeight);

                        ctx.beginPath();
                        ctx.moveTo(x1, y1);
                        ctx.lineTo(x2, y2);
                        ctx.lineWidth = 2;
                        ctx.strokeStyle = primaryColor;
                        ctx.stroke();
                    }

                    requestAnimationFrame(drawCenterVisualizer);
                };

                const drawBottomVisualizer = () => {
                    const canvas = bottomVisualizerElement;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;

                    const bufferLength = analyzer.frequencyBinCount;
                    const dataArray = new Uint8Array(bufferLength);
                    analyzer.getByteFrequencyData(dataArray);

                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    // Draw wave form
                    ctx.beginPath();
                    ctx.moveTo(0, canvas.height / 2);

                    const sliceWidth = canvas.width / bufferLength;
                    let x = 0;

                    for (let i = 0; i < bufferLength; i++) {
                        const v = dataArray[i] / 128.0;
                        const y = v * canvas.height / 2;

                        if (i === 0) {
                            ctx.moveTo(x, y);
                        } else {
                            ctx.lineTo(x, y);
                        }

                        x += sliceWidth;
                    }

                    ctx.lineTo(canvas.width, canvas.height / 2);
                    ctx.strokeStyle = primaryColor;
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    requestAnimationFrame(drawBottomVisualizer);
                };

                // Start the visualizers
                drawTopVisualizer();
                drawCenterVisualizer();
                drawBottomVisualizer();
            };

            // Initialize the visualizers
            renderVisualizers();

            // Add Spotify event listener here
            window.addEventListener('spotify-player-ready', (e: any) => {
                if (e.detail && e.detail.audioElement) {
                    connectToAudioElement(e.detail.audioElement);
                }
            });

            // Clean up function
            return () => {
                if (visualizerContainer && document.body.contains(visualizerContainer)) {
                    document.body.removeChild(visualizerContainer);
                }

                const systemAudioButton = document.getElementById('system-audio-button');
                if (systemAudioButton) {
                    systemAudioButton.remove();
                }

                observer.disconnect();

                // Close audio context
                if (audioCtx.state !== 'closed') {
                    audioCtx.close().catch(err => console.error('Error closing audio context:', err));
                }

                window.removeEventListener('spotify-player-ready', (e: any) => {
                    if (e.detail && e.detail.audioElement) {
                        connectToAudioElement(e.detail.audioElement);
                    }
                });
            };
        }
    }, [audioVisualization, primaryColor]);

    return (
        <ThemeProvider theme={customTheme}>
            {!initialLoadComplete && (
                <Box
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        bgcolor: 'background.default',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: isLoading ? 1 : 0,
                        transition: 'opacity 0.5s ease',
                        pointerEvents: isLoading ? 'auto' : 'none',
                    }}
                >
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" sx={{ mb: 2, fontWeight: 'medium' }}>
                            Loading Dashboard
                        </Typography>
                        <Box sx={{
                            width: 40,
                            height: 40,
                            margin: '0 auto',
                            borderRadius: '50%',
                            border: '3px solid',
                            borderColor: 'grey.300',
                            borderTopColor: 'primary.main',
                            animation: 'spin 1s linear infinite',
                        }} />
                        <style>{`
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        `}</style>
                    </Box>
                </Box>
            )}

            {isRefreshing && (
                <Box
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 9999,
                        height: '3px',
                        bgcolor: 'primary.main',
                        animation: 'progress 1s infinite linear'
                    }}
                />
            )}

            <Box
                sx={{
                    height: '100%',
                    width: '100%',
                    overflow: 'hidden',
                    position: 'relative',
                    bgcolor: 'transparent',
                    color: 'text.primary',
                    transition: 'background-color 0.3s ease, opacity 0.5s ease',
                    opacity: initialLoadComplete ? 1 : 0,
                    '& > *': {
                        position: 'relative',
                        zIndex: 2
                    }
                }}
            >
                <style>{`
                    .react-grid-placeholder {
                        background-color: ${customTheme.palette.primary.main}20 !important;
                        border: 1px dashed ${customTheme.palette.primary.main} !important;
                        border-radius: 8px !important;
                        opacity: 0.7 !important;
                        transition: all 200ms ease;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1) !important;
                    }
                    
                `}</style>

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
                    fullscreen={isFullscreen}
                    toggleFullscreen={toggleFullscreen}
                    gridSnap={gridSnap}
                    setGridSnap={setGridSnap}
                    onApplyTemplate={onApplyTemplate}
                    restartTour={restartTour}
                    primaryColor={primaryColor}
                    onChangePrimaryColor={handleChangePrimaryColor}
                    fontFamily={fontFamily}
                    onChangeFontFamily={(font) => setFontFamily(font)}
                    backgroundImage={backgroundImage}
                    onChangeBackgroundImage={setBackgroundImage}
                    backgroundOpacity={backgroundOpacity}
                    onChangeBackgroundOpacity={setBackgroundOpacity}
                    audioVisualization={audioVisualization}
                    onToggleAudioVisualization={toggleAudioVisualization}
                />

                {/* Widget Edit Panel */}
                <WidgetEditPanel
                    open={editPanelOpen}
                    widget={activeWidget}
                    onClose={handleCloseEditPanel}
                    onSave={updateWidget}
                >

                    {/* Add more widget-specific edit content here */}
                </WidgetEditPanel>

                {showTour && (
                    <Tour
                        isOpen={showTour}
                        onRequestClose={handleTourClose}
                        editMode={editMode}
                        setEditMode={setEditMode}
                        widgets={widgets}
                        setWidgets={setWidgets}
                        defaultWidgets={defaultWidgets}
                        settingsOpen={settingsOpen}
                        setSettingsOpen={setSettingsOpen}
                    />
                )}
            </Box>
            <Tooltip title="Settings">
                <Box
                    // ref={settingsButtonRef}
                    sx={{
                        position: 'fixed',
                        bottom: { xs: 16, sm: 20 },
                        right: { xs: 32, sm: 40 },
                        zIndex: 1200,
                        opacity: showSettingsButton && !settingsOpen ? 1 : 0,
                        visibility: showSettingsButton && !settingsOpen ? 'visible' : 'hidden',
                        transition: 'opacity 0.3s ease-in-out, visibility 0.3s ease-in-out',
                        pointerEvents: showSettingsButton && !settingsOpen ? 'auto' : 'none',
                        transform: 'translateZ(0)',
                        willChange: 'opacity, visibility',
                        '& > *': {
                            transform: 'translateZ(0)'
                        }
                    }}
                >
                    <Fab
                        size="medium"
                        color="primary"
                        aria-label="settings"
                        onClick={toggleSettings}
                        className="settings-button"
                        sx={{
                            transition: 'box-shadow 0.3s ease-in-out, transform 0.2s ease',
                            boxShadow: showSettingsButton ? '0 0 15px rgba(25, 118, 210, 0.6), 0 4px 10px rgba(0,0,0,0.3)' : '0 4px 10px rgba(0,0,0,0.2)',
                            transform: showSettingsButton ? 'scale(1.1)' : 'scale(1)',
                            '&:hover': {
                                transform: 'scale(1.15)',
                                boxShadow: '0 0 20px rgba(25, 118, 210, 0.8), 0 6px 14px rgba(0,0,0,0.25)'
                            }
                        }}
                    >
                        <SettingsIcon />
                    </Fab>
                </Box>
            </Tooltip>
        </ThemeProvider>
    );
};

export default DashboardGrid;
