import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { Project } from './projects';

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

export const approveAllChanges = async (projectId: string): Promise<any> => {
  const response = await apiClient.post(`/projects/${projectId}/library/approve-all`);
  return response.data;
};

export const rejectAllChanges = async (projectId: string): Promise<any> => {
  const response = await apiClient.post(`/projects/${projectId}/library/reject-all`);
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
    onMutate: async (entityId) => {
      await queryClient.cancelQueries({ queryKey: ['projects', projectId, 'library', 'entities'] });
      const previousEntities = queryClient.getQueryData<Entity[]>(['projects', projectId, 'library', 'entities']);
      
      if (previousEntities) {
        queryClient.setQueryData<Entity[]>(['projects', projectId, 'library', 'entities'], old => {
          if (!old) return old;
          return old.map(entity => {
            if (entity.id === entityId) {
              if (!entity.proposed_state) return null as any;
              return { ...entity, current_state: entity.proposed_state, proposed_state: null, status: 'approved' };
            }
            return entity;
          }).filter(Boolean);
        });
      }
      return { previousEntities };
    },
    onError: (err, newEntity, context) => {
      if (context?.previousEntities) {
        queryClient.setQueryData(['projects', projectId, 'library', 'entities'], context.previousEntities);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'library', 'entities'] });
    },
  });
};

export const useRejectEntityProposal = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entityId: string) => rejectEntityProposal(projectId, entityId),
    onMutate: async (entityId) => {
      await queryClient.cancelQueries({ queryKey: ['projects', projectId, 'library', 'entities'] });
      const previousEntities = queryClient.getQueryData<Entity[]>(['projects', projectId, 'library', 'entities']);
      
      if (previousEntities) {
        queryClient.setQueryData<Entity[]>(['projects', projectId, 'library', 'entities'], old => {
          if (!old) return old;
          return old.map(entity => {
            if (entity.id === entityId) {
              if (!entity.current_state) return null as any;
              return { ...entity, proposed_state: null, status: 'approved' };
            }
            return entity;
          }).filter(Boolean);
        });
      }
      return { previousEntities };
    },
    onError: (err, newEntity, context) => {
      if (context?.previousEntities) {
        queryClient.setQueryData(['projects', projectId, 'library', 'entities'], context.previousEntities);
      }
    },
    onSettled: () => {
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
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['projects', projectId] });
      const previousProject = queryClient.getQueryData<Project>(['projects', projectId]);
      if (previousProject && previousProject.library_summary) {
        queryClient.setQueryData<Project>(['projects', projectId], {
          ...previousProject,
          library_summary: {
            ...previousProject.library_summary,
            current_text: previousProject.library_summary.proposed_text || previousProject.library_summary.current_text,
            proposed_text: null,
            status: 'approved'
          }
        });
      }
      return { previousProject };
    },
    onError: (err, variables, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(['projects', projectId], context.previousProject);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
};

export const useRejectSummaryChange = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => rejectSummaryChange(projectId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['projects', projectId] });
      const previousProject = queryClient.getQueryData<Project>(['projects', projectId]);
      if (previousProject && previousProject.library_summary) {
        queryClient.setQueryData<Project>(['projects', projectId], {
          ...previousProject,
          library_summary: {
            ...previousProject.library_summary,
            proposed_text: null,
            status: 'approved'
          }
        });
      }
      return { previousProject };
    },
    onError: (err, variables, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(['projects', projectId], context.previousProject);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
};

export const useApproveAllChanges = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => approveAllChanges(projectId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['projects', projectId] });
      await queryClient.cancelQueries({ queryKey: ['projects', projectId, 'library', 'entities'] });
      
      const previousProject = queryClient.getQueryData<Project>(['projects', projectId]);
      const previousEntities = queryClient.getQueryData<Entity[]>(['projects', projectId, 'library', 'entities']);
      
      if (previousProject && previousProject.library_summary) {
        queryClient.setQueryData<Project>(['projects', projectId], {
          ...previousProject,
          library_summary: {
            ...previousProject.library_summary,
            current_text: previousProject.library_summary.proposed_text || previousProject.library_summary.current_text,
            proposed_text: null,
            status: 'approved'
          }
        });
      }
      
      if (previousEntities) {
        queryClient.setQueryData<Entity[]>(['projects', projectId, 'library', 'entities'], old => {
          if (!old) return old;
          return old.map(entity => {
            if (entity.status === 'pending' || entity.proposed_state) {
              if (!entity.proposed_state) return null as any;
              return { ...entity, current_state: entity.proposed_state, proposed_state: null, status: 'approved' };
            }
            return entity;
          }).filter(Boolean);
        });
      }
      return { previousProject, previousEntities };
    },
    onError: (err, variables, context) => {
      if (context?.previousProject) queryClient.setQueryData(['projects', projectId], context.previousProject);
      if (context?.previousEntities) queryClient.setQueryData(['projects', projectId, 'library', 'entities'], context.previousEntities);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
};

export const useRejectAllChanges = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => rejectAllChanges(projectId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['projects', projectId] });
      await queryClient.cancelQueries({ queryKey: ['projects', projectId, 'library', 'entities'] });
      
      const previousProject = queryClient.getQueryData<Project>(['projects', projectId]);
      const previousEntities = queryClient.getQueryData<Entity[]>(['projects', projectId, 'library', 'entities']);
      
      if (previousProject && previousProject.library_summary) {
        queryClient.setQueryData<Project>(['projects', projectId], {
          ...previousProject,
          library_summary: {
            ...previousProject.library_summary,
            proposed_text: null,
            status: 'approved'
          }
        });
      }
      
      if (previousEntities) {
        queryClient.setQueryData<Entity[]>(['projects', projectId, 'library', 'entities'], old => {
          if (!old) return old;
          return old.map(entity => {
            if (entity.status === 'pending' || entity.proposed_state) {
              if (!entity.current_state) return null as any;
              return { ...entity, proposed_state: null, status: 'approved' };
            }
            return entity;
          }).filter(Boolean);
        });
      }
      return { previousProject, previousEntities };
    },
    onError: (err, variables, context) => {
      if (context?.previousProject) queryClient.setQueryData(['projects', projectId], context.previousProject);
      if (context?.previousEntities) queryClient.setQueryData(['projects', projectId, 'library', 'entities'], context.previousEntities);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
};
