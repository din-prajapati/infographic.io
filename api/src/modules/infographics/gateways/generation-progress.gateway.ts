import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

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
    const room = `generation:${generationId}`;
    this.server.to(room).emit('progress', {
      generationId,
      ...progress,
      timestamp: new Date().toISOString(),
    });
    this.logger.debug(`Emitted progress for generation ${generationId}: ${progress.status} - Step ${progress.step || 'N/A'}`);
  }
}
