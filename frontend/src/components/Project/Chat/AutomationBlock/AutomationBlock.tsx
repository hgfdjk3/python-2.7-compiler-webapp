import React from 'react';
import { Box, Card, Group, Text } from '@mantine/core';

export interface AutomationBlockProps {
  content: string;
  onAutomationGenerated?: (data: any) => void;
}

export const AutomationBlock: React.FC<AutomationBlockProps> = ({ content, onAutomationGenerated }) => {
  const [jsonData, setJsonData] = React.useState<any>(null);
  React.useEffect(() => {
    if (!onAutomationGenerated || !content) return;
    try {
      const data = JSON.parse(content);
      if (data && data.nodes && data.edges) {
        setJsonData(data);
        onAutomationGenerated(data);
      }
    } catch (e) {
      // ignore parsing error while streaming
    }
  }, [content, onAutomationGenerated]);

  return (
    <Card withBorder p="md" radius="md" mt="sm">
      <Group>
        <div style={{
          background: 'var(--mantine-color-blue-light)',
          borderRadius: '50%',
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--mantine-color-blue-filled)'
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2z" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="M20 12h2" />
            <path d="M2 12h2" />
            <path d="M9 10l3 -3l3 3" />
            <path d="M9 14l3 3l3 -3" />
          </svg>
        </div>
        <Box>
          <Text fw={500} size="sm">Automation Generated</Text>
          <Text size="xs" c="dimmed">The automation workflow has been loaded into the builder above.</Text>
        </Box>
        {jsonData?.nodes.length} nodes and {jsonData?.edges.length} edges
      </Group>
    </Card>
  );
};
