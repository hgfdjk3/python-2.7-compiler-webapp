import React from 'react';
import { Box, Group, Text, ThemeIcon } from '@mantine/core';
import { IconArrowUpRight, IconArrowDownRight, IconMinus } from '@tabler/icons-react';
import { motion } from 'motion/react';
import './StatCard.css';

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
}) => {
  const TrendIcon =
    trend?.direction === 'up'
      ? IconArrowUpRight
      : trend?.direction === 'down'
        ? IconArrowDownRight
        : IconMinus;

  const trendColor =
    trend?.direction === 'up'
      ? 'var(--mantine-color-emerald-filled)'
      : trend?.direction === 'down'
        ? 'var(--mantine-color-red-filled)'
        : 'var(--mantine-color-zinc-4)';

  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      whileHover={{ y: -2 }}
    >
      <Box className="stat-card-inner">
        <Group justify="space-between" align="flex-start" mb="md">
          <Box>
            <Text size="xs" fw={600} c="dimmed" tt="uppercase" className="stat-card-label">
              {label}
            </Text>
          </Box>
          <ThemeIcon
            variant="light"
            color={color}
            size="lg"
            radius="md"
            className="stat-card-icon"
          >
            <Icon size={18} stroke={1.5} />
          </ThemeIcon>
        </Group>

        <Text className="stat-card-value" fw={800}>
          {value}
        </Text>

        {(subtitle || trend) && (
          <Group gap="xs" mt="xs">
            {trend && (
              <Group gap={4} className="stat-card-trend" style={{ color: trendColor }}>
                <TrendIcon size={14} stroke={2} />
                <Text size="xs" fw={600} inherit>
                  {trend.value}%
                </Text>
              </Group>
            )}
            {subtitle && (
              <Text size="xs" c="dimmed">
                {subtitle}
              </Text>
            )}
          </Group>
        )}
      </Box>
    </motion.div>
  );
};
