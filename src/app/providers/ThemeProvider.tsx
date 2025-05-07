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
    const [theme, setTheme] = useState(createTheme());

    useEffect(() => {
        // Check system preference and saved preference
        const savedMode = localStorage.getItem('theme-mode');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedPrimaryColor = localStorage.getItem('dashboardPrimaryColor');
        const savedFontFamily = localStorage.getItem('dashboardFontFamily');

        setMode(savedMode === 'dark' || (!savedMode && prefersDark) ? 'dark' : 'light');

        // Use saved primary color if available
        if (savedPrimaryColor) {
            setPrimaryColor(savedPrimaryColor);
        }

        // Use saved font family if available
        if (savedFontFamily) {
            setFontFamily(savedFontFamily);
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

    // Add this function to handle font family changes
    const handleSetFontFamily = (font: string) => {
        setFontFamily(font);
        localStorage.setItem('dashboardFontFamily', font);

        // Force a re-render of the theme by creating a new theme object
        const newTheme = createTheme({
            ...theme,
            typography: {
                ...theme.typography,
                fontFamily: font,
                h1: { ...theme.typography.h1, fontFamily: font },
                h2: { ...theme.typography.h2, fontFamily: font },
                h3: { ...theme.typography.h3, fontFamily: font },
                h4: { ...theme.typography.h4, fontFamily: font },
                h5: { ...theme.typography.h5, fontFamily: font },
                h6: { ...theme.typography.h6, fontFamily: font },
                body1: { ...theme.typography.body1, fontFamily: font },
                body2: { ...theme.typography.body2, fontFamily: font },
                button: { ...theme.typography.button, fontFamily: font },
                caption: { ...theme.typography.caption, fontFamily: font },
            }
        });

        // Apply the new theme
        setTheme(newTheme);
    };

    const themeContextValue = {
        toggleColorMode,
        mode,
        fontFamily,
        setFontFamily: handleSetFontFamily,
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