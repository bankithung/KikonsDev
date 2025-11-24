import { toast as toastAction, useToastStore } from '@/store/toastStore';

// Re-export for backward compatibility and ease of use
export const useToast = () => {
    const { addToast, dismissToast } = useToastStore();
    return {
        toast: toastAction,
        dismiss: dismissToast,
    };
};

export { toastAction as toast };
