import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

export interface ToolDetail {
  name: string;
  display_name?: string;
  display_description?: string;
  tags?: string[];
}

export interface ConnectorFormData {
  id: string;
  name: string;
  url: string;
  color: string;
  icon?: string;
  description: string;
  headers?: Record<string, string>;
  headers_schema?: Record<string, string>;
  header_values?: Record<string, string>;
  tools?: string[];
  publisher_name?: string;
  developers?: string[];
  tags?: string[];
}

export const getToolMetadata = async (toolName: string): Promise<ToolDetail> => {
  try {
    const response = await apiClient.get<ToolDetail>(`/tools/${toolName}/metadata`);
    return response.data;
  } catch (error) {
    console.warn(`Failed to fetch metadata for tool: ${toolName}`, error);
    return { name: toolName };
  }
};

export const getConnectors = async (): Promise<ConnectorFormData[]> => {
  const response = await apiClient.get<ConnectorFormData[]>('/connectors');
  return response.data;
};

export const getDeveloperConnectors = async (): Promise<ConnectorFormData[]> => {
  const response = await apiClient.get<ConnectorFormData[]>('/developers/connectors');
  return response.data;
};

export const addConnector = async (data: ConnectorFormData): Promise<ConnectorFormData> => {
  const response = await apiClient.post<ConnectorFormData>('/connectors', data);
  return response.data;
};

export const deleteConnector = async (id: string): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(`/connectors/${id}`);
  return response.data;
};

export const updateConnector = async ({ id, data }: { id: string; data: ConnectorFormData }): Promise<ConnectorFormData> => {
  const response = await apiClient.put<ConnectorFormData>(`/connectors/${id}`, data);
  return response.data;
};

// React Query Custom Hooks
export const useConnectors = () => {
  return useQuery<ConnectorFormData[]>({
    queryKey: ['connectors'],
    queryFn: getConnectors,
  });
};

export const useDeveloperConnectors = () => {
  return useQuery<ConnectorFormData[]>({
    queryKey: ['developerConnectors'],
    queryFn: getDeveloperConnectors,
  });
};

export const useToolMetadata = (toolName: string) => {
  return useQuery<ToolDetail>({
    queryKey: ['toolMetadata', toolName],
    queryFn: () => getToolMetadata(toolName),
    enabled: !!toolName,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

export const useAddConnector = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addConnector,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connectors'] });
      queryClient.invalidateQueries({ queryKey: ['developerConnectors'] });
    },
    onError: (err: any) => {
      console.error('Failed to add connector:', err);
      const errMsg = err?.response?.data?.detail || err?.message || String(err);
      alert('Failed to add connector: ' + errMsg);
    },
  });
};

export const useUpdateConnector = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateConnector,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connectors'] });
      queryClient.invalidateQueries({ queryKey: ['developerConnectors'] });
    },
    onError: (err: any) => {
      console.error('Failed to update connector:', err);
      const errMsg = err?.response?.data?.detail || err?.message || String(err);
      alert('Failed to update connector: ' + errMsg);
    },
  });
};

export const useDeleteConnector = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteConnector,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connectors'] });
      queryClient.invalidateQueries({ queryKey: ['developerConnectors'] });
    },
    onError: (err: any) => {
      console.error('Failed to delete connector:', err);
      const errMsg = err?.response?.data?.detail || err?.message || String(err);
      alert('Failed to delete connector: ' + errMsg);
    },
  });
};
