import React from 'react';
import { useMantineColorScheme, NavLink, Text } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ThemeToggleProps {
  opened?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ opened = true }) => {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  const handleToggle = () => {
    setColorScheme(isDark ? 'light' : 'dark');
  };

  const IconContainer = (
    <div style={{ width: 18, height: 18, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={colorScheme}
          initial={{ rotate: -90, scale: 0, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 90, scale: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {isDark ? (
            <IconMoon size={18} stroke={1.5} />
          ) : (
            <IconSun size={18} stroke={1.5} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  return (
    <NavLink
      onClick={handleToggle}
      label={
        <AnimatePresence mode="wait">
          {opened && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Text size="sm" fw={500}>
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </Text>
            </motion.div>
          )}
        </AnimatePresence>
      }
      leftSection={IconContainer}
      variant="subtle"
      h={36}
      style={{
        borderRadius: 'var(--mantine-radius-md)',
        display: 'flex',
        justifyContent: opened ? 'flex-start' : 'center',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
    />
  );
};
