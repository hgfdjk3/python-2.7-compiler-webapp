import React from 'react';
import { Box, Group, Text, ThemeIcon, Badge, Stack } from '@mantine/core';
import { motion, Variants } from 'motion/react';
import './RecentActivity.css';

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  icon: React.ElementType;
  color: string;
  badge?: string;
  badgeColor?: string;
}

interface RecentActivityProps {
  items: ActivityItem[];
  title?: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.15,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -8 },
  show: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  },
};

export const RecentActivity: React.FC<RecentActivityProps> = ({
  items,
  title = 'Recent Activity',
}) => {
  return (
    <Box className="recent-activity">
      <Box className="recent-activity-inner">
        <Text size="sm" fw={700} mb="md">
          {title}
        </Text>

        <motion.div variants={containerVariants} initial="hidden" animate="show">
          <Stack gap={0}>
            {items.map((item, index) => (
              <motion.div key={item.id} variants={itemVariants}>
                <Group
                  className="activity-item"
                  wrap="nowrap"
                  gap="sm"
                  py="sm"
                  px="xs"
                  style={{
                    borderBottom:
                      index < items.length - 1
                        ? '1px solid var(--mantine-color-default-border)'
                        : 'none',
                  }}
                >
                  <ThemeIcon
                    variant="light"
                    color={item.color}
                    size="md"
                    radius="md"
                    style={{ flexShrink: 0 }}
                  >
                    <item.icon size={14} stroke={1.5} />
                  </ThemeIcon>

                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Group gap="xs" wrap="nowrap">
                      <Text size="sm" fw={500} truncate>
                        {item.title}
                      </Text>
                      {item.badge && (
                        <Badge
                          size="xs"
                          variant="light"
                          color={item.badgeColor || 'zinc'}
                          style={{ flexShrink: 0 }}
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Group>
                    <Text size="xs" c="dimmed" truncate>
                      {item.description}
                    </Text>
                  </Box>

                  <Text size="xs" c="dimmed" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {item.timestamp}
                  </Text>
                </Group>
              </motion.div>
            ))}
          </Stack>
        </motion.div>
      </Box>
    </Box>
  );
};
