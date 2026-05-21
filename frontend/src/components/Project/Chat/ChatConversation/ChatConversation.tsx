import React from 'react';
import { Box, Stack } from '@mantine/core';
import { MarkdownResponse } from '../MarkdownResponse';
import { UserMessage } from '../UserMessage/UserMessage';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatConversationProps {
  messages: ChatMessage[];
  streamedContent?: string;
  isStreaming?: boolean;
  onSubmitAnswer?: (answer: string) => void;
}

export const ChatConversation: React.FC<ChatConversationProps> = ({ 
  messages, 
  streamedContent, 
  isStreaming,
  onSubmitAnswer,
}) => {
  return (
    <Box style={{ height: '100%' }}>
      <Stack gap="0" pb={120}>
        {messages.map((msg) => (
          <Box key={msg.id}>
            {msg.role === 'user' ? (
              <UserMessage content={msg.content} timestamp={msg.timestamp} />
            ) : (
              <MarkdownResponse content={msg.content} onSubmitAnswer={onSubmitAnswer} />
            )}
          </Box>
        ))}

        {isStreaming && (
          <Box>
            <MarkdownResponse content={streamedContent || ''} onSubmitAnswer={onSubmitAnswer} />
          </Box>
        )}
      </Stack>
    </Box>
  );
};

