import React from 'react';
import { Text } from '@mantine/core';
import { AutomationNodeTools } from './AutomationNodeTools';

interface AutomationNodeContentProps {
  description: string;
  tools?: string[];
  toolsExpanded: boolean;
  onToggleTools: () => void;
}

export const AutomationNodeContent: React.FC<AutomationNodeContentProps> = ({
  description,
  tools,
  toolsExpanded,
  onToggleTools,
}) => {
  return (
    <>
      <Text size="sm" lineClamp={2} className="automation-node-description">
        {description}
      </Text>

      {tools && tools.length > 0 && (
        <AutomationNodeTools 
          tools={tools} 
          expanded={toolsExpanded} 
          onToggle={onToggleTools} 
        />
      )}
    </>
  );
};
