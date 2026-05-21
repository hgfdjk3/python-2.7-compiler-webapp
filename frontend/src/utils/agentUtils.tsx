import React from 'react';
import {
  IconBrandGithub,
  IconBrandGitlab,
  IconBrandSlack,
  IconBrandNotion,
  IconBrandGoogleDrive,
  IconBrandDiscord,
  IconBrandFigma,
  IconBrandTrello,
  IconBrandJira,
  IconTool
} from '@tabler/icons-react';

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

export const AGENTS_DIRECTORY: AgentInfo[] = [
  {
    id: 'github',
    name: 'GitHub',
    description: 'Establish a high-bandwidth connection to your GitHub organization. Empower your AI to navigate repositories, analyze pull requests, and manage issues with full awareness of your codebase and development history.',
    developer: 'Atom Inc.',
    developerWebsite: 'https://atom.inc',
    developerSupport: 'https://support.atom.inc',
    category: 'Development & Code',
    brandColor: '#fff',
    icon: <IconBrandGithub size={24} stroke={1.5} />,
    sourcesAdded: ['Repositories', 'Pull Requests', 'Issues'],
    toolsEnabled: ['Create Issue', 'Comment on PR', 'Trigger Workflow']
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    description: 'Seamlessly integrate your GitLab ecosystem into your AI workspace. Sync private and public projects, track merge requests in real-time, monitor CI/CD pipelines, and provide your AI with deep technical context across your entire software development lifecycle.',
    developer: 'Atom Inc.',
    developerWebsite: 'https://gitlab.com',
    developerSupport: 'https://support.gitlab.com',
    category: 'Development & Code',
    brandColor: '#fc6d26',
    icon: <IconBrandGitlab size={24} stroke={1.5} />,
    sourcesAdded: ['Projects', 'Merge Requests', 'Pipelines'],
    toolsEnabled: ['Create Merge Request', 'Trigger Pipeline']
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Integrate your Jira workflow to bring mission-critical project tracking into your workspace. Sync boards, track issues, and maintain a unified view of your team’s progress across all projects.',
    developer: 'Community',
    developerWebsite: 'https://atlassian.com',
    developerSupport: 'https://support.atlassian.com',
    category: 'Development & Code',
    brandColor: '#0052CC',
    icon: <IconBrandJira size={24} stroke={1.5} />,
    sourcesAdded: ['Projects', 'Issues', 'Boards'],
    toolsEnabled: ['Create Issue', 'Transition Issue', 'Add Comment']
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Access channels, messages, and threads directly from your workspace.',
    developer: 'Atom Inc.',
    category: 'Development & Code',
    brandColor: '#E01E5A',
    icon: <IconBrandSlack size={24} stroke={1.5} />,
    sourcesAdded: ['Channels', 'Direct Messages'],
    toolsEnabled: ['Send Message', 'Create Channel']
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Connect to your Discord servers to read channel history and manage roles.',
    developer: 'Community',
    category: 'Development & Code',
    brandColor: '#5865F2',
    icon: <IconBrandDiscord size={24} stroke={1.5} />,
    sourcesAdded: ['Servers', 'Text Channels'],
    toolsEnabled: ['Send Message', 'Kick User']
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Sync your Notion workspaces and databases for AI retrieval.',
    developer: 'Atom Inc.',
    category: 'Database & Storage',
    brandColor: '#171717',
    icon: <IconBrandNotion size={24} stroke={1.5} />,
    sourcesAdded: ['Pages', 'Databases'],
    toolsEnabled: ['Create Page', 'Update Database']
  },
  {
    id: 'gdrive',
    name: 'Google Drive',
    description: 'Import documents, spreadsheets, and presentations from your Drive.',
    developer: 'Atom Inc.',
    category: 'Database & Storage',
    brandColor: '#1FA463',
    icon: <IconBrandGoogleDrive size={24} stroke={1.5} />,
    sourcesAdded: ['Docs', 'Sheets', 'Slides'],
    toolsEnabled: ['Create Doc', 'Read Sheet']
  },
  {
    id: 'trello',
    name: 'Trello',
    description: 'Read cards, lists, and boards from Trello to organize your tasks.',
    developer: 'Community',
    category: 'Database & Storage',
    brandColor: '#0079BF',
    icon: <IconBrandTrello size={24} stroke={1.5} />,
    sourcesAdded: ['Boards', 'Lists', 'Cards'],
    toolsEnabled: ['Create Card', 'Move Card']
  },
  {
    id: 'figma',
    name: 'Figma',
    description: 'Connect Figma to bring design files and components into your context.',
    developer: 'Atom Inc.',
    category: 'Design',
    brandColor: '#F24E1E',
    icon: <IconBrandFigma size={24} stroke={1.5} />,
    sourcesAdded: ['Design Files', 'Components'],
    toolsEnabled: ['Export Asset', 'Read Comments']
  }
];

export const getAgentInfo = (id: string): AgentInfo | undefined => {
  return AGENTS_DIRECTORY.find(agent => agent.id === id);
};

export const useAgentInfo = () => {
  return {
    agents: AGENTS_DIRECTORY,
    getAgent: getAgentInfo
  };
};

export interface ToolInfo {
  id: string;
  name: string;
  agentId?: string;
}

export const TOOLS_DIRECTORY: ToolInfo[] = [
  // Generic / System Tools
  { id: 'tool-webhook', name: 'WebHook Listener' },
  { id: 'tool-llm', name: 'LLM' },
  { id: 'tool-json-parser', name: 'JSON Parser' },
  { id: 'tool-database', name: 'Database' },
  { id: 'tool-email', name: 'Email Service' },
  { id: 'tool-notification', name: 'Notification Service' },
  { id: 'tool-s3', name: 'S3 Bucket' },
  { id: 'tool-lambda', name: 'Lambda' },

  // GitHub Tools (Agent ID: 'github')
  { id: 'tool-gh-create-issue', name: 'Create Issue', agentId: 'github' },
  { id: 'tool-gh-comment-pr', name: 'Comment on PR', agentId: 'github' },
  { id: 'tool-gh-trigger-workflow', name: 'Trigger Workflow', agentId: 'github' },

  // GitLab Tools (Agent ID: 'gitlab')
  { id: 'tool-gl-create-mr', name: 'Create Merge Request', agentId: 'gitlab' },
  { id: 'tool-gl-trigger-pipeline', name: 'Trigger Pipeline', agentId: 'gitlab' },

  // Jira Tools (Agent ID: 'jira')
  { id: 'tool-jira-create-issue', name: 'Create Issue', agentId: 'jira' },
  { id: 'tool-jira-transition-issue', name: 'Transition Issue', agentId: 'jira' },
  { id: 'tool-jira-add-comment', name: 'Add Comment', agentId: 'jira' },

  // Slack Tools (Agent ID: 'slack')
  { id: 'tool-slack-api', name: 'Slack API', agentId: 'slack' },
  { id: 'tool-slack-send-message', name: 'Send Message', agentId: 'slack' },
  { id: 'tool-slack-create-channel', name: 'Create Channel', agentId: 'slack' },

  // Discord Tools (Agent ID: 'discord')
  { id: 'tool-discord-send-message', name: 'Send Message', agentId: 'discord' },
  { id: 'tool-discord-kick', name: 'Kick User', agentId: 'discord' },

  // Notion Tools (Agent ID: 'notion')
  { id: 'tool-notion-create-page', name: 'Create Page', agentId: 'notion' },
  { id: 'tool-notion-update-db', name: 'Update Database', agentId: 'notion' },

  // Google Drive Tools (Agent ID: 'gdrive')
  { id: 'tool-gdrive-create-doc', name: 'Create Doc', agentId: 'gdrive' },
  { id: 'tool-gdrive-read-sheet', name: 'Read Sheet', agentId: 'gdrive' },

  // Trello Tools (Agent ID: 'trello')
  { id: 'tool-trello-create-card', name: 'Create Card', agentId: 'trello' },
  { id: 'tool-trello-move-card', name: 'Move Card', agentId: 'trello' },

  // Figma Tools (Agent ID: 'figma')
  { id: 'tool-figma-export', name: 'Export Asset', agentId: 'figma' },
  { id: 'tool-figma-read-comments', name: 'Read Comments', agentId: 'figma' },
];

export const getToolInfo = (toolIdOrName: string) => {
  const tool = TOOLS_DIRECTORY.find(t => t.id === toolIdOrName || t.name === toolIdOrName);
  const fallbackIcon = <IconTool size={14} />;

  if (!tool) {
    return {
      id: toolIdOrName,
      name: toolIdOrName,
      color: '#228be6',
      icon: fallbackIcon
    };
  }

  let color = '#228be6'; // fallback blue
  let icon: React.ReactNode = fallbackIcon;

  if (tool.agentId) {
    const agent = AGENTS_DIRECTORY.find(a => a.id === tool.agentId);
    if (agent) {
      if (agent.brandColor) {
        color = agent.brandColor;
      }
      if (agent.icon && React.isValidElement(agent.icon)) {
        icon = React.cloneElement(agent.icon as React.ReactElement<{ size?: number }>, { size: 14 });
      }
    }
  }

  return {
    id: tool.id,
    name: tool.name,
    color,
    icon
  };
};
