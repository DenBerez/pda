import { useState, useEffect, useRef } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [
    T,
    (value: T | ((prev: T) => T)) => void,
    boolean // Added loading state
] {
    // State to store our value
    const [storedValue, setStoredValue] = useState<T>(initialValue);
    const [isLoading, setIsLoading] = useState(true);
    const initialized = useRef(false);

    // Initialize the state
    useEffect(() => {
        if (typeof window === 'undefined' || initialized.current) {
            return;
        }

        setIsLoading(true);
        try {
            // Get from local storage by key
            const item = window.localStorage.getItem(key);
            // Parse stored json or if none return initialValue
            const parsedValue = item ? JSON.parse(item) : initialValue;
            setStoredValue(parsedValue);
        } catch (error) {
            // If error also return initialValue
            console.error(`Error reading localStorage key "${key}":`, error);
            setStoredValue(initialValue);
        } finally {
            setIsLoading(false);
            initialized.current = true;
        }
    }, [key, initialValue]);

    // Return a wrapped version of useState's setter function that
    // persists the new value to localStorage.
    const setValue = (value: T | ((prev: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    };

    return [storedValue, setValue, isLoading];
} 