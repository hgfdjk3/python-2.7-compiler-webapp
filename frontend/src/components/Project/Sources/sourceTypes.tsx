import React from 'react';
import {
  IconPdf,
  IconFileText,
  IconExternalLink,
  IconUser,
  IconBulb,
  IconMapPin,
  IconBuilding,
  IconFile,
  IconTag,
  IconDatabase
} from '@tabler/icons-react';

export interface SourceStyle {
  color: string;
  icon: React.ReactNode;
}

const PREDEFINED_STYLES: Record<string, SourceStyle> = {
  pdf: { color: 'red', icon: <IconPdf size={16} /> },
  doc: { color: 'blue', icon: <IconFileText size={16} /> },
  txt: { color: 'gray', icon: <IconFileText size={16} /> },
  link: { color: 'indigo', icon: <IconExternalLink size={16} /> },
  person: { color: 'cyan', icon: <IconUser size={16} /> },
  concept: { color: 'violet', icon: <IconBulb size={16} /> },
  place: { color: 'orange', icon: <IconMapPin size={16} /> },
  organization: { color: 'grape', icon: <IconBuilding size={16} /> },
  database: { color: 'teal', icon: <IconDatabase size={16} /> },
};

const DYNAMIC_COLORS = [
  'pink', 'yellow', 'lime', 'green', 'cyan', 'indigo', 'violet', 'grape'
];

export const getSourceStyle = (type: string): SourceStyle => {
  const normalizedType = type.toLowerCase();
  if (PREDEFINED_STYLES[normalizedType]) {
    return PREDEFINED_STYLES[normalizedType];
  }

  // Simple hash for consistent dynamic color
  let hash = 0;
  for (let i = 0; i < normalizedType.length; i++) {
    hash = normalizedType.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % DYNAMIC_COLORS.length;
  
  return {
    color: DYNAMIC_COLORS[colorIndex],
    icon: <IconTag size={16} />
  };
};
