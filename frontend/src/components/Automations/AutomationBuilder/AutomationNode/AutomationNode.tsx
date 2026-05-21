import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card, Stack } from '@mantine/core';
import { AppEdge, AppNode } from '../types';
import { useReactFlow } from '@xyflow/react';
import { AutomationNodeHeader } from './AutomationNodeHeader';
import { AutomationNodeContent } from './AutomationNodeContent';
import { AutomationNodeRewrite } from './AutomationNodeRewrite';
import { AutomationExpandedTools } from './AutomationExpandedTools';
import { AnimatePresence } from 'motion/react';
import { getToolInfo } from '../../../../utils/agentUtils';
import './AutomationNode.css';

export interface AutomationNodeProps extends NodeProps<AppNode> { }

export const AutomationNode: React.FC<AutomationNodeProps> = ({ data, isConnectable, id }) => {
  const { setNodes } = useReactFlow<AppNode, AppEdge>();
  const [prompt, setPrompt] = React.useState('');

  const setIsRewriting = (val: boolean) => {
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, isRewriting: val } } : n));
  };

  const setToolsExpanded = (val: boolean) => {
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, toolsExpanded: val } } : n));
  };

  const isRewriting = data.isRewriting;

  const handleRewrite = () => {
    // In a real app, this would call an LLM API
    console.log(`Rewriting node ${data.title} with prompt: ${prompt}`);
    setIsRewriting(false);
    setPrompt('');
  };

  const handleNodeClick = () => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === id
          ? n
          : {
              ...n,
              data: {
                ...n.data,
                toolsExpanded: false
              }
            }
      )
    );
  };

  const firstTool = data.tools && data.tools.length > 0 ? data.tools[0] : null;
  const toolInfo = firstTool ? getToolInfo(firstTool) : null;
  const nodeColor = toolInfo ? toolInfo.color : 'var(--mantine-color-blue-6)';

  return (
    <div onClick={handleNodeClick}>
      <Card
        p="md"
        className="automation-node-card"
        style={{
          borderLeft: `4px solid ${nodeColor}`,
          '--node-color': nodeColor,
        } as React.CSSProperties}
      >
        <Handle
          type="target"
          position={Position.Left}
          isConnectable={isConnectable}
          className="automation-handle"
          style={{
            background: nodeColor,
            borderColor: 'var(--mantine-color-body)',
            boxShadow: `0 0 8px ${nodeColor}`,
          }}
        />

        <Stack gap="xs">
          <AutomationNodeHeader
            title={data.title}
            isRewriting={!!isRewriting}
            onToggleRewrite={() => setIsRewriting(!isRewriting)}
          />

          {!isRewriting ? (
            <AutomationNodeContent
              description={data.description}
              tools={data.tools}
              toolsExpanded={!!data.toolsExpanded}
              onToggleTools={() => setToolsExpanded(!data.toolsExpanded)}
            />
          ) : (
            <AutomationNodeRewrite
              prompt={prompt}
              onPromptChange={setPrompt}
              onRewrite={handleRewrite}
              onCancel={() => setIsRewriting(false)}
            />
          )}
        </Stack>

        <Handle
          type="source"
          position={Position.Right}
          isConnectable={isConnectable}
          className="automation-handle"
          style={{
            background: nodeColor,
            borderColor: 'var(--mantine-color-body)',
            boxShadow: `0 0 8px ${nodeColor}`,
          }}
        />
      </Card>

      <AnimatePresence>
        {data.toolsExpanded && data.tools && data.tools.length > 0 ? (
          <AutomationExpandedTools key="expanded-tools" tools={data.tools} />
        ) : null}
      </AnimatePresence>
    </div>
  );
};
