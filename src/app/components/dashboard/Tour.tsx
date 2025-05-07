import React, { useEffect, useRef } from 'react';
import Shepherd from 'shepherd.js';
import type { Tour as ShepherdTour, Step } from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Widget } from './types';

interface TourProps {
    isOpen: boolean;
    onRequestClose: () => void;
    editMode: boolean;
    setEditMode: (mode: boolean) => void;
    widgets: Widget[];
    setWidgets: (widgets: Widget[]) => void;
    defaultWidgets: Widget[];
    settingsOpen: boolean;
    setSettingsOpen: (open: boolean) => void;
}

const Tour: React.FC<TourProps> = ({
    isOpen,
    onRequestClose,
    editMode,
    setEditMode,
    widgets,
    setWidgets,
    defaultWidgets,
    settingsOpen,
    setSettingsOpen
}) => {
    const theme = useTheme();
    const tourRef = useRef<ShepherdTour | null>(null);

    useEffect(() => {
        // First, clean up any existing tours to prevent duplicates
        const existingTours = document.querySelectorAll('.shepherd-element, .shepherd-modal-overlay');
        existingTours.forEach(el => el.remove());

        // Only initialize the tour if it's supposed to be open
        if (!isOpen) return;

        // Create a new tour instance
        tourRef.current = new Shepherd.Tour({
            defaultStepOptions: {
                cancelIcon: {
                    enabled: true
                },
                classes: 'shepherd-theme-custom',
                scrollTo: {
                    behavior: 'smooth',
                    block: 'center'
                },
                arrow: true,

            },
            useModalOverlay: true
        });

        // Handler for tour completion
        const handleTourComplete = () => {
            if (typeof window !== 'undefined') {
                localStorage.setItem('dashboard-tour-completed', 'true');
            }
            onRequestClose();
        };

        // Add event listeners
        tourRef.current.on('cancel', handleTourComplete);
        tourRef.current.on('complete', handleTourComplete);

        // Add steps to the tour
        tourRef.current.addStep({
            id: 'welcome',
            title: 'Welcome to Your Dashboard',
            text: `
                <div style="padding: 4px 0">
                    <p>Welcome to your personalized dashboard! This quick tour will show you how to use and customize it.</p>
                </div>
            `,
            buttons: [
                {
                    text: 'Skip',
                    action: () => {
                        tourRef.current?.complete();
                        handleTourComplete();
                    },
                    classes: 'shepherd-button-secondary'
                },
                {
                    text: 'Next',
                    action: () => tourRef.current?.next(),
                    classes: 'shepherd-button-primary'
                }
            ]
        });

        tourRef.current.addStep({
            id: 'add-widgets',
            title: 'Add Widgets',
            text: `
                <div>
                    <p>Browse and add different widgets to customize your dashboard.</p>
                </div>
            `,
            attachTo: {
                element: '.add-widgets-panel',
                on: 'bottom'
            },
            beforeShowPromise: () => {
                return new Promise<void>(resolve => {
                    if (!editMode) {
                        setEditMode(true);
                        setTimeout(() => resolve(), 500);
                    } else {
                        resolve();
                    }
                });
            },
            buttons: [
                {
                    text: 'Next',
                    action: () => tourRef.current?.next(),
                    classes: 'shepherd-button-primary'
                }
            ]
        });

        tourRef.current.addStep({
            id: 'drag-widgets',
            title: 'Arrange Widgets',
            text: `
                <div>
                    <p>Drag widgets by their headers to rearrange them on your dashboard.
                    You can also resize widgets by dragging their edges.</p>
                </div>
            `,
            attachTo: {
                element: '.widget-drag-handle',
                on: 'top'
            },
            beforeShowPromise: () => {
                return new Promise<void>(resolve => {
                    // Make sure we have widgets and edit mode is enabled
                    if (widgets.length === 0) {
                        // Add a default widget if none exist
                        setWidgets(defaultWidgets);
                        setTimeout(() => resolve(), 800);
                    } else if (!editMode) {
                        setEditMode(true);
                        setTimeout(() => resolve(), 500);
                    } else {
                        resolve();
                    }
                });
            },
            buttons: [
                {
                    text: 'Next',
                    action: () => tourRef.current?.next(),
                    classes: 'shepherd-button-primary'
                }
            ]
        });

        tourRef.current.addStep({
            id: 'settings-button',
            title: 'Dashboard Settings',
            text: `
                <div>
                    <p>Click this button to access dashboard settings where you can customize appearance,
                    apply templates, and manage your widgets.</p>
                </div>
            `,
            attachTo: {
                element: '.settings-button',
                on: 'left'
            },
            beforeShowPromise: () => {
                return new Promise<void>(resolve => {
                    // Ensure the settings button is visible and properly highlighted
                    const settingsButton = document.querySelector('.settings-button');
                    if (settingsButton) {
                        settingsButton.classList.add('tour-highlight-settings');
                        // Force a reflow to ensure the class is applied
                        void (settingsButton as HTMLElement).offsetWidth;
                        setTimeout(() => resolve(), 300);
                    } else {
                        resolve();
                    }
                });
            },
            buttons: [
                {
                    text: 'Next',
                    action: () => tourRef.current?.next(),
                    classes: 'shepherd-button-primary'
                }
            ]
        });

        tourRef.current.addStep({
            id: 'edit-mode',
            title: 'Edit Mode',
            text: `
                <div>
                    <p>Toggle edit mode to lock your widgets in place or make changes to your layout.</p>
                </div>
            `,
            attachTo: {
                element: '.edit-mode-toggle',
                on: 'left'
            },
            beforeShowPromise: () => {
                return new Promise<void>(resolve => {
                    // Open the settings drawer if it's not already open
                    if (!settingsOpen) {
                        setSettingsOpen(true);
                        // Give it a moment to open before resolving
                        setTimeout(() => resolve(), 500);
                    } else {
                        resolve();
                    }
                });
            },
            buttons: [
                {
                    text: 'Next',
                    action: () => tourRef.current?.next(),
                    classes: 'shepherd-button-primary'
                }
            ]
        });

        tourRef.current.addStep({
            id: 'all-set',
            title: 'All Set!',
            text: `
                <div>
                    <p>You're all set to use your personalized dashboard. Add widgets, rearrange them,
                    and make it your own!</p>
                    <p>You can restart this tour anytime from the settings menu.</p>
                </div>
            `,
            buttons: [
                {
                    text: 'Finish',
                    action: () => {
                        tourRef.current?.complete();
                        handleTourComplete();
                    },
                    classes: 'shepherd-button-primary'
                }
            ]
        });

        // Add custom styles for the tour
        const style = document.createElement('style');
        style.textContent = `
            .shepherd-theme-custom {
                --shepherd-bg: ${theme.palette.background.paper};
                --shepherd-text: ${theme.palette.text.primary};
                --shepherd-primary: ${theme.palette.primary.main};
                --shepherd-header-bg: ${theme.palette.background.paper};
                --shepherd-element-border-radius: 12px;
                --shepherd-element-width: 350px;
                z-index: 10000;
                box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
            }
            
            /* Apply these styles to all shepherd elements */
            .shepherd-element {
                background-color: ${theme.palette.background.paper} !important;
                color: ${theme.palette.text.primary} !important;
                filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
                z-index: 10000;
                border: 1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'};
            }
            
            .shepherd-button-primary {
                background-color: ${theme.palette.primary.main} !important;
                color: ${theme.palette.primary.contrastText} !important;
                font-weight: 500 !important;
                padding: 8px 16px !important;
                border-radius: 6px !important;
                transition: background-color 0.2s ease !important;
                margin-left: 8px !important;
            }
            
            .shepherd-button-primary:hover {
                background-color: ${theme.palette.primary.dark} !important;
            }
            
            .shepherd-button-secondary {
                color: ${theme.palette.text.primary} !important;
                background-color: ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'} !important;
                font-weight: 500 !important;
                padding: 8px 16px !important;
                border-radius: 6px !important;
                transition: background-color 0.2s ease !important;
            }
            
            .shepherd-button-secondary:hover {
                background-color: ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'} !important;
            }
            
            .shepherd-text {
                font-size: 14px;
                color: ${theme.palette.text.primary} !important;
                line-height: 1.6 !important;
                padding: 0 16px 8px 16px !important;
            }
            
            .shepherd-text p {
                margin-bottom: 12px !important;
            }
            
            .shepherd-text p:last-child {
                margin-bottom: 0 !important;
            }
            
            .shepherd-title {
                font-weight: 600;
                color: ${theme.palette.text.primary} !important;
                font-size: 18px !important;
                margin-bottom: 8px !important;
            }
            
            .shepherd-header {
                background-color: ${theme.palette.background.paper} !important;
                padding: 16px 16px 8px 16px !important;
                border-bottom: none !important;
                position: relative !important;
            }
            
            .shepherd-content {
                padding-bottom: 0 !important;
                background-color: ${theme.palette.background.paper} !important;
            }
            
            .shepherd-footer {
                padding: 8px 16px 16px 16px !important;
                background-color: ${theme.palette.background.paper} !important;
                border-top: 1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'} !important;
                margin-top: 8px !important;
                display: flex !important;
                justify-content: flex-end !important;
            }
            
            /* Fix for modal overlay */
            .shepherd-modal-overlay-container {
                z-index: 9999;
                background-color: ${theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.5)'} !important;
            }
            
            /* Fix for cancel button */
            .shepherd-cancel-icon {
                color: ${theme.palette.text.secondary} !important;
                opacity: 0.7 !important;
                transition: opacity 0.2s ease !important;
                position: absolute !important;
                top: 12px !important;
                right: 12px !important;
            }
            
            .shepherd-cancel-icon:hover {
                opacity: 1 !important;
            }
            
            /* Define the pulsing animation for all tour highlights */
            @keyframes tour-spotlight-pulse {
                0% {
                    box-shadow: 0 0 0 4px ${theme.palette.primary.main}70, 
                               0 0 0 8px ${theme.palette.primary.main}40,
                               0 0 0 12px ${theme.palette.primary.main}20,
                               0 0 15px 5px ${theme.palette.primary.main}30,
                               0 0 30px 10px ${theme.palette.primary.main}20,
                               0 0 45px 15px ${theme.palette.primary.main}10;
                }
                50% {
                    box-shadow: 0 0 0 4px ${theme.palette.primary.main}80, 
                               0 0 0 8px ${theme.palette.primary.main}50,
                               0 0 0 12px ${theme.palette.primary.main}30,
                               0 0 20px 8px ${theme.palette.primary.main}40,
                               0 0 35px 12px ${theme.palette.primary.main}30,
                               0 0 50px 18px ${theme.palette.primary.main}20;
                }
                100% {
                    box-shadow: 0 0 0 4px ${theme.palette.primary.main}70, 
                               0 0 0 8px ${theme.palette.primary.main}40,
                               0 0 0 12px ${theme.palette.primary.main}20,
                               0 0 15px 5px ${theme.palette.primary.main}30,
                               0 0 30px 10px ${theme.palette.primary.main}20,
                               0 0 45px 15px ${theme.palette.primary.main}10;
                }
            }
            
            /* Generic tour highlight class that can be applied to any element */
            .tour-highlight {
                animation: tour-spotlight-pulse 2s infinite ease-in-out;
                z-index: 10001 !important;
                position: relative !important;
            }
            
            /* Highlight for settings button - now inherits from tour-highlight */
            .tour-highlight-settings {
                animation: tour-spotlight-pulse 2s infinite ease-in-out;
                z-index: 10001 !important;
                transition: box-shadow 0.3s ease-in-out !important;
            }
            
            /* Arrow styling */
            .shepherd-arrow {
                border-width: 8px !important;
            }
            
            .shepherd-arrow:before {
                border-width: 8px !important;
            }
            
            /* Improve step transitions */
            .shepherd-element[data-popper-placement^='top'] {
                transform-origin: bottom center;
            }
            
            .shepherd-element[data-popper-placement^='bottom'] {
                transform-origin: top center;
            }
            
            .shepherd-element[data-popper-placement^='left'] {
                transform-origin: right center;
            }
            
            .shepherd-element[data-popper-placement^='right'] {
                transform-origin: left center;
            }
        `;
        document.head.appendChild(style);

        // Add this function after the handleTourComplete function (around line 81)
        const handleStepChange = (event: any) => {
            // Remove highlight from all previously highlighted elements
            document.querySelectorAll('.tour-highlight, .tour-highlight-settings').forEach(el => {
                el.classList.remove('tour-highlight');
                el.classList.remove('tour-highlight-settings');
            });

            // Add highlight to the current step's target element if it exists
            if (event && event.step && event.step.options && event.step.options.attachTo) {
                const targetSelector = event.step.options.attachTo.element;
                const targetElement = document.querySelector(targetSelector);
                if (targetElement) {
                    // Use the specific class for settings button, generic class for others
                    if (targetSelector === '.settings-button') {
                        targetElement.classList.add('tour-highlight-settings');
                    } else {
                        targetElement.classList.add('tour-highlight');
                    }
                }
            }
        };

        // Add this event listener after the existing ones
        tourRef.current.on('show', handleStepChange);

        // Start the tour
        tourRef.current.start();

        // Clean up when component unmounts or when isOpen changes
        return () => {
            if (tourRef.current) {
                tourRef.current.off('cancel', handleTourComplete);
                tourRef.current.off('complete', handleTourComplete);
                tourRef.current.off('show', handleStepChange);
                tourRef.current.complete();
            }

            // Force removal of any remaining shepherd elements
            document.querySelectorAll('.shepherd-element, .shepherd-modal-overlay-container, .shepherd-modal-overlay').forEach(el => {
                el.remove();
            });

            if (document.head.contains(style)) {
                document.head.removeChild(style);
            }

            // Remove any highlight classes
            document.querySelectorAll('.tour-highlight, .tour-highlight-settings').forEach(el => {
                el.classList.remove('tour-highlight');
                el.classList.remove('tour-highlight-settings');
            });
        };
    }, [isOpen, theme.palette.mode, onRequestClose]);

    // The tour is managed via the useEffect hook, so we don't need to render anything
    return null;
};

export default Tour; 