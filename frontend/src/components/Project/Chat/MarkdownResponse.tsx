import React from 'react';
import { Anchor, Box, Card, Table } from '@mantine/core';
import { Streamdown } from 'streamdown';
import 'streamdown/styles.css';
import './MarkdownResponse.css';
import { ClarificationBlock } from './ClarificationBlock/ClarificationBlock';
import { ClarificationQuestionData } from './PromptInput/PromptClarification/PromptClarification';

export interface MarkdownResponseProps {
  content: string;
  onSubmitAnswer?: (answer: string) => void;
  onTriggerClarification?: (questions: ClarificationQuestionData[]) => void;
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

export const MarkdownResponse: React.FC<MarkdownResponseProps> = ({ content, onSubmitAnswer, onTriggerClarification }) => {
  const components = React.useMemo(() => ({
    'my-component': ({ children }: { children?: React.ReactNode }) => (
      <div className="special-note">
        <span className="special-note-title">Special Note: </span>
        {children}
      </div>
    ),
    a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
      <Anchor href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </Anchor>
    ),
    metadata: ({ children }: { children?: React.ReactNode }) => {
      return <Card withBorder> {JSON.parse(String(children)).next}:{JSON.parse(String(children)).reasoning}</Card>;
    },
    clarification: ({ children }: { children?: React.ReactNode }) => {
      const rawContent = getTextFromChildren(children);
      return (
        <ClarificationBlock
          content={rawContent}
          onSubmitAnswer={onSubmitAnswer}
          onTriggerClarification={onTriggerClarification}
        />
      );
    },
    table: Table.withProps({ variant: 'striped', withRowBorders: true, striped: 'even', })
  }), [onSubmitAnswer, onTriggerClarification]);

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
        allowedTags={{ 'my-component': [], 'metadata': [], 'clarification': [] }}
      >
        {content}
      </Streamdown>
    </Box>
  );
};

