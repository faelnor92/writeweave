
import { useState, useEffect, useRef } from 'react';

/**
 * Hook useDebounce pour retarder la mise à jour d'une valeur
 * Utile pour éviter trop d'appels API ou de calculs coûteux
 */
export const useDebounce = <T>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        // Annuler le timeout précédent s'il existe
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Créer un nouveau timeout
        timeoutRef.current = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Cleanup function
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [value, delay]);

    // Cleanup au démontage du composant
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return debouncedValue;
};

/**
 * Hook useDebouncedCallback pour débouncer une fonction
 * Utile pour les gestionnaires d'événements
 */
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
    callback: T,
    delay: number
): [T, () => void] => {
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const callbackRef = useRef<T>(callback);

    // Garder la référence à jour
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    const debouncedCallback = useRef((...args: Parameters<T>) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            callbackRef.current(...args);
        }, delay);
    }) as React.MutableRefObject<T>;

    const cancel = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };

    // Cleanup au démontage
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return [debouncedCallback.current, cancel];
};
