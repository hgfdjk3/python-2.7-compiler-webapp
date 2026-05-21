import React, { useState } from 'react';
import { Edge } from '@xyflow/react';
import { AppNode } from './types';
import { Box, Paper } from '@mantine/core';
import { AutomationActionButton } from '../AutomationActionButton';
import { ScheduleConfiguratorModal } from '../ScheduleConfiguratorModal';
import { ScheduleConfig } from '../ScheduleConfigurator';
import { AutomationBoard } from './AutomationBoard';

const getScheduleString = (config: ScheduleConfig): string => {
  const { frequency, interval, time } = config;
  const plural = interval > 1 ? 's' : '';
  const timeStr = time ? ` at ${time}` : '';

  if (frequency === 'weeks' && config.byDays && config.byDays.length > 0) {
    const daysStr = config.byDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ');
    return `Every ${interval} week${plural} on ${daysStr}${timeStr}`;
  }

  const freqSingle = frequency.endsWith('s') ? frequency.slice(0, -1) : frequency;
  return `Every ${interval} ${freqSingle}${plural}${timeStr}`;
};

export interface AutomationBuilderProps {
  initialNodes?: AppNode[];
  initialEdges?: Edge[];
  height?: string | number;
}

const defaultNodes: AppNode[] = [
  {
    id: '1',
    type: 'automation',
    position: { x: 0, y: 0 },
    data: {
      title: 'Trigger Event',
      description: 'Triggered when a new user joins the workspace.',
      tools: ['tool-webhook']
    },
  },
  {
    id: '2',
    type: 'automation',
    position: { x: 0, y: 0 },
    data: {
      title: 'Extract Profile Data',
      description: 'Uses LLM to extract key skills and interests from user profile.',
      tools: ['tool-llm', 'tool-json-parser']
    },
  },
  {
    id: '3',
    type: 'automation',
    position: { x: 0, y: 0 },
    data: {
      title: 'Assign to Team',
      description: 'Assigns the user to the appropriate team channel based on skills.',
      tools: ['tool-slack-api', 'tool-database', 'tool-llm', 'tool-json-parser', 'tool-email', 'tool-notification']
    },
  },
  {
    id: '4',
    type: 'automation',
    position: { x: 0, y: 0 },
    data: {
      title: 'Notify Manager',
      description: 'Sends a summary report to the team lead.',
      tools: ['tool-email']
    },
  },
  {
    id: '5',
    type: 'automation',
    position: { x: 0, y: 0 },
    data: {
      title: 'Archiving',
      description: 'Archives the user session for audit logs.',
      tools: ['tool-s3', 'tool-lambda']
    },
  }
];

const defaultEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', type: 'automation', animated: true },
  { id: 'e2-3', source: '2', target: '3', type: 'automation', animated: true },
  { id: 'e3-4', source: '3', target: '4', type: 'automation', animated: true },
  { id: 'e4-5', source: '4', target: '5', type: 'automation', animated: true }
];

export const AutomationBuilder: React.FC<AutomationBuilderProps> = ({
  initialNodes = defaultNodes,
  initialEdges = defaultEdges,
  height = '100%'
}) => {
  const [scheduleModalOpened, setScheduleModalOpened] = useState(false);

  // Automation State
  const [isScheduled, setIsScheduled] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig | undefined>(undefined);
  const [isRunning, setIsRunning] = useState(false);

  return (
    <Paper
      w="100%"
      h={height}
      radius="0"
      shadow="0"
      style={{
        // borderBottom: "1px solid var(--mantine-color-default-border)",
        borderTop: "1px solid var(--mantine-color-default-border)",
        overflow: 'hidden',
      }}
      pos={'relative'}
    >
      <Box
        style={{
          position: 'absolute',
          zIndex: 10,
          top: '10px',
          right: '10px',
        }}
      >
        <AutomationActionButton
          isActive={isActive}
          isScheduled={isScheduled}
          isRunning={isRunning}
          schedule={scheduleConfig ? getScheduleString(scheduleConfig) : undefined}
          onToggle={() => setIsActive(!isActive)}
          onRun={() => {
            setIsRunning(true);
            setTimeout(() => setIsRunning(false), 2000);
          }}
          onScheduleClick={() => setScheduleModalOpened(true)}
        />
      </Box>

      <AutomationBoard
        initialNodes={initialNodes}
        initialEdges={initialEdges}
      />

      <ScheduleConfiguratorModal
        opened={scheduleModalOpened}
        onClose={() => setScheduleModalOpened(false)}
        onSave={(config) => {
          setScheduleConfig(config);
          setIsScheduled(true);
          setIsActive(true);
          setScheduleModalOpened(false);
        }}
        initialConfig={scheduleConfig}
        automationName="Automation Workflow"
      />
    </Paper>
  );
};
