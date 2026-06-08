import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { streamAsk } from '../api/chat';
import { ChatMessage } from '../components/Project/Chat/ChatConversation/ChatConversation';
import { useApprovalStore } from '../utils/approvalStore';

export const useChatStream = (
  threadId?: string,
  projectId?: string,
  setMessages?: React.Dispatch<React.SetStateAction<ChatMessage[]>>
) => {
  const [streamedContent, setStreamedContent] = useState('');

  const mutation = useMutation({
    mutationFn: async ({ prompt, isAutomation = false }: { prompt: string; isAutomation?: boolean }) => {
      setStreamedContent('');
      try {
        return await streamAsk(
          prompt,
          (content) => {
            setStreamedContent(content);
          },
          threadId,
          isAutomation,
          projectId
        );
      } catch (err: any) {
        console.error('Chat stream error:', err);
        const errMsg = `Error: Failed to connect to the assistant backend. Please ensure the backend is running.\n\nDetails: ${err.message || err}`;
        setStreamedContent(errMsg);
        return errMsg;
      }
    },
  });

  const submitApproval = async (toolCallId: string, toolName: string, decision: 'allow' | 'reject' | 'try_again' | 'always_allow') => {
    if (!threadId) return;

    if (setMessages) {
      setMessages(prev => {
        const newMessages = [...prev];
        const last = newMessages[newMessages.length - 1];
        if (last && last.role === 'assistant') {
          newMessages.pop();
        }
        return newMessages;
      });
    }

    useApprovalStore.getState().recordDecision(toolCallId, decision, toolName);

    const initialContent = streamedContent;

    setStreamedContent(initialContent);

    try {
      const finalContent = await streamAsk(
        "", // empty prompt
        (content) => {
          setStreamedContent(content);
        },
        threadId,
        false, // isAutomation
        projectId,
        decision, // resumeDecision
        toolCallId,
        toolName,
        initialContent
      );

      if (setMessages && finalContent) {
        setMessages((prev) => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: finalContent as string,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
      return finalContent;
    } catch (err: any) {
      console.error('Approval stream error:', err);
      setStreamedContent(streamedContent + `\n\nError: Failed to submit approval. ${err.message || err}`);
      throw err;
    }
  };

  const clearStream = () => {
    setStreamedContent('');
  };

  return {
    ...mutation,
    streamedContent,
    clearStream,
    submitApproval
  };
};
