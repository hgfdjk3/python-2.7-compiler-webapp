import React from 'react';
import { Box, Button, Group } from '@mantine/core';
import { Source } from '../../Sources/types';
import { PromptInputHiddenSources } from './PromptInputHiddenSources';
import { PromptInputSourceBadge } from './PromptInputSourceBadge';

import { AnimatePresence } from 'framer-motion';
import { AnimatedItem } from '../../../animations/AnimatedItem';

export interface PromptInputSourcesProps {
  attachedSources: Source[];
  onDetachSource?: (sourceId: string) => void;
  emptySourcesLabel?: string;
  isDropTarget?: boolean;
  maxVisible?: number;
}

export const PromptInputSources: React.FC<PromptInputSourcesProps> = ({
  attachedSources,
  onDetachSource,
  emptySourcesLabel,
  isDropTarget,
  maxVisible = 2,
}) => {
  const visibleSources = attachedSources.slice(0, maxVisible);
  const hiddenSources = attachedSources.slice(maxVisible);

  return (
    <Box className="promptInputSources" data-over={isDropTarget || undefined}>
      <Group gap="xs" wrap="nowrap" align="center">
        <AnimatePresence mode="wait">
          {attachedSources.length > 0 ? (
            <>
              {visibleSources.map(source => (
                <AnimatedItem key={source.id}>
                  <PromptInputSourceBadge
                    source={source}
                    onDetachSource={onDetachSource}
                  />
                </AnimatedItem>
              ))}
              {hiddenSources.length > 0 && (
                <AnimatedItem key="hidden-sources-menu">
                  <PromptInputHiddenSources hiddenSources={hiddenSources} onDetachSource={onDetachSource} />
                </AnimatedItem>
              )}
            </>
          ) : (
            <AnimatedItem key="empty-state">
              <Button size="xs" variant="subtle" color="gray" radius="xl" disabled>
                {emptySourcesLabel}
              </Button>
            </AnimatedItem>
          )}
        </AnimatePresence>
      </Group>
    </Box>
  );
};
