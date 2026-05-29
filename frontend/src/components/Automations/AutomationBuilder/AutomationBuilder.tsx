import React, { useState } from 'react';
import { Edge } from '@xyflow/react';
import { AppNode } from './types';
import { Box, Paper, Group } from '@mantine/core';
import { useStateHistory } from '@mantine/hooks';
import { useCreateAutomation, useUpdateAutomation } from '../../../api/automations';
import { AutomationSaveButton } from '../AutomationSaveButton';
import { AutomationHistoryButtons } from '../AutomationHistoryButtons';
import { AutomationActionButton } from '../AutomationActionButton';
import { ScheduleConfiguratorModal } from '../ScheduleConfiguratorModal';
import { ScheduleConfig } from '../ScheduleConfigurator';
import { AutomationBoard } from './AutomationBoard';
import { AutomationExecutionPanel } from './AutomationExecutionPanel';
import { useAutomationRun } from '../../../hooks/useAutomationRun';
import { EditableTitle } from '../../Common/EditableTitle';
import { SaveAutomationModal } from '../SaveAutomationModal/SaveAutomationModal';
import { RunAutomationModal } from '../RunAutomationModal/RunAutomationModal';
import { getScheduleString } from '../utils';

export interface AutomationBuilderProps {
  automationId?: string;
  initialName?: string;
  initialNodes?: AppNode[];
  initialEdges?: Edge[];
  height?: string | number;
  projectId?: string;
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
  automationId,
  initialName,
  initialNodes = defaultNodes,
  initialEdges = defaultEdges,
  height = '100%',
  projectId
}) => {
  const [currentAutomationId, setCurrentAutomationId] = useState<string | undefined>(automationId);
  const [automationName, setAutomationName] = useState(initialName || 'New Automation');
  const [scheduleModalOpened, setScheduleModalOpened] = useState(false);
  const [panelOpened, setPanelOpened] = useState(false);

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);

  const [historyState, handlers, historyValue] = useStateHistory({ nodes: initialNodes, edges: initialEdges });

  // Sync with incoming props (e.g., from LLM generation)
  React.useEffect(() => {
    handlers.set({ nodes: initialNodes, edges: initialEdges });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNodes, initialEdges]);

  const createAutomation = useCreateAutomation();
  const updateAutomation = useUpdateAutomation();

  // Automation State
  const [isScheduled, setIsScheduled] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig | undefined>(undefined);

  const { mutate: runAutomation, nodeExecutionStates, isPending: isRunningAutomation } = useAutomationRun(currentAutomationId || '');

  const handleSaveAutomation = (name: string) => {
    setAutomationName(name);
    const payload = {
      name,
      nodes: historyState.nodes,
      edges: historyState.edges,
      automation_type: isScheduled ? 'scheduled' : 'manual',
      schedule_config: scheduleConfig,
      project_id: projectId,
    };
    if (currentAutomationId) {
      updateAutomation.mutate({
        id: currentAutomationId,
        automation: payload,
      }, {
        onSuccess: () => {
          setIsSaveModalOpen(false);
        }
      });
    } else {
      createAutomation.mutate(payload, {
        onSuccess: (data) => {
          setCurrentAutomationId(data.id);
          setIsSaveModalOpen(false);
        }
      });
    }
  };

  const handleConfirmRun = () => {
    if (!currentAutomationId) return;
    setIsRunModalOpen(false);
    setPanelOpened(true);
    runAutomation({ inputText: 'Run this automation now.' });
  };

  const calculateToolsUsed = () => {
    const tools = new Set<string>();
    historyState.nodes.forEach(node => {
      if (node.data && node.data.tools) {
        node.data.tools.forEach((tool: string) => tools.add(tool));
      }
    });
    return tools.size;
  };

  return (
    <Paper
      w="100%"
      h={height}
      radius="0"
      shadow="0"
      style={{
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
          left: '10px',
        }}
      >
        <EditableTitle
          value={automationName}
          onChange={setAutomationName}
          size="md"
          placeholder="Automation Name"
        />
      </Box>

      <Box
        style={{
          position: 'absolute',
          zIndex: 10,
          top: '10px',
          right: '10px',
        }}
      >
        <Group gap="sm">
          <AutomationHistoryButtons
            canUndo={historyValue.current > 0}
            canRedo={historyValue.current < historyValue.history.length - 1}
            onUndo={() => handlers.back()}
            onRedo={() => handlers.forward()}
          />
          <AutomationSaveButton
            isSaving={createAutomation.isPending || updateAutomation.isPending}
            onSave={() => setIsSaveModalOpen(true)}
          />
          <AutomationActionButton
            isActive={isActive}
            isScheduled={isScheduled}
            isRunning={isRunningAutomation}
            schedule={scheduleConfig ? getScheduleString(scheduleConfig) : undefined}
            onToggle={() => setIsActive(!isActive)}
            onRun={() => setIsRunModalOpen(true)}
            onScheduleClick={() => setScheduleModalOpened(true)}
          />
        </Group>
      </Box>

      <AutomationBoard
        initialNodes={historyState.nodes}
        initialEdges={historyState.edges}
        onStructureChange={(nodes, edges) => handlers.set({ nodes, edges })}
        nodeExecutionStates={nodeExecutionStates}
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

      <SaveAutomationModal
        opened={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveAutomation}
        initialName={automationName}
        isSavedBefore={!!currentAutomationId}
        isSaving={createAutomation.isPending || updateAutomation.isPending}
        stats={{
          nodesCount: historyState.nodes.length,
          edgesCount: historyState.edges.length,
          toolsUsed: calculateToolsUsed(),
        }}
      />

      <RunAutomationModal
        opened={isRunModalOpen}
        onClose={() => setIsRunModalOpen(false)}
        onConfirmRun={handleConfirmRun}
        isSavedBefore={!!currentAutomationId}
        isRunning={isRunningAutomation}
      />

      <AutomationExecutionPanel
        opened={panelOpened}
        onClose={() => setPanelOpened(false)}
        nodes={historyState.nodes}
        nodeExecutionStates={nodeExecutionStates}
      />
    </Paper>
  );
};
