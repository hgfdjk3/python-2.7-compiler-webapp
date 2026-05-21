import React from 'react';
import { ActionIcon, Menu, Text } from '@mantine/core';
import {
  IconDots,
  IconFolder,
  IconRobot,
  IconTrash,
  IconPencil,
  IconCopy,
} from '@tabler/icons-react';
import './ProjectCard.css';

const ACCENT_COLORS = ['violet', 'blue', 'emerald', 'rose', 'amber', 'cyan', 'slate'] as const;
type AccentColor = (typeof ACCENT_COLORS)[number];

interface ProjectCardProps {
  title: string;
  description: string;
  updatedAt: string;
  sourcesCount?: number;
  agentsCount?: number;
  accentColor?: AccentColor;
  onClick?: () => void;
  onRename?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const getAccentColor = (title: string): AccentColor => {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return ACCENT_COLORS[Math.abs(hash) % ACCENT_COLORS.length];
};

export const ProjectCard: React.FC<ProjectCardProps> = ({
  title,
  description,
  updatedAt,
  sourcesCount = 0,
  agentsCount = 0,
  accentColor,
  onClick,
  onRename,
  onDuplicate,
  onDelete,
}) => {
  const color = accentColor ?? getAccentColor(title);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="project-card" onClick={onClick}>
      {/* Gradient accent bar */}
      <div className="project-card-accent" data-color={color} />

      {/* Card body */}
      <div className="project-card-body">
        {/* Header: icon + title + menu */}
        <div className="project-card-header">
          <div className="project-card-icon" data-color={color}>
            {getInitials(title)}
          </div>

          <div className="project-card-title-group">
            <span className="project-card-title">{title}</span>
          </div>

          <Menu shadow="md" position="bottom-end" withArrow>
            <Menu.Target>
              <ActionIcon
                variant="subtle"
                size="sm"
                className="project-card-menu-btn"
                onClick={handleMenuClick}
              >
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconPencil size={14} />}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onRename?.();
                }}
              >
                Rename
              </Menu.Item>
              <Menu.Item
                leftSection={<IconCopy size={14} />}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onDuplicate?.();
                }}
              >
                Duplicate
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onDelete?.();
                }}
              >
                Delete
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>

        {/* Description */}
        {description && (
          <Text className="project-card-description">{description}</Text>
        )}
      </div>

      {/* Footer metadata */}
      <div className="project-card-footer">
        <div className="project-card-meta">
          <span className="project-card-meta-item">
            <IconFolder size={14} />
            {sourcesCount} {sourcesCount === 1 ? 'source' : 'sources'}
          </span>
          <span className="project-card-meta-item">
            <IconRobot size={14} />
            {agentsCount} {agentsCount === 1 ? 'agent' : 'agents'}
          </span>
        </div>
        <span className="project-card-updated">{updatedAt}</span>
      </div>
    </div>
  );
};
