import React, { useState } from 'react';
import { Anchor, Box, Collapse, Group, Text } from '@mantine/core';
import { Streamdown } from 'streamdown';
import 'streamdown/styles.css';
import './MarkdownResponse.css';
import { ReasoningBlock } from './ReasoningBlock/ReasoningBlock';

export interface MarkdownResponseProps {
  content: string;
}

const components: any = {
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
    const rawContent = children?.toString() || '';
    return <>1111{JSON.parse(rawContent).next}</>
    // return <ReasoningBlock content={rawContent} />;
  }
};

export const MarkdownResponse: React.FC<MarkdownResponseProps> = ({ content }) => {
  return (
    <Box className="markdown-response-container" w={{ base: '100%', md: 800, lg: 1100 }}>
      <Streamdown
        animated={{
          animation: "blurIn",
          easing: "ease-out",
          // sep: "char",
        }}
        isAnimating={false}
        caret="block"
        components={components}
        allowedTags={{ 'my-component': [], 'metadata': [] }}
      // skipHtml={false}
      >
        {content}
      </Streamdown>
    </Box>
  );
};
