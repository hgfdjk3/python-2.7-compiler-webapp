import React from 'react';
import { Avatar, Tooltip } from '@mantine/core';

interface Member {
  id: string;
  name: string;
  image?: string;
  initials?: string;
}

interface ProjectMembersPreviewProps {
  members: Member[];
  max?: number;
}

export const ProjectMembersPreview: React.FC<ProjectMembersPreviewProps> = ({ members, max = 4 }) => {
  return (
    <Avatar.Group spacing="xs">
      {members.slice(0, max).map((member) => (
        <Tooltip key={member.id} label={member.name} withArrow>
          <Avatar
            src={member.image}
            radius="xl"
            size="30"
            alt={member.name}
            variant="filled"
            color="gray"
          >
            {member.initials || member.name.charAt(0)}
          </Avatar>
        </Tooltip>
      ))}
      {members.length > max && (
        <Avatar radius="xl" size="30" variant="light" color="gray">
          +{members.length - max}
        </Avatar>
      )}
    </Avatar.Group>
  );
};
