import { ActionIcon, Box, Group, Menu, Text, Tooltip, UnstyledButton } from '@mantine/core';
import { IconStar, IconStarFilled, IconDotsVertical, IconTrash } from '@tabler/icons-react';
import './ChatItem.css';

export interface ChatItemData {
  id: string;
  title: string;
  preview: string;
  timestamp: string;
  isSaved: boolean;
}

interface ChatItemProps {
  chat: ChatItemData;
  onToggleSave?: (id: string) => void;
  onClick?: (id: string) => void;
}

export const ChatItem: React.FC<ChatItemProps> = ({ chat, onToggleSave, onClick }) => {
  return (
    <Box
      className="chat-item"
      onClick={() => onClick?.(chat.id)}
    >
      <Group justify="space-between" align="center" wrap="nowrap" gap="md">
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text className="chat-item-title" truncate>
            {chat.title}
          </Text>
          <Text className="chat-item-preview" lineClamp={1}>
            {chat.preview}
          </Text>
        </Box>

        <Box className="chat-item-time-col">
          <Text className="chat-item-meta">
            {chat.timestamp}
          </Text>
        </Box>

        <Box className="chat-item-actions" onClick={(e) => e.stopPropagation()}>
          <Menu position="bottom-end" shadow="md" width={160} withinPortal>
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray" size="xs">
                <IconDotsVertical size={14} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item
                leftSection={chat.isSaved ? <IconStarFilled size={14} style={{ color: 'var(--mantine-color-amber-5)' }} /> : <IconStar size={14} />}
                onClick={() => onToggleSave?.(chat.id)}
              >
                {chat.isSaved ? 'Unsave chat' : 'Save chat'}
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<IconTrash size={14} />}
              >
                Delete chat
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Box>
      </Group>
    </Box>
  );
};
