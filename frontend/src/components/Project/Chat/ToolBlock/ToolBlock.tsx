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

// Dynamically select an icon based on the tool's name
export const getToolIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('search') || lower.includes('google') || lower.includes('web') || lower.includes('fetch')) {
    return IconSearch;
  }
  if (lower.includes('file') || lower.includes('read') || lower.includes('write') || lower.includes('dir') || lower.includes('list')) {
    return IconFileText;
  }
  if (lower.includes('db') || lower.includes('sql') || lower.includes('database') || lower.includes('postgres') || lower.includes('redis')) {
    return IconDatabase;
  }
  if (lower.includes('code') || lower.includes('execute') || lower.includes('python') || lower.includes('run') || lower.includes('compiler')) {
    return IconCode;
  }
  if (lower.includes('api') || lower.includes('http') || lower.includes('request') || lower.includes('curl') || lower.includes('mcp')) {
    return IconCpu;
  }
  return IconHammer;
};

interface ToolCallBlockProps {
  name?: string;
  children?: React.ReactNode;
}

export const ToolCallBlock: React.FC<ToolCallBlockProps> = ({ name, children }) => {
  const [open, { toggle }] = useDisclosure(false)
  const ToolIcon = getToolIcon(name ?? "");

  return (<>
    <Group w="100%" wrap="nowrap" gap="5" justify='space-between'>
      <Group w="100%" wrap="nowrap" gap="5">

        {/* <Text size="xs">{name}</Text> */}
        <ThemeIcon variant='outline' color="dimmed" c="dimmed" size="xs" radius={5} >
          <IconTool size={12} />
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

