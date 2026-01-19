/**
 * WebSocket Provider for real-time updates
 * Connects to Django Channels backend and invalidates React Query cache on events
 */
'use client';

import React, { createContext, useContext } from 'react';
import { useWebSocket, WebSocketMessage } from '@/hooks/useWebSocket';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';

interface WebSocketContextType {
    status: string;
    lastMessage: WebSocketMessage | null;
}

const WebSocketContext = createContext<WebSocketContextType>({
    status: 'disconnected',
    lastMessage: null,
});

export const useWebSocketContext = () => useContext(WebSocketContext);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuthStore();
    const queryClient = useQueryClient();

    // Use localhost to match Daphne server address
    const wsUrl = 'ws://localhost:8000/ws/updates/';

    const { status, lastMessage } = useWebSocket({
        url: isAuthenticated ? wsUrl : '',
        onMessage: (message) => {
            handleRealtimeUpdate(message);
        },
        onOpen: () => {
            console.log('✅ Real-time updates connected');
        },
        onClose: () => {
            console.log('❌ Real-time updates disconnected');
        },
        onError: (error) => {
            console.error('WebSocket error:', error);
        },
    });

    const handleRealtimeUpdate = (message: WebSocketMessage) => {
        if (message.type !== 'update') return;

        const { entity, action, data } = message;

        console.log(`📢 Real-time update: ${entity} ${action}`, data);

        // Invalidate relevant React Query caches based on entity type
        switch (entity) {
            case 'enquiry':
                queryClient.invalidateQueries({ queryKey: ['enquiries'] });
                queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
                queryClient.invalidateQueries({ queryKey: ['dashboard-recent-enquiries'] });
                queryClient.invalidateQueries({ queryKey: ['dashboard-weekly'] });
                break;

            case 'registration':
                queryClient.invalidateQueries({ queryKey: ['registrations'] });
                queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
                queryClient.invalidateQueries({ queryKey: ['dashboard-weekly'] });
                break;

            case 'enrollment':
                queryClient.invalidateQueries({ queryKey: ['enrollments'] });
                queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
                queryClient.invalidateQueries({ queryKey: ['dashboard-weekly'] });
                break;

            case 'payment':
                queryClient.invalidateQueries({ queryKey: ['payments'] });
                queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
                queryClient.invalidateQueries({ queryKey: ['dashboard-pending-payments'] });
                queryClient.invalidateQueries({ queryKey: ['dashboard-revenue'] });
                break;

            case 'document':
                queryClient.invalidateQueries({ queryKey: ['documents'] });
                queryClient.invalidateQueries({ queryKey: ['dashboard-doc-transfers'] });
                break;

            case 'task':
                queryClient.invalidateQueries({ queryKey: ['tasks'] });
                queryClient.invalidateQueries({ queryKey: ['dashboard-upcoming-tasks'] });
                break;

            case 'followup':
                queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
                queryClient.invalidateQueries({ queryKey: ['dashboard-follow-ups'] });
                queryClient.invalidateQueries({ queryKey: ['dashboard-upcoming-tasks'] });
                break;

            case 'notification':
                queryClient.invalidateQueries({ queryKey: ['notifications'] });
                break;

            case 'user':
                queryClient.invalidateQueries({ queryKey: ['users'] });
                break;

            // NEW: Chat
            case 'chat_conversation':
            case 'chat_message':
            case 'group_chat':
                queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
                queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
                queryClient.invalidateQueries({ queryKey: ['group-chats'] });
                break;

            // NEW: Physical Transfers
            case 'physical_transfer':
            case 'transfer_timeline':
                queryClient.invalidateQueries({ queryKey: ['physical-doc-transfers'] });
                queryClient.invalidateQueries({ queryKey: ['dashboard-doc-transfers'] });
                queryClient.invalidateQueries({ queryKey: ['student-documents-all'] }); // Update main document list (e.g. holder info)
                break;

            // NEW: Digital Transfers
            case 'digital_transfer':
                queryClient.invalidateQueries({ queryKey: ['document-transfers'] });
                break;

            // NEW: Remarks
            case 'student_remark':
                queryClient.invalidateQueries({ queryKey: ['student-remarks'] });
                break;

            // NEW: Appointments
            case 'appointment':
                queryClient.invalidateQueries({ queryKey: ['appointments'] });
                queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
                break;

            // NEW: Earnings
            case 'earning':
                queryClient.invalidateQueries({ queryKey: ['earnings'] });
                queryClient.invalidateQueries({ queryKey: ['dashboard-revenue'] });
                break;

            // NEW: Approvals & Signups
            case 'approval_request':
            case 'signup_request':
                queryClient.invalidateQueries({ queryKey: ['approvals'] });
                queryClient.invalidateQueries({ queryKey: ['signup-requests'] });
                break;

            // NEW: Company settings
            case 'company':
                queryClient.invalidateQueries({ queryKey: ['companies'] });
                break;

            // NEW: Templates
            case 'template':
                queryClient.invalidateQueries({ queryKey: ['templates'] });
                break;

            default:
                console.warn(`Unknown entity type: ${entity}`);
        }
    };

    return (
        <WebSocketContext.Provider value={{ status, lastMessage }}>
            {children}
        </WebSocketContext.Provider>
    );
}
