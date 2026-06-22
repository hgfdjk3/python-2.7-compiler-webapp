import React from 'react';
import { Menu } from '@mantine/core';
import { IconDotsVertical, IconFileText, IconDownload, IconUpload, IconRefresh } from '@tabler/icons-react';
import { ToolbarButton } from './ToolbarButton';

interface GraphOptionsMenuProps {
  onExtractText: () => void;
  onRethinkConnections: () => void;
}

export const GraphOptionsMenu: React.FC<GraphOptionsMenuProps> = ({ onExtractText, onRethinkConnections }) => {
  return (
    <Menu shadow="md" width={200} position="bottom-end" offset={16}>
      <Menu.Target>
        {/* We have to wrap custom component in a div or use forwardRef in ToolbarButton, but since we can't easily change ToolbarButton right now, we wrap it in a div */}
        <div>
          <ToolbarButton
            icon={<IconDotsVertical size={18} />}
            label="More Options"
            color="gray"
            onClick={() => { }}
          />
        </div>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Data Actions</Menu.Label>
        <Menu.Item leftSection={<IconFileText size={14} />} onClick={onExtractText}>
          Extract from Text
        </Menu.Item>
        <Menu.Item leftSection={<IconRefresh size={14} />} onClick={onRethinkConnections}>
          Rethink Connections
        </Menu.Item>
        <Menu.Item leftSection={<IconUpload size={14} />} disabled>
          Import Graph (Coming soon)
        </Menu.Item>
        <Menu.Item leftSection={<IconDownload size={14} />} disabled>
          Export Graph (Coming soon)
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
