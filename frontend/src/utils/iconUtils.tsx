import React from 'react';
import {
  IconTool,
  IconBrandGitlab,
  IconDatabase,
  IconBrandSlack,
  IconBrandNotion,
  IconBrandJira,
  IconBrandTrello,
  IconBrandGoogleDrive,
  IconBrandFigma,
  IconCloud,
  IconCode,
  IconSearch,
  IconFileText,
  IconCpu,
  IconTerminal,
  IconBrandDocker,
  IconBrandPython,
  IconBrandJavascript,
  IconBrandTypescript,
  IconGlobe,
  IconAppWindow,
  IconMail,
  IconGrape,
  IconAtom,
  IconLanguage,
  IconUsers,
  IconFileMusic
} from '@tabler/icons-react';

export const AGENT_ICON_MAP: Record<string, any> = {
  gitlab: IconBrandGitlab,
  git: IconBrandGitlab,
  runDB: IconDatabase,
  database: IconDatabase,
  sql: IconDatabase,
  atom: IconAtom,
  mongo: IconDatabase,
  redis: IconDatabase,
  slack: IconBrandSlack,
  notion: IconBrandNotion,
  jira: IconBrandJira,
  trello: IconBrandTrello,
  drive: IconBrandGoogleDrive,
  google: IconBrandGoogleDrive,
  figma: IconBrandFigma,
  cloud: IconCloud,
  code: IconCode,
  dev: IconCode,
  terminal: IconTerminal,
  bash: IconTerminal,
  langauge: IconLanguage,
  shell: IconTerminal,
  docker: IconBrandDocker,
  container: IconBrandDocker,
  people: IconUsers,
  python: IconBrandPython,
  typescript: IconBrandTypescript,
  ts: IconBrandTypescript,
  search: IconSearch,
  brave: IconSearch,
  web: IconGlobe,
  sound: IconFileMusic,
  browser: IconGlobe,
  file: IconFileText,
  grape: IconGrape,
  api: IconCpu,
  email: IconMail,
};

export const getAgentIcon = (nameOrIcon?: string, props?: any) => {
  if (!nameOrIcon) return <IconTool {...props} />;
  const lower = nameOrIcon.toLowerCase();

  for (const [key, IconComponent] of Object.entries(AGENT_ICON_MAP)) {
    if (lower.includes(key)) {
      return <IconComponent {...props} />;
    }
  }

  return <IconTool {...props} />;
};

export const getToolIcon = (_name?: string, props?: any) => {
  return <IconTool {...props} />;
};
