'use client';

import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import { CssBaseline, IconButton } from '@mui/material';
import { useEffect, useState, createContext, useContext } from 'react';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

// Create a context for theme toggling
interface ThemeContextType {
    toggleColorMode: () => void;
    mode: 'light' | 'dark';
}

export const ThemeContext = createContext<ThemeContextType>({
    toggleColorMode: () => { },
    mode: 'light',
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

    useEffect(() => {
        // Check system preference and saved preference
        const savedMode = localStorage.getItem('theme-mode');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        setMode(savedMode === 'dark' || (!savedMode && prefersDark) ? 'dark' : 'light');
    }, []);

    const toggleColorMode = () => {
        setMode((prevMode) => {
            const newMode = prevMode === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme-mode', newMode);
            return newMode;
        });
    };

    const theme = createTheme({
        palette: {
            mode,
            primary: {
                main: mode === 'light' ? '#1976d2' : '#90caf9',
            },
            secondary: {
                main: mode === 'light' ? '#f50057' : '#f48fb1',
            },
            background: {
                default: mode === 'light' ? '#f5f5f5' : '#121212',
                paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
            },
        },
        typography: {
            fontFamily: 'var(--font-geist-sans), sans-serif',
            h1: {
                fontSize: '2rem',
                fontWeight: 600,
            },
            h6: {
                fontWeight: 600,
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
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        borderRadius: 8,
                    },
                },
            },
        },
    });

    const themeContextValue = {
        toggleColorMode,
        mode,
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