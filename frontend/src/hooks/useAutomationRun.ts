import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { streamRunAutomation, streamRunUnsavedAutomation, NodeExecutionState } from '../api/automations';
import { notify } from '@/utils/notifications';

export const useAutomationRun = (automationId: string) => {
  const queryClient = useQueryClient();
  const [nodeExecutionStates, setNodeExecutionStates] = useState<Record<string, NodeExecutionState>>({});

  const mutation = useMutation({
    mutationKey: ['runAutomation', automationId],
    onMutate: async () => {
      const tempId = `temp-${Date.now()}`;
      const timestamp = new Date().toISOString();
      await queryClient.cancelQueries({ queryKey: ['automations', automationId, 'runs'] });
      
      const previousRuns = queryClient.getQueryData(['automations', automationId, 'runs']);
      
      queryClient.setQueryData(['automations', automationId, 'runs'], (old: any) => {
        const newRun = {
          id: tempId,
          automation_id: automationId,
          status: 'running',
          timestamp: timestamp,
          duration: null
        };
        return [newRun, ...(old || [])];
      });
      
      return { previousRuns, tempId, timestamp };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['automations', automationId, 'runs'] });
    },
    onError: (err: any, variables: any, context: any) => {
      if (context?.previousRuns) {
        queryClient.setQueryData(['automations', automationId, 'runs'], context.previousRuns);
      }
    },
    mutationFn: async ({ inputText }: { inputText?: string }) => {
      setNodeExecutionStates({});
      try {
        await streamRunAutomation(
          automationId,
          inputText,
          (states) => {
            setNodeExecutionStates(states);
          }
        );
      } catch (err: any) {
        console.error('Automation run error:', err);
        notify.error({
          title: 'Automation Error',
          message: err.message || 'Failed to run automation',
        });
        throw err;
      }
    },
  });

  const clearStream = () => setNodeExecutionStates({});

  return {
    ...mutation,
    nodeExecutionStates,
    clearStream,
  };
};

export const useUnsavedAutomationRun = () => {
  const [nodeExecutionStates, setNodeExecutionStates] = useState<Record<string, NodeExecutionState>>({});

  const mutation = useMutation({
    mutationFn: async ({ inputText, automationData }: { inputText?: string, automationData: any }) => {
      setNodeExecutionStates({});
      try {
        await streamRunUnsavedAutomation(
          automationData,
          inputText,
          (states) => {
            setNodeExecutionStates(states);
          }
        );
      } catch (err: any) {
        console.error('Automation run error:', err);
        notify.error({
          title: 'Automation Error',
          message: err.message || 'Failed to run automation',
        });
        throw err;
      }
    },
  });

  const clearStream = () => setNodeExecutionStates({});

  return {
    ...mutation,
    nodeExecutionStates,
    clearStream,
  };
};
