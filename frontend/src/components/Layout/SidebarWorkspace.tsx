import React from 'react';
import { NavLink, Text } from '@mantine/core';
import { IconFolder, IconFolderOpen, IconMessage } from '@tabler/icons-react';
import { useLocation } from 'react-router-dom';

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
  name,
  chats,
  isOpened,
  onToggle,
  sidebarOpened = true,
}) => {
  const location = useLocation();
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
      leftSection={<FolderIcon size={16} stroke={1.5} color="light-dark(var(--mantine-color-zinc-6), var(--mantine-color-zinc-7))" />}
      opened={isOpened}
      onChange={onToggle}

      variant="subtle"
      childrenOffset={28}
      p="5"
      style={{ borderRadius: 'var(--mantine-radius-sm)' }}
    >
      {chats.map((chat) => (
        <NavLink
          key={chat.id}
          label={<Text size="xs" c="dimmed" truncate>{chat.name}</Text>}
          leftSection={<IconMessage size={14} stroke={1.5} color="light-dark(var(--mantine-color-zinc-6), var(--mantine-color-zinc-2))" />}
          h={32}
          variant="light"
          active={location.pathname === `/chat/${chat.id}`}
          style={{ borderRadius: 'var(--mantine-radius-sm)', marginTop: '2px' }}
        />
      ))}
    </NavLink>
  );
};
