import React, { useMemo } from 'react';
import { Box, Text, useMantineTheme } from '@mantine/core';
import * as Diff from 'diff';

interface ApprovalDiffViewerProps {
  oldText: string;
  newText: string;
}

export const ApprovalDiffViewer: React.FC<ApprovalDiffViewerProps> = ({ oldText, newText }) => {
  const theme = useMantineTheme();
  
  const diffResult = useMemo(() => {
    return Diff.diffWordsWithSpace(oldText || '', newText || '');
  }, [oldText, newText]);

  return (
    <Box 
      style={{ 
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        fontFamily: theme.fontFamilyMonospace,
        fontSize: theme.fontSizes.sm,
      }}
    >
      {diffResult.map((part, index) => {
        if (part.added) {
          return (
            <Text 
              key={index} 
              span 
              c="green.5" 
            >
              {part.value}
            </Text>
          );
        }
        if (part.removed) {
          return (
            <Text 
              key={index} 
              span 
              c="red.5" 
              td="line-through" 
            >
              {part.value}
            </Text>
          );
        }
        return (
          <Text key={index} span c="gray.3">
            {part.value}
          </Text>
        );
      })}
    </Box>
  );
};
