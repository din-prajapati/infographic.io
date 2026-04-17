import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../lib/auth';

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

  // Store callbacks in refs to avoid reconnection on every render
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const connect = useCallback(() => {
    if (!generationId || !user?.id) {
      return;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io(`${WS_URL}/generations`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 [WebSocket] Connected to generation progress server');
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
      onProgressRef.current?.(progress);
    });

    socket.on('error', (error: { message: string }) => {
      console.error('❌ [WebSocket] Error:', error);
      onErrorRef.current?.(new Error(error.message));
    });

    socket.on('disconnect', () => {
      console.log('🔌 [WebSocket] Disconnected from generation progress server');
    });

    socket.on('connect_error', (error: Error) => {
      console.error('❌ [WebSocket] Connection error:', error);
      onErrorRef.current?.(error);
    });
  }, [generationId, user?.id]);

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
