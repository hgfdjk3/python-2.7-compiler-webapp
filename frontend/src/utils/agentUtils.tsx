import React from 'react';
import { useConnectors } from '../api/connectors';
import { IconTool } from '@tabler/icons-react';

export interface AgentInfo {
  id: string;
  name: string;
  description: string;
  developer: string;
  developerWebsite?: string;
  developerSupport?: string;
  category: string;
  brandColor: string;
  icon: React.ReactNode;
  sourcesAdded: string[];
  toolsEnabled: string[];
}

export const useAgentInfo = () => {
  const { data: connectors = [] } = useConnectors();

  const agents: AgentInfo[] = React.useMemo(() => {
    return connectors.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description || 'Custom Connector',
      developer: 'Local',
      category: 'Installed Connectors',
      brandColor: c.color || '#228be6',
      icon: <IconTool size={24} stroke={1.5} />,
      sourcesAdded: [],
      toolsEnabled: c.tools || []
    }));
  }, [connectors]);

  return {
    agents: agents.length > 0 ? agents : [],
    getAgent: (id: string) => agents.find(a => a.id === id)
  };
};

export const getToolInfo = (toolIdOrName: string, customAgents?: AgentInfo[]) => {
  const fallbackIcon = <IconTool size={14} />;
  
  const searchAgents = customAgents || [];
  const agent = searchAgents.find(a => a.toolsEnabled?.includes(toolIdOrName));

  if (agent) {
    const color = agent.brandColor || '#228be6';
    let icon: React.ReactNode = fallbackIcon;
    if (agent.icon && React.isValidElement(agent.icon)) {
      icon = React.cloneElement(agent.icon as React.ReactElement<{ size?: number }>, { size: 14 });
    }
    return {
      id: toolIdOrName,
      name: toolIdOrName,
      agentId: agent.id,
      color,
      icon
    };
  }

  // Fallback if not owned by any connector/agent
  return {
    id: toolIdOrName,
    name: toolIdOrName,
    color: '#228be6',
    icon: fallbackIcon
  };
};
