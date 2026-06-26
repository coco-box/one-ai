import { describe, expect, it, vi } from 'vitest';
import { createUiChunkStreamFromAgUi } from './stream-adapter';

describe('createUiChunkStreamFromAgUi', () => {
  it('errors and cancels upstream when emitting a mapped event fails', async () => {
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

  it('does not log repeatedly when malformed JSON is received', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const cancel = vi.fn();
    const onStreamError = vi.fn();
    const invalidLine = 'data:{"type": "TEXT_MESSAGE_CONTENT", "message_id": "a"';
    const source = new ReadableStream<string>({
      start(controller) {
        controller.enqueue('data:{"type": "TEXT_MESSAGE_START", "message_id": "a"}\n');
        controller.enqueue(`${invalidLine}\n`);
      },
      cancel,
    });

    const stream = createUiChunkStreamFromAgUi(source, undefined, onStreamError);
    const reader = stream.getReader();

    await expect(reader.read()).resolves.toMatchObject({
      value: { type: 'text-start', id: 'a' },
      done: false,
    });
    await expect(reader.read()).rejects.toThrow(invalidLine);
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(onStreamError).toHaveBeenCalledTimes(1);
    expect(onStreamError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect((onStreamError.mock.calls[0][0] as Error).message).toContain(invalidLine);
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('stops reading upstream after finish without logging later events', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const cancel = vi.fn();
    const source = new ReadableStream<string>({
      start(controller) {
        controller.enqueue([
          'data:{"type": "RUN_FINISHED"}',
          'data:{"type": "TEXT_MESSAGE_CONTENT", "message_id": "late", "delta": "late"}',
          '',
        ].join('\n'));
      },
      cancel,
    });

    const stream = createUiChunkStreamFromAgUi(source);
    const reader = stream.getReader();

    await expect(reader.read()).resolves.toMatchObject({
      value: { type: 'finish' },
      done: false,
    });
    await expect(reader.read()).resolves.toEqual({ value: undefined, done: true });
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
