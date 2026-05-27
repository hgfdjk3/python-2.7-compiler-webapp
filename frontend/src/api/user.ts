import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

export interface UserConfig {
  enabled_connectors: string[];
  header_values: Record<string, Record<string, string>>;
}

export const useUserConfig = () => {
  return useQuery<UserConfig>({
    queryKey: ['userConfig'],
    queryFn: async () => {
      const response = await apiClient.get('/user/config');
      return response.data;
    },
  });
};

export const useUpdateUserConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: UserConfig) => {
      const response = await apiClient.post('/user/config', config);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userConfig'] });
    },
  });
};
