import React from 'react';
import { Anchor, Box } from '@mantine/core';
import { Streamdown } from 'streamdown';
import 'streamdown/styles.css';
import './MarkdownResponse.css';

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
  )
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
        allowedTags={{ 'my-component': [] }}
      // skipHtml={false}
      >
        {content}
      </Streamdown>
    </Box>
  );
};
