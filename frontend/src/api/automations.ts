import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export interface Automation {
  id: string;
  name: string;
  nodes: any[];
  edges: any[];
  automation_type: string;
  schedule_config?: any;
}

export interface AutomationCreate {
  name: string;
  nodes: any[];
  edges: any[];
  automation_type: string;
  schedule_config?: any;
}

export interface AutomationUpdate {
  name?: string;
  nodes?: any[];
  edges?: any[];
  automation_type?: string;
  schedule_config?: any;
}

const api = axios.create({
  baseURL: API_URL,
});

export const getAutomations = async (): Promise<Automation[]> => {
  const { data } = await api.get('/automations');
  return data;
};

export const getAutomation = async (id: string): Promise<Automation> => {
  const { data } = await api.get(`/automations/${id}`);
  return data;
};

export const createAutomation = async (automation: AutomationCreate): Promise<Automation> => {
  const { data } = await api.post('/automations', automation);
  return data;
};

export const updateAutomation = async ({ id, automation }: { id: string, automation: AutomationUpdate }): Promise<Automation> => {
  const { data } = await api.put(`/automations/${id}`, automation);
  return data;
};

export const deleteAutomation = async (id: string): Promise<void> => {
  await api.delete(`/automations/${id}`);
};

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

export const runAutomation = async (id: string, inputText?: string) => {
  const { data } = await api.post(`/automations/${id}/run`, {
    input_text: inputText,
    stream: false
  });
  return data;
};

export const streamRunAutomation = async (
  id: string,
  inputText: string | undefined,
  onUpdate: (content: string) => void
): Promise<string> => {
  const response = await api.post<ReadableStream>(
    `/automations/${id}/run`,
    {
      input_text: inputText,
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
        } else if (msg.type === 'tool') {
            accumulatedContent += `\n[Tool Executed: ${msg.name}]\n`;
            onUpdate(accumulatedContent);
        }
      }
    } else {
        // Handle token stream if present
        if (chunk.chatbot?.type === 'ai' && chunk.chatbot?.content) {
            accumulatedContent += chunk.chatbot.content;
            onUpdate(accumulatedContent);
        }
    }
  }

  return accumulatedContent;
};

export const useAutomations = () => {
  return useQuery({
    queryKey: ['automations'],
    queryFn: getAutomations,
  });
};

export const useAutomation = (id: string) => {
  return useQuery({
    queryKey: ['automations', id],
    queryFn: () => getAutomation(id),
    enabled: !!id,
  });
};

export const useCreateAutomation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAutomation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
    },
  });
};

export const useUpdateAutomation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAutomation,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      queryClient.invalidateQueries({ queryKey: ['automations', variables.id] });
    },
  });
};

export const useDeleteAutomation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAutomation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
    },
  });
};
