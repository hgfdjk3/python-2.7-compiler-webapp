import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { streamAsk } from '../api/chat';

export const useChatStream = () => {
  const [streamedContent, setStreamedContent] = useState('');

  const mutation = useMutation({
    mutationFn: async (prompt: string) => {
      setStreamedContent('');
      try {
        return await streamAsk(prompt, (content) => {
          setStreamedContent(content);
        });
      } catch (err: any) {
        console.error('Chat stream error:', err);
        const errMsg = `Error: Failed to connect to the assistant backend. Please ensure the backend is running.\n\nDetails: ${err.message || err}`;
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
