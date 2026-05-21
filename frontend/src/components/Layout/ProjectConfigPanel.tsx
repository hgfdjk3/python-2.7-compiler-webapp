import React from 'react';
import { Box, Stack } from '@mantine/core';
import { AnimatePresence, motion, Variants } from 'motion/react';
import { ProjectConfigSection } from '../Project/ProjectConfigSection';
import { KnowledgeGraphPreview } from '../Project/KnowledgeGraph/KnowledgeGraphPreview';
import { ProjectMembersPreview } from '../Project/ProjectMembersPreview';
import { ProjectOverview } from '../Project/ProjectOverview';
import { ProjectSourcesPreview } from '../Project/Sources/ProjectSourcesPreview/ProjectSourcesPreview';
import { Source, SourceGroup } from '../Project/Sources/types';

const MOCK_MEMBERS = [
  { id: '1', name: 'Ran', initials: 'R' },
  { id: '2', name: 'Alice', initials: 'A' },
  { id: '3', name: 'Bob', initials: 'B' },
  { id: '4', name: 'Charlie', initials: 'C' },
  { id: '5', name: 'David', initials: 'D' },
];

const MOCK_GROUPS: SourceGroup[] = [
  {
    id: 'group-1',
    title: 'Research Papers',
    description: 'A collection of PDFs about LLMs',
    sources: [
      { id: 's1', title: 'Attention is All You Need.pdf', description: 'Transformer architecture paper', type: 'pdf', color: 'red' },
    ]
  }
];

const MOCK_STANDALONE: Source[] = [
  { id: 's2', title: 'Project Specs.txt', description: 'Requirements document', type: 'txt', color: 'blue' },
  { id: 's3', title: 'Design Assets', description: 'Link to Figma', type: 'link', color: 'orange' },
  { id: 's4', title: 'Design Assets', description: 'Link to Figma', type: 'link', color: 'green' },
  { id: 's5', title: 'Design Assets', description: 'Link to Figma', type: 'link', color: 'blue' },
  { id: 's6', title: 'Design Assets', description: 'Link to Figma', type: 'link', color: 'orange' },
  { id: 's7', title: 'Design Assets', description: 'Link to Figma', type: 'link', color: 'green' },
  { id: 's8', title: 'Design Assets', description: 'Link to Figma', type: 'link', color: 'blue' },
];

const MOCK_OVERVIEW = "This project focuses on creating a high-fidelity UI clone of the Claude AI web interface using Mantine and React. It includes a multi-panel layout with a responsive sidebar, a central chat area, and a context-aware configuration panel for project management and settings.";

interface ProjectConfigPanelProps {
  groups: SourceGroup[];
  standaloneSources: Source[];
  activeSourceId: string | null;
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

export const ProjectConfigPanel: React.FC<ProjectConfigPanelProps> = ({ groups, standaloneSources, activeSourceId }) => {
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
        <MotionSection key="members" title="Members" variants={itemVariants}>
          <ProjectMembersPreview members={MOCK_MEMBERS} />
        </MotionSection>

        <MotionSection key="overview" title="Overview" variants={itemVariants}>
          <ProjectOverview content={MOCK_OVERVIEW} />
        </MotionSection>

        <MotionSection key="sources" title="Sources" flex={2} variants={itemVariants}>
          <ProjectSourcesPreview
            initialGroups={groups}
            standaloneSources={standaloneSources}
            activeSourceId={activeSourceId}
          />
        </MotionSection>

        <MotionSection key="graph" title="Knowledge Graph" flex={1} variants={itemVariants}>
          <Box pt="5" />
          <KnowledgeGraphPreview />
        </MotionSection>
      </AnimatePresence>
    </MotionStack>
  );
};
