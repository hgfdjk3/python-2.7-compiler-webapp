import React, { useState } from 'react';
import { Box, Text, Loader, Center } from '@mantine/core';
import { motion, Variants } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { AutomationItem, AutomationData } from './AutomationItem';
import { ScheduleConfiguratorModal } from './ScheduleConfiguratorModal';
import { ToggleAutomationModal } from './ToggleAutomationModal/ToggleAutomationModal';
import { RunAutomationModal } from './RunAutomationModal/RunAutomationModal';
import { ScheduleConfig } from './ScheduleConfigurator';
import { useDeleteAutomation, useUpdateAutomation, Automation, useProjectAutomations } from '../../api/automations';
import { useAutomationRun } from '../../hooks/useAutomationRun';
import { getScheduleString } from './utils';
import './Automations.css';

/**
 * Maps a backend Automation to the AutomationData shape used by AutomationsList.
 */
const toAutomationData = (automation: Automation): AutomationData => ({
  id: automation.id,
  name: automation.name,
  description: `${automation.nodes?.length ?? 0} nodes • ${automation.automation_type}`,
  isScheduled: !!automation.schedule_config,
  schedule: automation.schedule_config ? getScheduleString(automation.schedule_config) : undefined,
  isActive: automation.automation_type === 'scheduled',
  isRunning: false,
});

interface AutomationsListProps {
  onAutomationClick?: (id: string, automation: Automation) => void;
  onRunAutomation?: (id: string, automation: Automation) => void;
  limit?: number;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      delay: 0.1,
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

export const AutomationsList: React.FC<AutomationsListProps> = ({
  onAutomationClick,
  onRunAutomation,
  limit,
}) => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { data: backendAutomations = [], isLoading } = useProjectAutomations(projectId);
  const deleteAutomation = useDeleteAutomation();
  const updateAutomation = useUpdateAutomation();
  const automations = backendAutomations.map(toAutomationData);
  const displayedAutomations = limit ? automations.slice(0, limit) : automations;

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [schedulingAutomationId, setSchedulingAutomationId] = useState<string | null>(null);

  const [toggleModalOpen, setToggleModalOpen] = useState(false);
  const [togglingAutomationId, setTogglingAutomationId] = useState<string | null>(null);

  const [runModalOpen, setRunModalOpen] = useState(false);
  const [runningAutomationId, setRunningAutomationId] = useState<string | null>(null);

  const { mutate: runAutomation, isPending: isRunning } = useAutomationRun(runningAutomationId || '');

  const handleScheduleClick = (id: string) => {
    setSchedulingAutomationId(id);
    setScheduleModalOpen(true);
  };

  const handleSaveSchedule = (config: ScheduleConfig) => {
    if (schedulingAutomationId) {
      updateAutomation.mutate({
        id: schedulingAutomationId,
        automation: {
          automation_type: 'scheduled',
          schedule_config: config,
        }
      });
    }
  };

  const handleRemoveSchedule = (id: string) => {
    updateAutomation.mutate({
      id,
      automation: {
        automation_type: 'manual',
        schedule_config: null,
      }
    });
  };

  const handleToggleClick = (id: string) => {
    setTogglingAutomationId(id);
    setToggleModalOpen(true);
  };

  const handleConfirmToggle = () => {
    if (togglingAutomationId) {
      const automation = backendAutomations.find(a => a.id === togglingAutomationId);
      if (automation) {
        const isActive = automation.automation_type === 'scheduled';
        updateAutomation.mutate({
          id: togglingAutomationId,
          automation: {
            automation_type: isActive ? 'manual' : 'scheduled',
          }
        }, {
          onSettled: () => {
            setToggleModalOpen(false);
            setTogglingAutomationId(null);
          }
        });
      }
    }
  };

  const handleDelete = (id: string) => {
    deleteAutomation.mutate(id);
  };

  const handleEdit = (id: string) => {
    const automation = backendAutomations.find((a) => a.id === id);
    if (automation) {
      if (onAutomationClick) {
        onAutomationClick(id, automation);
      } else {
        navigate(`/automations/${id}`);
      }
    }
  };

  const handleRunClick = (id: string) => {
    setRunningAutomationId(id);
    setRunModalOpen(true);
  };

  const handleConfirmRun = () => {
    if (runningAutomationId) {
      const automation = backendAutomations.find((a) => a.id === runningAutomationId);
      if (automation) {
        onRunAutomation?.(runningAutomationId, automation);
        // We also trigger useAutomationRun directly since onRunAutomation is mostly for ChatView UI state
        runAutomation({ inputText: 'Run this automation now.' });
      }
      setRunModalOpen(false);
    }
  };

  const selectedAutomationForSchedule = backendAutomations.find(a => a.id === schedulingAutomationId);
  const selectedAutomationForToggle = backendAutomations.find(a => a.id === togglingAutomationId);

  if (isLoading) {
    return (
      <Center py="lg">
        <Loader size="sm" />
      </Center>
    );
  }

  return (
    <Box className="automations-section">
      {automations.length > 0 ? (
        <motion.div
          className="automations-list"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {displayedAutomations.map((automation) => (
            <motion.div key={automation.id} variants={itemVariants}>
              <AutomationItem
                automation={{
                  ...automation,
                  isRunning: runningAutomationId === automation.id && isRunning
                }}
                onToggleActive={() => handleToggleClick(automation.id)}
                onRun={() => handleRunClick(automation.id)}
                onClick={() => handleEdit(automation.id)}
                onScheduleClick={() => handleScheduleClick(automation.id)}
                onRemoveSchedule={() => handleRemoveSchedule(automation.id)}
                onEdit={() => handleEdit(automation.id)}
                onDelete={() => handleDelete(automation.id)}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Box py="xl" ta="center" className="automation-empty-state">
            <Text size="sm" c="dimmed" fw={500}>
              No automations active
            </Text>
            <Text size="xs" c="dimmed" mt="xs" style={{ opacity: 0.7 }}>
              Build workflows to automate your project
            </Text>
          </Box>
        </motion.div>
      )}

      <ScheduleConfiguratorModal
        opened={scheduleModalOpen}
        onClose={() => {
          setScheduleModalOpen(false);
          setSchedulingAutomationId(null);
        }}
        onSave={handleSaveSchedule}
        automationName={selectedAutomationForSchedule?.name}
        initialConfig={selectedAutomationForSchedule?.schedule_config}
      />

      <ToggleAutomationModal
        opened={toggleModalOpen}
        onClose={() => {
          if (!updateAutomation.isPending) {
            setToggleModalOpen(false);
            setTogglingAutomationId(null);
          }
        }}
        onConfirm={handleConfirmToggle}
        isActivating={selectedAutomationForToggle?.automation_type !== 'scheduled'}
        isLoading={updateAutomation.isPending}
      />

      <RunAutomationModal
        opened={runModalOpen}
        onClose={() => setRunModalOpen(false)}
        onConfirmRun={handleConfirmRun}
        isSavedBefore={true}
        isRunning={isRunning}
      />
    </Box>
  );
};
