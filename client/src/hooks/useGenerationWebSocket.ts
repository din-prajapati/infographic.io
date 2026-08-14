import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../lib/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const WS_URL = API_URL.replace(/^http/, 'ws');

/** localStorage key set by mock-backed E2E (addInitScript) to skip socket.io. */
export const E2E_GENERATION_POLL_ONLY_KEY = 'e2e-generation-poll-only';

function isGenerationPollOnlyMode(): boolean {
  if (import.meta.env.VITE_E2E_GENERATION_POLL_ONLY === 'true') {
    return true;
  }
  if (typeof window !== 'undefined') {
    try {
      return window.localStorage.getItem(E2E_GENERATION_POLL_ONLY_KEY) === '1';
    } catch {
      return false;
    }
  }
  return false;
}

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

/**
 * BL-01 fix — this hook used to tear down and recreate the ENTIRE socket.io
 * connection every time `generationId` changed (it was a dependency of the
 * effect that owned the socket's lifecycle). Since `generationId` is set to
 * `null` from three separate completion-handling code paths in the callers
 * (AIChatBox/RightSidebar), a single generation finishing could trigger
 * several back-to-back disconnect+reconnect cycles — the "~4 rapid
 * connect/disconnect cycles at completion" this bug's report described.
 * Each reconnect also re-pays the full transport handshake (worse on
 * Railway's proxy than on localhost), during which any progress emitted by
 * the server has nowhere to land — compounding the server-side race that
 * generation-progress.gateway.ts's replay-on-subscribe fix addresses from
 * the other end.
 *
 * The fix: the socket connection's lifecycle now depends only on the user
 * (connect once when logged in, disconnect on unmount/logout). Changing
 * `generationId` sends 'unsubscribe'/'subscribe' messages over the SAME
 * already-open socket — no reconnect. socket.io-client buffers emits made
 * before the transport finishes connecting and flushes them automatically
 * on connect, so subscribing before the initial handshake completes is safe.
 */
export function useGenerationWebSocket({
  generationId,
  onProgress,
  onError,
}: UseGenerationWebSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const subscribedGenerationIdRef = useRef<string | null>(null);
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);

  // Store callbacks/generationId in refs so the socket-lifecycle effect
  // below doesn't need them as dependencies.
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const generationIdRef = useRef(generationId);
  generationIdRef.current = generationId;

  const userId = user?.id;

  const subscribe = useCallback((id: string) => {
    const socket = socketRef.current;
    if (!socket || !userId) return;
    socket.emit('subscribe', { generationId: id, userId });
    subscribedGenerationIdRef.current = id;
  }, [userId]);

  const unsubscribe = useCallback((id: string) => {
    const socket = socketRef.current;
    if (!socket || !userId) return;
    socket.emit('unsubscribe', { generationId: id, userId });
    if (subscribedGenerationIdRef.current === id) {
      subscribedGenerationIdRef.current = null;
    }
  }, [userId]);

  // ── Socket lifecycle: connect once per user session, not per generation ──
  useEffect(() => {
    if (!userId || isGenerationPollOnlyMode()) {
      return;
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
      setConnected(true);
      // Re-subscribe on (re)connect — covers both the first connection and
      // any reconnect after a drop, so a mid-generation network blip doesn't
      // leave the client silently unsubscribed.
      const currentId = generationIdRef.current;
      if (currentId) subscribe(currentId);
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
      setConnected(false);
    });

    socket.on('connect_error', (error: Error) => {
      console.error('❌ [WebSocket] Connection error:', error);
      onErrorRef.current?.(error);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      subscribedGenerationIdRef.current = null;
      setConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- subscribe is stable per userId, intentionally excluded to avoid recreating the socket
  }, [userId]);

  // ── Subscription lifecycle: follows generationId over the existing socket ──
  useEffect(() => {
    if (isGenerationPollOnlyMode()) {
      if (generationId) {
        onErrorRef.current?.(
          new Error('E2E poll-only mode: skipping WebSocket, using REST status polling'),
        );
      }
      return;
    }

    const previous = subscribedGenerationIdRef.current;
    if (previous && previous !== generationId) {
      unsubscribe(previous);
    }
    if (generationId && generationId !== previous) {
      subscribe(generationId);
    }
  }, [generationId, subscribe, unsubscribe]);

  const disconnect = useCallback(() => {
    const id = subscribedGenerationIdRef.current;
    if (id) unsubscribe(id);
    socketRef.current?.disconnect();
    socketRef.current = null;
  }, [unsubscribe]);

  return {
    connected,
    disconnect,
  };
}
