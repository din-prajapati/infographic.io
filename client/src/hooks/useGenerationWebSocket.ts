import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../lib/auth';

// Use environment variable for API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const WS_URL = API_URL.replace(/^http/, 'ws');

export interface GenerationProgress {
  generationId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  step?: number;
  stepLabel?: string;
  progress?: number;
  errorMessage?: string;
  timestamp: string;
}

export interface UseGenerationWebSocketOptions {
  generationId: string | null;
  onProgress?: (progress: GenerationProgress) => void;
  onError?: (error: Error) => void;
}

export function useGenerationWebSocket({
  generationId,
  onProgress,
  onError,
}: UseGenerationWebSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAuth();

  const connect = useCallback(() => {
    if (!generationId || !user?.id) {
      return;
    }

    // Disconnect existing socket if any
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // Connect to WebSocket namespace
    const socket = io(`${WS_URL}/generations`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 [WebSocket] Connected to generation progress server');
      
      // Subscribe to generation updates
      socket.emit('subscribe', {
        generationId,
        userId: user.id,
      });
    });

    socket.on('subscribed', (data: { generationId: string }) => {
      console.log(`✅ [WebSocket] Subscribed to generation ${data.generationId}`);
    });

    socket.on('progress', (progress: GenerationProgress) => {
      console.log('📊 [WebSocket] Progress update:', progress);
      onProgress?.(progress);
    });

    socket.on('error', (error: { message: string }) => {
      console.error('❌ [WebSocket] Error:', error);
      onError?.(new Error(error.message));
    });

    socket.on('disconnect', () => {
      console.log('🔌 [WebSocket] Disconnected from generation progress server');
    });

    socket.on('connect_error', (error: Error) => {
      console.error('❌ [WebSocket] Connection error:', error);
      onError?.(error);
    });
  }, [generationId, user?.id, onProgress, onError]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      if (generationId && user?.id) {
        socketRef.current.emit('unsubscribe', {
          generationId,
          userId: user.id,
        });
      }
      socketRef.current.disconnect();
      socketRef.current = null;
      console.log('🔌 [WebSocket] Disconnected');
    }
  }, [generationId, user?.id]);

  useEffect(() => {
    if (generationId && user?.id) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [generationId, user?.id, connect, disconnect]);

  return {
    connected: socketRef.current?.connected || false,
    disconnect,
  };
}
