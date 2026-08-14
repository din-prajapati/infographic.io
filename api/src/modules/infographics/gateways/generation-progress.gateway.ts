import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

interface ProgressPayload {
  generationId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  step?: number;
  stepLabel?: string;
  progress?: number;
  errorMessage?: string;
  timestamp: string;
}

/**
 * How long a terminal-state (completed/failed) progress payload stays
 * replayable after emission. A straggling client — connecting late, or
 * reconnecting right after the generation finished — still gets the real
 * outcome instead of nothing. Short enough not to leak memory across a
 * long-running process; long enough to cover realistic reconnect delay.
 */
const TERMINAL_STATE_TTL_MS = 30_000;

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:5000',
      'http://localhost:5001',
      process.env.CLIENT_URL
    ].filter(Boolean),
    credentials: true,
  },
  namespace: '/generations',
})
export class GenerationProgressGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GenerationProgressGateway.name);
  private readonly clientRooms = new Map<string, Set<string>>(); // userId -> Set of generationIds

  /**
   * BL-01 fix — last known progress per generation, so a client that
   * subscribes AFTER an emit already happened (the common case: the server
   * emits step:0 synchronously right after creating the DB record, before
   * the HTTP response carrying the generation id can possibly have reached
   * the client, let alone before a new socket.io connection has completed
   * its handshake) still gets caught up immediately on subscribe instead of
   * waiting for the next emit or getting nothing at all. Socket.io rooms do
   * not buffer or replay by themselves — a room with no members when
   * `.to(room).emit()` runs simply drops the event.
   */
  private readonly lastProgress = new Map<string, ProgressPayload>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Clean up rooms when client disconnects
    this.clientRooms.forEach((rooms, userId) => {
      rooms.forEach((generationId) => {
        client.leave(`generation:${generationId}`);
      });
    });
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, payload: { generationId: string; userId: string }) {
    const { generationId, userId } = payload;
    
    if (!generationId || !userId) {
      client.emit('error', { message: 'Missing generationId or userId' });
      return;
    }

    const room = `generation:${generationId}`;
    client.join(room);

    // Track client subscriptions
    if (!this.clientRooms.has(userId)) {
      this.clientRooms.set(userId, new Set());
    }
    this.clientRooms.get(userId)!.add(generationId);

    this.logger.log(`Client ${client.id} subscribed to generation ${generationId}`);
    client.emit('subscribed', { generationId });

    // BL-01: replay the current state directly to this client — do not wait
    // for the next emit, which may never come if the generation is already
    // done, and may arrive too late to feel responsive either way.
    const cached = this.lastProgress.get(generationId);
    if (cached) {
      client.emit('progress', cached);
      this.logger.debug(`Replayed cached progress to late subscriber ${client.id} for generation ${generationId}`);
    }
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, payload: { generationId: string; userId: string }) {
    const { generationId, userId } = payload;
    
    if (!generationId || !userId) {
      return;
    }

    const room = `generation:${generationId}`;
    client.leave(room);
    
    // Remove from tracking
    const rooms = this.clientRooms.get(userId);
    if (rooms) {
      rooms.delete(generationId);
      if (rooms.size === 0) {
        this.clientRooms.delete(userId);
      }
    }

    this.logger.log(`Client ${client.id} unsubscribed from generation ${generationId}`);
  }

  /**
   * Emit progress update to all clients subscribed to a generation
   */
  emitProgress(generationId: string, progress: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    step?: number;
    stepLabel?: string;
    progress?: number;
    errorMessage?: string;
  }) {
    const STEP_TO_PERCENT: Record<number, number> = {
      0: 8,
      1: 25,
      2: 50,
      3: 72,
      4: 88,
      5: 100,
    };
    const resolvedProgress =
      progress.progress ??
      (progress.step !== undefined ? STEP_TO_PERCENT[progress.step] : undefined);

    const payload: ProgressPayload = {
      generationId,
      ...progress,
      progress: resolvedProgress,
      timestamp: new Date().toISOString(),
    };

    // BL-01: cache before broadcasting, so a client that races the broadcast
    // (subscribes a moment too late to receive it live) can still be caught
    // up on 'subscribe'. Terminal states get pruned after a short TTL rather
    // than kept forever — see TERMINAL_STATE_TTL_MS.
    this.lastProgress.set(generationId, payload);
    if (progress.status === 'completed' || progress.status === 'failed') {
      setTimeout(() => {
        // Only prune if nothing newer has overwritten this entry in the
        // meantime (defensive — terminal states shouldn't be followed by
        // more emits, but don't race a legitimate later update either way).
        if (this.lastProgress.get(generationId) === payload) {
          this.lastProgress.delete(generationId);
        }
      }, TERMINAL_STATE_TTL_MS).unref?.();
    }

    const room = `generation:${generationId}`;
    this.server.to(room).emit('progress', payload);
    this.logger.debug(`Emitted progress for generation ${generationId}: ${progress.status} - Step ${progress.step || 'N/A'}`);
  }
}
