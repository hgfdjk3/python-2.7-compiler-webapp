import React from 'react';
import { Accordion, Box, Text, Divider } from '@mantine/core';
import { IconTool } from '@tabler/icons-react';

export interface Tool {
  name: string;
  input?: any;
  output?: any;
}

export interface ToolExecutionCardProps {
  tool: Tool;
  isLast: boolean;
  value: string;
}

export const ToolExecutionCard: React.FC<ToolExecutionCardProps> = ({ tool, isLast, value }) => {
  return (
    <Accordion.Item value={value} style={{ borderBottom: isLast ? 'none' : undefined }}>
      <Accordion.Control icon={<IconTool size={12} color="var(--mantine-color-zinc-5)" />}>
        <Text size="10px" fw={500} c="zinc.7">{tool.name}</Text>
      </Accordion.Control>
      <Accordion.Panel>
        <Box pl="sm" style={{ borderLeft: '2px solid var(--mantine-color-zinc-2)' }}>
          {tool.input && (
            <Box mb={tool.output ? 'xs' : 0}>
              <Text size="9px" fw={600} c="dimmed" tt="uppercase" mb={2}>Input</Text>
              <Text size="10px" ff="monospace" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {JSON.stringify(tool.input, null, 2)}
              </Text>
            </Box>
          )}
          {tool.output && (
            <Box style={{ paddingTop: tool.input ? 4 : 0 }}>
              {tool.input && <Divider mb="xs" variant="dashed" />}
              <Text size="9px" fw={600} c="dimmed" tt="uppercase" mb={2}>Output</Text>
              <Text size="10px" ff="monospace" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {typeof tool.output === 'string' ? tool.output : JSON.stringify(tool.output, null, 2)}
              </Text>
            </Box>
          )}
        </Box>
      </Accordion.Panel>
    </Accordion.Item>
  );
};
