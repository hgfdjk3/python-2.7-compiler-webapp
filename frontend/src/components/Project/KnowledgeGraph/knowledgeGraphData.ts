export type KnowledgeGraphNode = {
  id: string;
  label: string;
  group: string;
  value: number;
  color: string;
};

export type KnowledgeGraphLink = {
  source: string;
  target: string;
  label: string;
};

export const knowledgeGraphNodes: KnowledgeGraphNode[] = [
  { id: 'project', label: 'Project', group: 'core', value: 12, color: '#5c7cfa' },
  { id: 'overview', label: 'Overview', group: 'docs', value: 7, color: '#4dabf7' },
  { id: 'sources', label: 'Sources', group: 'docs', value: 7, color: '#20c997' },
  { id: 'members', label: 'Members', group: 'team', value: 6, color: '#f59f00' },
  { id: 'ui', label: 'UI System', group: 'design', value: 8, color: '#cc5de8' },
  { id: 'chat', label: 'Chat Layout', group: 'product', value: 7, color: '#ff6b6b' },
  { id: 'knowledge-graph', label: 'Knowledge Graph', group: 'product', value: 9, color: '#12b886' },
  { id: 'search', label: 'Search', group: 'product', value: 5, color: '#339af0' },
];

export const knowledgeGraphLinks: KnowledgeGraphLink[] = [
  { source: 'project', target: 'overview', label: 'describes' },
  { source: 'project', target: 'sources', label: 'collects' },
  { source: 'project', target: 'members', label: 'owned by' },
  { source: 'project', target: 'ui', label: 'shaped by' },
  { source: 'project', target: 'chat', label: 'contains' },
  { source: 'project', target: 'knowledge-graph', label: 'indexes' },
  { source: 'project', target: 'search', label: 'supports' },
  { source: 'sources', target: 'knowledge-graph', label: 'feeds' },
  { source: 'overview', target: 'chat', label: 'informs' },
  { source: 'ui', target: 'chat', label: 'styles' },
  { source: 'search', target: 'knowledge-graph', label: 'powers' },
];
