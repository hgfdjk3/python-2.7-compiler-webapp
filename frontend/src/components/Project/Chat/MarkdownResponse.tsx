import React from 'react';
import { Anchor, Box, Card } from '@mantine/core';
import { Streamdown } from 'streamdown';
import 'streamdown/styles.css';
import './MarkdownResponse.css';
import { ReasoningBlock } from './ReasoningBlock/ReasoningBlock';
import { ClarificationBlock } from './ClarificationBlock/ClarificationBlock';

export interface MarkdownResponseProps {
  content: string;
  onSubmitAnswer?: (answer: string) => void;
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
    return getTextFromChildren(children.props.children);
  }
  return '';
};

export const MarkdownResponse: React.FC<MarkdownResponseProps> = ({ content, onSubmitAnswer }) => {
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
      return <Card withBorder> {JSON.parse(String(children)).reasoning}</Card>;
    },
    clarification: ({ children }: { children?: React.ReactNode }) => {
      const rawContent = getTextFromChildren(children);
      return <ClarificationBlock content={rawContent} onSubmitAnswer={onSubmitAnswer} />;
    }
  }), [onSubmitAnswer]);

  return (
    <Box className="markdown-response-container" w={{ base: '100%', md: 800, lg: 1100 }}>
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

