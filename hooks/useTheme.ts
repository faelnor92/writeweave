import { useState, useEffect, useCallback } from 'react';
import type { Theme, AmbianceSettings } from '../types.ts';

export const useTheme = (ambianceSettings: AmbianceSettings) => {
    const { theme: ambianceTheme, autoTheme } = ambianceSettings;

    const [manualTheme, setManualTheme] = useState<'light' | 'dark'>(() => {
        try {
            const stored = localStorage.getItem('writeweave-manual-theme');
            if (stored === 'light' || stored === 'dark') return stored;
        } catch (e) { /* ignore */ }
        return 'dark'; // default manual theme
    });

    const getSystemTheme = useCallback((): 'light' | 'dark' => {
        if (typeof window === 'undefined') return 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }, []);

    const [systemTheme, setSystemTheme] = useState(getSystemTheme);
    
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => setSystemTheme(getSystemTheme());
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [getSystemTheme]);

    const getTimeBasedTheme = useCallback((): 'light' | 'dark' => {
        const hour = new Date().getHours();
        return (hour > 6 && hour < 20) ? 'light' : 'dark';
    }, []);

    const effectiveTheme = autoTheme ? getTimeBasedTheme() : manualTheme;
    
    // Apply theme classes to document
    useEffect(() => {
        const root = document.documentElement;
        
        // Clear previous theme classes
        root.classList.remove('light', 'dark');
        Array.from(root.classList).forEach(className => {
            if (className.startsWith('theme-')) {
                root.classList.remove(className);
            }
        });

        // Add new classes
        root.classList.add(effectiveTheme);
        if (ambianceTheme !== 'default') {
            root.classList.add(`theme-${ambianceTheme}`);
        }

    }, [effectiveTheme, ambianceTheme]);

    const toggleTheme = useCallback(() => {
        const newTheme = effectiveTheme === 'light' ? 'dark' : 'light';
        setManualTheme(newTheme);
        try {
            localStorage.setItem('writeweave-manual-theme', newTheme);
        } catch (e) { console.warn("Could not save manual theme choice."); }
    }, [effectiveTheme]);

    return {
        theme: effectiveTheme,
        toggleTheme,
        effectiveTheme
    };
};