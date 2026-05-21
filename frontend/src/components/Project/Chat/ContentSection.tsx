import React from 'react';
import { Box, Text, Group } from '@mantine/core';
import './ContentSection.css';

interface ContentSectionProps {
  children: React.ReactNode;
  title?: string;
  actionLabel?: string;
  onAction?: () => void;
  rightSection?: React.ReactNode;
}

export const ContentSection: React.FC<ContentSectionProps> = ({
  children,
  title,
  actionLabel,
  onAction,
  rightSection
}) => {
  return (
    <Box className="content-section-container">
      {(title || actionLabel || rightSection) && (
        <Box className="content-section-header">
          <Group gap="xs" align="center">
            {title && (
              <Text className="content-section-title">
                {title}
              </Text>
            )}
          </Group>
          <Group gap="sm" align="center">
            {actionLabel && (
              <Text className="content-section-action" onClick={onAction}>
                {actionLabel}
              </Text>
            )}
            {rightSection}
          </Group>
        </Box>
      )}
      <Box className="content-section-body">
        {children}
      </Box>
    </Box>
  );
};
