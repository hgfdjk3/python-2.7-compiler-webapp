import React, { useState } from 'react';
import { Box, Title, Text, Stack, Center, Flex, Group, Loader } from '@mantine/core';
import { useParams } from 'react-router-dom';
import { AutomationBuilder, AutomationBuilderRef } from '../components/Automations/AutomationBuilder/AutomationBuilder';
import { useAutomation } from '../api/automations';
import { AutomationRunsHistory } from '../components/Automations/AutomationRunsHistory';
import { AutomationSelectHeader } from '../components/Automations/AutomationSelectHeader';

export const AutomationsPage: React.FC = () => {
  const { automationId } = useParams<{ automationId: string }>();
  const { data: automation, isLoading } = useAutomation(automationId || '');
  const [selectedRun, setSelectedRun] = useState<any>(null);
  const [builderState, setBuilderState] = useState<{ hasChanges: boolean; scheduleString?: string; isSaving?: boolean }>({ hasChanges: false });
  const builderRef = React.useRef<AutomationBuilderRef>(null);

  const isEditing = !!automationId;

  return (
    <Flex direction="column" h="100%" style={{ overflow: 'hidden' }}>
      <AutomationSelectHeader 
        automationId={automationId}
        projectId={automation?.project_id}
        hasChanges={builderState.hasChanges}
        scheduleString={builderState.scheduleString}
        isSaving={builderState.isSaving}
        onRun={() => builderRef.current?.triggerRun()}
        onSave={() => builderRef.current?.triggerSave()}
      />
      <Flex flex={1} w="100%" p="0" gap="0" style={{ minHeight: 0, overflow: 'hidden' }}>
        {/* Left Sidebar: Runs History */}
        <AutomationRunsHistory
          automationId={automationId}
          onSelectRun={setSelectedRun}
          selectedRunId={selectedRun?.id}
        />

        {/* Right Main Area: Automation Builder & Header */}
        <Box flex={1} style={{ display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' }}>

          <Box style={{ flex: 1, minHeight: 0, position: 'relative' }} h="100%">
            {isEditing && isLoading ? (
              <Center h="100%">
                <Loader />
              </Center>
            ) : isEditing && automation ? (
              <AutomationBuilder
                ref={builderRef}
                key={automation.id}
                automationId={automation.id}
                initialName={automation.name}
                initialNodes={automation.nodes}
                initialEdges={automation.edges}
                projectId={automation.project_id}
                historicalRun={selectedRun}
                showHeader={false}
                initialScheduleConfig={automation.schedule_config}
                onStateChange={setBuilderState}
                height="100%"
              />
            ) : (
              <AutomationBuilder 
                ref={builderRef} 
                height="100%" 
                showHeader={false} 
                onStateChange={setBuilderState}
              />
            )}
          </Box>
        </Box>
      </Flex>
    </Flex>
  );
};
