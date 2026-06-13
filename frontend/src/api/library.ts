import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

export interface EntityConnection {
  entity_id: string;
  connection_type: string;
}

export interface EntityState {
  title: string;
  description: string;
  related_entities: EntityConnection[];
  source_tools: string[];
}

export interface Entity {
  id: string;
  project_id: string;
  type: string;
  status: string;
  current_state: EntityState | null;
  proposed_state: EntityState | null;
}

export const getLibraryEntities = async (projectId: string): Promise<Entity[]> => {
  const response = await apiClient.get(`/projects/${projectId}/library/entities`);
  return response.data;
};

export const proposeEntityChange = async (projectId: string, data: { type?: string; proposed_state?: EntityState | null }, entityId?: string): Promise<Entity> => {
  const url = `/projects/${projectId}/library/entities` + (entityId ? `?entity_id=${entityId}` : '');
  const response = await apiClient.post(url, data);
  return response.data;
};

export const approveEntityProposal = async (projectId: string, entityId: string): Promise<Entity> => {
  const response = await apiClient.post(`/projects/${projectId}/library/entities/${entityId}/approve`);
  return response.data;
};

export const rejectEntityProposal = async (projectId: string, entityId: string): Promise<Entity> => {
  const response = await apiClient.post(`/projects/${projectId}/library/entities/${entityId}/reject`);
  return response.data;
};

export const proposeSummaryChange = async (projectId: string, proposedText: string): Promise<any> => {
  const response = await apiClient.put(`/projects/${projectId}/library/summary`, { proposed_text: proposedText });
  return response.data;
};

export const approveSummaryChange = async (projectId: string): Promise<any> => {
  const response = await apiClient.post(`/projects/${projectId}/library/summary/approve`);
  return response.data;
};

export const rejectSummaryChange = async (projectId: string): Promise<any> => {
  const response = await apiClient.post(`/projects/${projectId}/library/summary/reject`);
  return response.data;
};

// React Query Hooks
export const useLibraryEntities = (projectId: string) => {
  return useQuery<Entity[]>({
    queryKey: ['projects', projectId, 'library', 'entities'],
    queryFn: () => getLibraryEntities(projectId),
    enabled: !!projectId,
  });
};

export const useProposeEntityChange = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data, entityId }: { data: { type?: string; proposed_state?: EntityState | null }, entityId?: string }) => proposeEntityChange(projectId, data, entityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'library', 'entities'] });
    },
  });
};

export const useApproveEntityProposal = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entityId: string) => approveEntityProposal(projectId, entityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'library', 'entities'] });
    },
  });
};

export const useRejectEntityProposal = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entityId: string) => rejectEntityProposal(projectId, entityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'library', 'entities'] });
    },
  });
};

export const useProposeSummaryChange = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (proposedText: string) => proposeSummaryChange(projectId, proposedText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
};

export const useApproveSummaryChange = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => approveSummaryChange(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
};

export const useRejectSummaryChange = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => rejectSummaryChange(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
};
