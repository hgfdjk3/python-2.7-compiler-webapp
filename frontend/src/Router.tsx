import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { KnowledgeGraphPage } from './pages/KnowledgeGraph.page';
import { HomePage } from './pages/Home.page';
import { AutomationsPage } from './pages/Automations.page';
import { ProjectPage } from './pages/Project.page';
import { NewProjectPage } from './pages/NewProject.page';
import { AgentsPage } from './pages/Agents.page';
import { DevelopersPage } from './pages/Developers.page';
import { DevelopersDocsPage } from './pages/DevelopersDocs.page';
import { DevelopersConnectionsPage } from './pages/DevelopersConnections.page';

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/projects',
    element: <HomePage />,
  },
  {
    path: '/project/:projectName',
    element: <ProjectPage />,
  },
  {
    path: '/new_project',
    element: <NewProjectPage />,
  },
  {
    path: '/knowledge-graph',
    element: <KnowledgeGraphPage />,
  },
  {
    path: '/automations',
    element: <AutomationsPage />,
  },
  {
    path: '/agents',
    element: <AgentsPage />,
  },
  {
    path: '/developers',
    element: <DevelopersPage />,
  },
  {
    path: '/developers/docs',
    element: <DevelopersDocsPage />,
  },
  {
    path: '/developers/connections',
    element: <DevelopersConnectionsPage />,
  },
]);

export const Router: React.FC = () => {
  return <RouterProvider router={router} />;
};
