'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';

interface UseOnlineUsersReturn {
    onlineCount: number;
    isConnected: boolean;
}

export function useOnlineUsers(): UseOnlineUsersReturn {
    const [onlineCount, setOnlineCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const { isAuthenticated } = useAuthStore();

    // Get token from storage
    const getToken = useCallback(() => {
        if (typeof window === 'undefined') return null;
        try {
            const authStorage = localStorage.getItem('auth-storage');
            if (authStorage) {
                const parsed = JSON.parse(authStorage);
                return parsed?.state?.token || null;
            }
        } catch {
            return null;
        }
        return null;
    }, []);

    const connect = useCallback(() => {
        const token = getToken();
        if (!token || !isAuthenticated) return;

        // Determine WebSocket URL
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsHost = process.env.NEXT_PUBLIC_WS_URL || `${wsProtocol}//${window.location.hostname}:8000`;
        const wsUrl = `${wsHost}/ws/updates/?token=${token}`;

        try {
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                setIsConnected(true);
                // Request initial online count
                ws.send(JSON.stringify({ type: 'get_online_count' }));
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'online_count') {
                        setOnlineCount(data.count);
                    }
                } catch (e) {
                    console.error('Failed to parse WebSocket message:', e);
                }
            };

            ws.onclose = () => {
                setIsConnected(false);
                // Attempt reconnection after 5 seconds
                reconnectTimeoutRef.current = setTimeout(() => {
                    connect();
                }, 5000);
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        } catch (error) {
            console.error('Failed to connect WebSocket:', error);
        }
    }, [getToken, isAuthenticated]);

    useEffect(() => {
        connect();

        // Keep-alive ping every 30 seconds
        const pingInterval = setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000);

        return () => {
            clearInterval(pingInterval);
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [connect]);

    return { onlineCount, isConnected };
}
