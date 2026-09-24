import { describe, expect, it, vi } from 'vitest';
import type { UIMessageChunk } from '@coco-box/ai';
import { createUiChunkStreamFromAgUi } from './stream-adapter';

async function readAll(stream: ReadableStream<UIMessageChunk>) {
  const chunks: UIMessageChunk[] = [];
  const reader = stream.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) return chunks;
    chunks.push(value);
  }
}

describe('createUiChunkStreamFromAgUi', () => {
  it('parses AS2 SSE fields without treating id as JSON', async () => {
    const source = new ReadableStream<string>({
      start(controller) {
        controller.enqueue([
          'id: 1-0',
          'data: {"type":"CUSTOM","name":"USER_QUERY","value":"开始告警"}',
          '',
          'id: 1-1',
          'data: {"type":"RUN_STARTED","thread_id":"session-1","run_id":"round-1"}',
          '',
          '',
        ].join('\n'));
        controller.close();
      },
    });

    await expect(readAll(createUiChunkStreamFromAgUi(source))).resolves.toMatchObject([
      { type: 'data-user_query', data: '开始告警' },
      { type: 'start' },
    ]);
  });

  it('supports control fields, comments, CRLF and multi-line data', async () => {
    const source = new ReadableStream<string>({
      start(controller) {
        controller.enqueue(': heartbeat\r');
        controller.enqueue('\nid: 9-0\r\nevent: message\r\nretry: 1000\r\n');
        controller.enqueue('data: {"type":"TEXT_MESSAGE_START",\r\n');
        controller.enqueue('data: "message_id":"message-1"}\r\n\r\n');
        controller.close();
      },
    });

    await expect(readAll(createUiChunkStreamFromAgUi(source))).resolves.toMatchObject([
      { type: 'text-start', id: 'message-1' },
    ]);
  });

  it('decodes UTF-8 characters split across byte chunks', async () => {
    const encoded = new TextEncoder().encode(
      'data:{"type":"TEXT_MESSAGE_CONTENT","message_id":"message-1","delta":"你好"}\n\n',
    );
    const chineseByteIndex = encoded.findIndex((value) => value > 0x7f);
    const source = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoded.slice(0, chineseByteIndex + 1));
        controller.enqueue(encoded.slice(chineseByteIndex + 1));
        controller.close();
      },
    });

    await expect(readAll(createUiChunkStreamFromAgUi(source))).resolves.toMatchObject([
      { type: 'text-delta', id: 'message-1', delta: '你好' },
    ]);
  });

  it('keeps compatibility with JSONL and direct object streams', async () => {
    const source = new ReadableStream<any>({
      start(controller) {
        controller.enqueue('{"type":"TEXT_MESSAGE_START","message_id":"jsonl"}\r');
        controller.enqueue({
          type: 'TEXT_MESSAGE_CONTENT',
          message_id: 'jsonl',
          delta: 'ok',
        });
        controller.close();
      },
    });

    await expect(readAll(createUiChunkStreamFromAgUi(source))).resolves.toMatchObject([
      { type: 'text-start', id: 'jsonl' },
      { type: 'text-delta', id: 'jsonl', delta: 'ok' },
    ]);
  });

  it('flushes a final SSE event without a trailing blank line', async () => {
    const source = new ReadableStream<string>({
      start(controller) {
        controller.enqueue('data: {"type":"TEXT_MESSAGE_START","message_id":"tail"}');
        controller.close();
      },
    });

    await expect(readAll(createUiChunkStreamFromAgUi(source))).resolves.toMatchObject([
      { type: 'text-start', id: 'tail' },
    ]);
  });

  it('supports bare CR as an SSE line terminator', async () => {
    const source = new ReadableStream<string>({
      start(controller) {
        controller.enqueue('data:{"type":"TEXT_MESSAGE_START","message_id":"bare-cr"}\r\r');
        controller.close();
      },
    });

    await expect(readAll(createUiChunkStreamFromAgUi(source))).resolves.toMatchObject([
      { type: 'text-start', id: 'bare-cr' },
    ]);
  });

  it('applies transformChunk before onUpdate and can drop a chunk', async () => {
    const onUpdate = vi.fn();
    const source = new ReadableStream<any>({
      start(controller) {
        controller.enqueue({ type: 'CUSTOM', name: 'USER_QUERY', value: 'question' });
        controller.enqueue({
          type: 'TEXT_MESSAGE_START',
          message_id: 'original',
          role: 'assistant',
        });
        controller.close();
      },
    });

    const chunks = await readAll(createUiChunkStreamFromAgUi(source, {
      transformChunk(chunk) {
        if (chunk.type === 'data-user_query') return null;
        if (chunk.type === 'text-start') return { ...chunk, id: 'transformed' };
        return chunk;
      },
      onUpdate,
    }));

    expect(chunks).toMatchObject([{ type: 'text-start', id: 'transformed' }]);
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: 'transformed' }));
  });

  it('closes and cancels upstream on data: [DONE]', async () => {
    const cancel = vi.fn();
    const source = new ReadableStream<string>({
      start(controller) {
        controller.enqueue('data: [DONE]\n\n');
      },
      cancel,
    });

    await expect(readAll(createUiChunkStreamFromAgUi(source))).resolves.toEqual([]);
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('errors and cancels upstream when onUpdate fails', async () => {
    const error = new Error('onUpdate failed');
    const cancel = vi.fn();
    const source = new ReadableStream<any>({
      start(controller) {
        controller.enqueue({
          type: 'TEXT_MESSAGE_START',
          message_id: 'message-1',
          role: 'assistant',
        });
      },
      cancel,
    });

    const stream = createUiChunkStreamFromAgUi(source, () => {
      throw error;
    });
    const reader = stream.getReader();

    await expect(reader.read()).rejects.toThrow(error);
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('reports malformed event JSON once and cancels upstream', async () => {
    const cancel = vi.fn();
    const onStreamError = vi.fn();
    const invalidEvent = 'data: {"type":"TEXT_MESSAGE_CONTENT"\n\n';
    const source = new ReadableStream<string>({
      start(controller) {
        controller.enqueue(invalidEvent);
      },
      cancel,
    });

    const stream = createUiChunkStreamFromAgUi(source, {
      onStreamError,
    });

    await expect(stream.getReader().read()).rejects.toThrow(
      'AG-UI protocol error: invalid JSON event line',
    );
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(onStreamError).toHaveBeenCalledTimes(1);
  });

  it('stops reading upstream after finish', async () => {
    const cancel = vi.fn();
    const source = new ReadableStream<string>({
      start(controller) {
        controller.enqueue([
          'data: {"type":"RUN_FINISHED"}',
          '',
          'data: {"type":"TEXT_MESSAGE_CONTENT","message_id":"late","delta":"late"}',
          '',
          '',
        ].join('\n'));
      },
      cancel,
    });

    await expect(readAll(createUiChunkStreamFromAgUi(source))).resolves.toMatchObject([
      { type: 'finish' },
    ]);
    expect(cancel).toHaveBeenCalledTimes(1);
  });
});
