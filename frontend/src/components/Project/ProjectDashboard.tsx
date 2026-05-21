import React from 'react';
import { Box, Stack, Group, Text, Tooltip, ActionIcon } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { ContentSection } from './Chat/ContentSection';
import { RecentChats } from './Chat/RecentChats';
import { AutomationsList } from '../Automations/AutomationsList';
import { ChatItemData } from './Chat/ChatItem';
import { AutomationData } from '../Automations/AutomationItem';
import { ScheduleConfiguratorModal } from '../Automations/ScheduleConfiguratorModal';
import { ScheduleConfig } from '../Automations/ScheduleConfigurator';
import './ProjectDashboard.css';

interface ProjectDashboardProps {
  chats: ChatItemData[];
  automations: AutomationData[];
  onToggleChatSave: (id: string) => void;
  onToggleAutomationActive: (id: string) => void;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  chats,
  automations,
  onToggleChatSave,
  onToggleAutomationActive,
}) => {
  const [scheduleModalOpen, setScheduleModalOpen] = React.useState(false);
  const [schedulingAutomationId, setSchedulingAutomationId] = React.useState<string | null>(null);

  const handleScheduleClick = (id: string) => {
    setSchedulingAutomationId(id);
    setScheduleModalOpen(true);
  };

  const handleSaveSchedule = (config: ScheduleConfig) => {
    console.log('Saved schedule for', schedulingAutomationId, config);
    // Here we would typically notify the parent or API of the schedule update
  };

  const selectedAutomation = automations.find(a => a.id === schedulingAutomationId);
  return (
    <Box className="chat-content-area" maw={{ xs: 800, sm: 900, md: 1000, lg: 1100, xl: 1000 }}>
      <Stack gap="md">
        <ContentSection
          title="Recent Chats"
          actionLabel={chats.length > 4 ? "View all" : undefined}
          onAction={() => console.log('See all chats clicked')}
        >
          <RecentChats
            chats={chats}
            onToggleSave={onToggleChatSave}
            limit={5}
          />
        </ContentSection>

        <ContentSection
          title="Automations"
          rightSection={
            <Group gap="xs" align="center">
              <Text size="xs" c="dimmed" style={{ opacity: 0.6, fontWeight: 500 }}>
                {automations.filter((a) => a.isActive).length}/{automations.length} ACTIVE
              </Text>
              <Tooltip label="New automation" withArrow>
                <ActionIcon variant="subtle" color="gray" size="sm">
                  <IconPlus size={14} stroke={2} />
                </ActionIcon>
              </Tooltip>
            </Group>
          }
        >
          <AutomationsList
            automations={automations}
            onToggleActive={onToggleAutomationActive}
            onScheduleClick={handleScheduleClick}
          />
        </ContentSection>
        <Box h={120} />
      </Stack>

      <ScheduleConfiguratorModal
        opened={scheduleModalOpen}
        onClose={() => {
          setScheduleModalOpen(false);
          setSchedulingAutomationId(null);
        }}
        onSave={handleSaveSchedule}
        automationName={selectedAutomation?.name}
      />
    </Box>
  );
};
