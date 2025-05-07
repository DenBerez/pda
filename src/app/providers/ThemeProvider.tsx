'use client';

import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import { CssBaseline, IconButton } from '@mui/material';
import { useEffect, useState, createContext, useContext } from 'react';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { lighten, darken, alpha } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

// Create a context for theme toggling
interface ThemeContextType {
    mode: PaletteMode;
    toggleColorMode: () => void;
    fontFamily: string;
    setFontFamily: (font: string) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
    toggleColorMode: () => { },
    mode: 'light',
    fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
    setFontFamily: () => { },
});

export function useThemeContext() {
    return useContext(ThemeContext);
}

export function ThemeToggleButton() {
    const { toggleColorMode, mode } = useThemeContext();

    return (
        <IconButton
            onClick={toggleColorMode}
            color="inherit"
            aria-label="toggle theme"
            sx={{ ml: 1 }}
        >
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
    );
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setMode] = useState<'light' | 'dark'>('light');
    const [primaryColor, setPrimaryColor] = useState<string>('#1976d2');
    const [fontFamily, setFontFamily] = useState('var(--font-geist-sans), system-ui, sans-serif');

    useEffect(() => {
        // Check system preference and saved preference
        const savedMode = localStorage.getItem('theme-mode');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedPrimaryColor = localStorage.getItem('dashboardPrimaryColor');

        setMode(savedMode === 'dark' || (!savedMode && prefersDark) ? 'dark' : 'light');

        // Use saved primary color if available
        if (savedPrimaryColor) {
            setPrimaryColor(savedPrimaryColor);
        }
    }, []);

    const toggleColorMode = () => {
        setMode((prevMode) => {
            const newMode = prevMode === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme-mode', newMode);
            return newMode;
        });
    };

    // Function to update primary color
    const handleSetPrimaryColor = (color: string) => {
        setPrimaryColor(color);
        localStorage.setItem('dashboardPrimaryColor', color);
    };

    // Ensure color is in a valid format for MUI color utilities
    const safeColor = (color: string) => {
        // Check if color is a valid hex, rgb, rgba, hsl, or hsla format
        const validColorRegex = /^(#[0-9A-Fa-f]{3}|#[0-9A-Fa-f]{6}|rgb\(.*\)|rgba\(.*\)|hsl\(.*\)|hsla\(.*\))$/;
        return validColorRegex.test(color) ? color : '#1976d2'; // Fallback to default blue if invalid
    };

    // Calculate dark mode primary color (lighter version of the primary color)
    const safePrimaryColor = safeColor(primaryColor);
    const darkModePrimaryColor = lighten(safePrimaryColor, 0.2);

    const theme = createTheme({
        palette: {
            mode,
            primary: {
                main: mode === 'light' ? safePrimaryColor : darkModePrimaryColor,
            },
            secondary: {
                main: mode === 'light' ? '#f50057' : '#f48fb1',
            },
            background: {
                default: mode === 'light' ? '#f5f5f5' : '#121212',
                paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
            },
            action: {
                // Customize hover states based on primary color
                hover: mode === 'light'
                    ? alpha(safePrimaryColor, 0.08)  // Light mode: slightly transparent primary
                    : alpha(darkModePrimaryColor, 0.12), // Dark mode: slightly transparent primary
                selected: mode === 'light'
                    ? alpha(safePrimaryColor, 0.16)  // Light mode: more opaque primary
                    : alpha(darkModePrimaryColor, 0.24), // Dark mode: more opaque primary
            },
        },
        typography: {
            fontFamily: fontFamily,
            fontSize: 16,
            fontWeightLight: 300,
            fontWeightRegular: 400,
            fontWeightMedium: 500,
            fontWeightBold: 600,
            h1: {
                fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
                fontSize: '2.5rem',
                fontWeight: 600,
                lineHeight: 1.2,
            },
            h2: {
                fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
                fontSize: '2rem',
                fontWeight: 600,
                lineHeight: 1.3,
            },
            h3: {
                fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
                fontSize: '1.75rem',
                fontWeight: 600,
                lineHeight: 1.3,
            },
            h4: {
                fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
                fontSize: '1.5rem',
                fontWeight: 600,
                lineHeight: 1.4,
            },
            h5: {
                fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
                fontSize: '1.25rem',
                fontWeight: 600,
                lineHeight: 1.4,
            },
            h6: {
                fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
                fontSize: '1rem',
                fontWeight: 600,
                lineHeight: 1.5,
            },
            body1: {
                fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
                fontSize: '1rem',
                lineHeight: 1.5,
            },
            body2: {
                fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
                fontSize: '0.875rem',
                lineHeight: 1.5,
            },
            button: {
                fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
                fontWeight: 500,
                textTransform: 'none',
            },
            caption: {
                fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
                fontSize: '0.75rem',
                lineHeight: 1.5,
            },
            overline: {
                fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
                fontSize: '0.75rem',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: 1,
            },
            subtitle1: {
                fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
                fontSize: '1rem',
                fontWeight: 500,
                lineHeight: 1.5,
            },
            subtitle2: {
                fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
                fontSize: '0.875rem',
                fontWeight: 500,
                lineHeight: 1.5,
            },
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 8,
                        textTransform: 'none',
                        fontWeight: 500,
                    },
                    containedPrimary: {
                        '&:hover': {
                            backgroundColor: mode === 'light'
                                ? darken(safePrimaryColor, 0.1) // Darken primary color in light mode
                                : lighten(darkModePrimaryColor, 0.1) // Lighten primary color in dark mode
                        }
                    },
                    outlinedPrimary: {
                        '&:hover': {
                            backgroundColor: mode === 'light'
                                ? alpha(safePrimaryColor, 0.08)
                                : alpha(darkModePrimaryColor, 0.12),
                            borderColor: mode === 'light' ? safePrimaryColor : darkModePrimaryColor
                        }
                    },
                    textPrimary: {
                        '&:hover': {
                            backgroundColor: mode === 'light'
                                ? alpha(safePrimaryColor, 0.08)
                                : alpha(darkModePrimaryColor, 0.12)
                        }
                    }
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        borderRadius: 8,
                        transition: 'box-shadow 0.3s ease, transform 0.2s ease',
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 12,
                        overflow: 'hidden',
                    },
                },
            },
            MuiCardContent: {
                styleOverrides: {
                    root: {
                        padding: 16,
                        '&:last-child': {
                            paddingBottom: 16,
                        },
                    },
                },
            },
            MuiIconButton: {
                styleOverrides: {
                    root: {
                        '&:hover': {
                            backgroundColor: mode === 'light'
                                ? alpha(safePrimaryColor, 0.08)
                                : alpha(darkModePrimaryColor, 0.12)
                        }
                    },
                    colorPrimary: {
                        '&:hover': {
                            backgroundColor: mode === 'light'
                                ? alpha(safePrimaryColor, 0.12)
                                : alpha(darkModePrimaryColor, 0.16)
                        }
                    }
                }
            },
            MuiCssBaseline: {
                styleOverrides: {
                    ':root': {
                        '--primary': mode === 'light' ? safePrimaryColor : darkModePrimaryColor,
                        '--primary-hover': mode === 'light'
                            ? darken(safePrimaryColor, 0.1).toString()
                            : lighten(darkModePrimaryColor, 0.1).toString(),
                    },
                    '@global': {
                        'code, pre, .code-font': {
                            fontFamily: 'var(--font-geist-mono), monospace',
                        },
                    },
                },
            },
        },
    });

    const themeContextValue = {
        toggleColorMode,
        mode,
        fontFamily,
        setFontFamily,
    };

    return (
        <ThemeContext.Provider value={themeContextValue}>
            <MUIThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </MUIThemeProvider>
        </ThemeContext.Provider>
    );
} 