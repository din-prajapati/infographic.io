/**
 * BL-01 — a client that subscribes AFTER a progress event was already
 * broadcast (the common case: the server emits step:0 synchronously right
 * after creating the DB record, before the HTTP response carrying the
 * generation id can possibly have reached the client) used to get nothing
 * until the NEXT emit — or nothing at all, if the generation finished before
 * the client's socket.io handshake completed. Socket.io rooms do not buffer;
 * `.to(room).emit()` on a room with no members simply drops the event.
 *
 * Fix: the gateway caches the last progress payload per generationId and
 * replays it directly to any client that subscribes, regardless of when.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GenerationProgressGateway } from '../../src/modules/infographics/gateways/generation-progress.gateway';

/** Minimal Socket stub — only what the gateway actually calls. */
function makeMockClient(id: string) {
  return {
    id,
    join: vi.fn(),
    leave: vi.fn(),
    emit: vi.fn(),
  };
}

describe('GenerationProgressGateway — BL-01: replay-on-subscribe', () => {
  let gateway: GenerationProgressGateway;

  beforeEach(() => {
    gateway = new GenerationProgressGateway();
    // The gateway broadcasts via `this.server.to(room).emit(...)` — stub the
    // NestJS-injected Socket.IO server just enough to not throw.
    (gateway as any).server = {
      to: vi.fn().mockReturnValue({ emit: vi.fn() }),
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('TC-BL01-01: subscribing before any emit gets only the ack, no phantom progress event', () => {
    const client = makeMockClient('client-1');
    gateway.handleSubscribe(client as any, { generationId: 'gen-1', userId: 'user-1' });

    expect(client.emit).toHaveBeenCalledWith('subscribed', { generationId: 'gen-1' });
    expect(client.emit).not.toHaveBeenCalledWith('progress', expect.anything());
  });

  it('TC-BL01-02: a client subscribing AFTER an emit is immediately caught up (the core fix)', () => {
    gateway.emitProgress('gen-2', { status: 'processing', step: 1, stepLabel: 'Designing layout', progress: 25 });

    const lateClient = makeMockClient('client-2');
    gateway.handleSubscribe(lateClient as any, { generationId: 'gen-2', userId: 'user-2' });

    expect(lateClient.emit).toHaveBeenCalledWith(
      'progress',
      expect.objectContaining({ generationId: 'gen-2', status: 'processing', step: 1, progress: 25 }),
    );
  });

  it('TC-BL01-03: replay reflects the MOST RECENT emit, not the first, when multiple steps have fired', () => {
    gateway.emitProgress('gen-3', { status: 'processing', step: 0, progress: 8 });
    gateway.emitProgress('gen-3', { status: 'processing', step: 3, progress: 72 });
    gateway.emitProgress('gen-3', { status: 'completed', step: 5, progress: 100 });

    const client = makeMockClient('client-3');
    gateway.handleSubscribe(client as any, { generationId: 'gen-3', userId: 'user-3' });

    const progressCalls = client.emit.mock.calls.filter((c) => c[0] === 'progress');
    expect(progressCalls).toHaveLength(1);
    expect(progressCalls[0][1]).toMatchObject({ status: 'completed', step: 5, progress: 100 });
  });

  it('TC-BL01-04: replay is per-generation — a subscriber to a different generation gets nothing', () => {
    gateway.emitProgress('gen-4a', { status: 'processing', step: 2, progress: 50 });

    const client = makeMockClient('client-4');
    gateway.handleSubscribe(client as any, { generationId: 'gen-4b', userId: 'user-4' });

    expect(client.emit).not.toHaveBeenCalledWith('progress', expect.anything());
  });

  it('TC-BL01-05: terminal-state cache (completed) is pruned after its TTL — a subscriber long after gets no stale replay', () => {
    vi.useFakeTimers();
    gateway.emitProgress('gen-5', { status: 'completed', step: 5, progress: 100 });

    vi.advanceTimersByTime(31_000); // > TERMINAL_STATE_TTL_MS (30_000)

    const client = makeMockClient('client-5');
    gateway.handleSubscribe(client as any, { generationId: 'gen-5', userId: 'user-5' });

    expect(client.emit).not.toHaveBeenCalledWith('progress', expect.anything());
  });

  it('TC-BL01-06: a straggler within the TTL window still gets the terminal state (the realistic reconnect case)', () => {
    vi.useFakeTimers();
    gateway.emitProgress('gen-6', { status: 'failed', errorMessage: 'boom' });

    vi.advanceTimersByTime(5_000); // well within the 30s TTL

    const client = makeMockClient('client-6');
    gateway.handleSubscribe(client as any, { generationId: 'gen-6', userId: 'user-6' });

    expect(client.emit).toHaveBeenCalledWith(
      'progress',
      expect.objectContaining({ status: 'failed', errorMessage: 'boom' }),
    );
  });
});
