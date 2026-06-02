import React, { useState } from 'react';
import { Box, Stack, Group, Text, Collapse } from '@mantine/core';
import { ContentSection } from './Chat/ContentSection';
import { RecentChats } from './Chat/RecentChats';
import { AutomationsList } from '../Automations/AutomationsList';
import { ChatItemData } from './Chat/ChatItem';
import './ProjectDashboard.css';

interface ProjectDashboardProps {
  chats: ChatItemData[];
  onToggleChatSave: (id: string) => void;
  onChatClick?: (id: string) => void;
  onAutomationClick?: (id: string) => void;
  onRunAutomation?: (id: string) => void;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  chats,
  onToggleChatSave,
  onChatClick,
  onAutomationClick,
  onRunAutomation,
}) => {
  // We only fetch here to get the counts for the header, AutomationsList handles its own fetching and logic
  const [expandedSection, setExpandedSection] = useState<'chats' | 'automations' | null>(null);

  return (
    <Box className="chat-content-area" maw={{ xs: 800, sm: 900, md: 1000, lg: 1100, xl: 1000 }}>
      <Stack gap="md">
        <Collapse expanded={expandedSection === null || expandedSection === 'chats'}>
          <ContentSection
            title="Recent Chats"
            actionLabel={
              expandedSection === 'chats'
                ? "Go back"
                : chats.length > 4 ? "View all" : undefined
            }
            onAction={() => setExpandedSection(expandedSection === 'chats' ? null : 'chats')}
          >
            <RecentChats
              chats={chats}
              onChatClick={onChatClick}
              onToggleSave={onToggleChatSave}
              limit={expandedSection === 'chats' ? undefined : 4}
            />
          </ContentSection>
        </Collapse>

        <Collapse expanded={expandedSection === null || expandedSection === 'automations'}>
          <ContentSection
            title="Automations"
            actionLabel={
              expandedSection === 'automations'
                ? "Go back"
                : "View all"
            }
            onAction={() => setExpandedSection(expandedSection === 'automations' ? null : 'automations')}
          >
            <AutomationsList
              onAutomationClick={onAutomationClick}
              onRunAutomation={onRunAutomation}
              limit={expandedSection === 'automations' ? undefined : 4}
            />
          </ContentSection>
        </Collapse>
        <Box h={120} />
      </Stack>
    </Box>
  );
};
