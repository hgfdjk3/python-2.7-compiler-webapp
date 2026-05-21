import React from 'react';
import { Box, Text } from '@mantine/core';
import { motion, Variants } from 'motion/react';
import { AutomationItem, AutomationData } from './AutomationItem';
import './Automations.css';

interface AutomationsListProps {
  automations: AutomationData[];
  onToggleActive?: (id: string) => void;
  onRun?: (id: string) => void;
  onAutomationClick?: (id: string) => void;
  onAdd?: () => void;
  onScheduleClick?: (id: string) => void;
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
  automations,
  onToggleActive,
  onRun,
  onAutomationClick,
  onAdd,
  onScheduleClick,
}) => {
  return (
    <Box className="automations-section">
      {automations.length > 0 ? (
        <motion.div
          className="automations-list"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {automations.map((automation) => (
            <motion.div key={automation.id} variants={itemVariants}>
              <AutomationItem
                automation={automation}
                onToggleActive={onToggleActive}
                onRun={onRun}
                onClick={onAutomationClick}
                onScheduleClick={onScheduleClick}
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
    </Box>
  );
};
