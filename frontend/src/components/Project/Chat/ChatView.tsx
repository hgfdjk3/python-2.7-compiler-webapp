import React, { useState, useCallback } from 'react';
import { ActionIcon, Box, Group, Stack, Text, Tooltip } from '@mantine/core';
import { AnimatePresence, motion } from 'motion/react';
import { ProjectHeader } from '../ProjectHeader';
import { ProjectDashboard } from '../ProjectDashboard';
import { PromptInput } from './PromptInput/PromptInput';
import { Source, SourceGroup } from '../Sources/types';
import { ChatItemData } from './ChatItem';
import { AutomationData } from '../../Automations/AutomationItem';
import { ChatConversation, ChatMessage } from './ChatConversation/ChatConversation';
import { useChatStream } from '../../../hooks/useChatStream';
import { ManageSourcesModal } from './PromptInput/ManageSourcesModal/ManageSourcesModal';
import '../ProjectDashboard.css';
import { AutomationBuilder } from '@/components/Automations/AutomationBuilder/AutomationBuilder';
import { ResizeDivider } from './ResizeDivider';

const MOCK_CHATS: ChatItemData[] = [
  { id: 'c1', title: 'Optimizing vector embeddings', preview: 'We discussed chunking strategies and how to improve retrieval accuracy with hybrid search...', timestamp: '2h ago', isSaved: true },
  { id: 'c2', title: 'API rate-limit architecture', preview: 'Designed a token-bucket approach with Redis for the ingestion pipeline...', timestamp: '5h ago', isSaved: false },
  { id: 'c3', title: 'Database schema migration', preview: 'Planned the migration from MongoDB to PostgreSQL with zero downtime...', timestamp: 'Yesterday', isSaved: true },
  { id: 'c4', title: 'React component refactor', preview: 'Broke down the monolithic dashboard into composable widgets...', timestamp: 'Yesterday', isSaved: false },
  { id: 'c5', title: 'CI/CD pipeline review', preview: 'Reviewed GitHub Actions workflows and added caching for faster builds...', timestamp: '2 days ago', isSaved: false },
];

const MOCK_AUTOMATIONS: AutomationData[] = [
  { id: 'a1', name: 'Daily status digest', description: 'Summarizes all project activity and sends a report to Slack', isScheduled: true, schedule: 'Every day 9:00 AM', isActive: true, lastRun: '2h ago' },
  { id: 'a2', name: 'PR review assistant', description: 'Automatically reviews new pull requests and leaves comments', isScheduled: false, isActive: true, lastRun: '30m ago' },
  { id: 'a3', name: 'Knowledge base sync', description: 'Syncs updated documents from Confluence into project sources', isScheduled: true, schedule: 'Every 6 hours', isActive: false, lastRun: '1 day ago' },
  { id: 'a4', name: 'Bug triage', description: 'Classifies and prioritizes incoming bug reports from Jira', isScheduled: false, isActive: true },
];

interface ChatViewProps {
  sources: Source[];
  standaloneSources: Source[];
  globalSources: Source[];
  groups: SourceGroup[];
  attachedSourceIds: string[];
  onDetachSource: (sourceId: string) => void;
  onToggleSource: (sourceId: string) => void;
  onAddGlobalToProject: (sourceIds: string[]) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  sources,
  standaloneSources,
  globalSources,
  groups,
  attachedSourceIds,
  onDetachSource,
  onToggleSource,
  onAddGlobalToProject,
}) => {
  const [chats, setChats] = useState<ChatItemData[]>(MOCK_CHATS);
  const [automations, setAutomations] = useState<AutomationData[]>(MOCK_AUTOMATIONS);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isManageSourcesModalOpen, setIsManageSourcesModalOpen] = useState(false);

  const { mutate, streamedContent, isPending, data } = useChatStream();

  const [isAutomationMode, setIsAutomationMode] = useState(false);
  const [boardHeight, setBoardHeight] = useState(150);
  const [isResizing, setIsResizing] = useState(false);

  const handleResize = useCallback((deltaY: number) => {
    setBoardHeight((prev) => {
      const newHeight = prev + deltaY;
      return Math.min(Math.max(newHeight, 150), 600);
    });
  }, []);

  const handleToggleBoard = useCallback(() => {
    setBoardHeight((prev) => (prev > 150 ? 150 : 600));
  }, []);

  const handleToggleSave = (id: string) => {
    setChats((current) =>
      current.map((chat) =>
        chat.id === id ? { ...chat, isSaved: !chat.isSaved } : chat
      )
    );
  };

  const handleToggleAutomationActive = (id: string) => {
    setAutomations((current) =>
      current.map((automation) =>
        automation.id === id ? { ...automation, isActive: !automation.isActive } : automation
      )
    );
  };

  const showMarkdownResponse = messages.length > 0 || isPending;

  return (
    <Box p="0" pr="0" pt="0" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, position: 'relative' }}>
      <ProjectHeader title="Operation Grandma" />

      <AnimatePresence initial={false}>
        {showMarkdownResponse && isAutomationMode && (
          <>
            <motion.div
              key="automation-board-container"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: boardHeight, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={isResizing ? { duration: 0 } : { duration: 0.3, ease: "easeInOut" }}
              style={{
                overflow: 'hidden',
                position: 'relative',
                flexShrink: 0,
                pointerEvents: isResizing ? 'none' : 'auto',
                userSelect: isResizing ? 'none' : 'auto'
              }}
            >
              <AutomationBuilder height="100%" />
            </motion.div>
            <ResizeDivider
              onResize={handleResize}
              onResizeStart={() => setIsResizing(true)}
              onResizeEnd={() => setIsResizing(false)}
              onToggle={handleToggleBoard}
            />
          </>
        )}
      </AnimatePresence>
      <Box className="chat-scroll-container" style={{ flex: 1, minHeight: 0 }}>
        <AnimatePresence mode="wait">
          {showMarkdownResponse ? (
            <motion.div
              key="markdown-response"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              style={{ height: '100%' }}
            >
              <ChatConversation messages={messages} streamedContent={streamedContent} isStreaming={isPending} />
            </motion.div>
          ) : (
            <motion.div
              key="project-dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              style={{ height: '100%' }}
            >
              <ProjectDashboard
                chats={chats}
                automations={automations}
                onToggleChatSave={handleToggleSave}
                onToggleAutomationActive={handleToggleAutomationActive}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* Masking Gradient at the bottom */}
      <Box
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 180,
          background: 'linear-gradient(to top, var(--mantine-color-body) 30%, transparent)',
          pointerEvents: 'none',
          zIndex: 90,
        }}
      />

      {/* Floating Input Island */}
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97, x: '-50%' }}
          animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
          exit={{ opacity: 0, y: 40, scale: 0.92, x: '-50%' }}
          transition={{
            duration: 0.5,
            delay: 0.15,
            ease: [0.16, 1, 0.3, 1]
          }}
          style={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            width: '100%',
            maxWidth: 820,
            zIndex: 100,
            padding: '0 20px',
          }}
        >
          <PromptInput
            initialValue=""
            onSubmit={(value, modeId) => {
              const now = new Date();
              const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              setMessages((prev) => [...prev, {
                id: Date.now().toString(),
                role: 'user',
                content: modeId === 'automation' ? `Create Automation: ${value}` : value,
                timestamp
              }]);

              mutate(value, {
                onSuccess: (finalContent) => {
                  setMessages((prev) => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: finalContent as string,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }]);
                }
              });
            }}
            attachedSources={sources.filter((source) => attachedSourceIds.includes(source.id))}
            onDetachSource={onDetachSource}
            onAttachSource={() => setIsManageSourcesModalOpen(true)}
            emptySourcesLabel="Project Sources"
            isAutomationMode={isAutomationMode}
            onAutomationModeToggle={setIsAutomationMode}
          />
        </motion.div>
      </AnimatePresence>

      <ManageSourcesModal
        opened={isManageSourcesModalOpen}
        onClose={() => setIsManageSourcesModalOpen(false)}
        standaloneSources={standaloneSources}
        globalSources={globalSources}
        groups={groups}
        attachedSourceIds={attachedSourceIds}
        onToggleSource={onToggleSource}
        onAddGlobalToProject={onAddGlobalToProject}
      />
    </Box>
  );
};
