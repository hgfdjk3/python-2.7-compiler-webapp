import React from 'react';

export type SourceType = 'pdf' | 'doc' | 'txt' | 'link' | string;

export interface Source {
  id: string;
  title: string;
  description: string;
  type: SourceType;
  color?: string;
}

export interface SourceGroup {
  id: string;
  title: string;
  description?: string;
  sources: Source[];
}
