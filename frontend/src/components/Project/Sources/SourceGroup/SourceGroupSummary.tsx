import React from 'react';
import { Group, ThemeIcon, Text } from '@mantine/core';
import { Source, SourceType } from '../types';
import { AnimatePresence } from 'motion/react';
import AnimatedItem from '@/components/animations/AnimatedItem';
import { getSourceStyle } from '../sourceTypes';

interface SourceGroupSummaryProps {
  sources: Source[];
}

const MAX_VISIBLE_SOURCE_GROUPS = 3;

export const SourceGroupSummary: React.FC<SourceGroupSummaryProps> = ({ sources = [] }) => {
  const summary = (sources || []).reduce((acc, source) => {
    const styleInfo = getSourceStyle(source.type);
    const color = source.color || styleInfo.color;
    const key = `${source.type}-${color}`;
    if (!acc[key]) {
      acc[key] = { type: source.type, color, count: 0 };
    }
    acc[key].count++;
    return acc;
  }, {} as Record<string, { type: SourceType; color: string; count: number }>);

  const summaryItems = Object.values(summary);

  if (summaryItems.length === 0) {
    return <Text size="10px" c="dimmed">Empty group</Text>;
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <AnimatedItem key="sources">
          <Text size="xs" c="dimmed">Sources:</Text>
        </AnimatedItem>
        {summaryItems.slice(0, MAX_VISIBLE_SOURCE_GROUPS).map((item, index) => {
          const styleInfo = getSourceStyle(item.type);
          return (
          <AnimatedItem key={`${item.type}-${item.color}-${index}`} delay={index * 0.1}>
            <Group gap="3px" wrap="nowrap">
              <Text size="xs" c="dimmed" fw={600}>
                {item.count}
              </Text>
              <ThemeIcon
                variant="light"
                color={item.color}
                size="xs"
                radius="xs"
              >
                {styleInfo.icon}
              </ThemeIcon>
            </Group>
          </AnimatedItem>
        )})}
        {summaryItems.length > MAX_VISIBLE_SOURCE_GROUPS && (
          <AnimatedItem key="more">
            <Text size="xs" c="dimmed">
              And {summaryItems.slice(MAX_VISIBLE_SOURCE_GROUPS).map(it => it.count).reduce((a, b) => a + b, 0)} more
            </Text>
          </AnimatedItem>
        )}
      </AnimatePresence>
    </>
  );
};
