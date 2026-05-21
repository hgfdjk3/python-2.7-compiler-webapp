import React, { useState } from 'react';
import { Menu, ActionIcon } from '@mantine/core';
import { IconDotsVertical, IconExternalLink, IconTrash, IconPencil } from '@tabler/icons-react';

import './SourceCardMenu.css';

interface SourceCardMenuProps {
  onGoToSource?: () => void;
  onRemove?: () => void;
  onRename?: () => void;
  visible?: boolean;
}

export const SourceCardMenu: React.FC<SourceCardMenuProps> = ({
  onGoToSource,
  onRemove,
  onRename,
  visible
}) => {
  const [opened, setOpened] = useState(false);

  return (
    <Menu 
      shadow="md" 
      width={160} 
      position="bottom-end" 
      withinPortal
      opened={opened}
      onChange={setOpened}
    >
      <Menu.Target>
        <ActionIcon 
          variant="subtle" 
          color="gray" 
          size="sm" 
          className="menuTrigger"
          data-visible={visible || opened || undefined}
        >
          <IconDotsVertical className="menuTriggerIcon" />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item 
          leftSection={<IconExternalLink className="menuItemIcon" />} 
          onClick={(e) => { e.stopPropagation(); onGoToSource?.(); }}
        >
          Go to source
        </Menu.Item>
        <Menu.Item 
          leftSection={<IconPencil className="menuItemIcon" />} 
          onClick={(e) => { e.stopPropagation(); onRename?.(); }}
        >
          Rename
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item 
          color="red" 
          leftSection={<IconTrash className="menuItemIcon" />} 
          onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
        >
          Remove
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
