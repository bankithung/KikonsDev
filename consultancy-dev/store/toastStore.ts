import { create } from 'zustand';

export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    title?: string;
    description?: string;
    type?: ToastType;
    duration?: number;
}

interface ToastState {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    dismissToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
    toasts: [],
    addToast: (toast) => {
        const id = Math.random().toString(36).substring(7);
        const newToast = { ...toast, id };

        set((state) => ({ toasts: [...state.toasts, newToast] }));

        if (toast.duration !== Infinity) {
            setTimeout(() => {
                set((state) => ({
                    toasts: state.toasts.filter((t) => t.id !== id),
                }));
            }, toast.duration || 5000);
        }
    },
    dismissToast: (id) =>
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        })),
}));

export const toast = (props: Omit<Toast, 'id'> | string) => {
    if (typeof props === 'string') {
        useToastStore.getState().addToast({ title: props });
    } else {
        useToastStore.getState().addToast(props);
    }
};

toast.success = (title: string, description?: string) =>
    useToastStore.getState().addToast({ title, description, type: 'success' });

toast.error = (title: string, description?: string) =>
    useToastStore.getState().addToast({ title, description, type: 'error' });

toast.warning = (title: string, description?: string) =>
    useToastStore.getState().addToast({ title, description, type: 'warning' });

toast.info = (title: string, description?: string) =>
    useToastStore.getState().addToast({ title, description, type: 'info' });
