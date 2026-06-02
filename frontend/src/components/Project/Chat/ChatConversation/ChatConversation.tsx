import React from 'react';
import { Box, Stack } from '@mantine/core';
import { MarkdownResponse } from '../MarkdownResponse';
import { UserMessage } from '../UserMessage/UserMessage';
import { ClarificationQuestionData } from '../PromptInput/PromptClarification/PromptClarification';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface QueuedMessage {
  id: string;
  prompt: string;
  isAutomation: boolean;
  timestamp: string;
}

export interface ChatConversationProps {
  messages: ChatMessage[];
  streamedContent?: string;
  isStreaming?: boolean;
  queuedMessages?: QueuedMessage[];
  onSubmitAnswer?: (answer: string) => void;
  onTriggerClarification?: (questions: ClarificationQuestionData[]) => void;
}

export const ChatConversation: React.FC<ChatConversationProps> = ({
  messages,
  streamedContent,
  isStreaming,
  queuedMessages = [],
  onSubmitAnswer,
  onTriggerClarification,
}) => {
  return (
    <Box style={{ height: '100%' }}>
      <Stack gap="0" pb={120}>
        {messages.map((msg) => (
          <Box key={msg.id}>
            {msg.role === 'user' ? (
              <UserMessage content={msg.content} timestamp={msg.timestamp} />
            ) : (
              <MarkdownResponse
                content={msg.content}
                onSubmitAnswer={onSubmitAnswer}
              />
            )}
          </Box>
        ))}

        {isStreaming && (
          <Box>
            <MarkdownResponse
              content={streamedContent || ''}
              onSubmitAnswer={onSubmitAnswer}
              onTriggerClarification={onTriggerClarification}
            />
          </Box>
        )}

        {queuedMessages.length > 0 && (
          <Box mt="md">
            {queuedMessages.map(msg => (
              <Box key={msg.id} style={{ opacity: 0.5 }}>
                <UserMessage content={msg.prompt} timestamp={`${msg.timestamp} (Queued)`} />
              </Box>
            ))}
          </Box>
        )}
      </Stack>
    </Box>
  );
};

