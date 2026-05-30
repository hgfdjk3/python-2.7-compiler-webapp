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
  creator?: string;
  project_id?: string;
}

export interface AutomationCreate {
  name: string;
  nodes: any[];
  edges: any[];
  automation_type: string;
  schedule_config?: any;
  project_id?: string;
}

export interface AutomationUpdate {
  name?: string;
  nodes?: any[];
  edges?: any[];
  automation_type?: string;
  schedule_config?: any;
  creator?: string;
}

import { apiClient as api } from './client';

export const getAutomations = async (projectId?: string): Promise<Automation[]> => {
  const url = projectId ? `/projects/${projectId}/automations` : '/automations';
  const { data } = await api.get(url);
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

export const getAutomationRuns = async (id: string): Promise<any[]> => {
  const { data } = await api.get(`/automations/${id}/runs`);
  return data;
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

export type NodeExecutionState = {
  status: 'idle' | 'running' | 'completed' | 'error';
  content: string;
  tools: any[];
  inputs?: any;
};

export const streamRunAutomation = async (
  id: string,
  inputText: string | undefined,
  onUpdate: (states: Record<string, NodeExecutionState>) => void
): Promise<void> => {
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

  const nodeStates: Record<string, NodeExecutionState> = {};

  for await (const chunk of parseSSEStream<any>(stream)) {
    if (chunk.error) {
      // Find the currently running node, if any
      const runningNodeId = Object.keys(nodeStates).find(id => nodeStates[id].status === 'running');
      if (runningNodeId) {
        nodeStates[runningNodeId].status = 'error';
        nodeStates[runningNodeId].content += `\n\n> [!ERROR]\n> **Execution Error**\n> \n> ${chunk.error}`;
        onUpdate({ ...nodeStates });
      }
      throw new Error(chunk.error);
    }

    if (chunk.type === 'node_start') {
      nodeStates[chunk.node_id] = { status: 'running', content: '', tools: [] };
    } else if (chunk.type === 'node_chunk') {
      if (!nodeStates[chunk.node_id]) nodeStates[chunk.node_id] = { status: 'running', content: '', tools: [] };
      nodeStates[chunk.node_id].content += chunk.content;
    } else if (chunk.type === 'node_tool_start') {
      if (!nodeStates[chunk.node_id]) nodeStates[chunk.node_id] = { status: 'running', content: '', tools: [] };
      nodeStates[chunk.node_id].tools.push({ name: chunk.tool_name, input: chunk.input, output: null });
    } else if (chunk.type === 'node_tool_end') {
      if (!nodeStates[chunk.node_id]) nodeStates[chunk.node_id] = { status: 'running', content: '', tools: [] };
      const tool = nodeStates[chunk.node_id].tools.find(t => t.name === chunk.tool_name && t.output === null);
      if (tool) {
        tool.output = chunk.output;
      }
    } else if (chunk.type === 'node_end') {
      if (!nodeStates[chunk.node_id]) nodeStates[chunk.node_id] = { status: 'completed', content: '', tools: [] };
      nodeStates[chunk.node_id].status = 'completed';
    }

    onUpdate({ ...nodeStates });
  }
};

export const runUnsavedAutomation = async (automationData: any, inputText?: string) => {
  const { data } = await api.post('/automations/run', {
    input_text: inputText,
    stream: false,
    automation_data: automationData
  });
  return data;
};

export const streamRunUnsavedAutomation = async (
  automationData: any,
  inputText: string | undefined,
  onUpdate: (states: Record<string, NodeExecutionState>) => void
): Promise<void> => {
  const response = await api.post<ReadableStream>(
    '/automations/run',
    {
      input_text: inputText,
      stream: true,
      automation_data: automationData
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

  const nodeStates: Record<string, NodeExecutionState> = {};

  for await (const chunk of parseSSEStream<any>(stream)) {
    if (chunk.error) {
      const runningNodeId = Object.keys(nodeStates).find(id => nodeStates[id].status === 'running');
      if (runningNodeId) {
        nodeStates[runningNodeId].status = 'error';
        nodeStates[runningNodeId].content += `\n\n> [!ERROR]\n> **Execution Error**\n> \n> ${chunk.error}`;
        onUpdate({ ...nodeStates });
      }
      throw new Error(chunk.error);
    }

    if (chunk.type === 'node_start') {
      nodeStates[chunk.node_id] = { status: 'running', content: '', tools: [] };
    } else if (chunk.type === 'node_chunk') {
      if (!nodeStates[chunk.node_id]) nodeStates[chunk.node_id] = { status: 'running', content: '', tools: [] };
      nodeStates[chunk.node_id].content += chunk.content;
    } else if (chunk.type === 'node_tool_start') {
      if (!nodeStates[chunk.node_id]) nodeStates[chunk.node_id] = { status: 'running', content: '', tools: [] };
      nodeStates[chunk.node_id].tools.push({ name: chunk.tool_name, input: chunk.input, output: null });
    } else if (chunk.type === 'node_tool_end') {
      if (!nodeStates[chunk.node_id]) nodeStates[chunk.node_id] = { status: 'running', content: '', tools: [] };
      const tool = nodeStates[chunk.node_id].tools.find(t => t.name === chunk.tool_name && t.output === null);
      if (tool) {
        tool.output = chunk.output;
      }
    } else if (chunk.type === 'node_end') {
      if (!nodeStates[chunk.node_id]) nodeStates[chunk.node_id] = { status: 'completed', content: '', tools: [] };
      nodeStates[chunk.node_id].status = 'completed';
    }

    onUpdate({ ...nodeStates });
  }
};

export const useProjectAutomations = (projectId?: string) => {
  return useQuery({
    queryKey: ['project-automations', projectId],
    queryFn: () => getAutomations(projectId),
    enabled: !!projectId,
  });
};

export const useAutomation = (id: string) => {
  return useQuery({
    queryKey: ['automations', id],
    queryFn: () => getAutomation(id),
    enabled: !!id,
  });
};

export const useAutomationRuns = (id: string) => {
  return useQuery({
    queryKey: ['automations', id, 'runs'],
    queryFn: () => getAutomationRuns(id),
    enabled: !!id,
    refetchInterval: 5000, // refresh runs every 5s while looking at the page
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
