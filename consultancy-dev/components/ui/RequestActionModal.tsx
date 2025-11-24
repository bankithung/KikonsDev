'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FileEdit, Trash2, Send } from 'lucide-react';

interface RequestActionModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (message: string) => void;
    action: 'DELETE' | 'UPDATE';
    entityType: string;
    entityName: string;
    isLoading?: boolean;
}

export function RequestActionModal({
    open,
    onClose,
    onSubmit,
    action,
    entityType,
    entityName,
    isLoading = false,
}: RequestActionModalProps) {
    const [message, setMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim()) {
            onSubmit(message);
            setMessage('');
        }
    };

    const handleClose = () => {
        setMessage('');
        onClose();
    };

    return (
        <Transition appear show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
                            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${action === 'DELETE' ? 'bg-red-100' : 'bg-blue-100'
                                        }`}>
                                        {action === 'DELETE' ? (
                                            <Trash2 className="w-6 h-6 text-red-600" />
                                        ) : (
                                            <FileEdit className="w-6 h-6 text-blue-600" />
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <Dialog.Title
                                            as="h3"
                                            className="text-lg font-medium leading-6 text-gray-900"
                                        >
                                            Request {action === 'DELETE' ? 'Delete' : 'Update'} Approval
                                        </Dialog.Title>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {entityType}: <span className="font-medium text-gray-700">{entityName}</span>
                                        </p>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit}>
                                    <div className="mb-4">
                                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                                            Reason for {action === 'DELETE' ? 'deletion' : 'update'} <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            id="message"
                                            rows={4}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                                            placeholder={`Please explain why you need to ${action === 'DELETE' ? 'delete' : 'update'} this ${entityType.toLowerCase()}...`}
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            required
                                            disabled={isLoading}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Your request will be sent to the admin for review.
                                        </p>
                                    </div>

                                    <div className="flex gap-3 justify-end">
                                        <button
                                            type="button"
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500"
                                            onClick={handleClose}
                                            disabled={isLoading}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            disabled={isLoading || !message.trim()}
                                        >
                                            <Send className="w-4 h-4" />
                                            {isLoading ? 'Sending...' : 'Send Request'}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
