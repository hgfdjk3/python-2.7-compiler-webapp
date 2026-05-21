import { apiClient } from './client';

export interface AskRequestPayload {
  message: string;
  thread_id?: string;
  stream?: boolean;
}

/**
 * A reusable generator that decodes a ReadableStream of bytes and yields parsed SSE JSON payloads.
 */
async function* parseSSEStream<T>(stream: ReadableStream<Uint8Array>): AsyncGenerator<T, void, unknown> {
  const reader = stream.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          try {
            yield JSON.parse(trimmed.slice(6)) as T;
          } catch {
            // Ignore incomplete chunks or malformed JSON
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Sends a message to the LangGraph backend and streams the response via SSE.
 * Calls `onUpdate` with the accumulated AI content as chunks arrive.
 */
export const streamAsk = async (
  prompt: string,
  onUpdate: (content: string) => void,
  threadId: string = 'default_api_session'
): Promise<string> => {
  const response = await apiClient.post<ReadableStream>(
    '/ask',
    {
      message: prompt,
      thread_id: threadId,
      stream: true,
    },
    {
      responseType: 'stream',
      adapter: 'fetch',
    }
  );

  const stream = response.data;
  if (!stream) {
    throw new Error('No stream data received from backend');
  }

  let accumulatedContent = '';

  for await (const chunk of parseSSEStream<any>(stream)) {
    if (chunk.error) {
      throw new Error(chunk.error);
    }

    const messages = chunk.chatbot?.messages;
    if (messages) {
      for (const msg of messages) {
        if (msg.type === 'ai' && msg.content) {
          accumulatedContent += msg.content;
          onUpdate(accumulatedContent);
        }
      }
    }
  }

  return accumulatedContent;
};
