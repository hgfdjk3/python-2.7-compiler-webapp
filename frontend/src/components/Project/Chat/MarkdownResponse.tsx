import React from 'react';
import { Anchor, Box, Card, Table } from '@mantine/core';
import { Streamdown } from 'streamdown';
import 'streamdown/styles.css';
import './MarkdownResponse.css';
import { ClarificationBlock } from './ClarificationBlock/ClarificationBlock';
import { ClarificationQuestionData } from './PromptInput/PromptClarification/PromptClarification';
import { ToolCallBlock } from './ToolBlock/ToolBlock';
import { ApproveToolBlock } from './ApproveToolBlock/ApproveToolBlock';
import { AutomationBlock } from './AutomationBlock/AutomationBlock';
import { AutomationModeBlock } from './AutomationModeBlock/AutomationModeBlock';
import { MetadataBlock } from './MetadataBlock/MetadataBlock';

export interface MarkdownResponseProps {
  content: string;
  onSubmitAnswer?: (answer: string) => void;
  onTriggerClarification?: (questions: ClarificationQuestionData[]) => void;
  onSubmitApproval?: (toolCallId: string, toolName: string, decision: 'allow' | 'reject' | 'try_again' | 'always_allow') => void;
}

/**
 * Recursively extracts raw text from nested React children to avoid comma-joins when parsing.
 */
const getTextFromChildren = (children: React.ReactNode): string => {
  if (!children) return '';
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return children.toString();
  if (Array.isArray(children)) {
    return children.map(getTextFromChildren).join('');
  }
  if (React.isValidElement(children)) {
    return getTextFromChildren((children.props as any).children);
  }
  return '';
};

export const MarkdownResponse: React.FC<MarkdownResponseProps> = ({ content, onSubmitAnswer, onTriggerClarification, onSubmitApproval }) => {
  const callbacksRef = React.useRef({ onSubmitAnswer, onTriggerClarification, onSubmitApproval });
  callbacksRef.current = { onSubmitAnswer, onTriggerClarification, onSubmitApproval };

  const components = React.useMemo(() => ({
    a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
      <Anchor href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </Anchor>
    ),
    metadata: ({ children }: { children?: React.ReactNode }) => <MetadataBlock>{children}</MetadataBlock>,
    clarification: ({ children }: { children?: React.ReactNode }) => {
      const rawContent = getTextFromChildren(children);
      return (
        <ClarificationBlock
          content={rawContent}
          onSubmitAnswer={(a) => callbacksRef.current.onSubmitAnswer?.(a)}
          onTriggerClarification={(q) => callbacksRef.current.onTriggerClarification?.(q)}
        />
      );
    },
    automation: ({ children }: { children?: React.ReactNode }) => {
      const rawContent = getTextFromChildren(children);
      return <AutomationBlock content={rawContent} />;
    },
    AutomationModeBlock: () => {
      return <AutomationModeBlock />;
    },
    'approve-tool': ({ children, ...props }: any) => <ApproveToolBlock {...props} onSubmitApproval={(id, name, decision) => callbacksRef.current.onSubmitApproval?.(id, name, decision)}>{getTextFromChildren(children)}</ApproveToolBlock>,
    'tool-call': ({ children, ...props }: any) => <ToolCallBlock {...props}>{getTextFromChildren(children)}</ToolCallBlock>,
    table: Table.withProps({ variant: 'striped', withRowBorders: true, striped: 'even', })
  }), []);

  return (
    <Box className="markdown-response-container" w={{ xs: 100, sm: 100, md: 600, lg: 900, xl: 1000, xxl: 1200 }}>
      <Streamdown
        animated={{
          animation: "blurIn",
          easing: "ease-out",
        }}
        isAnimating={false}
        caret="block"
        components={components}
        allowedTags={{ 'my-component': [], 'metadata': [], 'clarification': [], 'automation': [], 'AutomationModeBlock': [], 'approve-tool': ['name', 'id'], 'tool-call': ['name'] }}
        literalTagContent={["approve-tool", "tool-call", "automation", "AutomationModeBlock"]}
      >
        {content}
      </Streamdown>
    </Box>
  );
};


