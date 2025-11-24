/**
 * Custom hook for WebSocket connection management
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface WebSocketMessage {
    type: string;
    entity?: string;
    action?: string;
    data?: any;
}

export interface UseWebSocketOptions {
    url: string;
    onMessage?: (message: WebSocketMessage) => void;
    onOpen?: () => void;
    onClose?: () => void;
    onError?: (error: Event) => void;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
}

export function useWebSocket(options: UseWebSocketOptions) {
    const {
        url,
        onMessage,
        onOpen,
        onClose,
        onError,
        reconnectInterval = 3000,
        maxReconnectAttempts = 10,
    } = options;

    const [status, setStatus] = useState<WebSocketStatus>('disconnected');
    const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

    const connect = useCallback(() => {
        // Get token from localStorage using correct key 'auth-token'
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;

        if (!token) {
            console.log('No auth token, skipping WebSocket connection');
            return;
        }

        try {
            setStatus('connecting');

            // Create WebSocket connection with auth token in URL
            const wsUrl = `${url}?token=${token}`;
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log('WebSocket connected');
                setStatus('connected');
                reconnectAttemptsRef.current = 0;
                onOpen?.();
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data) as WebSocketMessage;
                    setLastMessage(message);
                    onMessage?.(message);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            ws.onclose = () => {
                console.log('WebSocket disconnected');
                setStatus('disconnected');
                onClose?.();

                // Attempt to reconnect
                if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                    reconnectAttemptsRef.current += 1;
                    console.log(
                        `Reconnecting... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
                    );

                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect();
                    }, reconnectInterval);
                } else {
                    console.error('Max reconnection attempts reached');
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                setStatus('error');
                onError?.(error);
            };

            wsRef.current = ws;
        } catch (error) {
            console.error('Error creating WebSocket connection:', error);
            setStatus('error');
        }
    }, [url, onMessage, onOpen, onClose, onError, reconnectInterval, maxReconnectAttempts]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        setStatus('disconnected');
    }, []);

    const sendMessage = useCallback((message: any) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket is not connected');
        }
    }, []);

    // Connect on mount, disconnect on unmount
    useEffect(() => {
        connect();

        return () => {
            disconnect();
        };
    }, []); // Empty dependency array - connect handles token internally

    // Ping interval to keep connection alive
    useEffect(() => {
        if (status === 'connected') {
            const pingInterval = setInterval(() => {
                sendMessage({ type: 'ping' });
            }, 30000); // Ping every 30 seconds

            return () => clearInterval(pingInterval);
        }
    }, [status, sendMessage]);

    return {
        status,
        lastMessage,
        sendMessage,
        disconnect,
        reconnect: connect,
    };
}
