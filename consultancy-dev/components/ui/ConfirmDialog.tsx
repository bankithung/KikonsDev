'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { AlertTriangle, Trash2, CheckCircle, Info } from 'lucide-react';

interface ConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    confirmVariant?: 'default' | 'destructive' | 'success' | 'info';
    isLoading?: boolean;
    icon?: React.ReactNode;
}

export function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm',
    confirmVariant = 'default',
    isLoading = false,
    icon,
}: ConfirmDialogProps) {
    const getIconColors = () => {
        switch (confirmVariant) {
            case 'destructive': return 'bg-red-100 text-red-600';
            case 'success': return 'bg-green-100 text-green-600';
            case 'info': return 'bg-blue-100 text-blue-600';
            default: return 'bg-yellow-100 text-yellow-600';
        }
    };

    const getButtonColors = () => {
        switch (confirmVariant) {
            case 'destructive': return 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500';
            case 'success': return 'bg-green-600 hover:bg-green-700 focus-visible:ring-green-500';
            case 'info': return 'bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500';
            default: return 'bg-teal-600 hover:bg-teal-700 focus-visible:ring-teal-500';
        }
    };

    const renderIcon = () => {
        if (icon) return <div className={getIconColors().split(' ')[1]}>{icon}</div>;

        const className = `w-6 h-6 ${getIconColors().split(' ')[1]}`;
        switch (confirmVariant) {
            case 'destructive': return <Trash2 className={className} />;
            case 'success': return <CheckCircle className={className} />;
            case 'info': return <Info className={className} />;
            default: return <AlertTriangle className={className} />;
        }
    };

    return (
        <Transition appear show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex items-start gap-4">
                                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${getIconColors().split(' ')[0]}`}>
                                        {renderIcon()}
                                    </div>

                                    <div className="flex-1">
                                        <Dialog.Title
                                            as="h3"
                                            className="text-lg font-medium leading-6 text-gray-900"
                                        >
                                            {title}
                                        </Dialog.Title>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                {description}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex gap-3 justify-end">
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500"
                                        onClick={onClose}
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${getButtonColors()} disabled:opacity-50 disabled:cursor-not-allowed`}
                                        onClick={onConfirm}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Processing...' : confirmText}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
