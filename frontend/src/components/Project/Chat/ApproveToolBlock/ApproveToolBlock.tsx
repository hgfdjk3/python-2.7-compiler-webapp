import React, { useState, useEffect } from 'react';
import { Box, Group, ThemeIcon, Divider, Collapse, Code, Card, Text, Loader, ActionIcon } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';

import { getToolIcon } from '../../../../utils/iconUtils';
import { ToolApprovalCard } from '../ToolApprovalCard/ToolApprovalCard';
import { useApprovalStore } from '../../../../utils/approvalStore';
import { ToolDataTable } from '../ToolBlock/ToolDataTable/ToolDataTable';
import { useToolMetadata } from '../../../../api/connectors';

interface ApproveToolBlockProps {
  name?: string;
  id?: string;
  onSubmitApproval?: (toolCallId: string, toolName: string, decision: 'allow' | 'reject' | 'try_again' | 'always_allow') => void;
  children?: React.ReactNode;
}

export const ApproveToolBlock: React.FC<ApproveToolBlockProps> = ({ name, id, onSubmitApproval, children }) => {
  const [open, { toggle }] = useDisclosure(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cleanId = (id?.replace(/^user-content-/, '') || '').trim();
  const cleanName = (name?.replace(/^user-content-/, '') || '').trim();

  const { data: toolMetadata } = useToolMetadata(cleanName);
  const displayName = toolMetadata?.display_name || cleanName;
  const displayDescription = toolMetadata?.display_description || '';

  const decision = useApprovalStore((state) => state.decisions[cleanId]);
  const isActive = useApprovalStore((state) => !!state.activeTools[cleanId]);
  const setPendingApproval = useApprovalStore((state) => state.setPendingApproval);

  useEffect(() => {
    if (!decision && cleanId) {
      setPendingApproval(cleanId, true);
    } else if (cleanId) {
      setPendingApproval(cleanId, false);
    }
    return () => {
      if (cleanId) {
        setPendingApproval(cleanId, false);
      }
    };
  }, [decision, cleanId, setPendingApproval]);

  if (decision && !isActive) {
    return null; // ToolCallBlock has claimed it, or it was rejected
  }

  const handleDecision = async (userDecision: 'allow' | 'reject' | 'try_again' | 'always_allow') => {
    if (!onSubmitApproval || !cleanId || !cleanName) {
      console.error("Cannot submit approval. Missing props:", { hasSubmitFn: !!onSubmitApproval, id: cleanId, name: cleanName });
      return;
    }
    setIsSubmitting(true);
    await onSubmitApproval(cleanId, cleanName, userDecision);
    setIsSubmitting(false);
  };

  let parsedArgs: any = null;
  try {
    parsedArgs = JSON.parse(String(children));
  } catch (e) {
    // Ignore
  }

  return (
    <Box mb="xs">
      <Group w="100%" wrap="nowrap" gap={5} justify='space-between'>
        <Group w="100%" wrap="nowrap" gap={5}>
          <ThemeIcon variant="outline" color="dimmed" c="dimmed" size="xs" radius={5}>
            {getToolIcon(cleanName || "Unknown Tool", { size: 12 })}
          </ThemeIcon>

          <Divider
            w="100%"
            label={
              <span>
                <span style={{ fontWeight: 500, fontSize: '12px' }}>{displayName}</span>
                {displayDescription && (
                  <span style={{ fontSize: '10px', color: 'var(--mantine-color-dimmed)', marginLeft: '4px', fontWeight: 400 }}>- {displayDescription}</span>
                )}
              </span>
            }
            labelPosition='left'
          />
        </Group>
        <ThemeIcon variant='transparent' onClick={toggle} size="xs" radius={5} style={{ cursor: 'pointer' }}>
          <IconChevronRight size={16} color="var(--mantine-color-default-border)" style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
        </ThemeIcon>
      </Group>


      {!decision && (
        <Collapse expanded={open}>
          <Box pl={28} mt="xs">
            <ToolDataTable data={parsedArgs} rawString={String(children)} />
          </Box>
        </Collapse>
      )}
      {!decision && (
        <Group mb={100} justify="flex-end">
          <ToolApprovalCard
            toolName={cleanName || 'Unknown Tool'}
            toolArgs={children ? String(children) : ''}
            onDecision={handleDecision}
            isSubmitting={isSubmitting}
          />
        </Group>
      )}
    </Box>
  );
};
