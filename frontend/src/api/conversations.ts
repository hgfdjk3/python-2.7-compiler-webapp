import { apiClient } from './client';

export interface Conversation {
  id: string;
  project_id: string;
  title: string;
  preview?: string;
  isSaved: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConversationHistory {
  metadata: Conversation;
  history: any[];
}

export const getProjectConversations = async (projectId: string): Promise<Conversation[]> => {
  const response = await apiClient.get<Conversation[]>(`/projects/${projectId}/conversations`);
  return response.data;
};

export const getConversation = async (threadId: string): Promise<ConversationHistory> => {
  const response = await apiClient.get<ConversationHistory>(`/conversations/${threadId}`);
  return response.data;
};

export const updateConversation = async (threadId: string, data: Partial<Conversation>): Promise<Conversation> => {
  const response = await apiClient.patch<Conversation>(`/conversations/${threadId}`, data);
  return response.data;
};

export const deleteConversation = async (threadId: string): Promise<void> => {
  await apiClient.delete(`/conversations/${threadId}`);
};
