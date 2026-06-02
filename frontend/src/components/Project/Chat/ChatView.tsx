import React, { useState, useCallback, useRef, useEffect } from 'react';
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
import { useChatStore } from '../../../store/chatStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjectConversations, updateConversation, getConversation } from '../../../api/conversations';

export interface QueuedMessage {
  id: string;
  prompt: string;
  isAutomation: boolean;
  timestamp: string;
}

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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isManageSourcesModalOpen, setIsManageSourcesModalOpen] = useState(false);

  // Clarification questions state — driven externally by MarkdownResponse
  const [clarificationQuestions, setClarificationQuestions] = useState<ClarificationQuestionData[]>([]);
  const [showClarification, setShowClarification] = useState(false);

  const [activeThreadId, setActiveThreadId] = useState(() => `chat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);
  const { mutate, streamedContent, isPending } = useChatStream(activeThreadId, project.id);

  const queryClient = useQueryClient();
  const { data: serverChats = [] } = useQuery({
    queryKey: ['conversations', project.id],
    queryFn: () => getProjectConversations(project.id)
  });

  const chats: ChatItemData[] = serverChats.map(c => ({
    id: c.id,
    title: c.title,
    preview: c.preview || '',
    timestamp: new Date(c.updated_at).toLocaleDateString(),
    isSaved: c.isSaved
  }));

  const [queuedMessages, setQueuedMessages] = useState<QueuedMessage[]>([]);

  const processSend = useCallback((prompt: string, isAutomation: boolean, messageId: string, timestamp: string) => {
    setMessages((prev) => [...prev, {
      id: messageId,
      role: 'user',
      content: prompt,
      timestamp
    }]);
    setShowClarification(false);
    mutate({ prompt, isAutomation }, {
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

  const handleSendMessage = useCallback((value: string, isAutomation: boolean = false) => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const messageId = Date.now().toString();

    if (isPending) {
      setQueuedMessages(prev => [...prev, { id: messageId, prompt: value, isAutomation, timestamp }]);
      return;
    }

    processSend(value, isAutomation, messageId, timestamp);
  }, [isPending, processSend]);

  useEffect(() => {
    if (!isPending && queuedMessages.length > 0) {
      const nextMsg = queuedMessages[0];
      setQueuedMessages(prev => prev.slice(1));
      processSend(nextMsg.prompt, nextMsg.isAutomation, nextMsg.id, nextMsg.timestamp);
    }
  }, [isPending]);

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

  const isAutomationMode = useChatStore((state) => state.isAutomationMode);
  const setIsAutomationMode = useChatStore((state) => state.setIsAutomationMode);
  const automationBuilderData = useChatStore((state) => state.automationBuilderData);
  const setAutomationBuilderData = useChatStore((state) => state.setAutomationBuilderData);

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

  const toggleSaveMutation = useMutation({
    mutationFn: (id: string) => {
      const chat = serverChats.find(c => c.id === id);
      return updateConversation(id, { isSaved: !chat?.isSaved });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations', project.id] })
  });

  const handleToggleSave = (id: string) => toggleSaveMutation.mutate(id);

  const loadConversationMutation = useMutation({
    mutationFn: (id: string) => getConversation(id),
    onSuccess: (data) => {
      setActiveThreadId(data.metadata.id);

      const collapsedMessages: ChatMessage[] = [];
      let currentAssistantMessage: ChatMessage | null = null;

      data.history.forEach((msg: any) => {
        if (msg.type === 'human') {
          if (currentAssistantMessage) {
            collapsedMessages.push(currentAssistantMessage);
            currentAssistantMessage = null;
          }
          collapsedMessages.push({
            id: msg.id || Math.random().toString(),
            role: 'user',
            content: msg.content || '',
            timestamp: ''
          });
        } else {
          // Accumulate 'ai', 'tool', etc. into a single assistant bubble
          let appendedContent = msg.content || '';
          
          if (msg.type === 'ai' && msg.tool_calls && msg.tool_calls.length > 0) {
            msg.tool_calls.forEach((tc: any) => {
              const payload = JSON.stringify({ name: tc.name, input: tc.args });
              appendedContent += `\n<toolcall name="${tc.name}"> ${payload} `;
            });
          }
          
          if (msg.type === 'tool') {
             const payload = JSON.stringify({ name: msg.name || 'unknown', output: msg.content });
             appendedContent = ` ${payload} </toolcall>\n`;
          }

          if (!currentAssistantMessage) {
            currentAssistantMessage = {
              id: msg.id || Math.random().toString(),
              role: 'assistant',
              content: appendedContent,
              timestamp: ''
            };
          } else {
            currentAssistantMessage.content += appendedContent;
          }
        }
      });

      if (currentAssistantMessage) {
        collapsedMessages.push(currentAssistantMessage);
      }

      setMessages(collapsedMessages);
    }
  });

  const handleChatClick = (id: string) => {
    setIsAutomationMode(false);
    setAutomationBuilderData(null);
    loadConversationMutation.mutate(id);
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
                queuedMessages={queuedMessages}
                onSubmitAnswer={handleClarificationSubmit}
                onTriggerClarification={handleTriggerClarification}
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
                onChatClick={handleChatClick}
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
