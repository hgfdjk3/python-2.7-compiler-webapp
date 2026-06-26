import React, { useEffect } from 'react';
import { Code, Group, Collapse, ThemeIcon, Card, Text, Loader, ActionIcon, Box, Divider } from '@mantine/core';
import { ToolDataTable } from './ToolDataTable/ToolDataTable';
import { IconChevronRight, IconCheck } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';

import { getToolIcon } from '../../../../utils/iconUtils';
import { useApprovalStore } from '../../../../utils/approvalStore';

interface ToolCallBlockProps {
  name?: string;
  children?: React.ReactNode;
}

export const ToolCallBlock: React.FC<ToolCallBlockProps> = ({ name, children }) => {
  const [open, { toggle }] = useDisclosure(false);

  const cleanName = (name?.replace(/^user-content-/, '') || '').trim();

  let isRunning = true;
  let parsed: any = null;
  let outputPreview = "";

  try {
    parsed = JSON.parse(String(children));
    if (parsed && parsed.output !== undefined) {
      isRunning = false;
      outputPreview = typeof parsed.output === 'string' ? parsed.output : JSON.stringify(parsed.output);
      // Truncate preview
      if (outputPreview.length > 150) {
        outputPreview = outputPreview.substring(0, 150) + "...";
      }
    }
  } catch (e) {
    // If it fails to parse, it's still streaming, so it's running
  }

  const isPendingApprovalExec = useApprovalStore((state) =>
    Object.values(state.activeTools).some(n => n.trim().toLowerCase() === cleanName.toLowerCase())
  );

  // Claim the execution if it was pending and NOW it has finished executing
  useEffect(() => {
    if (!isRunning && cleanName) {
      useApprovalStore.getState().claimToolExecution(cleanName);
    }
  }, [cleanName, isRunning]);

  // If this tool has an active approval block, hide this block entirely.
  // The ApproveToolBlock is currently showing the loader.
  // Once this tool finishes executing, the useEffect will claim the execution,
  // which clears isPendingApprovalExec and hides ApproveToolBlock,
  // causing this component to smoothly take its place.
  if (isPendingApprovalExec) {
    return null;
  }

  return (
    <Box mb="xs">
      <Group w="100%" wrap="nowrap" gap={5} justify='space-between'>
        <Group w="100%" wrap="nowrap" gap={5}>
          <ThemeIcon variant={isRunning ? 'light' : 'outline'} color={isRunning ? "blue" : "dimmed"} c="dimmed" size="xs" radius={5}>
            {getToolIcon(cleanName ?? "", { size: 12 })}
          </ThemeIcon>

          <Divider
            w="100%"
            label={cleanName}
            labelPosition='left'
          />
        </Group>
        <ThemeIcon variant='transparent' onClick={toggle} size="xs" radius={5} style={{ cursor: 'pointer' }}>
          <IconChevronRight size={16} color="var(--mantine-color-default-border)" style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
        </ThemeIcon>
      </Group>

      {/* {outputPreview && (
          <Box pl={28} mt={5}>
            <Text size="xs" c="dimmed" lineClamp={2} style={{ fontStyle: 'italic' }}>
              {outputPreview}
            </Text>
          </Box>
        )} */}

      <Collapse expanded={open}>
        <Box pl={28} mt="xs">
          <ToolDataTable data={parsed} rawString={String(children)} />
        </Box>
      </Collapse>
    </Box>
  );
};

