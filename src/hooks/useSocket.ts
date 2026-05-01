'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3688';
const SOCKET_PATH = process.env.NEXT_PUBLIC_SOCKET_PATH || '/api/socket.io';

export const useSocket = (adminId: string | undefined, type: 'admin' = 'admin') => {
  const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
  const adminIdRef = useRef<string | undefined>(adminId);

  useEffect(() => {
    adminIdRef.current = adminId;
  }, [adminId]);

  useEffect(() => {
    if (!adminId) {
      console.log('Socket not initialized: No admin ID provided');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    if (socketRef.current && adminIdRef.current === adminId) {
      return;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    console.log(`Connecting to Socket server: ${SOCKET_URL} for admin ${adminId}`);
    
    socketRef.current = io(SOCKET_URL, {
      path: SOCKET_PATH,
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
      withCredentials: true,
    });

    socketRef.current.on('connect', () => {
      console.log('Admin Socket connected:', socketRef.current?.id);
      setIsConnected(true);
      socketRef.current?.emit('join', { id: adminId, type });
    });

    socketRef.current.on('connect_error', (error: any) => {
      console.error('Admin Socket connection error:', error.message || error);
      setIsConnected(false);
    });

    socketRef.current.on('disconnect', (reason: string) => {
      console.log('Admin Socket disconnected. Reason:', reason);
    });

    socketRef.current.on('error', (error: any) => {
      console.error('Admin Socket error:', error);
      setIsConnected(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [adminId, type]);

  const on = (event: string, callback: (...args: any[]) => void) => {
    socketRef.current?.on(event, callback);
  };

  const off = (event: string, callback?: (...args: any[]) => void) => {
    socketRef.current?.off(event, callback);
  };

  const emit = (event: string, data: any) => {
    socketRef.current?.emit(event, data);
  };

  return { socket: socketRef.current, on, off, emit };
};

export default useSocket;
