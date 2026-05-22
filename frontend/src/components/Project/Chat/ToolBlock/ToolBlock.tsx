import React, { useState } from 'react';
import { Card, Text, Code, Group, Collapse, ActionIcon, ThemeIcon, Box, Badge, Tooltip } from '@mantine/core';
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
  IconLoader
} from '@tabler/icons-react';
import './ToolBlock.css';

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
  const [openedInput, setOpenedInput] = useState(false);
  const [openedOutput, setOpenedOutput] = useState(false);


  const ToolIcon = getToolIcon(name ?? "");

  const hasOutput = true
  return (
    <Card className={`tool-block-card tool-call-card completed`} withBorder p="md" radius="md" mb="sm">
      <Group justify="space-between" wrap="nowrap">
        <Group gap="sm" wrap="nowrap" style={{ flex: 1 }}>
          <ThemeIcon
            className={`tool-icon-wrapper output-icon`}
            size="lg"
            radius="md"
            variant="light"
          >
            <IconCheck size={20} />
          </ThemeIcon>
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Group gap="xs" align="center">
              <Text size="sm" fw={700} c="zinc.2" className="tool-call-title">
                {hasOutput ? 'Tool Executed: ' : 'Executing Tool: '}
                <span className="tool-highlight">{name}</span>
              </Text>
              {hasOutput ? (
                <Badge size="xs" color="emerald" variant="light">
                  Completed
                </Badge>
              ) : (
                <Badge size="xs" color="violet" variant="light" className="pulse-badge">
                  Active
                </Badge>
              )}
            </Group>
            <Text size="xs" c="zinc.5" truncate>
              {hasOutput ? 'Output returned successfully' : 'Preparing parameters & running...'}
            </Text>
          </Box>
        </Group>

        <Group gap="xs">
          {!name && !hasOutput ? (
            <ActionIcon variant="transparent" c="zinc.4" className="spinning-loader">
              <IconLoader size={18} />
            </ActionIcon>
          ) : (
            <Group gap="xs">
              {name && (
                <Tooltip label={openedInput ? "Hide arguments" : "View arguments"}>
                  <Badge
                    variant="subtle"
                    color="zinc"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setOpenedInput(!openedInput)}
                  >
                    Arguments {openedInput ? '▲' : '▼'}
                  </Badge>
                </Tooltip>
              )}
              {hasOutput && (
                <Tooltip label={openedOutput ? "Hide response" : "View response"}>
                  <Badge
                    variant="subtle"
                    color="emerald"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setOpenedOutput(!openedOutput)}
                  >
                    Response {openedOutput ? '▲' : '▼'}
                  </Badge>
                </Tooltip>
              )}
            </Group>
          )}
        </Group>
      </Group>

      {/* Input arguments collapse */}
      <Collapse expanded={openedInput}>
        <Box mt="md" className="tool-code-container">
          <Text size="xs" fw={600} c="zinc.4" mb="xs">Arguments JSON</Text>
          <Code block className="tool-code-block" lang="json">11
          </Code>
        </Box>
      </Collapse>

      {/* Output response collapse */}
      <Collapse in={openedOutput}>
        <Box mt="md" className="tool-code-container" style={{ borderTop: '1px dashed var(--mantine-color-zinc-8)' }}>
          <Text size="xs" fw={600} c="zinc.4" mb="xs">Response Payload</Text>
          <Code block className="tool-code-block" lang="json">11
          </Code>
        </Box>
      </Collapse>
    </Card>
  );
};

interface ToolOutputBlockProps {
  content: string;
}

export const ToolOutputBlock: React.FC<ToolOutputBlockProps> = ({ content }) => {
  const [opened, setOpened] = useState(false);

  let toolName = 'Agent Tool';
  let toolOutput: any = null;
  let isParsed = false;

  try {
    const data = JSON.parse(content);
    toolName = data.name || toolName;
    toolOutput = data.output;
    isParsed = true;
  } catch (e) {
    // If not fully streamed yet, extract tool name using regex
    const nameMatch = content.match(/"name"\s*:\s*"([^"]+)"/);
    if (nameMatch) {
      toolName = nameMatch[1];
    }
  }

  const ToolIcon = getToolIcon(toolName);

  // Format outputs nicely
  let formattedOutput = '';
  if (isParsed && toolOutput !== null && toolOutput !== undefined) {
    if (typeof toolOutput === 'string') {
      try {
        // Attempt to pretty-print if output itself is a JSON string
        const parsedOutput = JSON.parse(toolOutput);
        formattedOutput = JSON.stringify(parsedOutput, null, 2);
      } catch {
        formattedOutput = toolOutput;
      }
    } else {
      formattedOutput = JSON.stringify(toolOutput, null, 2);
    }
  } else {
    // Fallback while streaming
    formattedOutput = content;
  }

  return (
    <Card className="tool-block-card tool-output-card" withBorder p="md" radius="md" mb="sm">
      <Group justify="space-between" wrap="nowrap">
        <Group gap="sm" wrap="nowrap" style={{ flex: 1 }}>
          <ThemeIcon className="tool-icon-wrapper output-icon" size="lg" radius="md" variant="light">
            <IconCheck size={20} />
          </ThemeIcon>
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Group gap="xs" align="center">
              <Text size="sm" fw={700} c="zinc.2" className="tool-output-title">
                Tool returned: <span className="tool-highlight">{toolName}</span>
              </Text>
              {isParsed && (
                <Badge size="xs" color="emerald" variant="light">
                  Completed
                </Badge>
              )}
            </Group>
            <Text size="xs" c="zinc.5" truncate>
              {isParsed ? 'Output returned successfully' : 'Receiving tool results...'}
            </Text>
          </Box>
        </Group>

        <Group gap="xs">
          {!isParsed ? (
            <ActionIcon variant="transparent" c="zinc.4" className="spinning-loader">
              <IconLoader size={18} />
            </ActionIcon>
          ) : (
            <Tooltip label={opened ? "Hide response details" : "View response details"}>
              <ActionIcon
                variant="subtle"
                color="zinc"
                onClick={() => setOpened(!opened)}
                aria-label="Toggle response view"
              >
                {opened ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Group>

      <Collapse expanded={opened && isParsed}>
        <Box mt="md" className="tool-code-container">
          <Text size="xs" fw={600} c="zinc.4" mb="xs">Response Payload</Text>
          <Code block className="tool-code-block" lang="json">
            {formattedOutput}
          </Code>
        </Box>
      </Collapse>
    </Card>
  );
};
