import React from 'react';
import { ProjectLayout } from '../components/Layout/ProjectLayout';
import { NewProjectView } from '../components/Projects/NewProjectView/NewProjectView';

export const NewProjectPage: React.FC = () => {
  return (
    <ProjectLayout>
      <NewProjectView />
    </ProjectLayout>
  );
};
