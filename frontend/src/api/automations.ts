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
