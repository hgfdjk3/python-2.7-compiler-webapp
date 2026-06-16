import React, { useState, useEffect } from 'react';
import { Modal, Box, Group, Text, Button, ActionIcon, Tooltip, Divider } from '@mantine/core';
import { IconCheck, IconX, IconPlayerSkipForward } from '@tabler/icons-react';
import { Project } from '../../../api/projects';
import { Entity, useApproveEntityProposal, useRejectEntityProposal, useApproveSummaryChange, useRejectSummaryChange, useApproveAllChanges, useRejectAllChanges } from '../../../api/library';
import { ApprovalStartScreen } from './ApprovalStartScreen';
import { SummaryApprovalStep } from './SummaryApprovalStep';
import { EntityApprovalStep } from './EntityApprovalStep';
import { AnimatePresence } from 'motion/react';

interface ProjectApprovalModalProps {
  project: Project;
  entities?: Entity[];
  manualOpenTrigger?: number;
}

export const ProjectApprovalModal: React.FC<ProjectApprovalModalProps> = ({ project, entities, manualOpenTrigger = 0 }) => {
  const [opened, setOpened] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1); // -1 means StartScreen

  const [staticEntities, setStaticEntities] = useState<Entity[]>([]);
  const [staticHasSummary, setStaticHasSummary] = useState(false);

  // Compute pending items dynamically to know if we should open
  const currentHasPendingSummary = project.library_summary?.status === 'pending' || project.library_summary?.proposed_text != null;
  const currentPendingEntities = (entities || []).filter(e => e.status === 'pending' || e.proposed_state != null);

  const currentTotalSteps = (currentHasPendingSummary ? 1 : 0) + currentPendingEntities.length;
  const totalSteps = (staticHasSummary ? 1 : 0) + staticEntities.length;

  const approveEntityMutation = useApproveEntityProposal(project.id);
  const rejectEntityMutation = useRejectEntityProposal(project.id);
  const approveSummaryMutation = useApproveSummaryChange(project.id);
  const rejectSummaryMutation = useRejectSummaryChange(project.id);
  const approveAllMutation = useApproveAllChanges(project.id);
  const rejectAllMutation = useRejectAllChanges(project.id);

  useEffect(() => {
    if (currentTotalSteps > 0 && !skipped && !opened) {
      setOpened(true);
      setCurrentStepIndex(-1); // Start with the summary screen
      setStaticEntities(currentPendingEntities);
      setStaticHasSummary(currentHasPendingSummary);
    } else if (currentTotalSteps === 0 && opened) {
      setOpened(false);
    }
  }, [currentTotalSteps, skipped, opened, currentHasPendingSummary, currentPendingEntities]);

  useEffect(() => {
    if (opened) {
      setStaticEntities(prev => {
        const existingIds = new Set(prev.map(e => e.id));
        const newEntities = currentPendingEntities.filter(e => !existingIds.has(e.id));
        if (newEntities.length === 0) return prev;
        
        // Update existing entities to their latest pending state, and append new ones
        const updatedPrev = prev.map(p => currentPendingEntities.find(c => c.id === p.id) || p);
        return [...updatedPrev, ...newEntities];
      });

      if (!staticHasSummary && currentHasPendingSummary) {
        setStaticHasSummary(true);
        // If the user was already reviewing an entity, we keep them on it but the summary will be missed.
        // However, summary is normally generated first, so this ensures it stays first.
        if (currentStepIndex >= 0) {
            setCurrentStepIndex(prev => prev + 1);
        }
      }
    }
  }, [currentPendingEntities, currentHasPendingSummary, opened, staticHasSummary, currentStepIndex]);

  useEffect(() => {
    if (manualOpenTrigger > 0 && currentTotalSteps > 0) {
      setOpened(true);
      setSkipped(false);
      setCurrentStepIndex(-1);
      setStaticEntities(currentPendingEntities);
      setStaticHasSummary(currentHasPendingSummary);
    }
  }, [manualOpenTrigger]);

  const handleSkipFlow = () => {
    setSkipped(true);
    setOpened(false);
  };

  const handleStartReview = () => {
    setCurrentStepIndex(0);
  };

  const handleApproveAll = async () => {
    await approveAllMutation.mutateAsync();
    setOpened(false);
    setSkipped(true);
  };

  const handleRejectAll = async () => {
    await rejectAllMutation.mutateAsync();
    setOpened(false);
    setSkipped(true);
  };

  const handleNextStep = () => {
    setCurrentStepIndex(prev => prev + 1);
  };

  const isSummaryStep = staticHasSummary && currentStepIndex === 0;
  const currentEntity = currentStepIndex >= 0 && !isSummaryStep ? staticEntities[staticHasSummary ? currentStepIndex - 1 : currentStepIndex] : null;

  const handleApprove = async () => {
    if (isSummaryStep) {
      await approveSummaryMutation.mutateAsync();
    } else if (currentEntity) {
      await approveEntityMutation.mutateAsync(currentEntity.id);
    }
    handleNextStep();
  };

  const handleReject = async () => {
    if (isSummaryStep) {
      await rejectSummaryMutation.mutateAsync();
    } else if (currentEntity) {
      await rejectEntityMutation.mutateAsync(currentEntity.id);
    }
    handleNextStep();
  };

  useEffect(() => {
    if (currentStepIndex >= totalSteps && totalSteps > 0) {
      setOpened(false);
      setSkipped(true); // Prevent immediate reopen
    }
  }, [currentStepIndex, totalSteps]);

  // Determine what to render based on currentStepIndex
  let currentView: React.ReactNode = null;

  if (currentStepIndex === -1) {
    const newEntitiesCount = staticEntities.filter(e => !e.current_state).length;
    const updatedEntitiesCount = staticEntities.length - newEntitiesCount;
    currentView = (
      <ApprovalStartScreen
        key="start"
        hasNewSummary={staticHasSummary}
        newEntitiesCount={newEntitiesCount}
        updatedEntitiesCount={updatedEntitiesCount}
        onStartReview={handleStartReview}
        onSkip={handleSkipFlow}
        onApproveAll={handleApproveAll}
        onRejectAll={handleRejectAll}
        isApprovingAll={approveAllMutation.isPending}
        isRejectingAll={rejectAllMutation.isPending}
      />
    );
  } else if (currentStepIndex < totalSteps) {
    // Determine if this step is the summary or an entity
    const isSummaryStep = staticHasSummary && currentStepIndex === 0;

    if (isSummaryStep) {
      currentView = (
        <SummaryApprovalStep
          key="summary"
          projectId={project.id}
          currentText={project.library_summary?.current_text || ''}
          proposedText={project.library_summary?.proposed_text || ''}
        />
      );
    } else {
      // Find the entity
      const entityIndex = staticHasSummary ? currentStepIndex - 1 : currentStepIndex;
      const entity = staticEntities[entityIndex];

      if (entity) {
        currentView = (
          <EntityApprovalStep
            key={entity.id}
            projectId={project.id}
            entity={entity}
          />
        );
      }
    }
  }

  // Footer containing Skip, Dots, and Actions
  const renderFooter = () => {
    if (currentStepIndex < 0 || totalSteps === 0) return null;

    const MAX_DOTS = 7;
    const displayDotsCount = Math.min(totalSteps, MAX_DOTS);

    const activeDotIndex = totalSteps <= MAX_DOTS
      ? currentStepIndex
      : Math.min(Math.floor((currentStepIndex / totalSteps) * MAX_DOTS), MAX_DOTS - 1);

    const isApprovePending = approveEntityMutation.isPending || approveSummaryMutation.isPending;
    const isRejectPending = rejectEntityMutation.isPending || rejectSummaryMutation.isPending;

    return (
      <Group justify="space-between" mt="xl" align="center">
        {/* Left Actions */}
        <Group gap={0}>
          <Button variant="subtle" color="gray" size="xs" onClick={handleSkipFlow} px="xs">
            Exit
          </Button>
          <Divider orientation="vertical" my="5" />
          <Button variant="subtle" color="gray" size="xs" onClick={handleNextStep} px="xs">
            Skip
          </Button>
        </Group>

        {/* Dots */}
        <Group justify="center" gap="sm">
          {Array.from({ length: displayDotsCount }).map((_, i) => (
            <Box
              key={i}
              w={8}
              h={8}
              style={{
                borderRadius: '50%',
                backgroundColor: i === activeDotIndex ? 'var(--mantine-color-blue-filled)' : 'var(--mantine-color-gray-4)',
                transition: 'background-color 0.2s ease'
              }}
            />
          ))}
          <Text size="xs" c="dimmed" ml="xs" style={{ minWidth: '35px' }}>
            {Math.min(currentStepIndex + 1, totalSteps)} of {totalSteps}
          </Text>
        </Group>

        {/* Actions */}
        <Group gap="xs">
          <ActionIcon
            variant="subtle"
            color="red"
            size="lg"
            onClick={handleReject}
            loading={isRejectPending}
          >
            <IconX size={20} />
          </ActionIcon>

          <ActionIcon
            variant="subtle"
            color="green"
            size="lg"
            onClick={handleApprove}
            loading={isApprovePending}
          >
            <IconCheck size={20} />
          </ActionIcon>
        </Group>
      </Group>
    );
  };

  return (
    <Modal
      opened={opened}
      onClose={handleSkipFlow}
      withCloseButton={false}
      closeOnClickOutside={false}
      closeOnEscape={true}
      size="lg"
      centered
      // p="xs"
      radius="md"
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <Box style={{ overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          {currentView}
        </AnimatePresence>
        {renderFooter()}
      </Box>
    </Modal>
  );
};
