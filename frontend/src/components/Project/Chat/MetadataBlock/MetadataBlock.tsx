import React from 'react';
import { Card } from '@mantine/core';

export interface MetadataBlockProps {
  children?: React.ReactNode;
}

export const MetadataBlock: React.FC<MetadataBlockProps> = ({ children }) => {
  try {
    const parsed = JSON.parse(String(children));
    return (
      <Card withBorder shadow="sm" p="sm" mb="sm" style={{ borderLeft: '4px solid var(--mantine-color-blue-filled)' }}>
        <span style={{ fontSize: '0.85em', color: 'var(--mantine-color-dimmed)', textTransform: 'uppercase', fontWeight: 600 }}>Orchestrator ({parsed.next})</span>
        <div style={{ marginTop: '4px', fontSize: '0.9em' }}>{parsed.reasoning}</div>
      </Card>
    );
  } catch (e) {
    // Hide incomplete JSON streams
    return null;
  }
};
