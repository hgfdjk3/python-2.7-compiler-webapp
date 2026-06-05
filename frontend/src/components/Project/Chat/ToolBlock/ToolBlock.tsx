import React, { useState } from 'react';
import { Card, Text, Code, Group, Collapse, ActionIcon, ThemeIcon, Box, Badge, Tooltip, Divider, Accordion } from '@mantine/core';
import {
  IconChevronDown,
  IconChevronUp,
  IconTerminal,
  IconSearch,
  IconFileText,
  IconDatabase,
  IconCode,
  IconCpu,
  IconHammer,
  IconCheck,
  IconLoader,
  IconTool,
  IconChevronRight
} from '@tabler/icons-react';
import './ToolBlock.css';
import { useDisclosure } from '@mantine/hooks';

import { getToolIcon } from '../../../../utils/iconUtils';

interface ToolCallBlockProps {
  name?: string;
  children?: React.ReactNode;
}

export const ToolCallBlock: React.FC<ToolCallBlockProps> = ({ name, children }) => {
  const [open, { toggle }] = useDisclosure(false)

  return (<>
    <Group w="100%" wrap="nowrap" gap="5" justify='space-between'>
      <Group w="100%" wrap="nowrap" gap="5">

        <ThemeIcon variant='outline' color="dimmed" c="dimmed" size="xs" radius={5}>
          {getToolIcon(name ?? "", { size: 12 })}
        </ThemeIcon>

        <Divider w="100%" label={name} labelPosition='left' />
      </Group>
      <ThemeIcon variant='transparent' onClick={toggle} size="xs" radius={5} >
        <IconChevronRight size={16} color="var(--mantine-color-default-border)" />
      </ThemeIcon>
    </Group>
    <Collapse expanded={open}>
      {JSON.stringify(children)}
    </Collapse>

  </>
  );
};

