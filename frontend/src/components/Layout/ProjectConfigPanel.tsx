import React from 'react';
import { Box, Stack, Button, ActionIcon, Group, Tooltip } from '@mantine/core';
import { AnimatePresence, motion, Variants } from 'motion/react';
import { ProjectConfigSection } from '../Project/ProjectConfigSection';
import { KnowledgeGraphPreview } from '../Project/KnowledgeGraph/KnowledgeGraphPreview';
import { ProjectMembersPreview } from '../Project/ProjectMembersPreview';
import { ProjectOverview } from '../Project/ProjectOverview';
import { Source, SourceGroup } from '../Project/Sources/types';
import { IconGitPullRequest, IconEdit, IconWand } from '@tabler/icons-react';
import { ProjectSourcesPreview } from '../Project/Sources/ProjectSourcesPreview/ProjectSourcesPreview';

const MOCK_MEMBERS = [
  { id: '1', name: 'Ran', initials: 'R' },
  { id: '2', name: 'Alice', initials: 'A' },
  { id: '3', name: 'Bob', initials: 'B' },
  { id: '4', name: 'Charlie', initials: 'C' },
  { id: '5', name: 'David', initials: 'D' },
];


const MOCK_OVERVIEW = "This project focuses on creating a high-fidelity UI clone of the Claude AI web interface using Mantine and React. It includes a multi-panel layout with a responsive sidebar, a central chat area, and a context-aware configuration panel for project management and settings.";

interface ProjectConfigPanelProps {
  groups: SourceGroup[];
  standaloneSources: Source[];
  activeSourceId: string | null;
  summary?: string;
  pendingCount?: number;
  isLoading?: boolean;
  onReviewPending?: () => void;
  onEditSummary?: () => void;
  onEditSource?: (id: string) => void;
  onExtract?: () => void;
}

const MotionSection = motion.create(ProjectConfigSection);
const MotionStack = motion.create(Stack);

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: 20 },

  visible: {
    opacity: 1,
    y: 0,
    x: 0,
    // filter: 'blur(0px)',
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 120,
    },
  },
  exit: {
    opacity: 0,
    x: 10,
    // filter: 'blur(8px)',
    transition: {
      duration: 0.4,
    },
  },
};

export const ProjectConfigPanel: React.FC<ProjectConfigPanelProps> = ({ groups, standaloneSources, activeSourceId, summary, pendingCount = 0, isLoading, onReviewPending, onEditSummary, onEditSource, onExtract }) => {
  return (
    <MotionStack
      gap="sm"
      h="100%"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <AnimatePresence mode="popLayout">
        {/* <MotionSection key="members" title="Members" variants={itemVariants}>
          <ProjectMembersPreview members={MOCK_MEMBERS} />
        </MotionSection> */}

        <MotionSection
          key="overview"
          title="Overview"
          variants={itemVariants}
          rightSection={
            <ActionIcon variant="subtle" color="gray" size="sm" onClick={onEditSummary}>
              <IconEdit size={16} stroke={1.5} />
            </ActionIcon>
          }
        >
          <ProjectOverview content={summary || "No project overview was created"} />
        </MotionSection>

        <MotionSection
          key="sources"
          title="Library"
          flex={2}
          variants={itemVariants}
          rightSection={
            <Group gap="xs">
              {pendingCount > 0 && (
                <motion.div
                  animate={{ y: [0, -4, 0, -4, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 60, ease: "easeInOut" }}
                >
                  <Button
                    size="compact-xs"
                    variant="light"
                    color="gray"
                    leftSection={<IconGitPullRequest size={14} />}
                    onClick={onReviewPending}
                    style={{ textTransform: 'none' }}
                  >
                    {pendingCount} Pending Changes
                  </Button>
                </motion.div>
              )}
              <Tooltip label="Extract Conversation">
                <ActionIcon variant="subtle" color="gray" size="sm" onClick={onExtract}>
                  <IconWand size={16} stroke={1.5} />
                </ActionIcon>
              </Tooltip>
            </Group>
          }
        >
          <ProjectSourcesPreview
            initialGroups={groups}
            standaloneSources={standaloneSources}
            activeSourceId={activeSourceId}
            isLoading={isLoading}
            onEditSource={onEditSource}
            onExtract={onExtract}
          />
        </MotionSection>

        {/* <MotionSection key="graph" title="Knowledge Graph" flex={1} variants={itemVariants}>
          <Box pt="5" />
          <KnowledgeGraphPreview />
        </MotionSection> */}
      </AnimatePresence>
    </MotionStack>
  );
};
