import React from 'react';
import { Box, Stack, Text } from '@mantine/core';
import { ChatItem, ChatItemData } from './ChatItem';
import './RecentChats.css';

interface RecentChatsProps {
  chats: ChatItemData[];
  onChatClick?: (id: string) => void;
  onToggleSave?: (id: string) => void;
  limit?: number;
}

export const RecentChats: React.FC<RecentChatsProps> = ({ 
  chats, 
  onChatClick, 
  onToggleSave, 
  limit = 4
}) => {
  const displayedChats = chats.slice(0, limit);

  return (
    <Box className="recent-chats-container">
      <Stack gap="0" className="recent-chats-list">
        {displayedChats.length > 0 ? (
          displayedChats.map((chat) => (
            <ChatItem
              key={chat.id}
              chat={chat}
              onClick={onChatClick}
              onToggleSave={onToggleSave}
            />
          ))
        ) : (
          <Box className="empty-state">
            <Text size="sm">No recent chats</Text>
          </Box>
        )}
      </Stack>
    </Box>
  );
};
