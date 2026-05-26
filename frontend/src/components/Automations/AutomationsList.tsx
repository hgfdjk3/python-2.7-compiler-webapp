import React, { useState } from 'react';
import { Box, Text, Loader, Center } from '@mantine/core';
import { motion, Variants } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { AutomationItem, AutomationData } from './AutomationItem';
import { ScheduleConfiguratorModal } from './ScheduleConfiguratorModal';
import { ScheduleConfig } from './ScheduleConfigurator';
import { useAutomations, useDeleteAutomation, Automation } from '../../api/automations';
import './Automations.css';

/**
 * Maps a backend Automation to the AutomationData shape used by AutomationsList.
 */
const toAutomationData = (automation: Automation): AutomationData => ({
  id: automation.id,
  name: automation.name,
  description: `${automation.nodes?.length ?? 0} nodes • ${automation.automation_type}`,
  isScheduled: automation.automation_type === 'scheduled',
  schedule: automation.schedule_config?.description,
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
  const { data: backendAutomations = [], isLoading } = useAutomations();
  const deleteAutomation = useDeleteAutomation();
  const automations = backendAutomations.map(toAutomationData);
  const displayedAutomations = limit ? automations.slice(0, limit) : automations;

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [schedulingAutomationId, setSchedulingAutomationId] = useState<string | null>(null);

  const handleScheduleClick = (id: string) => {
    setSchedulingAutomationId(id);
    setScheduleModalOpen(true);
  };

  const handleSaveSchedule = (config: ScheduleConfig) => {
    console.log('Saved schedule for', schedulingAutomationId, config);
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

  const handleRun = (id: string) => {
    const automation = backendAutomations.find((a) => a.id === id);
    if (automation) onRunAutomation?.(id, automation);
  };

  const selectedAutomation = automations.find(a => a.id === schedulingAutomationId);

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
                automation={automation}
                onToggleActive={() => {}} // TODO: implement toggle
                onRun={() => handleRun(automation.id)}
                onClick={() => handleEdit(automation.id)}
                onScheduleClick={() => handleScheduleClick(automation.id)}
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
        automationName={selectedAutomation?.name}
      />
    </Box>
  );
};
