import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { Edge } from '@xyflow/react';
import { AppNode } from './types';
import { Box, Paper, Group, Button } from '@mantine/core';
import { useStateHistory } from '@mantine/hooks';
import { useCreateAutomation, useUpdateAutomation } from '../../../api/automations';
import { AutomationSaveButton } from '../AutomationSaveButton';
import { AutomationHistoryButtons } from '../AutomationHistoryButtons';
import { AutomationActionButton } from '../AutomationActionButton';
import { ScheduleConfig } from '../ScheduleConfigurator';
import { AutomationBoard } from './AutomationBoard';
import { AutomationExecutionPanel } from './AutomationExecutionPanel';
import { useAutomationRun, useUnsavedAutomationRun } from '../../../hooks/useAutomationRun';
import { EditableTitle } from '../../Common/EditableTitle';
import { SaveAutomationModal } from '../SaveAutomationModal/SaveAutomationModal';
import { RunAutomationModal } from '../RunAutomationModal/RunAutomationModal';
import { getScheduleString } from '../utils';
import { IconHistory, IconX } from '@tabler/icons-react';

export interface AutomationBuilderProps {
  automationId?: string;
  initialName?: string;
  initialNodes?: AppNode[];
  initialEdges?: Edge[];
  height?: string | number;
  projectId?: string;
  historicalRun?: any;
  showHeader?: boolean;
  initialScheduleConfig?: any;
  onStateChange?: (state: { hasChanges: boolean; scheduleString?: string; isSaving?: boolean }) => void;
}

export interface AutomationBuilderRef {
  triggerRun: () => void;
  triggerSave: () => void;
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

export const AutomationBuilder = forwardRef<AutomationBuilderRef, AutomationBuilderProps>(({
  automationId,
  initialName,
  initialNodes = defaultNodes,
  initialEdges = defaultEdges,
  height = '100%',
  projectId,
  historicalRun,
  showHeader = true,
  initialScheduleConfig,
  onStateChange
}, ref) => {
  const [currentAutomationId, setCurrentAutomationId] = useState<string | undefined>(automationId);
  const [automationName, setAutomationName] = useState(initialName || 'New Automation');
  const [panelOpened, setPanelOpened] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [savedHistoryIndex, setSavedHistoryIndex] = useState(0);

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);

  const [historyState, handlers, historyValue] = useStateHistory({ nodes: initialNodes, edges: initialEdges });

  // Sync with incoming props (e.g., from LLM generation)
  React.useEffect(() => {
    if (
      JSON.stringify(initialNodes) !== JSON.stringify(historyState.nodes) ||
      JSON.stringify(initialEdges) !== JSON.stringify(historyState.edges)
    ) {
      handlers.set({ nodes: initialNodes, edges: initialEdges });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNodes, initialEdges]);

  // Open panel when historical run is selected
  React.useEffect(() => {
    if (historicalRun) {
      setPanelOpened(true);
    }
  }, [historicalRun]);

  const createAutomation = useCreateAutomation();
  const updateAutomation = useUpdateAutomation();

  // Automation State
  const [isScheduled, setIsScheduled] = useState(!!initialScheduleConfig);
  const [isActive, setIsActive] = useState(!!initialScheduleConfig);
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig | undefined>(initialScheduleConfig);

  const isSaving = createAutomation.isPending || updateAutomation.isPending;

  React.useEffect(() => {
    if (onStateChange) {
      const hasChanges = historyValue.current !== savedHistoryIndex || JSON.stringify(scheduleConfig) !== JSON.stringify(initialScheduleConfig) || automationName !== (initialName || 'New Automation');
      onStateChange({
        hasChanges,
        scheduleString: scheduleConfig ? getScheduleString(scheduleConfig) : undefined,
        isSaving
      });
    }
  }, [historyValue.current, savedHistoryIndex, scheduleConfig, initialScheduleConfig, onStateChange, automationName, initialName, isSaving]);

  const { mutate: runAutomation, nodeExecutionStates: savedExecutionStates, isPending: isRunningSaved } = useAutomationRun(currentAutomationId || '');
  const { mutate: runUnsavedAutomation, nodeExecutionStates: unsavedExecutionStates, isPending: isRunningUnsaved } = useUnsavedAutomationRun();

  const isRunningAutomation = isRunningSaved || isRunningUnsaved;
  const liveNodeExecutionStates = currentAutomationId ? savedExecutionStates : unsavedExecutionStates;

  const [localHistoricalRun, setLocalHistoricalRun] = useState<any>(historicalRun);

  React.useEffect(() => {
    setLocalHistoricalRun(historicalRun);
  }, [historicalRun]);

  const displayNodeExecutionStates = localHistoricalRun?.nodeExecutionStates || liveNodeExecutionStates;

  useImperativeHandle(ref, () => ({
    triggerRun: () => setIsRunModalOpen(true),
    triggerSave: () => setIsSaveModalOpen(true),
  }));

  const handleSaveAutomation = (name: string, isScheduled: boolean, scheduleConfig: ScheduleConfig | undefined) => {
    setAutomationName(name);
    setIsScheduled(isScheduled);
    setScheduleConfig(scheduleConfig);
    
    const cleanedScheduleConfig = isScheduled && scheduleConfig ? { ...scheduleConfig } : null;
    if (cleanedScheduleConfig && cleanedScheduleConfig.frequency !== 'weeks') {
      delete cleanedScheduleConfig.byDays;
    }

    const payload = {
      name,
      nodes: historyState.nodes,
      edges: historyState.edges,
      automation_type: isScheduled ? 'scheduled' : 'manual',
      schedule_config: cleanedScheduleConfig,
      project_id: projectId,
    };
    if (currentAutomationId) {
      updateAutomation.mutate({
        id: currentAutomationId,
        automation: payload,
      }, {
        onSuccess: () => {
          setSavedHistoryIndex(historyValue.current);
          setIsSaveModalOpen(false);
        }
      });
    } else {
      createAutomation.mutate(payload, {
        onSuccess: (data) => {
          setCurrentAutomationId(data.id);
          setSavedHistoryIndex(historyValue.current);
          setIsSaveModalOpen(false);
        }
      });
    }
  };

  const handleConfirmRun = (saveFirst: boolean) => {
    setIsRunModalOpen(false);
    if (saveFirst) {
      setIsSaveModalOpen(true);
    } else {
      setPanelOpened(true);
      setLocalHistoricalRun(null); // Clear historical view

      const hasUnsavedChanges = historyValue.current !== savedHistoryIndex || !currentAutomationId;

      if (hasUnsavedChanges) {
        runUnsavedAutomation({
          inputText: 'Run this automation now.',
          automationData: {
            nodes: historyState.nodes,
            edges: historyState.edges
          }
        });
      } else {
        runAutomation({ inputText: 'Run this automation now.' });
      }
    }
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
      <>
        <Group
          gap="5"
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
          <Button
            size='compact-sm'
            variant='filled'
            style={{
              backgroundColor: 'light-dark(var(--mantine-color-zinc-0), var(--mantine-color-zinc-9))',
              color: 'light-dark(var(--mantine-color-gray-9), var(--mantine-color-gray-0))',
            }}
            onClick={() => setPanelOpened(!panelOpened)}
          >
            {panelOpened ? <IconX size={14} /> : <IconHistory size={14} />}
            {/* {panelOpened ? 'Hide' : 'Show'} Logs */}
          </Button>
        </Group>

        {showHeader && (
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
                automationId={currentAutomationId}
                isSaving={isSaving}
                onSave={() => setIsSaveModalOpen(true)}
              />
              <AutomationActionButton
                isActive={isActive}
                isScheduled={isScheduled}
                isRunning={isRunningAutomation}
                schedule={scheduleConfig ? getScheduleString(scheduleConfig) : undefined}
                onToggle={() => setIsActive(!isActive)}
                onRun={() => setIsRunModalOpen(true)}
              />
            </Group>
          </Box>
        )}
      </>
      <Group gap="0" w="100%" h="100%" wrap="nowrap" align="stretch">
        <AutomationExecutionPanel
          opened={panelOpened}
          onClose={() => setPanelOpened(false)}
          nodes={historyState.nodes}
          nodeExecutionStates={displayNodeExecutionStates}
          activePanel={activeNodeId}
          onActivePanelChange={setActiveNodeId}
        />
        <Box style={{ flex: 1, height: '100%', position: 'relative' }}>
          <AutomationBoard
            initialNodes={historyState.nodes}
            initialEdges={historyState.edges}
            onStructureChange={(nodes, edges) => handlers.set({ nodes, edges })}
            nodeExecutionStates={displayNodeExecutionStates}
            activeNodeId={activeNodeId}
          />
        </Box>
      </Group>

      <SaveAutomationModal
        opened={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveAutomation}
        initialName={automationName}
        isSavedBefore={!!currentAutomationId}
        isSaving={isSaving}
        initialIsScheduled={isScheduled}
        initialScheduleConfig={scheduleConfig}
        stats={{
          nodesCount: historyState.nodes.length,
          edgesCount: historyState.edges.length,
          toolsUsed: calculateToolsUsed(),
        }}
      />

      <RunAutomationModal
        opened={isRunModalOpen}
        onClose={() => setIsRunModalOpen(false)}
        onConfirmRun={(saveFirst) => handleConfirmRun(saveFirst)}
        isSavedBefore={!!currentAutomationId && historyValue.current === savedHistoryIndex && automationName === (initialName || 'New Automation')}
        isRunning={isRunningAutomation}
      />

    </Paper>
  );
});
