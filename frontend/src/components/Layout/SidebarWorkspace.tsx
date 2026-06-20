import React from 'react';
import { NavLink, Text } from '@mantine/core';
import { IconFolder, IconFolderOpen, IconMessage } from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';
import { useProjectConversations, getConversation } from '../../api/conversations';
import { useQueryClient } from '@tanstack/react-query';

interface ChatItem {
  id: string;
  name: string;
}

export interface SidebarWorkspaceProps {
  id: string;
  name: string;
  chats: ChatItem[];
  isOpened: boolean;
  onToggle: () => void;
  sidebarOpened?: boolean;
}

export const SidebarWorkspace: React.FC<SidebarWorkspaceProps> = ({
  id,
  name,
  chats = [],
  isOpened,
  onToggle,
  sidebarOpened = true,
}) => {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { data: conversations = [] } = useProjectConversations(id);
  const FolderIcon = isOpened ? IconFolderOpen : IconFolder;

  if (!sidebarOpened) {
    return (
      <NavLink
        leftSection={<FolderIcon size={18} stroke={1.5} color="light-dark(var(--mantine-color-zinc-7), var(--mantine-color-zinc-5))" />}
        variant="subtle"
        p="xs"
        style={{ borderRadius: 'var(--mantine-radius-md)', display: 'flex', justifyContent: 'center' }}
        onClick={onToggle}
      />
    );
  }

  return (
    <NavLink
      label={<Text size="sm" fw={500} truncate>{name}</Text>}
      leftSection={<FolderIcon size={16} stroke={1.5} color="light-dark(var(--mantine-color-zinc-6), var(--mantine-color-zinc-3))" />}
      opened={isOpened}
      onChange={onToggle}
      variant="subtle"
      childrenOffset={6}
      p="5"
      style={{ borderRadius: 'var(--mantine-radius-sm)' }}
    >
      {conversations.slice(0, 4).map((chat) => (
        <NavLink
          key={chat.id}
          component={Link}
          to={`/project/${id}/chat/${chat.id}`}
          onMouseEnter={() => {
            queryClient.prefetchQuery({
              queryKey: ['conversation', chat.id],
              queryFn: () => getConversation(chat.id)
            });
          }}
          label={<Text size="xs" c="dimmed" truncate>{chat.title}</Text>}
          leftSection={<IconMessage size={14} stroke={1.5} color="light-dark(var(--mantine-color-zinc-6), var(--mantine-color-zinc-2))" />}
          h={20}
          variant="light"
          active={location.pathname === `/project/${id}/chat/${chat.id}`}
          style={{ borderRadius: 'var(--mantine-radius-sm)', marginTop: '2px' }}
        />
      ))}
      {conversations.length > 4 && (
        <NavLink
          component={Link}
          to={`/project/${id}`}
          label={<Text size="xs" c="dimmed" truncate>View all...</Text>}
          leftSection={<IconFolderOpen size={14} stroke={1.5} color="light-dark(var(--mantine-color-zinc-6), var(--mantine-color-zinc-2))" />}
          h={20}
          variant="light"
          active={location.pathname === `/project/${id}`}
          style={{ borderRadius: 'var(--mantine-radius-sm)', marginTop: '2px' }}
        />
      )}
    </NavLink>
  );
};
