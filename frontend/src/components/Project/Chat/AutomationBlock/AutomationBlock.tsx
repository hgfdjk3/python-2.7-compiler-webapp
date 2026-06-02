import React from 'react';
import { Box, Card, Group, Text, Timeline, ThemeIcon, Collapse, ActionIcon } from '@mantine/core';
import { IconCheck, IconRobot, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { useChatStore } from '@/store/chatStore';


export interface AutomationBlockProps {
  content: string;
}

export const AutomationBlock: React.FC<AutomationBlockProps> = ({ content }) => {
  const [jsonData, setJsonData] = React.useState<any>(null);
  const [opened, setOpened] = React.useState(false);
  const setAutomationBuilderData = useChatStore((state) => state.setAutomationBuilderData);
  const setIsAutomationMode = useChatStore((state) => state.setIsAutomationMode);

  React.useEffect(() => {
    if (!content) return;
    try {
      const data = JSON.parse(content);
      if (data && data.nodes && data.edges) {
        setJsonData(data);
        setAutomationBuilderData(data);
        setIsAutomationMode(true);
      }
    } catch (e) {
      // ignore parsing error while streaming
    }
  }, [content, setAutomationBuilderData, setIsAutomationMode]);

  // If streaming but no valid JSON yet, show loading/generating state
  if (!jsonData) {
    return (
      <Card withBorder p="md" radius="md" mt="sm">
        <Group>
          <ThemeIcon size="lg" radius="xl" variant="light" color="blue">
            <IconRobot size={18} />
          </ThemeIcon>
          <Box>
            <Text fw={500} size="sm">Generating Automation...</Text>
            <Text size="xs" c="dimmed">Drafting workflow steps and connections.</Text>
          </Box>
        </Group>
      </Card>
    );
  }

  return (
    <Card withBorder p="md" radius="md" mt="sm">
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <Group>
          <ThemeIcon size="lg" radius="xl" variant="light" color="green">
            <IconCheck size={18} />
          </ThemeIcon>
          <Box>
            <Text fw={500} size="sm">Automation Generated Successfully</Text>
            <Text size="xs" c="dimmed">{jsonData?.name}</Text>
          </Box>
        </Group>
        <ActionIcon variant="subtle" color="gray" onClick={() => setOpened((o) => !o)}>
          {opened ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
        </ActionIcon>
      </Group>

      <Collapse expanded={opened}>
        <Box pl="xs" mt="md">
          <Timeline active={jsonData.nodes.length} bulletSize={24} lineWidth={2} color="blue">
            {jsonData.nodes.map((node: any) => (
              <Timeline.Item key={node.id} title={<Text fw={500} size="sm">{node.data?.title || 'Step'}</Text>}>
                <Text c="dimmed" size="xs" mt={4}>{node.data?.description}</Text>
                {node.data?.tools && node.data.tools.length > 0 && (
                  <Group gap={4} mt={6}>
                    {node.data.tools.map((tool: string) => (
                      <Text key={tool} size="10px" fw={600} c="blue" style={{ background: 'var(--mantine-color-blue-light)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
                        {tool.replace('tool-', '')}
                      </Text>
                    ))}
                  </Group>
                )}
              </Timeline.Item>
            ))}
          </Timeline>
        </Box>
      </Collapse>
    </Card>
  );
};
