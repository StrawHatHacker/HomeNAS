// src/lib/stores/toastStore.ts
import { writable } from 'svelte/store';

export type ToastData = {
    id: number;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
}

const initialToasts: ToastData[] = [];

// The writable store
const toasts = writable(initialToasts);

// A simple counter for unique IDs
let idCounter = 0;

/**
 * Adds a new toast notification.
 * @param message The message to display.
 * @param type The type of toast (success, error, etc.).
 * @param duration How long the toast should display (in ms). Default is 5000.
 */
function addToast(type: ToastData['type'], message: string, duration: number = 5000) {
    const id = idCounter++;
    const newToast: ToastData = { id, message, type };

    toasts.update(currentToasts => {
        // Add the new toast to the top of the stack
        return [...currentToasts, newToast];
    });

    // Automatically dismiss the toast after the duration
    if (duration > 0) {
        setTimeout(() => {
            dismissToast(id);
        }, duration);
    }
}

/**
 * Removes a toast notification by its ID.
 * @param id The unique ID of the toast to dismiss.
 */
function dismissToast(id: number) {
    toasts.update(currentToasts => {
        return currentToasts.filter(toast => toast.id !== id);
    });
}

export { toasts, addToast, dismissToast };