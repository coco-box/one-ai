import { describe, expect, it, vi } from 'vitest';
import { AgUiHttpTransport } from './AgUiHttpTransport';

describe('AgUiHttpTransport', () => {
  it('aborts the underlying fetch when the AG-UI stream fails', async () => {
    let fetchSignal: AbortSignal | undefined;
    const fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      fetchSignal = init?.signal ?? undefined;

      return new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('data:{"type": "TEXT_MESSAGE_CONTENT"\n\n'));
          },
        }),
        {
          headers: {
            'Content-Type': 'text/event-stream',
          },
        },
      );
    });

    const transport = new AgUiHttpTransport({
      api: '/api/chat',
      fetch,
    });

    const stream = await transport.sendMessages({
      chatId: 'chat-1',
      messages: [],
      abortSignal: new AbortController().signal,
      trigger: 'submit-message',
      messageId: undefined,
    } as any);

    await expect(stream.getReader().read()).rejects.toThrow(
      'AG-UI protocol error: invalid JSON event line',
    );
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetchSignal?.aborted).toBe(true);
  });

  it('applies transformChunk before exposing the response stream', async () => {
    const onUpdate = vi.fn();
    const fetch = vi.fn(async () => new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode([
            'data: {"type":"CUSTOM","name":"USER_QUERY","value":"question"}',
            '',
            'data: {"type":"RUN_FINISHED"}',
            '',
            '',
          ].join('\n')));
        },
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
        },
      },
    ));
    const transport = new AgUiHttpTransport({
      api: '/api/chat',
      fetch,
      transformChunk(chunk) {
        return chunk.type === 'data-user_query' ? null : chunk;
      },
      onUpdate,
    });

    const stream = await transport.sendMessages({
      chatId: 'chat-1',
      messages: [],
      abortSignal: new AbortController().signal,
      trigger: 'submit-message',
      messageId: undefined,
    } as any);
    const reader = stream.getReader();

    await expect(reader.read()).resolves.toMatchObject({
      value: { type: 'finish' },
      done: false,
    });
    await expect(reader.read()).resolves.toEqual({ value: undefined, done: true });
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ type: 'finish' }));
  });
});
