import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { streamRunAutomation, NodeExecutionState } from '../api/automations';
import { notify } from '@/utils/notifications';

export const useAutomationRun = (automationId: string) => {
  const [nodeExecutionStates, setNodeExecutionStates] = useState<Record<string, NodeExecutionState>>({});

  const mutation = useMutation({
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
