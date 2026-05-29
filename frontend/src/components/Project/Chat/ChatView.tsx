import React, { useState, useCallback, useRef } from 'react';
import { ActionIcon, Box, Group, Stack, Text, Tooltip } from '@mantine/core';
import { AnimatePresence, motion } from 'motion/react';
import { ProjectHeader } from '../ProjectHeader';
import { ProjectDashboard } from '../ProjectDashboard';
import { PromptInput } from './PromptInput/PromptInput';
import { Source, SourceGroup } from '../Sources/types';
import { ChatItemData } from './ChatItem';
import { ChatConversation, ChatMessage } from './ChatConversation/ChatConversation';
import { useChatStream } from '../../../hooks/useChatStream';
import { ManageSourcesModal } from './PromptInput/ManageSourcesModal/ManageSourcesModal';
import '../ProjectDashboard.css';
import { AutomationBuilder } from '@/components/Automations/AutomationBuilder/AutomationBuilder';
import { ResizeDivider } from './ResizeDivider';
import { PromptClarification, ClarificationQuestionData } from './PromptInput/PromptClarification/PromptClarification';
import { Project } from '../../../api/projects';

const MOCK_CHATS: ChatItemData[] = [
  { id: 'c1', title: 'Optimizing vector embeddings', preview: 'We discussed chunking strategies and how to improve retrieval accuracy with hybrid search...', timestamp: '2h ago', isSaved: true },
  { id: 'c2', title: 'API rate-limit architecture', preview: 'Designed a token-bucket approach with Redis for the ingestion pipeline...', timestamp: '5h ago', isSaved: false },
  { id: 'c3', title: 'Database schema migration', preview: 'Planned the migration from MongoDB to PostgreSQL with zero downtime...', timestamp: 'Yesterday', isSaved: true },
  { id: 'c4', title: 'React component refactor', preview: 'Broke down the monolithic dashboard into composable widgets...', timestamp: 'Yesterday', isSaved: false },
  { id: 'c5', title: 'CI/CD pipeline review', preview: 'Reviewed GitHub Actions workflows and added caching for faster builds...', timestamp: '2 days ago', isSaved: false },
];



interface ChatViewProps {
  project: Project;
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
  project,
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isManageSourcesModalOpen, setIsManageSourcesModalOpen] = useState(false);

  // Clarification questions state — driven externally by MarkdownResponse
  const [clarificationQuestions, setClarificationQuestions] = useState<ClarificationQuestionData[]>([]);
  const [showClarification, setShowClarification] = useState(false);

  const threadIdRef = useRef(`chat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);
  const { mutate, streamedContent, isPending, data } = useChatStream(threadIdRef.current);

  const handleSendMessage = useCallback((value: string, isAutomation: boolean = false) => {
    if (isPending) {
      return;
    }
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: value,
      timestamp
    }]);
    setShowClarification(false);
    mutate({ prompt: value, isAutomation }, {
      onSuccess: (finalContent) => {
        setMessages((prev) => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: finalContent as string,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    });
  }, [mutate]);

  /** Called from MarkdownResponse / ClarificationBlock to show clarification above the prompt */
  const handleTriggerClarification = useCallback((questions: ClarificationQuestionData[]) => {
    setClarificationQuestions(questions);
    setShowClarification(true);
  }, []);

  const handleClarificationSubmit = useCallback((formattedAnswer: string) => {
    setShowClarification(false);
    setClarificationQuestions([]);
    handleSendMessage(formattedAnswer);
  }, [handleSendMessage]);

  const handleClarificationClose = useCallback(() => {
    setClarificationQuestions([]);
    setShowClarification(false);
  }, []);

  const [isAutomationMode, setIsAutomationMode] = useState(false);
  const [automationBuilderData, setAutomationBuilderData] = useState<{ nodes: any[], edges: any[], name?: string } | null>(null);

  const handleAutomationGenerated = useCallback((data: any) => {
    setAutomationBuilderData(data);
    setIsAutomationMode(true);
  }, []);

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


  const showMarkdownResponse = messages.length > 0 || isPending;

  return (
    <Box p="0" pr="0" pt="0" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, position: 'relative' }}>
      <ProjectHeader title={project.name} />

      <AnimatePresence initial={false}>
        {showMarkdownResponse && isAutomationMode && automationBuilderData && (
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
              <AutomationBuilder
                height="100%"
                initialName={automationBuilderData?.name}
                initialNodes={automationBuilderData?.nodes}
                initialEdges={automationBuilderData?.edges}
                projectId={project.id}
              />
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
              <ChatConversation
                messages={messages}
                streamedContent={streamedContent}
                isStreaming={isPending}
                onSubmitAnswer={handleSendMessage}
                onTriggerClarification={handleTriggerClarification}
                onAutomationGenerated={handleAutomationGenerated}
              />
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
                onToggleChatSave={handleToggleSave}
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
          <AnimatePresence>
            {showClarification && clarificationQuestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: 16, height: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <PromptClarification
                  questions={clarificationQuestions}
                  onSubmit={handleClarificationSubmit}
                  onClose={handleClarificationClose}
                />
              </motion.div>
            )}
          </AnimatePresence>
          <PromptInput
            initialValue=""
            onSubmit={(value, modeId) => {
              handleSendMessage(value, modeId === 'automation');
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
