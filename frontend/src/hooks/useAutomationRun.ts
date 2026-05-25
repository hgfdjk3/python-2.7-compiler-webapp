import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { streamRunAutomation } from '../api/automations';

export const useAutomationRun = (automationId: string) => {
  const [streamedContent, setStreamedContent] = useState('');

  const mutation = useMutation({
    mutationFn: async ({ inputText }: { inputText?: string }) => {
      setStreamedContent('');
      try {
        return await streamRunAutomation(
          automationId,
          inputText,
          (content) => {
            setStreamedContent(content);
          }
        );
      } catch (err: any) {
        console.error('Automation run error:', err);
        const errMsg = `Error: Failed to run automation.\n\nDetails: ${err.message || err}`;
        setStreamedContent(errMsg);
        return errMsg;
      }
    },
  });

  const clearStream = () => setStreamedContent('');

  return {
    ...mutation,
    streamedContent,
    clearStream,
  };
};
