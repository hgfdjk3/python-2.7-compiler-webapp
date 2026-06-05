import React from 'react';
import { useConnectors } from '../api/connectors';
import { getAgentIcon } from './iconUtils';

export interface AgentInfo {
  id: string;
  name: string;
  description: string;
  developer: string;
  developerWebsite?: string;
  developerSupport?: string;
  category: string;
  brandColor: string;
  iconName?: string;
  sourcesAdded: string[];
  toolsEnabled: string[];
  headers_schema?: Record<string, string>;
  header_values?: Record<string, string>;
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
      iconName: c.icon,
      sourcesAdded: [],
      toolsEnabled: c.tools || [],
      headers_schema: c.headers_schema || c.headers, // fallback to old headers
      header_values: c.header_values
    }));
  }, [connectors]);

  return {
    agents: agents.length > 0 ? agents : [],
    getAgent: (id: string) => agents.find(a => a.id === id)
  };
};

export const getToolInfo = (toolIdOrName: string, customAgents?: AgentInfo[]) => {
  const fallbackIcon = getAgentIcon(toolIdOrName, { size: 14 });
  
  const searchAgents = customAgents || [];
  const agent = searchAgents.find(a => a.toolsEnabled?.includes(toolIdOrName));

  if (agent) {
    const color = agent.brandColor || '#228be6';
    let icon = getAgentIcon(agent.iconName || agent.name, { size: 14 });
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
