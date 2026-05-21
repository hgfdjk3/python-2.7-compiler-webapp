import React, { ReactNode } from 'react';
import { AppShell } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Sidebar } from './Sidebar';

interface ProjectLayoutProps {
  children: ReactNode;
}

export const ProjectLayout: React.FC<ProjectLayoutProps> = ({ children }) => {
  const [opened, { toggle }] = useDisclosure(true);

  return (
    <AppShell
      navbar={{
        width: opened ? 260 : 70,
        breakpoint: 'sm'
      }}
      padding=""
      transitionDuration={300}
      transitionTimingFunction="ease"
    >
      <AppShell.Navbar p="8" style={{ overflow: 'hidden', borderColor: 'var(--mantine-color-default-border)' }}>
        <Sidebar opened={opened} onToggle={toggle} />
      </AppShell.Navbar>
      <AppShell.Main h="100vh" py="xs" pr="xs" style={{ display: 'flex', flexDirection: 'column' }}>
        {children}
      </AppShell.Main>
    </AppShell>
  );
};

