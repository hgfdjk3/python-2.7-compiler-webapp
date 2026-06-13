import React, { useState } from 'react';
import { ActionIcon, Avatar, Box, Group, NavLink, Stack, Text, ScrollArea, Modal, TextInput, Button } from '@mantine/core';
import {
  IconLayoutSidebar,
  IconSearch,
  IconFolders,
  IconPlug,
  IconCode,
  IconPlus,
  IconBolt,
} from '@tabler/icons-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SidebarWorkspace } from './SidebarWorkspace';
import { motion, AnimatePresence } from 'framer-motion';
import { AtomLogo } from '../AtomLogo/AtomLogo';
import { useProjects } from '../../api/projects';
import { ThemeToggle } from '../ThemeToggle/ThemeToggle';
import { useUserStore } from '../../store/userStore';


const navItems = [
  { label: 'Search', icon: IconSearch, link: '/' },
  { label: 'Projects', icon: IconFolders, link: '/projects' },
  { label: 'Connectors', icon: IconPlug, link: '/agents' },
  // { label: 'Automations', icon: IconBolt, link: '/automations' },
  { label: 'Developers', icon: IconCode, link: '/developers' },
];



interface SidebarProps {
  opened: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ opened, onToggle }) => {
  const location = useLocation();
  const [openedProjects, setOpenedProjects] = useState<string[]>([]);
  const { data: projects = [] } = useProjects();
  const user = useUserStore((state) => state.user);


  const toggleProject = (projectId: string) => {
    setOpenedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };
  const navigate = useNavigate();
  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0' }}>
      {/* Sidebar Header */}
      <Group justify={opened ? "space-between" : "center"} pr={opened ? 0 : "sm"} mb={opened ? "md" : 0} flex-direction={opened ? "row" : "column"} px={opened ? 4 : 0} gap="6" mt={4} >
        <Group gap="xs" wrap="nowrap" onClick={() => navigate('/')} style={{ cursor: 'pointer' }} >
          <AtomLogo size={24} color="var(--mantine-color-text)" />
          <AnimatePresence mode="wait">

            {opened && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
              >
                <Text size="lg" fw={800} style={{ letterSpacing: '-0.5px' }}>
                  Atom.
                </Text>
              </motion.div>
            )}
          </AnimatePresence>
        </Group>
        <ActionIcon variant="subtle" color="gray" onClick={onToggle} aria-label="Toggle Sidebar">
          <IconLayoutSidebar stroke={1.5} size={20} />
        </ActionIcon>
      </Group>

      {/* Main Navigation */}
      <Stack gap={0} mb="xs">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            component={Link}
            to={item.link}
            label=
            {opened && (
              <AnimatePresence mode="wait">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Text size="sm" fw={500}>{item.label}</Text>
                </motion.div>
              </AnimatePresence>
            )}

            leftSection={<item.icon size={18} stroke={1.5} />}
            active={location.pathname === item.link || location.pathname.startsWith(item.link + '/')}
            variant="light"
            p="xs"
            style={{
              borderRadius: 'var(--mantine-radius-md)',
              display: 'flex',
              justifyContent: opened ? 'flex-start' : 'center',
              overflow: 'hidden'
            }}
          />
        ))}
      </Stack>

      {/* Projects Folders Section */}
      <AnimatePresence>
        {opened && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1 }}
          >
            <Box px={8} mb="xs">
              <Group justify="space-between">
                <Text size="xs" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.5px' }}>
                  Workspaces
                </Text>
                <ActionIcon variant="subtle" size="sm" color="gray" onClick={() => navigate('/new_project')}>
                  <IconPlus size={14} />
                </ActionIcon>
              </Group>
            </Box>

            <ScrollArea flex={1} pr="0" >
              <Stack gap={0}>
                {projects.map((project) => (
                  <SidebarWorkspace
                    key={project.id}
                    id={project.id}
                    name={project.name}
                    chats={project.chats}
                    isOpened={openedProjects.includes(project.id)}
                    onToggle={() => toggleProject(project.id)}
                    sidebarOpened={opened}
                  />
                ))}
              </Stack>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer when collapsed to push footer down */}
      {!opened && <Box style={{ flex: 1 }} />}

      {/* Footer Section */}
      <Stack gap="xs" mt="md">
        <ThemeToggle opened={opened} />

        <Box
          p="xs"
          style={{
            borderRadius: 'var(--mantine-radius-md)',
            backgroundColor: 'var(--mantine-color-default-hover)',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
            display: 'flex',
            justifyContent: opened ? 'flex-start' : 'center',
            overflow: 'hidden'
          }}
        >
          <Group wrap="nowrap" gap="sm">
            <Avatar color="dark" radius="md" size="sm">{user.fullname ? user.fullname.charAt(0).toUpperCase() : 'U'}</Avatar>
            <AnimatePresence mode="wait">
              {opened && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}
                >
                  <Text size="sm" fw={600} truncate lh={1.2}>{user.fullname}</Text>
                  <Text c="dimmed" size="xs" truncate lh={1.2}>Free plan</Text>
                </motion.div>
              )}
            </AnimatePresence>
          </Group>
        </Box>
      </Stack>
    </Box>
  );

};

