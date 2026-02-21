import * as SecureStore from 'expo-secure-store';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { ColorSchemeName, Platform, useColorScheme as useRNColorScheme } from 'react-native';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'light',
    toggleTheme: () => { },
    setTheme: () => { },
});

const THEME_KEY = 'habify_theme';

export function ThemeProvider({ children }: { children: ReactNode }): React.ReactElement | null {
    const systemTheme = useRNColorScheme();
    const [theme, setThemeState] = useState<Theme>('light');
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const loadTheme = async () => {
            try {
                let storedTheme: string | null = null;
                if (Platform.OS === 'web') {
                    storedTheme = typeof window !== 'undefined' ? localStorage.getItem(THEME_KEY) : null;
                } else {
                    storedTheme = await SecureStore.getItemAsync(THEME_KEY);
                }

                if (storedTheme === 'dark' || storedTheme === 'light') {
                    setThemeState(storedTheme);
                } else if (systemTheme) {
                    setThemeState(systemTheme as Theme);
                }
            } catch (e) {
                console.error("Failed to load theme", e);
            } finally {
                setIsReady(true);
            }
        };
        loadTheme();
    }, []);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        if (Platform.OS === 'web') {
            localStorage.setItem(THEME_KEY, newTheme);
        } else {
            SecureStore.setItemAsync(THEME_KEY, newTheme);
        }
    };

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    if (!isReady) {
        return null;
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

// Hook to get the current scheme (overrides RN one)
export function useColorScheme(): ColorSchemeName {
    const ctx = useContext(ThemeContext);
    return ctx?.theme ?? 'light';
}

// Hook to control theme
export function useThemeControl(): ThemeContextType {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error("useThemeControl must be used within ThemeProvider");
    }
    return ctx;
}
